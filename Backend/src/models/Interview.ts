import { Schema, model, models, Types } from "mongoose";

const InterviewMessageSchema = new Schema(
  {
    role: { type: String, enum: ["interviewer", "candidate"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InterviewSchema = new Schema(
  {
    applicationId: { type: Types.ObjectId, ref: "Application", required: true },
    studentId: { type: Types.ObjectId, ref: "User", required: true },
    jobId: { type: Types.ObjectId, ref: "JobPosting", required: true },
    stageIndex: { type: Number, required: true },

    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },

    transcript: { type: [InterviewMessageSchema], default: [] },
    durationSeconds: { type: Number, default: 0 },

    /** AI evaluation saved at the end */
    evaluation: {
      overallScore: { type: Number },
      summary: { type: String },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
    },

    /** Job description context stored at creation so recruiter review makes sense */
    jobTitle: { type: String },
    jobDescription: { type: String },
  },
  { timestamps: true }
);

InterviewSchema.index({ applicationId: 1 });
InterviewSchema.index({ studentId: 1 });

export const Interview = models["Interview"] ?? model("Interview", InterviewSchema);
