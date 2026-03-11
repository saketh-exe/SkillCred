import { Schema, model, models, Types } from "mongoose";

const ApplicationStageSchema = new Schema(
  {
    name: { type: String, required: true },
    completed: { type: Boolean, default: false },
    score: { type: Number },
    feedback: { type: String },
  },
  { _id: false }
);

const ApplicationSchema = new Schema(
  {
    studentId: { type: Types.ObjectId, ref: "User", required: true },
    jobId: { type: Types.ObjectId, ref: "JobPosting", required: true },
    status: {
      type: String,
      enum: ["Pending Review", "In Pipeline", "Rejected", "Hired"],
      default: "Pending Review",
    },
    stages: { type: [ApplicationStageSchema], default: [] },
    pipelineStage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ApplicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

export const Application = models["Application"] ?? model("Application", ApplicationSchema);
