import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { UserBase } from "../models/User";
import { JobPosting } from "../models/JobPosting";
import { Application } from "../models/Application";
import { SkillVerification, getSkillMeta } from "../models/SkillVerification";
import { Notification } from "../models/Notification";
import { Feedback } from "../models/Feedback";

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
      .populate("jobId", "title company")
      .sort({ createdAt: -1 });

    const result = apps.map((a: {
      _id: unknown; status: string; pipelineStage: number; stages: unknown[];
      createdAt: Date; jobId: { _id: unknown; title: string; company: string } | unknown;
    }) => {
      const job = a.jobId as { _id: unknown; title: string; company: string };
      return {
        id: String(a._id),
        jobId: String(job?._id ?? ""),
        company: job?.company ?? "",
        role: job?.title ?? "",
        appliedDate: a.createdAt.toISOString().split("T")[0],
        status: a.status,
        pipelineStage: a.pipelineStage,
        pipelineTotal: a.stages?.length ?? 0,
        stages: a.stages,
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
      githubAnalysis?: unknown;
      credibilityReport?: unknown;
    };
    const update: Record<string, unknown> = {};
    if (parsedResume !== undefined) update["parsedResume"] = parsedResume;
    if (githubAnalysis !== undefined) update["githubAnalysis"] = githubAnalysis;
    if (credibilityReport !== undefined) update["credibilityReport"] = credibilityReport;
    await UserBase.findByIdAndUpdate(req.userId, { $set: update });
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

    // Find active job postings for each target role and compute gap
    const gaps = await Promise.all(
      targetRoles.map(async (role) => {
        const jobs = await JobPosting.find({
          title: { $regex: role, $options: "i" },
          status: "Active",
        });

        // Tally required skills across postings
        const skillCount: Record<string, number> = {};
        for (const job of jobs) {
          for (const rs of (job.requiredSkills as Array<{ name: string }>) ?? []) {
            skillCount[rs.name] = (skillCount[rs.name] ?? 0) + 1;
          }
        }

        const totalPostings = jobs.length || 1;
        const allRequired = Object.keys(skillCount);
        const matched = allRequired.filter(s => studentSkills.includes(s));
        const missing = allRequired
          .filter(s => !studentSkills.includes(s))
          .map(s => ({
            name: s,
            reason: `Required in ${Math.round((skillCount[s] / totalPostings) * 100)}% of ${role} postings`,
            proficiencyNeeded: "Intermediate",
          }))
          .slice(0, 6);

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

export default router;
