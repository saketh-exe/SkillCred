import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { analyzeGithubProfile } from "../../services/github/analyzer";
import { generateCredibilityReport } from "../../services/resume/credibility";
import { requireAuth, type AuthRequest } from "../../middleware/auth";
import { UserBase } from "../../models/User";

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "resumes");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

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

// POST /api/resumes — upload and parse a resume PDF (auth optional: if authenticated, saves file)
router.post("/", upload.single("resume"), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: "No PDF file received" });

  // Authenticate if token provided (header-optional auth)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const jwt = await import("jsonwebtoken");
    const secret = process.env.JWT_SECRET;
    if (secret) {
      try {
        const payload = jwt.default.verify(authHeader.slice(7), secret) as { userId: string; role: string };
        req.userId = payload.userId;
        req.userRole = payload.role;
      } catch { /* invalid token — proceed without saving */ }
    }
  }

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

    // If authenticated, save the PDF to disk and store the URL on the student record
    if (req.userId) {
      const filePath = path.join(UPLOAD_DIR, `${req.userId}.pdf`);
      fs.writeFileSync(filePath, req.file.buffer);
      await UserBase.findByIdAndUpdate(req.userId, { resumeUrl: `/api/resumes/file/${req.userId}` });
    }

    res.json(result);
  } catch (err) {
    console.error("Resume parsing error:", err);
    res.status(500).json({ error: "Failed to parse resume" });
  }
});

// GET /api/resumes/file/:studentId — serve the saved resume PDF
// Accessible to: the student themselves, or any recruiter who has received an application from them
router.get("/file/:studentId", requireAuth, async (req: AuthRequest, res) => {
  const { studentId } = req.params as { studentId: string };
  const requesterId = req.userId!;

  // The student can always access their own resume
  let allowed = requesterId === studentId;

  // Recruiters are allowed if a student has applied to one of their jobs
  if (!allowed && req.userRole === "recruiter") {
    const { Application } = await import("../../models/Application");
    const { JobPosting } = await import("../../models/JobPosting");
    const myJobs = await JobPosting.find({ recruiterId: requesterId }).select("_id");
    const jobIds = myJobs.map((j: { _id: unknown }) => j._id);
    const app = await Application.findOne({ studentId, jobId: { $in: jobIds } });
    allowed = app != null;
  }

  if (!allowed) return res.status(403).json({ error: "Access denied" });

  const filePath = path.join(UPLOAD_DIR, `${studentId}.pdf`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Resume not found" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="resume.pdf"`);
  fs.createReadStream(filePath).pipe(res);
});

// POST /api/resumes/credibility — cross-reference resume with GitHub
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
