import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { UserBase } from "../models/User";
import { JobPosting } from "../models/JobPosting";
import { Application } from "../models/Application";
import { SkillVerification, getSkillMeta } from "../models/SkillVerification";
import { Notification } from "../models/Notification";
import { Feedback } from "../models/Feedback";
import { AIQuestionGenerator } from "../services/assessment/aiQuestionGenerator";
import { SkillVerificationService } from "../services/assessment/skillVerificationService";
import { AIInterviewerService } from "../services/assessment/interviewService";
import { Interview } from "../models/Interview";
import { findRoleForTitle } from "../services/roleDefinitions";

const router = Router();
router.use(requireAuth);

// ── Profile ───────────────────────────────────────────────────
// GET /api/student/profile
router.get("/profile", async (req: AuthRequest, res) => {
  try {
    const user = await UserBase.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PATCH /api/student/profile
router.patch("/profile", async (req: AuthRequest, res) => {
  try {
    const allowed = ["name", "avatarUrl", "university", "degree", "graduationYear",
      "skills", "targetRoles", "experienceLevel", "profileVisible"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }

    const user = await UserBase.findByIdAndUpdate(req.userId, update, { returnDocument: 'after' });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Keep skill verifications in sync when skills list changes
    if (Array.isArray(req.body.skills)) {
      const existing = await SkillVerification.find({ studentId: req.userId }).select("name");
      const existingNames = new Set(existing.map((s: { name: string }) => s.name));
      const newSkills: string[] = req.body.skills;
      const toAdd = newSkills.filter(s => !existingNames.has(s));
      if (toAdd.length > 0) {
        await SkillVerification.insertMany(
          toAdd.map(name => ({ studentId: req.userId, name, ...getSkillMeta(name) }))
        );
      }
    }

    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ── Skills ───────────────────────────────────────────────────
// GET /api/student/skills
router.get("/skills", async (req: AuthRequest, res) => {
  try {
    let skills = await SkillVerification.find({ studentId: req.userId }).sort({ createdAt: 1 });

    // Bootstrap from student's skills list if empty
    if (skills.length === 0) {
      const user = await UserBase.findById(req.userId);
      const userSkills: string[] = (user as { skills?: string[] })?.skills ?? [];
      if (userSkills.length > 0) {
        await SkillVerification.insertMany(
          userSkills.map(name => ({ studentId: req.userId, name, ...getSkillMeta(name) }))
        );
        skills = await SkillVerification.find({ studentId: req.userId }).sort({ createdAt: 1 });
      }
    }

    // Return with id field matching frontend Skill type
    const result = skills.map((s: {
      _id: unknown; name: string; icon: string; category: string;
      difficulty: string; status: string; score?: number;
    }) => ({
      id: String(s._id),
      name: s.name,
      icon: s.icon,
      category: s.category,
      difficulty: s.difficulty,
      status: s.status,
      ...(s.score != null ? { score: s.score } : {}),
    }));

    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch skills" });
  }
});

// POST /api/student/skills  — add a new skill (status: Not Verified)
router.post("/skills", async (req: AuthRequest, res) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name) return res.status(400).json({ error: "Skill name is required" });

    const existing = await SkillVerification.findOne({ studentId: req.userId, name });
    if (existing) return res.status(409).json({ error: "Skill already added" });

    const skill = await SkillVerification.create({
      studentId: req.userId, name, ...getSkillMeta(name),
    });
    res.status(201).json({ id: String(skill._id), ...getSkillMeta(name), name, status: "Not Verified" });
  } catch {
    res.status(500).json({ error: "Failed to add skill" });
  }
});

// PATCH /api/student/skills/:id — update skill score/status (e.g. after assessment)
router.patch("/skills/:id", async (req: AuthRequest, res) => {
  try {
    const { score, status } = req.body as { score?: number; status?: string };
    const skill = await SkillVerification.findOneAndUpdate(
      { _id: req.params["id"], studentId: req.userId },
      { ...(score != null ? { score } : {}), ...(status ? { status } : {}) },
      { returnDocument: 'after' }
    );
    if (!skill) return res.status(404).json({ error: "Skill not found" });
    res.json(skill);
  } catch {
    res.status(500).json({ error: "Failed to update skill" });
  }
});

// ── Job Matches ───────────────────────────────────────────────
// GET /api/student/jobs
router.get("/jobs", async (req: AuthRequest, res) => {
  try {
    const user = await UserBase.findById(req.userId);
    const studentSkills: string[] = (user as { skills?: string[] })?.skills ?? [];

    const jobs = await JobPosting.find({ status: "Active" }).sort({ createdAt: -1 });

    const result = jobs.map((job: {
      _id: unknown; title: string; company: string; location: string;
      experienceLevel: string; requiredSkills: Array<{ name: string; mustHave: boolean }>
    }) => {
      const required = job.requiredSkills ?? [];
      const matched = required.filter(s => studentSkills.includes(s.name)).length;
      const matchPercent = required.length > 0
        ? Math.round((matched / required.length) * 100)
        : 0;
      return {
        jobId: String(job._id),
        title: job.title,
        company: job.company,
        location: job.location,
        experienceLevel: job.experienceLevel,
        matchPercent,
        readinessPercent: Math.max(0, matchPercent - 10),
        requiredSkills: required.map(s => ({
          name: s.name,
          verified: studentSkills.includes(s.name),
        })),
      };
    });

    res.json(result.sort((a, b) => b.matchPercent - a.matchPercent));
  } catch {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// ── Applications ──────────────────────────────────────────────
// GET /api/student/applications
router.get("/applications", async (req: AuthRequest, res) => {
  try {
    const apps = await Application.find({ studentId: req.userId })
      .populate("jobId", "title company pipeline")
      .sort({ createdAt: -1 });

    const result = apps.map((a: {
      _id: unknown; status: string; pipelineStage: number;
      stages: Array<{ name: string; completed: boolean; score?: number; feedback?: string; assessmentStatus?: string }>;
      createdAt: Date;
      jobId: { _id: unknown; title: string; company: string; pipeline?: Array<{ name: string; type: string }> } | unknown;
    }) => {
      const job = a.jobId as { _id: unknown; title: string; company: string; pipeline?: Array<{ name: string; type: string }> };
      const pipelineTypes = job?.pipeline ?? [];
      return {
        id: String(a._id),
        jobId: String(job?._id ?? ""),
        company: job?.company ?? "",
        role: job?.title ?? "",
        appliedDate: a.createdAt.toISOString().split("T")[0],
        status: a.status,
        pipelineStage: a.pipelineStage,
        pipelineTotal: a.stages?.length ?? 0,
        stages: (a.stages ?? []).map((s, i) => ({
          name: s.name,
          completed: s.completed,
          score: s.score,
          feedback: s.feedback,
          assessmentStatus: s.assessmentStatus,
          stageType: pipelineTypes[i]?.type ?? undefined,
        })),
      };
    });

    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// POST /api/student/applications
router.post("/applications", async (req: AuthRequest, res) => {
  try {
    const { jobId } = req.body as { jobId?: string };
    if (!jobId) return res.status(400).json({ error: "jobId is required" });

    const job = await JobPosting.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const existing = await Application.findOne({ studentId: req.userId, jobId });
    if (existing) return res.status(409).json({ error: "Already applied" });

    const stages = (job.pipeline as Array<{ name: string }>).map(p => ({
      name: p.name, completed: false,
    }));

    const app = await Application.create({
      studentId: req.userId, jobId, stages, pipelineStage: 0,
    });

    // Bump applicant counter
    await JobPosting.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

    res.status(201).json(app);
  } catch {
    res.status(500).json({ error: "Failed to apply" });
  }
});

// ── Profile Data (resume / github / credibility) ──────────────
// GET /api/student/profile-data
router.get("/profile-data", async (req: AuthRequest, res) => {
  try {
    const user = await UserBase.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const u = user as unknown as { parsedResume?: unknown; githubAnalysis?: unknown; credibilityReport?: unknown };
    res.json({
      parsedResume: u.parsedResume ?? null,
      githubAnalysis: u.githubAnalysis ?? null,
      credibilityReport: u.credibilityReport ?? null,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch profile data" });
  }
});

// PATCH /api/student/profile-data
router.patch("/profile-data", async (req: AuthRequest, res) => {
  try {
    const { parsedResume, githubAnalysis, credibilityReport } = req.body as {
      parsedResume?: unknown;
      githubAnalysis?: { languages?: Array<{ name: string }> } | null;
      credibilityReport?: unknown;
    };
    const update: Record<string, unknown> = {};
    if (parsedResume !== undefined) update["parsedResume"] = parsedResume;
    if (githubAnalysis !== undefined) update["githubAnalysis"] = githubAnalysis;
    if (credibilityReport !== undefined) update["credibilityReport"] = credibilityReport;
    await UserBase.findByIdAndUpdate(req.userId, { $set: update });

    // Sync detected GitHub languages → SkillVerification (mark as Verified)
    if (githubAnalysis && Array.isArray(githubAnalysis.languages)) {
      const langNames = githubAnalysis.languages.map((l) => l.name).filter(Boolean);
      await Promise.all(
        langNames.map((name) =>
          SkillVerification.findOneAndUpdate(
            { studentId: req.userId, name },
            { $set: { status: "Verified", ...getSkillMeta(name) } },
            { upsert: true, new: true }
          )
        )
      );
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to save profile data" });
  }
});

// ── Feedback ──────────────────────────────────────────────────
// GET /api/student/feedback
router.get("/feedback", async (req: AuthRequest, res) => {
  try {
    const feedback = await Feedback.find({ studentId: req.userId }).sort({ createdAt: -1 });
    res.json(feedback);
  } catch {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// ── Skill Gaps ────────────────────────────────────────────────
// GET /api/student/skill-gaps
router.get("/skill-gaps", async (req: AuthRequest, res) => {
  try {
    const user = await UserBase.findById(req.userId);
    const studentSkills: string[] = (user as { skills?: string[]; targetRoles?: string[] })?.skills ?? [];
    const targetRoles: string[] = (user as { targetRoles?: string[] })?.targetRoles ?? [];

    if (targetRoles.length === 0) {
      return res.json([]);
    }

    const gaps = await Promise.all(
      targetRoles.map(async (role) => {
        // 1. Start from the predefined role definition (core + bonus skills)
        const roleDef = findRoleForTitle(role);
        const coreSkills: Set<string> = new Set(roleDef?.coreSkills ?? []);
        const allRoleSkills: Set<string> = new Set([
          ...(roleDef?.coreSkills ?? []),
          ...(roleDef?.bonusSkills ?? []),
        ]);

        // 2. Also pull skills from active job postings that match this role
        const jobs = await JobPosting.find({
          title: { $regex: role, $options: "i" },
          status: "Active",
        });
        for (const job of jobs) {
          for (const rs of (job.requiredSkills as Array<{ name: string }>) ?? []) {
            allRoleSkills.add(rs.name);
          }
        }

        const allRequired = [...allRoleSkills];
        const matched = allRequired.filter(s => studentSkills.includes(s));
        const missing = allRequired
          .filter(s => !studentSkills.includes(s))
          .map(s => ({
            name: s,
            reason: coreSkills.has(s)
              ? `Core skill for ${role}`
              : `Recommended for ${role}`,
            proficiencyNeeded: coreSkills.has(s) ? "Intermediate" as const : "Beginner" as const,
          }))
          // Show core skills first, then bonus
          .sort((a, b) => {
            const aCore = coreSkills.has(a.name) ? 0 : 1;
            const bCore = coreSkills.has(b.name) ? 0 : 1;
            return aCore - bCore;
          })
          .slice(0, 10);

        const matchPercent = allRequired.length > 0
          ? Math.round((matched.length / allRequired.length) * 100)
          : 0;

        return {
          targetRole: role,
          matchPercent,
          strengths: matched,
          missing,
        };
      })
    );

    res.json(gaps);
  } catch {
    res.status(500).json({ error: "Failed to compute skill gaps" });
  }
});

// ── Notifications ─────────────────────────────────────────────
// GET /api/student/notifications
router.get("/notifications", async (req: AuthRequest, res) => {
  try {
    const notes = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
    const result = notes.map((n: {
      _id: unknown; message: string; createdAt: Date; read: boolean; type: string;
    }) => ({
      id: String(n._id),
      message: n.message,
      timestamp: n.createdAt.toISOString(),
      read: n.read,
      type: n.type,
    }));
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /api/student/notifications/:id/read
router.patch("/notifications/:id/read", async (req: AuthRequest, res) => {
  try {
    const note = await Notification.findOneAndUpdate(
      { _id: req.params["id"], userId: req.userId },
      { read: true },
      { returnDocument: 'after' }
    );
    if (!note) return res.status(404).json({ error: "Notification not found" });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// PATCH /api/student/notifications/read-all
router.patch("/notifications/read-all", async (req: AuthRequest, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// ── Pipeline Assessments ──────────────────────────────────────
// GET /api/student/applications/:appId/assessment
// Returns the assessment config for the student's current pipeline stage
router.get("/applications/:appId/assessment", async (req: AuthRequest, res) => {
  try {
    const app = await Application.findOne({ _id: req.params["appId"], studentId: req.userId });
    if (!app) return res.status(404).json({ error: "Application not found" });

    const job = await JobPosting.findById(app.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const stageIdx = (app as unknown as { pipelineStage: number }).pipelineStage;
    const pipeline = job.pipeline as Array<{
      name: string; type: string;
      assessmentConfig?: {
        type: string; skills: string[];
        numQuestionsPerSkill: number; timeLimitSeconds: number;
        premadeQuestions: Array<{ question: string; options: string[]; correctIndex: number }>;
        proctoringEnabled: boolean;
      };
    }>;
    const stage = pipeline[stageIdx];

    if (!stage || stage.type !== "Online Assessment") {
      return res.status(400).json({ error: "Current stage is not an Online Assessment" });
    }

    const stages = (app as unknown as { stages: Array<{ assessmentStatus?: string }> }).stages;
    if (stages[stageIdx]?.assessmentStatus === "completed") {
      return res.status(400).json({ error: "Assessment already completed" });
    }

    const config = stage.assessmentConfig ?? { type: "ai", skills: [], numQuestionsPerSkill: 3, timeLimitSeconds: 90, premadeQuestions: [], proctoringEnabled: true };

    // If AI type, also include the skills from the job posting as fallback
    let assessmentSkills = config.skills ?? [];
    if (assessmentSkills.length === 0) {
      assessmentSkills = (job.requiredSkills as Array<{ name: string }> ?? []).map(s => s.name);
    }

    res.json({
      stageIndex: stageIdx,
      stageName: stage.name,
      assessmentType: config.type,
      skills: assessmentSkills,
      numQuestionsPerSkill: config.numQuestionsPerSkill,
      timeLimitSeconds: config.timeLimitSeconds,
      premadeQuestions: config.type === "premade" ? config.premadeQuestions : undefined,
      proctoringEnabled: config.proctoringEnabled,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch assessment config" });
  }
});

// POST /api/student/applications/:appId/assessment/generate
// Generates AI questions for the current pipeline stage assessment
router.post("/applications/:appId/assessment/generate", async (req: AuthRequest, res) => {
  try {
    const app = await Application.findOne({ _id: req.params["appId"], studentId: req.userId });
    if (!app) return res.status(404).json({ error: "Application not found" });

    const job = await JobPosting.findById(app.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const stageIdx = (app as unknown as { pipelineStage: number }).pipelineStage;
    const pipeline = job.pipeline as Array<{
      type: string;
      assessmentConfig?: { type: string; skills: string[]; numQuestionsPerSkill: number };
    }>;
    const stage = pipeline[stageIdx];

    if (!stage || stage.type !== "Online Assessment") {
      return res.status(400).json({ error: "Current stage is not an Online Assessment" });
    }

    const config = stage.assessmentConfig ?? { type: "ai", skills: [], numQuestionsPerSkill: 3 };
    if (config.type !== "ai") {
      return res.status(400).json({ error: "This assessment does not use AI-generated questions" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    let skills = config.skills ?? [];
    if (skills.length === 0) {
      skills = (job.requiredSkills as Array<{ name: string }> ?? []).map(s => s.name);
    }
    if (skills.length === 0) {
      return res.status(400).json({ error: "No skills configured for this assessment" });
    }

    // Mark assessment as in_progress
    await Application.findByIdAndUpdate(app._id, {
      $set: { [`stages.${stageIdx}.assessmentStatus`]: "in_progress" },
    });

    const generator = new AIQuestionGenerator(apiKey);
    const questions = await generator.generateQuestions({
      skills,
      apiKey,
      numQuestionsPerSkill: config.numQuestionsPerSkill || 3,
    });

    const verificationResult = SkillVerificationService.generateVerificationQuestions(
      { skills, numQuestionsPerSkill: config.numQuestionsPerSkill || 3 },
      questions as any,
    );

    res.json({ success: true, data: verificationResult });
  } catch (err) {
    console.error("Assessment generate error:", err);
    res.status(500).json({ error: "Failed to generate assessment questions" });
  }
});

// POST /api/student/applications/:appId/assessment/submit
// Submit answers and record score for the current pipeline stage
router.post("/applications/:appId/assessment/submit", async (req: AuthRequest, res) => {
  try {
    const { answers, answerKey, report } = req.body as {
      answers: Array<{ questionId: string; selectedAnswer: string }>;
      answerKey: Array<{ questionId: string; skill: string; correctAnswer: string; explanation: string }>;
      report?: unknown;
    };

    if (!answers || !answerKey) {
      return res.status(400).json({ error: "answers and answerKey are required" });
    }

    const app = await Application.findOne({ _id: req.params["appId"], studentId: req.userId });
    if (!app) return res.status(404).json({ error: "Application not found" });

    const job = await JobPosting.findById(app.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const stageIdx = (app as unknown as { pipelineStage: number }).pipelineStage;
    const pipeline = job.pipeline as Array<{ type: string }>;
    const stage = pipeline[stageIdx];

    if (!stage || stage.type !== "Online Assessment") {
      return res.status(400).json({ error: "Current stage is not an Online Assessment" });
    }

    const result = SkillVerificationService.validateAnswers(answers, answerKey);

    await Application.findByIdAndUpdate(app._id, {
      $set: {
        [`stages.${stageIdx}.score`]: result.score,
        [`stages.${stageIdx}.assessmentStatus`]: "completed",
        [`stages.${stageIdx}.assessmentReport`]: report ?? null,
        [`stages.${stageIdx}.feedback`]: `Score: ${result.score}% (${result.correctAnswers}/${result.totalQuestions} correct)`,
      },
    });

    // Notify recruiter
    const recruiter = await UserBase.findById((job as unknown as { recruiterId: Types.ObjectId }).recruiterId);
    if (recruiter) {
      const student = await UserBase.findById(req.userId);
      await Notification.create({
        userId: recruiter._id,
        message: `${(student as { name?: string })?.name ?? "A candidate"} completed the online assessment for "${(job as { title: string }).title}" with a score of ${result.score}%.`,
        type: "info",
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Assessment submit error:", err);
    res.status(500).json({ error: "Failed to submit assessment" });
  }
});

// ── AI Interview ──────────────────────────────────────────────

// Helper: resolve interview context from an application
async function getInterviewContext(appId: string, userId: string) {
  const app = await Application.findOne({ _id: appId, studentId: userId });
  if (!app) return null;

  const job = await JobPosting.findById(app.jobId);
  if (!job) return null;

  const stageIdx = (app as unknown as { pipelineStage: number }).pipelineStage;
  const pipeline = job.pipeline as Array<{ name: string; type: string }>;
  const stage = pipeline[stageIdx];
  if (!stage || stage.type !== "AI Interview") return null;

  const student = await UserBase.findById(userId);
  const skills = (job.requiredSkills as Array<{ name: string }> ?? []).map(s => s.name);

  return {
    app,
    job,
    stageIdx,
    stage,
    context: {
      jobTitle: (job as { title: string }).title,
      jobDescription: (job as { description: string }).description,
      requiredSkills: skills,
      candidateName: (student as { name?: string })?.name ?? "Candidate",
    },
  };
}

// GET /api/student/applications/:appId/interview
// Returns interview config and checks eligibility
router.get("/applications/:appId/interview", async (req: AuthRequest, res) => {
  try {
    const resolved = await getInterviewContext(String(req.params["appId"]), req.userId!);
    if (!resolved) return res.status(400).json({ error: "Current stage is not an AI Interview or application not found" });

    const stages = (resolved.app as unknown as { stages: Array<{ assessmentStatus?: string }> }).stages;
    if (stages[resolved.stageIdx]?.assessmentStatus === "completed") {
      return res.status(400).json({ error: "Interview already completed" });
    }

    // Check if there's an existing in-progress interview
    const existing = await Interview.findOne({
      applicationId: resolved.app._id,
      stageIndex: resolved.stageIdx,
      status: "in_progress",
    });

    res.json({
      stageIndex: resolved.stageIdx,
      stageName: resolved.stage.name,
      jobTitle: resolved.context.jobTitle,
      jobDescription: resolved.context.jobDescription,
      requiredSkills: resolved.context.requiredSkills,
      candidateName: resolved.context.candidateName,
      existingInterviewId: existing?._id?.toString() ?? null,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch interview config" });
  }
});

// POST /api/student/applications/:appId/interview/start is now handled by the WebSocket relay
// (see geminiLiveRelay.ts)

// POST /api/student/applications/:appId/interview/message is now handled by the WebSocket relay
// (real-time audio is streamed via WebSocket instead of HTTP request/response)

// POST /api/student/applications/:appId/interview/end
// Ends the interview, evaluates the transcript, saves results
router.post("/applications/:appId/interview/end", async (req: AuthRequest, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });

    const { interviewId, durationSeconds } = req.body as { interviewId: string; durationSeconds?: number };
    if (!interviewId) return res.status(400).json({ error: "interviewId is required" });

    const interview = await Interview.findOne({
      _id: interviewId,
      studentId: req.userId,
      status: "in_progress",
    });
    if (!interview) return res.status(404).json({ error: "Interview session not found" });

    const resolved = await getInterviewContext(String(req.params["appId"]), req.userId!);
    if (!resolved) return res.status(400).json({ error: "Application context invalid" });

    const transcript = (interview as unknown as { transcript: Array<{ role: string; text: string }> }).transcript;

    // Evaluate the interview
    const service = new AIInterviewerService(apiKey);
    let evaluation;
    try {
      evaluation = await service.evaluate(
        resolved.context,
        transcript.map(t => ({ role: t.role as "interviewer" | "candidate", text: t.text })),
      );
    } catch {
      evaluation = { overallScore: 0, summary: "Evaluation could not be generated.", strengths: [], improvements: [] };
    }

    // Update interview record
    await Interview.findByIdAndUpdate(interviewId, {
      $set: {
        status: "completed",
        durationSeconds: durationSeconds ?? 0,
        evaluation,
      },
    });

    // Update application stage
    await Application.findByIdAndUpdate(resolved.app._id, {
      $set: {
        [`stages.${resolved.stageIdx}.score`]: evaluation.overallScore,
        [`stages.${resolved.stageIdx}.assessmentStatus`]: "completed",
        [`stages.${resolved.stageIdx}.feedback`]: `Interview Score: ${evaluation.overallScore}% — ${evaluation.summary}`,
      },
    });

    // Notify recruiter
    const recruiter = await UserBase.findById((resolved.job as unknown as { recruiterId: Types.ObjectId }).recruiterId);
    if (recruiter) {
      const student = await UserBase.findById(req.userId);
      await Notification.create({
        userId: recruiter._id,
        message: `${(student as { name?: string })?.name ?? "A candidate"} completed the AI interview for "${resolved.context.jobTitle}" with a score of ${evaluation.overallScore}%.`,
        type: "info",
      });
    }

    res.json({ success: true, evaluation });
  } catch (err) {
    console.error("Interview end error:", err);
    res.status(500).json({ error: "Failed to end interview" });
  }
});

export default router;
