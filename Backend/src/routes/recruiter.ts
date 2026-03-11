import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { UserBase } from "../models/User";
import { JobPosting } from "../models/JobPosting";
import { Application } from "../models/Application";
import { SkillVerification } from "../models/SkillVerification";
import { Notification } from "../models/Notification";
import { Feedback } from "../models/Feedback";

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
    const user = await UserBase.findByIdAndUpdate(req.userId, update, { new: true });
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
      { new: true }
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
        hasGitHub: false,
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

    const s = student as unknown as Record<string, unknown>;
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
      hasGitHub: false,
      matchPercent: 0,
      readinessScore: 0,
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

    const candidates = apps.map((a: {
      studentId: { _id: unknown; name: string; avatarUrl?: string } | unknown;
      status: string; pipelineStage: number; stages: Array<{ score?: number }>;
    }) => {
      const student = a.studentId as { _id: unknown; name: string; avatarUrl?: string };
      const currentStage = (job.pipeline as Array<{ _id: unknown }>)[a.pipelineStage];
      const mapped = {
        id: String(student?._id ?? ""),
        name: student?.name ?? "Unknown",
        avatarUrl: student?.avatarUrl,
        stageId: String(currentStage?._id ?? ""),
        score: a.stages?.[a.pipelineStage - 1]?.score,
        status: a.status === "Rejected" ? "rejected" : "active",
      };
      console.log(`[getPipeline] candidate studentId=${mapped.id} pipelineStage=${a.pipelineStage} -> stageId=${mapped.stageId}`);
      return mapped;
    });

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
      { new: true }
    );
    console.log(`[move] application update result: ${app ? `_id=${String(app._id)} pipelineStage=${(app as unknown as { pipelineStage: number }).pipelineStage}` : "NOT FOUND"}`);
    if (!app) return res.status(404).json({ error: "Application not found" });

    res.json({ ok: true, pipelineStage: stageIndex });
  } catch (err) {
    console.error("[move] error:", err);
    res.status(500).json({ error: "Failed to move candidate" });
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
      { new: true }
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

export default router;
