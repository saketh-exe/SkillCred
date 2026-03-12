import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { UserBase } from "../models/User";
import { JobPosting } from "../models/JobPosting";
import { Application } from "../models/Application";
import { SkillVerification } from "../models/SkillVerification";
import { Notification } from "../models/Notification";
import { Feedback } from "../models/Feedback";
import { Interview } from "../models/Interview";

const router = Router();
router.use(requireAuth);

// ── Profile ───────────────────────────────────────────────────
// GET /api/recruiter/profile
router.get("/profile", async (req: AuthRequest, res) => {
  try {
    const user = await UserBase.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PATCH /api/recruiter/profile
router.patch("/profile", async (req: AuthRequest, res) => {
  try {
    const allowed = ["name", "avatarUrl", "companyName", "industry", "companySize",
      "hiringDomains", "companyDescription", "companyWebsite"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }
    const user = await UserBase.findByIdAndUpdate(req.userId, update, { returnDocument: 'after' });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ── Job Postings ──────────────────────────────────────────────
// GET /api/recruiter/jobs
router.get("/jobs", async (req: AuthRequest, res) => {
  try {
    const jobs = await JobPosting.find({ recruiterId: req.userId }).sort({ createdAt: -1 });
    res.json(jobs.map((j: { _id: unknown; toJSON: () => Record<string, unknown> }) => ({
      ...j.toJSON(), id: String(j._id),
    })));
  } catch {
    res.status(500).json({ error: "Failed to fetch job postings" });
  }
});

// POST /api/recruiter/jobs
router.post("/jobs", async (req: AuthRequest, res) => {
  try {
    const recruiter = await UserBase.findById(req.userId);
    if (!recruiter) return res.status(404).json({ error: "User not found" });

    const body = req.body as Record<string, unknown>;

    // Strip frontend-generated 'id' from pipeline stages (not valid ObjectIds)
    const pipeline = Array.isArray(body.pipeline)
      ? (body.pipeline as Record<string, unknown>[]).map(({ id: _frontendId, ...rest }) => rest)
      : [];

    const job = await JobPosting.create({
      ...body,
      pipeline,
      recruiterId: req.userId,
      company: (recruiter as { companyName?: string }).companyName ?? body.company,
    });
    res.status(201).json({ ...job.toJSON(), id: String(job._id) });
  } catch (err) {
    console.error("Create job error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to create job posting" });
  }
});

// PATCH /api/recruiter/jobs/:id
router.patch("/jobs/:id", async (req: AuthRequest, res) => {
  try {
    const job = await JobPosting.findOneAndUpdate(
      { _id: req.params["id"], recruiterId: req.userId },
      req.body,
      { returnDocument: 'after' }
    );
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ ...(job.toJSON() as Record<string, unknown>), id: String(job._id) });
  } catch {
    res.status(500).json({ error: "Failed to update job posting" });
  }
});

// DELETE /api/recruiter/jobs/:id
router.delete("/jobs/:id", async (req: AuthRequest, res) => {
  try {
    const job = await JobPosting.findOneAndDelete({ _id: req.params["id"], recruiterId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });
    // Remove all applications for this job so students no longer see it
    await Application.deleteMany({ jobId: job._id });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete job posting" });
  }
});

// ── Candidates ────────────────────────────────────────────────
// GET /api/recruiter/candidates — students who applied to any of this recruiter's jobs
router.get("/candidates", async (req: AuthRequest, res) => {
  try {
    const myJobs = await JobPosting.find({ recruiterId: req.userId }).select("_id");
    const jobIds = myJobs.map((j: { _id: unknown }) => j._id);

    const apps = await Application.find({ jobId: { $in: jobIds } })
      .populate("studentId")
      .populate("jobId", "title")
      .sort({ createdAt: -1 });

    // De-duplicate by studentId, keep most recent
    const seen = new Set<string>();
    const candidates = [];
    for (const app of apps) {
      const student = app.studentId as Record<string, unknown>;
      if (!student || seen.has(String(student._id))) continue;
      seen.add(String(student._id));

      const skills = await SkillVerification.find({
        studentId: student._id,
      }).select("name status score");

      const verifiedSkills = skills
        .filter((s: { status: string }) => s.status === "Verified")
        .map((s: { name: string }) => s.name);
      const allSkills = skills.map((s: { name: string }) => s.name);

      const job = app.jobId as { _id: unknown; title: string; requiredSkills?: Array<{ name: string }> };
      const jobDoc = await JobPosting.findById(job._id);
      const required: string[] = (jobDoc?.requiredSkills as Array<{ name: string }> ?? []).map(s => s.name);
      const matched = required.filter(s => allSkills.includes(s)).length;
      const matchPercent = required.length > 0 ? Math.round((matched / required.length) * 100) : 0;

      const gh = student["githubAnalysis"] as { profile?: { publicRepos?: number }; languages?: Array<{ name: string }>; repositories?: Array<{ recentCommits?: unknown[] }> } | null;
      const hasGitHub = !!gh;
      const githubStats = gh ? {
        repos: gh.profile?.publicRepos ?? 0,
        languages: (gh.languages ?? []).map((l) => l.name),
        contributions: (gh.repositories ?? []).reduce((sum, r) => sum + (r.recentCommits?.length ?? 0), 0),
      } : undefined;

      candidates.push({
        id: String(student._id),
        name: student.name,
        avatarUrl: student.avatarUrl,
        university: student.university,
        degree: student.degree,
        graduationYear: student.graduationYear,
        verifiedSkills,
        allSkills,
        targetRoles: student.targetRoles,
        experienceLevel: student.experienceLevel,
        matchPercent,
        readinessScore: Math.max(0, matchPercent - 10),
        hasProjects: false,
        hasGitHub,
        githubStats,
        resumeUrl: (student as Record<string, unknown>)["resumeUrl"] ?? null,
        assessmentScores: skills
          .filter((s: { score?: number }) => s.score != null)
          .map((s: { name: string; score: number }) => ({ skill: s.name, score: s.score })),
      });
    }

    res.json(candidates);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

// GET /api/recruiter/candidates/:id
router.get("/candidates/:id", async (req: AuthRequest, res) => {
  try {
    const student = await UserBase.findById(req.params["id"]);
    if (!student) return res.status(404).json({ error: "Candidate not found" });

    const skills = await SkillVerification.find({ studentId: student._id }).select("name status score");
    const verifiedSkills = skills
      .filter((s: { status: string }) => s.status === "Verified")
      .map((s: { name: string }) => s.name);
    const allSkills = skills.map((s: { name: string }) => s.name);

    // Compute matchPercent from the most recent application to this recruiter's jobs
    const myJobs = await JobPosting.find({ recruiterId: req.userId }).select("_id requiredSkills");
    const app = await Application.findOne({ studentId: student._id, jobId: { $in: myJobs.map((j: { _id: unknown }) => j._id) } })
      .sort({ createdAt: -1 })
      .populate("jobId", "requiredSkills");

    let matchPercent = 0;
    if (app?.jobId) {
      const jobDoc = app.jobId as { requiredSkills?: Array<{ name: string }> };
      const required = (jobDoc.requiredSkills ?? []).map((s) => s.name);
      const matched = required.filter((s) => allSkills.includes(s)).length;
      matchPercent = required.length > 0 ? Math.round((matched / required.length) * 100) : 0;
    }
    const readinessScore = Math.max(0, matchPercent - 10);

    const s = student as unknown as Record<string, unknown>;
    const gh = s["githubAnalysis"] as { profile?: { publicRepos?: number }; languages?: Array<{ name: string }>; repositories?: Array<{ recentCommits?: unknown[] }> } | null;
    const hasGitHub = !!gh;
    const githubStats = gh ? {
      repos: gh.profile?.publicRepos ?? 0,
      languages: (gh.languages ?? []).map((l) => l.name),
      contributions: (gh.repositories ?? []).reduce((sum, r) => sum + (r.recentCommits?.length ?? 0), 0),
    } : undefined;

    res.json({
      id: String(student._id),
      name: s["name"],
      avatarUrl: s["avatarUrl"],
      university: s["university"],
      degree: s["degree"],
      graduationYear: s["graduationYear"],
      verifiedSkills,
      allSkills,
      targetRoles: s["targetRoles"],
      experienceLevel: s["experienceLevel"],
      hasProjects: false,
      hasGitHub,
      githubStats,
      matchPercent,
      readinessScore,
      resumeUrl: s["resumeUrl"] ?? null,
      assessmentScores: skills
        .filter((s: { score?: number }) => s.score != null)
        .map((s: { name: string; score: number }) => ({ skill: s.name, score: s.score })),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch candidate" });
  }
});

// ── Pipeline ──────────────────────────────────────────────────
// GET /api/recruiter/pipeline/:jobId
router.get("/pipeline/:jobId", async (req: AuthRequest, res) => {
  try {
    const job = await JobPosting.findOne({ _id: req.params["jobId"], recruiterId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const apps = await Application.find({ jobId: job._id })
      .populate("studentId", "name avatarUrl");

    const required: string[] = (job.requiredSkills as Array<{ name: string }> ?? []).map((s) => s.name);

    const candidatesPromises = apps.map(async (a: {
      studentId: { _id: unknown; name: string; avatarUrl?: string } | unknown;
      status: string; pipelineStage: number; stages: Array<{ score?: number }>;
    }) => {
      const student = a.studentId as { _id: unknown; name: string; avatarUrl?: string };
      const currentStage = (job.pipeline as Array<{ _id: unknown }>)[a.pipelineStage];

      let matchPercent: number | undefined;
      if (required.length > 0 && student?._id) {
        const skills = await SkillVerification.find({ studentId: student._id }).select("name");
        const allSkills = skills.map((s: { name: string }) => s.name);
        const matched = required.filter((s) => allSkills.includes(s)).length;
        matchPercent = Math.round((matched / required.length) * 100);
      }

      const mapped = {
        id: String(student?._id ?? ""),
        name: student?.name ?? "Unknown",
        avatarUrl: student?.avatarUrl,
        stageId: String(currentStage?._id ?? ""),
        matchPercent,
        score: a.stages?.[a.pipelineStage - 1]?.score,
        status: a.status === "Rejected" ? "rejected" : a.status === "Hired" ? "hired" : "active",
      };
      console.log(`[getPipeline] candidate studentId=${mapped.id} pipelineStage=${a.pipelineStage} -> stageId=${mapped.stageId}`);
      return mapped;
    });
    const candidates = await Promise.all(candidatesPromises);

    res.json({
      stages: (job.pipeline as Array<{ _id: unknown; name: string; type: string; description: string; maxAdvancing: number }>).map(s => ({
        id: String(s._id), name: s.name, type: s.type, description: s.description, maxAdvancing: s.maxAdvancing,
      })),
      candidates,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch pipeline" });
  }
});

// PATCH /api/recruiter/pipeline/:jobId/move — move a candidate to a specific stage
router.patch("/pipeline/:jobId/move", async (req: AuthRequest, res) => {
  try {
    const { studentId, toStageId } = req.body as { studentId?: string; toStageId?: string };
    console.log(`[move] jobId=${req.params["jobId"]} recruiterId=${req.userId} studentId=${studentId} toStageId=${toStageId}`);

    if (!studentId || !toStageId) return res.status(400).json({ error: "studentId and toStageId required" });

    const job = await JobPosting.findOne({ _id: req.params["jobId"], recruiterId: req.userId });
    console.log(`[move] job lookup result: ${job ? String(job._id) : "NOT FOUND"}`);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const pipeline = job.pipeline as Array<{ _id: unknown }>;
    console.log(`[move] pipeline stage IDs: ${pipeline.map(s => String(s._id)).join(", ")}`);
    const stageIndex = pipeline.findIndex(s => String(s._id) === toStageId);
    console.log(`[move] resolved toStageId="${toStageId}" -> stageIndex=${stageIndex}`);
    if (stageIndex === -1) return res.status(400).json({ error: "Invalid stage" });

    // Build $set update: move pipelineStage and mark all prior stages as completed
    const setFields: Record<string, unknown> = {
      pipelineStage: stageIndex,
      status: "In Pipeline",
    };
    for (let i = 0; i < stageIndex; i++) {
      setFields[`stages.${i}.completed`] = true;
    }

    const app = await Application.findOneAndUpdate(
      { jobId: job._id, studentId },
      { $set: setFields },
      { returnDocument: 'after' }
    );
    console.log(`[move] application update result: ${app ? `_id=${String(app._id)} pipelineStage=${(app as unknown as { pipelineStage: number }).pipelineStage}` : "NOT FOUND"}`);
    if (!app) return res.status(404).json({ error: "Application not found" });

    try {
      await Notification.create({
        userId: new Types.ObjectId(studentId),
        message: `Your application for "${(job as { title: string }).title}" has advanced to a new stage.`,
        type: "info",
      });
    } catch (e) { console.warn("[move] notification error:", e); }

    res.json({ ok: true, pipelineStage: stageIndex });
  } catch (err) {
    console.error("[move] error:", err);
    res.status(500).json({ error: "Failed to move candidate" });
  }
});

// PATCH /api/recruiter/pipeline/:jobId/reject
router.patch("/pipeline/:jobId/reject", async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.body as { studentId?: string };
    if (!studentId) return res.status(400).json({ error: "studentId required" });
    const job = await JobPosting.findOne({ _id: req.params["jobId"], recruiterId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });
    const app = await Application.findOneAndUpdate(
      { jobId: job._id, studentId },
      { $set: { status: "Rejected" } },
      { returnDocument: 'after' }
    );
    if (!app) return res.status(404).json({ error: "Application not found" });
    try {
      await Notification.create({
        userId: new Types.ObjectId(studentId),
        message: `Your application for "${(job as { title: string }).title}" was not selected at this time.`,
        type: "info",
      });
    } catch (e) { console.warn("[reject] notification error:", e); }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject candidate" });
  }
});

// PATCH /api/recruiter/pipeline/:jobId/hire
router.patch("/pipeline/:jobId/hire", async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.body as { studentId?: string };
    if (!studentId) return res.status(400).json({ error: "studentId required" });
    const job = await JobPosting.findOne({ _id: req.params["jobId"], recruiterId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });
    const app = await Application.findOneAndUpdate(
      { jobId: job._id, studentId },
      { $set: { status: "Hired" } },
      { returnDocument: 'after' }
    );
    if (!app) return res.status(404).json({ error: "Application not found" });
    try {
      await Notification.create({
        userId: new Types.ObjectId(studentId),
        message: `Congratulations! You have been selected for "${(job as { title: string }).title}".`,
        type: "success",
      });
    } catch (e) { console.warn("[hire] notification error:", e); }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to hire candidate" });
  }
});

// ── Feedback ──────────────────────────────────────────────────
// GET /api/recruiter/feedback
router.get("/feedback", async (req: AuthRequest, res) => {
  try {
    const feedback = await Feedback.find({ recruiterId: req.userId })
      .populate("studentId", "name")
      .sort({ createdAt: -1 });
    const result = feedback.map((f: {
      _id: unknown; studentId: { _id: unknown; name: string } | unknown;
      company: string; role: string; recruiterName: string;
      strengths: string[]; improvements: string[]; notes?: string; rating: number; createdAt: Date;
    }) => {
      const student = f.studentId as { _id: unknown; name: string };
      return {
        id: String(f._id),
        candidateId: String(student?._id ?? ""),
        candidateName: student?.name ?? "",
        company: f.company,
        role: f.role,
        recruiterName: f.recruiterName,
        date: f.createdAt.toISOString().split("T")[0],
        strengths: f.strengths,
        improvements: f.improvements,
        notes: f.notes,
        rating: f.rating,
      };
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// POST /api/recruiter/feedback
router.post("/feedback", async (req: AuthRequest, res) => {
  try {
    const recruiter = await UserBase.findById(req.userId) as unknown as Record<string, unknown> | null;
    if (!recruiter) return res.status(404).json({ error: "User not found" });

    const { studentId, jobId, role, strengths, improvements, notes, rating } = req.body;
    const fb = await Feedback.create({
      recruiterId: req.userId,
      studentId,
      jobId,
      company: (recruiter as { companyName?: string }).companyName ?? "",
      role,
      recruiterName: recruiter["name"],
      strengths: strengths ?? [],
      improvements: improvements ?? [],
      notes,
      rating,
    });

    // Notify the student
    await Notification.create({
      userId: new Types.ObjectId(studentId),
      message: `Feedback received from ${recruiter["name"]} at ${(recruiter as { companyName?: string }).companyName}`,
      type: "info",
    });

    res.status(201).json(fb);
  } catch {
    res.status(500).json({ error: "Failed to create feedback" });
  }
});

// ── Notifications ─────────────────────────────────────────────
// GET /api/recruiter/notifications
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

// PATCH /api/recruiter/notifications/:id/read
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

// PATCH /api/recruiter/notifications/read-all
router.patch("/notifications/read-all", async (req: AuthRequest, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// ── Compare Candidates ────────────────────────────────────────
// POST /api/recruiter/compare
router.post("/compare", async (req: AuthRequest, res) => {
  try {
    const { ids } = req.body as { ids?: string[] };
    if (!ids || ids.length < 2) return res.status(400).json({ error: "Provide at least 2 candidate IDs" });

    const results = await Promise.all(
      ids.map(async (id) => {
        const student = await UserBase.findById(id) as unknown as Record<string, unknown> | null;
        if (!student) return null;
        const skills = await SkillVerification.find({ studentId: id }).select("name status score");
        return {
          id: String(student["_id"]),
          name: student["name"],
          university: student["university"],
          degree: student["degree"],
          graduationYear: student["graduationYear"],
          verifiedSkills: skills.filter((s: { status: string }) => s.status === "Verified").map((s: { name: string }) => s.name),
          allSkills: skills.map((s: { name: string }) => s.name),
          targetRoles: student["targetRoles"],
          experienceLevel: student["experienceLevel"],
          matchPercent: 0,
          readinessScore: 0,
          hasProjects: false,
          hasGitHub: false,
          assessmentScores: skills.filter((s: { score?: number }) => s.score != null)
            .map((s: { name: string; score: number }) => ({ skill: s.name, score: s.score })),
        };
      })
    );

    res.json(results.filter(Boolean));
  } catch {
    res.status(500).json({ error: "Failed to compare candidates" });
  }
});

// ── Assessment Configuration ──────────────────────────────────
// PATCH /api/recruiter/jobs/:jobId/stage/:stageIdx/assessment
// Configure assessment for a specific pipeline stage
router.patch("/jobs/:jobId/stage/:stageIdx/assessment", async (req: AuthRequest, res) => {
  try {
    const job = await JobPosting.findOne({ _id: req.params["jobId"], recruiterId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const stageIdx = parseInt(String(req.params["stageIdx"] ?? ""), 10);
    const pipeline = job.pipeline as Array<{ type: string }>;
    if (isNaN(stageIdx) || stageIdx < 0 || stageIdx >= pipeline.length) {
      return res.status(400).json({ error: "Invalid stage index" });
    }
    if (pipeline[stageIdx].type !== "Online Assessment") {
      return res.status(400).json({ error: "Stage is not an Online Assessment" });
    }

    const { type, skills, numQuestionsPerSkill, timeLimitSeconds, premadeQuestions, proctoringEnabled } = req.body as {
      type?: "ai" | "premade";
      skills?: string[];
      numQuestionsPerSkill?: number;
      timeLimitSeconds?: number;
      premadeQuestions?: Array<{ question: string; options: string[]; correctIndex: number }>;
      proctoringEnabled?: boolean;
    };

    const config: Record<string, unknown> = {};
    if (type !== undefined) config[`pipeline.${stageIdx}.assessmentConfig.type`] = type;
    if (skills !== undefined) config[`pipeline.${stageIdx}.assessmentConfig.skills`] = skills;
    if (numQuestionsPerSkill !== undefined) config[`pipeline.${stageIdx}.assessmentConfig.numQuestionsPerSkill`] = numQuestionsPerSkill;
    if (timeLimitSeconds !== undefined) config[`pipeline.${stageIdx}.assessmentConfig.timeLimitSeconds`] = timeLimitSeconds;
    if (premadeQuestions !== undefined) config[`pipeline.${stageIdx}.assessmentConfig.premadeQuestions`] = premadeQuestions;
    if (proctoringEnabled !== undefined) config[`pipeline.${stageIdx}.assessmentConfig.proctoringEnabled`] = proctoringEnabled;

    const updated = await JobPosting.findByIdAndUpdate(job._id, { $set: config }, { returnDocument: "after" });
    res.json({ ok: true, pipeline: (updated as { pipeline: unknown[] }).pipeline });
  } catch {
    res.status(500).json({ error: "Failed to update assessment config" });
  }
});

// ── Interview Transcripts ─────────────────────────────────────

// GET /api/recruiter/interviews/:jobId
// List all completed interviews for a given job
router.get("/interviews/:jobId", async (req: AuthRequest, res) => {
  try {
    const job = await JobPosting.findOne({ _id: req.params["jobId"], recruiterId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const interviews = await Interview.find({ jobId: job._id, status: "completed" })
      .sort({ createdAt: -1 })
      .lean();

    // Attach candidate names
    const studentIds = interviews.map((i: any) => i.studentId);
    const students = await UserBase.find({ _id: { $in: studentIds } }).select("name").lean();
    const nameMap = new Map(students.map((s: any) => [s._id.toString(), s.name]));

    const result = interviews.map((i: any) => ({
      id: i._id,
      candidateName: nameMap.get(i.studentId.toString()) ?? "Unknown",
      jobTitle: i.jobTitle,
      stageIndex: i.stageIndex,
      durationSeconds: i.durationSeconds,
      evaluation: i.evaluation,
      messageCount: i.transcript?.length ?? 0,
      completedAt: i.updatedAt,
    }));

    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});

// GET /api/recruiter/interviews/:jobId/:interviewId
// Get full interview transcript
router.get("/interviews/:jobId/:interviewId", async (req: AuthRequest, res) => {
  try {
    const job = await JobPosting.findOne({ _id: req.params["jobId"], recruiterId: req.userId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const interview = await Interview.findOne({
      _id: req.params["interviewId"],
      jobId: job._id,
    }).lean();
    if (!interview) return res.status(404).json({ error: "Interview not found" });

    const student = await UserBase.findById((interview as any).studentId).select("name email").lean();

    res.json({
      id: (interview as any)._id,
      candidateName: (student as any)?.name ?? "Unknown",
      candidateEmail: (student as any)?.email ?? "",
      jobTitle: (interview as any).jobTitle,
      jobDescription: (interview as any).jobDescription,
      transcript: (interview as any).transcript,
      evaluation: (interview as any).evaluation,
      durationSeconds: (interview as any).durationSeconds,
      status: (interview as any).status,
      createdAt: (interview as any).createdAt,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch interview" });
  }
});

export default router;
