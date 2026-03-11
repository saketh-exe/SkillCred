/**
 * Skills Matcher
 * --------------
 * Given a candidate's skills and a job's required skills, uses an LLM to
 * perform semantic matching (handles aliases, abbreviations, related techs)
 * and returns a structured similarity report.
 *
 * Usage (standalone):
 *   ts-node src/services/skills/matcher.ts
 *
 * Usage (imported):
 *   import { matchSkills } from './services/skills/matcher'
 */

import * as dotenv from "dotenv";
dotenv.config();

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

// ─── Output schema ─────────────────────────────────────────────────────────────

const SkillMatchSchema = z.object({
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "0–100 similarity score. 100 = candidate has every required skill (exact or equivalent). 0 = no overlap at all."
    ),

  matchedSkills: z
    .array(
      z.object({
        requiredSkill: z.string().describe("Skill name from the job requirements."),
        candidateSkill: z.string().describe("The matching/equivalent skill from the candidate's list."),
        matchType: z
          .enum(["exact", "alias", "related", "broader", "narrower"])
          .describe(
            "exact = same name; alias = different name, same thing (e.g. 'JS' vs 'JavaScript'); related = closely related but not identical; broader = candidate skill covers the required one; narrower = candidate skill is a subset."
          ),
        confidence: z
          .number()
          .min(0)
          .max(100)
          .describe("How confident the match is (0–100)."),
      })
    )
    .describe("Skills from the job requirements that the candidate satisfies."),

  missingSkills: z
    .array(z.string())
    .describe("Required skills the candidate does not have (no reasonable equivalent found)."),

  extraSkills: z
    .array(z.string())
    .describe(
      "Candidate skills that go beyond the job requirements — nice-to-haves the candidate brings."
    ),

  summary: z
    .string()
    .describe("2–3 sentence human-readable summary of the match quality."),
});

export type SkillMatchReport = z.infer<typeof SkillMatchSchema>;

// ─── Main function ─────────────────────────────────────────────────────────────

export async function matchSkills(
  candidateSkills: string[],
  jobRequiredSkills: string[]
): Promise<SkillMatchReport> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0,
  });

  const structured = model.withStructuredOutput(SkillMatchSchema);

  const prompt = `You are a technical recruiter evaluating how well a candidate's skill set matches a job's requirements.

Candidate skills:
${candidateSkills.map((s) => `  - ${s}`).join("\n")}

Job required skills:
${jobRequiredSkills.map((s) => `  - ${s}`).join("\n")}

Instructions:
1. Match each required skill to a candidate skill if a reasonable equivalent exists.
   - Treat abbreviations and alternate names as exact/alias matches (e.g. "JS" = "JavaScript", "TS" = "TypeScript", "Postgres" = "PostgreSQL", "ML" = "Machine Learning").
   - Treat framework/library knowledge as related to the underlying language (e.g. knowing "React" is related to "JavaScript").
   - A candidate who knows a broader technology satisfies a narrower requirement (e.g. knowing "Python" covers "Python scripting").
2. List required skills with no reasonable candidate match in missingSkills.
3. List candidate skills that are not needed for this job (extra / bonus skills) in extraSkills.
4. Compute an overallScore: percentage of required skills that are meaningfully covered, weighted by confidence.`;

  return structured.invoke([{ role: "human", content: prompt }]);
}

// ─── Standalone runner ─────────────────────────────────────────────────────────

async function main() {
  const candidateSkills = [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Express",
    "PostgreSQL",
    "Git",
    "Docker",
    "REST APIs",
  ];

  const jobRequiredSkills = [
    "JS",
    "TS",
    "ReactJS",
    "Backend development",
    "SQL databases",
    "Version control",
    "Containerisation",
    "GraphQL",
    "AWS",
  ];

  console.log("Candidate skills :", candidateSkills.join(", "));
  console.log("Job requirements  :", jobRequiredSkills.join(", "));
  console.log("\nRunning skill match…\n");

  const report = await matchSkills(candidateSkills, jobRequiredSkills);

  console.log(`Overall Score : ${report.overallScore}/100`);
  console.log(`\nSummary:\n  ${report.summary}`);

  console.log("\nMatched Skills:");
  for (const m of report.matchedSkills) {
    console.log(
      `  ✓ "${m.requiredSkill}" → "${m.candidateSkill}" [${m.matchType}, ${m.confidence}% confidence]`
    );
  }

  if (report.missingSkills.length > 0) {
    console.log("\nMissing Skills:");
    for (const s of report.missingSkills) console.log(`  ✗ ${s}`);
  }

  if (report.extraSkills.length > 0) {
    console.log("\nBonus / Extra Skills:");
    for (const s of report.extraSkills) console.log(`  + ${s}`);
  }
}

// Run if executed directly: ts-node src/services/skills/matcher.ts
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
