import { Schema, model, models, Model } from "mongoose";
import bcrypt from "bcryptjs";

// ── Shared base ───────────────────────────────────────────────
export interface IUserBase {
  _id: unknown;
  name: string;
  email: string;
  password: string;
  role: "student" | "recruiter";
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const baseOptions = { discriminatorKey: "role", timestamps: true };

const UserBaseSchema = new Schema<IUserBase>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["student", "recruiter"], required: true },
    avatarUrl: { type: String },
  },
  baseOptions
);

UserBaseSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserBaseSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password as string);
};

// Strip password from JSON responses
UserBaseSchema.set("toJSON", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_doc: unknown, ret: any) {
    delete ret["password"];
    return ret;
  },
});

export const UserBase: Model<IUserBase> =
  (models["User"] as Model<IUserBase>) ?? model<IUserBase>("User", UserBaseSchema);

// ── Student discriminator ─────────────────────────────────────
export interface IStudent extends IUserBase {
  role: "student";
  university: string;
  degree: string;
  graduationYear: number;
  skills: string[];
  targetRoles: string[];
  experienceLevel: "Beginner" | "Intermediate" | "Advanced";
  profileVisible: boolean;
}

const StudentSchema = new Schema<IStudent>({
  university: { type: String, required: true },
  degree: { type: String, required: true },
  graduationYear: { type: Number, required: true },
  skills: { type: [String], default: [] },
  targetRoles: { type: [String], default: [] },
  experienceLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
  profileVisible: { type: Boolean, default: true },
});

export const Student: Model<IStudent> =
  (UserBase.discriminators?.["student"] as Model<IStudent>) ??
  UserBase.discriminator<IStudent>("student", StudentSchema);

// ── Recruiter discriminator ───────────────────────────────────
export interface IRecruiter extends IUserBase {
  role: "recruiter";
  companyName: string;
  industry: string;
  companySize: string;
  hiringDomains: string[];
  companyDescription: string;
  companyWebsite?: string;
}

const RecruiterSchema = new Schema<IRecruiter>({
  companyName: { type: String, required: true },
  industry: { type: String, required: true },
  companySize: { type: String, required: true },
  hiringDomains: { type: [String], default: [] },
  companyDescription: { type: String, default: "" },
  companyWebsite: { type: String },
});

export const Recruiter: Model<IRecruiter> =
  (UserBase.discriminators?.["recruiter"] as Model<IRecruiter>) ??
  UserBase.discriminator<IRecruiter>("recruiter", RecruiterSchema);
