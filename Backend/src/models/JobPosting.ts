import { Schema, model, models, Types } from "mongoose";

const RequiredSkillSchema = new Schema(
  {
    name: { type: String, required: true },
    proficiency: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], required: true },
    mustHave: { type: Boolean, default: false },
  },
  { _id: false }
);

const PremadeQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
  },
  { _id: false }
);

const AssessmentConfigSchema = new Schema(
  {
    type: { type: String, enum: ["ai", "premade"], default: "ai" },
    skills: { type: [String], default: [] },
    numQuestionsPerSkill: { type: Number, default: 3 },
    timeLimitSeconds: { type: Number, default: 90 },
    premadeQuestions: { type: [PremadeQuestionSchema], default: [] },
    proctoringEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const PipelineStageSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["Profile Review", "GitHub Analysis", "Online Assessment", "AI Interview", "Final"], required: true },
    description: { type: String, default: "" },
    maxAdvancing: { type: Number, default: 10 },
    assessmentConfig: { type: AssessmentConfigSchema },
  },
  { _id: true }
);

const JobPostingSchema = new Schema(
  {
    recruiterId: { type: Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    department: { type: String, required: true },
    location: { type: String, required: true },
    workMode: { type: String, enum: ["Remote", "Hybrid", "Onsite"], required: true },
    employmentType: { type: String, enum: ["Full-time", "Part-time", "Internship"], required: true },
    experienceLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], required: true },
    salaryRange: { type: String },
    description: { type: String, required: true },
    requiredSkills: { type: [RequiredSkillSchema], default: [] },
    pipeline: { type: [PipelineStageSchema], default: [] },
    status: { type: String, enum: ["Active", "Draft", "Closed"], default: "Draft" },
    applicantCount: { type: Number, default: 0 },
    inPipelineCount: { type: Number, default: 0 },
    topMatchPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const JobPosting = models["JobPosting"] ?? model("JobPosting", JobPostingSchema);
