// ─── Auth & Users ───────────────────────────────────────────────
export type Role = 'student' | 'recruiter';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface StudentUser extends User {
  role: 'student';
  university: string;
  degree: string;
  graduationYear: number;
  skills: string[];
  targetRoles: string[];
  experienceLevel: ExperienceLevel;
  profileVisible: boolean;
}

export interface RecruiterUser extends User {
  role: 'recruiter';
  companyName: string;
  industry: string;
  companySize: string;
  hiringDomains: string[];
  companyDescription: string;
  companyWebsite?: string;
}

// ─── Skills ─────────────────────────────────────────────────────
export type SkillCategory = 'All' | 'Web' | 'Backend' | 'Data' | 'DevOps' | 'Mobile';
export type SkillStatus = 'Verified' | 'Not Verified' | 'In Progress';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Skill {
  id: string;
  name: string;
  icon: string;
  category: SkillCategory;
  status: SkillStatus;
  difficulty: Difficulty;
  score?: number;
}

// ─── Assessment ─────────────────────────────────────────────────
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface AssessmentResult {
  skillId: string;
  skillName: string;
  score: number;
  total: number;
  passed: boolean;
  answers: { questionId: string; selected: number; correct: number }[];
}

// ─── Jobs ───────────────────────────────────────────────────────
export type EmploymentType = 'Full-time' | 'Part-time' | 'Internship';
export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite';
export type JobStatus = 'Active' | 'Draft' | 'Closed';

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  department: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryRange?: string;
  description: string;
  requiredSkills: RequiredSkill[];
  pipeline: PipelineStage[];
  status: JobStatus;
  applicantCount: number;
  inPipelineCount: number;
  topMatchPercent: number;
  createdAt: string;
}

export interface RequiredSkill {
  name: string;
  proficiency: Difficulty;
  mustHave: boolean;
}

// ─── Match & Gap ────────────────────────────────────────────────
export interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  companyLogo?: string;
  matchPercent: number;
  readinessPercent: number;
  requiredSkills: { name: string; verified: boolean }[];
  location: string;
  experienceLevel: ExperienceLevel;
}

export interface SkillGap {
  targetRole: string;
  matchPercent: number;
  strengths: string[];
  missing: SkillGapItem[];
}

export interface SkillGapItem {
  name: string;
  reason: string;
  proficiencyNeeded: Difficulty;
}

// ─── Applications ───────────────────────────────────────────────
export type ApplicationStatus = 'Pending Review' | 'In Pipeline' | 'Rejected' | 'Hired';

export interface Application {
  id: string;
  jobId: string;
  company: string;
  companyLogo?: string;
  role: string;
  appliedDate: string;
  status: ApplicationStatus;
  pipelineStage?: number;
  pipelineTotal?: number;
  stages?: ApplicationStage[];
}

export interface ApplicationStage {
  name: string;
  completed: boolean;
  score?: number;
  feedback?: string;
}

// ─── Pipeline ───────────────────────────────────────────────────
export type StageType = 'Profile Review' | 'GitHub Analysis' | 'Online Assessment' | 'AI Interview' | 'Final';

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  description: string;
  maxAdvancing: number;
}

export interface PipelineCandidate {
  id: string;
  name: string;
  avatarUrl?: string;
  stageId: string;
  score?: number;
  status: 'active' | 'advanced' | 'rejected';
  notes?: string;
}

// ─── Candidate ──────────────────────────────────────────────────
export interface Candidate {
  id: string;
  name: string;
  avatarUrl?: string;
  university: string;
  degree: string;
  graduationYear: number;
  verifiedSkills: string[];
  allSkills: string[];
  targetRoles: string[];
  experienceLevel: ExperienceLevel;
  matchPercent: number;
  readinessScore: number;
  hasProjects: boolean;
  hasGitHub: boolean;
  projects?: Project[];
  githubStats?: GitHubStats;
  assessmentScores?: { skill: string; score: number }[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
}

export interface GitHubStats {
  repos: number;
  languages: string[];
  contributions: number;
}

// ─── Feedback ───────────────────────────────────────────────────
export interface Feedback {
  id: string;
  candidateId?: string;
  candidateName?: string;
  company: string;
  role: string;
  recruiterName: string;
  date: string;
  strengths: string[];
  improvements: string[];
  notes?: string;
  rating: number;
}

// ─── Notifications ──────────────────────────────────────────────
export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

// ─── Organization ───────────────────────────────────────────────
export interface Organization {
  name: string;
  logo?: string;
  industry: string;
  size: string;
  website: string;
  hiringDomains: string[];
  about: string;
  teamMembers: { name: string; email: string; role: string }[];
}
