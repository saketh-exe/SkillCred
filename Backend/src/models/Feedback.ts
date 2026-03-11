import { Schema, model, models, Types } from "mongoose";

const FeedbackSchema = new Schema(
  {
    recruiterId: { type: Types.ObjectId, ref: "User", required: true },
    studentId: { type: Types.ObjectId, ref: "User", required: true },
    jobId: { type: Types.ObjectId, ref: "JobPosting" },
    company: { type: String, required: true },
    role: { type: String, required: true },
    recruiterName: { type: String, required: true },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    notes: { type: String },
    rating: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);

export const Feedback = models["Feedback"] ?? model("Feedback", FeedbackSchema);
