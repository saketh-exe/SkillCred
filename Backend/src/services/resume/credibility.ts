import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import type { GithubAnalysis } from "../github/types";

// ─── Resume sub-types (mirror what the route extracts) ───────────────────────

interface ResumeData {
  github: { username: string | null; url: string | null } | null;
  skills: string[];
  projects: Array<{
    name: string;
    description: string | null;
    github: string | null;
    technologies: string[];
  }>;
  internships: Array<{
    company: string;
    role: string;
    duration: string | null;
    description: string | null;
  }>;
}

// ─── Output schema ────────────────────────────────────────────────────────────

export const CredibilityReportSchema = z.object({
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe("0–100 credibility score. 100 = every claim is backed by rich GitHub evidence."),

  summary: z
    .string()
    .describe("2–4 sentence executive summary of the candidate's credibility based on both sources."),

  skillsAnalysis: z
    .array(
      z.object({
        skill: z.string(),
        verificationStatus: z
          .enum(["verified", "partially_verified", "unverified"])
          .describe(
            "verified = clear GitHub evidence; partially_verified = some evidence; unverified = no GitHub evidence found."
          ),
        evidence: z
          .string()
          .nullable()
          .describe("Brief note on what GitHub evidence supports or contradicts this skill."),
      })
    )
    .describe("One entry per skill claimed in the resume."),

  projectsAnalysis: z
    .array(
      z.object({
        name: z.string(),
        source: z
          .enum(["resume_only", "github_only", "both"])
          .describe(
            "resume_only = claimed in resume but no matching GitHub repo found; github_only = exists on GitHub but not mentioned in resume; both = found in both."
          ),
        githubRepo: z.string().nullable().describe("Matching GitHub repo name if found."),
        notes: z
          .string()
          .nullable()
          .describe("Any notable observations about this project (activity, tech, stars, etc.)."),
      })
    )
    .describe("All projects found in either the resume or the top GitHub repos."),

  strengths: z
    .array(z.string())
    .describe("Concrete positive findings that support the candidate's resume claims."),

  redFlags: z
    .array(z.string())
    .describe(
      "Concrete inconsistencies or gaps (e.g. skills claimed but never used in any repo, projects mentioned but no repo found, recent inactivity despite claiming active development)."
    ),

  recommendations: z
    .array(z.string())
    .describe(
      "Actionable suggestions for the interviewer or the candidate (e.g. 'Ask candidate to walk through project X in depth')."
    ),
});

export type CredibilityReport = z.infer<typeof CredibilityReportSchema>;

// ─── LLM context builder ──────────────────────────────────────────────────────

/** Trims the GitHub analysis to a size friendly for an LLM context window. */
function buildGithubContext(analysis: GithubAnalysis): string {
  const { profile, summary, languages, repositories } = analysis;

  const topLanguages = languages
    .slice(0, 12)
    .map((l) => `  • ${l.name}: ${l.percentage}% (${l.repoCount} repos, score ${l.significanceScore})`)
    .join("\n");

  const topRepos = repositories
    .slice(0, 20)
    .map((r) => {
      const langs = Object.keys(r.languages).slice(0, 5).join(", ") || r.primaryLanguage || "unknown";
      const commitSummary = r.recentCommits
        .slice(0, 3)
        .map((c) => `      - ${c.message.substring(0, 80)} (${c.date.substring(0, 10)})`)
        .join("\n");
      return [
        `  Repo: ${r.name}${r.isFork ? " [fork]" : ""}`,
        `    Description: ${r.description ?? "none"}`,
        `    Stars: ${r.stars} | Forks: ${r.forks} | Last pushed: ${r.lastPushed.substring(0, 10)}`,
        `    Languages: ${langs}`,
        commitSummary ? `    Recent commits:\n${commitSummary}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return `
GitHub Profile
==============
Username     : ${profile.username}
Name         : ${profile.name ?? "N/A"}
Bio          : ${profile.bio ?? "N/A"}
Member since : ${profile.memberSince.substring(0, 10)}
Public repos : ${profile.publicRepos}
Followers    : ${profile.followers}

Summary
-------
Repos analyzed  : ${summary.totalReposAnalyzed} (own: ${summary.ownRepos}, contributed forks: ${summary.forkedRepos})
Top language    : ${summary.topLanguage ?? "N/A"}
Total code bytes: ${summary.totalCodeBytes.toLocaleString()}
Total stars     : ${summary.totalStars}
Most significant: ${summary.mostSignificantRepo ?? "N/A"}

Top Languages
-------------
${topLanguages}

Top Repositories (by significance)
-----------------------------------
${topRepos}
`.trim();
}

function buildResumeContext(resume: ResumeData): string {
  const skills = resume.skills.length > 0 ? resume.skills.join(", ") : "None listed";

  const projects =
    resume.projects.length > 0
      ? resume.projects
          .map(
            (p) =>
              `  • ${p.name}${p.github ? ` (${p.github})` : ""}: ${p.description ?? "no description"} [${p.technologies.join(", ")}]`
          )
          .join("\n")
      : "  None listed";

  const internships =
    resume.internships.length > 0
      ? resume.internships
          .map(
            (i) =>
              `  • ${i.role} @ ${i.company}${i.duration ? ` (${i.duration})` : ""}: ${i.description ?? "no description"}`
          )
          .join("\n")
      : "  None listed";

  return `
Resume Data
===========
GitHub username: ${resume.github?.username ?? "not provided"}

Skills claimed:
  ${skills}

Projects:
${projects}

Work Experience / Internships:
${internships}
`.trim();
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateCredibilityReport(
  resume: ResumeData,
  githubAnalysis: GithubAnalysis
): Promise<CredibilityReport> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.1-flash-lite-preview",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.2,
  });

  const structuredModel = model.withStructuredOutput(CredibilityReportSchema);

  const resumeContext = buildResumeContext(resume);
  const githubContext = buildGithubContext(githubAnalysis);

  const prompt = `You are an expert technical recruiter and software engineer evaluating a candidate's resume against their actual GitHub activity.

Your job is to produce an objective, evidence-based credibility report. Be specific — reference actual repo names, languages, and commit activity when supporting or challenging claims.

${resumeContext}

---

${githubContext}

---

Instructions:
1. Score the candidate 0–100 on how well their GitHub activity backs up their resume claims.
2. For EVERY skill listed in the resume, determine whether GitHub activity evidence supports it.
3. Cross-reference resume projects against GitHub repos (fuzzy match on names and technologies).
4. List any projects that appear on GitHub but are NOT mentioned in the resume (these are bonus evidence).
5. Identify red flags: skills with zero GitHub evidence, empty repos, very old last-pushed dates, inconsistent tech stack, etc.
6. Provide recommendations for the interviewer.

Be fair but rigorous. A candidate who lists "React" but has only HTML/CSS repos should be flagged. A candidate whose GitHub shows consistent activity in the claimed languages should score highly.`;

  return structuredModel.invoke([{ role: "human", content: prompt }]);
}
