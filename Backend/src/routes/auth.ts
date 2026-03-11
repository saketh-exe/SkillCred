import { Router } from "express";
import jwt from "jsonwebtoken";
import { UserBase, Student, Recruiter } from "../models/User";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();

function signToken(userId: string, role: string): string {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign({ userId, role }, secret, { expiresIn: "7d" });
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await UserBase.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(String(user._id), user.role);
    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/signup/student
router.post("/signup/student", async (req, res) => {
  try {
    const {
      name, email, password, university, degree,
      graduationYear, skills, targetRoles, experienceLevel, avatarUrl,
    } = req.body;

    if (!name || !email || !password || !university || !degree || !graduationYear) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const exists = await UserBase.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const student = await Student.create({
      name, email, password, university, degree,
      graduationYear, skills: skills ?? [], targetRoles: targetRoles ?? [],
      experienceLevel: experienceLevel ?? "Beginner",
      avatarUrl, profileVisible: true,
    });

    const token = signToken(String(student._id), "student");
    res.status(201).json({ token, user: student });
  } catch (err) {
    console.error("Student signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// POST /api/auth/signup/recruiter
router.post("/signup/recruiter", async (req, res) => {
  try {
    const {
      name, email, password, companyName, industry, companySize,
      hiringDomains, companyDescription, companyWebsite, avatarUrl,
    } = req.body;

    if (!name || !email || !password || !companyName || !industry || !companySize) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const exists = await UserBase.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const recruiter = await Recruiter.create({
      name, email, password, companyName, industry, companySize,
      hiringDomains: hiringDomains ?? [], companyDescription: companyDescription ?? "",
      companyWebsite, avatarUrl,
    });

    const token = signToken(String(recruiter._id), "recruiter");
    res.status(201).json({ token, user: recruiter });
  } catch (err) {
    console.error("Recruiter signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// GET /api/auth/me  — returns the current user from the JWT
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await UserBase.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
