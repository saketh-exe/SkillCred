import { Schema, model, models, Types } from "mongoose";

export type SkillStatus = "Verified" | "Not Verified" | "In Progress";
export type SkillCategory = "Web" | "Backend" | "Data" | "DevOps" | "Mobile";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

const SKILL_ICONS: Record<string, string> = {
  Python: "🐍", JavaScript: "⚡", TypeScript: "🔷", Java: "☕", "C++": "⊕",
  Go: "🐹", Rust: "🦀", React: "⚛️", Angular: "🅰️", "Vue.js": "💚",
  "Next.js": "▲", "Node.js": "🟢", Express: "🚂", Django: "🎸", Flask: "🍶",
  "Spring Boot": "🌱", SQL: "🗃️", PostgreSQL: "🐘", MongoDB: "🍃", Redis: "🔴",
  Docker: "🐳", Kubernetes: "☸️", AWS: "☁️", GCP: "🌩️", Azure: "💙",
  "CI/CD": "🔄", Git: "📦", "REST APIs": "🔌", GraphQL: "◈",
  "System Design": "🏗️", "Machine Learning": "🤖", TensorFlow: "🧠",
  PyTorch: "🔥", Pandas: "🐼", Spark: "✨", "React Native": "📱",
  Flutter: "🦋", Swift: "🦜", Kotlin: "🎯",
};

const SKILL_CATEGORIES: Record<string, SkillCategory> = {
  Python: "Backend", JavaScript: "Web", TypeScript: "Web", Java: "Backend",
  "C++": "Backend", Go: "Backend", Rust: "Backend", React: "Web", Angular: "Web",
  "Vue.js": "Web", "Next.js": "Web", "Node.js": "Backend", Express: "Backend",
  Django: "Backend", Flask: "Backend", "Spring Boot": "Backend", SQL: "Data",
  PostgreSQL: "Data", MongoDB: "Data", Redis: "Data", Docker: "DevOps",
  Kubernetes: "DevOps", AWS: "DevOps", GCP: "DevOps", Azure: "DevOps",
  "CI/CD": "DevOps", Git: "DevOps", "REST APIs": "Backend", GraphQL: "Backend",
  "System Design": "Backend", "Machine Learning": "Data", TensorFlow: "Data",
  PyTorch: "Data", Pandas: "Data", Spark: "Data", "React Native": "Mobile",
  Flutter: "Mobile", Swift: "Mobile", Kotlin: "Mobile",
};

const SKILL_DIFFICULTIES: Record<string, Difficulty> = {
  Git: "Beginner", SQL: "Intermediate", JavaScript: "Intermediate",
  Python: "Intermediate", React: "Intermediate", "REST APIs": "Intermediate",
  TypeScript: "Intermediate", "Node.js": "Intermediate", Docker: "Intermediate",
  PostgreSQL: "Intermediate", MongoDB: "Beginner", Redis: "Intermediate",
  Kubernetes: "Advanced", "System Design": "Advanced", "Machine Learning": "Advanced",
  TensorFlow: "Advanced", PyTorch: "Advanced", Spark: "Intermediate",
  AWS: "Intermediate", GCP: "Intermediate", Azure: "Intermediate",
  "C++": "Advanced", Rust: "Advanced", "Spring Boot": "Intermediate",
};

export function getSkillMeta(name: string) {
  return {
    icon: SKILL_ICONS[name] ?? "💡",
    category: SKILL_CATEGORIES[name] ?? "Backend",
    difficulty: SKILL_DIFFICULTIES[name] ?? "Intermediate",
  };
}

const SkillVerificationSchema = new Schema(
  {
    studentId: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "💡" },
    category: { type: String, enum: ["Web", "Backend", "Data", "DevOps", "Mobile"], default: "Backend" },
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Intermediate" },
    status: { type: String, enum: ["Verified", "Not Verified", "In Progress"], default: "Not Verified" },
    score: { type: Number },
  },
  { timestamps: true }
);

SkillVerificationSchema.index({ studentId: 1, name: 1 }, { unique: true });

export const SkillVerification = models["SkillVerification"] ?? model("SkillVerification", SkillVerificationSchema);
