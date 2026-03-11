import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { analyzeGithubProfile } from "../../services/github/analyzer";
import { generateCredibilityReport } from "../../services/resume/credibility";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const ResumeSchema = z.object({
  github: z
    .object({
      username: z.string().nullable(),
      url: z.string().nullable(),
    })
    .nullable(),
  skills: z.array(z.string()),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string().nullable(),
      github: z.string().nullable(),
      technologies: z.array(z.string()),
    })
  ),
  internships: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      duration: z.string().nullable(),
      description: z.string().nullable(),
    })
  ),
});

router.post("/", upload.single("resume"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No PDF file received" });

  try {
    const parser = new PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText({ parseHyperlinks: true });
    const text = pdfData.text;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-3.1-flash-lite-preview",
      apiKey: process.env.GEMINI_API_KEY,
    });

    const structuredModel = model.withStructuredOutput(ResumeSchema);

    const result = await structuredModel.invoke([
      {
        role: "human",
        content: `Extract structured information from the following resume text.
Return null for any fields that are not found in the resume.
For skills, extract all technical skills, programming languages, frameworks and tools mentioned.
For projects, extract all personal or academic projects.
For internships, extract all work experience, internships or jobs.
Hyperlinks in the text are formatted as Markdown inline links: [visible text](url). Use these URLs when extracting github urls for the candidate profile or for individual projects.

Resume text:
${text}`,
      },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Resume parsing error:", err);
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

// POST /api/resumes/credibility
// Body: { resume: ParsedResume }
// Fetches GitHub data for the username found in the resume, then generates a credibility report.
router.post("/credibility", async (req, res) => {
  const resume = req.body?.resume;

  if (!resume) {
    return res.status(400).json({ error: "Request body must contain a 'resume' field." });
  }

  const username: string | null = resume?.github?.username ?? null;
  if (!username) {
    return res.status(400).json({ error: "No GitHub username found in the resume data." });
  }

  try {
    const githubAnalysis = await analyzeGithubProfile(username);
    const credibilityReport = await generateCredibilityReport(resume, githubAnalysis);

    res.json({ github: githubAnalysis, credibilityReport });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : message.includes("rate limit") ? 429 : 500;
    console.error("Credibility analysis error:", err);
    res.status(status).json({ error: message });
  }
});

export default router;
