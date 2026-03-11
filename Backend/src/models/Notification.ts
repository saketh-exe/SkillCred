import { Schema, model, models, Types } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["info", "success", "warning"], default: "info" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = models["Notification"] ?? model("Notification", NotificationSchema);
