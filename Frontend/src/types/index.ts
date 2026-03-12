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
export type SkillCategory = 'All' | 'Web' | 'Backend' | 'Data' | 'DevOps' | 'Mobile' | 'AI' | 'Security' | 'Testing' | 'Design' | 'Other';
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
  assessmentStatus?: 'not_started' | 'in_progress' | 'completed';
  stageType?: string;
}

// ─── Pipeline Assessments ────────────────────────────────────────
export interface AssessmentConfig {
  stageIndex: number;
  stageName: string;
  assessmentType: 'ai' | 'premade';
  skills: string[];
  numQuestionsPerSkill: number;
  timeLimitSeconds: number;
  premadeQuestions?: { question: string; options: string[]; correctIndex: number }[];
  proctoringEnabled: boolean;
}

export interface AssessmentQuestion {
  id: string;
  skill: string;
  question: string;
  options: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface AssessmentSkillSection {
  skill: string;
  questions: AssessmentQuestion[];
  totalQuestions: number;
}

export interface AssessmentData {
  candidateName?: string;
  date: string;
  skills: AssessmentSkillSection[];
  totalQuestionsGenerated: number;
  answerKey: { questionId: string; skill: string; correctAnswer: string; explanation: string }[];
}

export interface AssessmentVerificationResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  results: {
    questionId: string;
    skill: string;
    isCorrect: boolean;
    correctAnswer: string;
    selectedAnswer: string;
    explanation: string;
  }[];
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
  matchPercent?: number;
  score?: number;
  status: 'active' | 'advanced' | 'rejected' | 'hired';
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
  resumeUrl?: string | null;
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

// ─── GitHub Analysis ────────────────────────────────────────────
export interface GithubLanguageProfile {
  name: string;
  bytes: number;
  percentage: number;
  repoCount: number;
  significanceScore: number;
}

export interface GithubCommitFile {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
}

export interface GithubCommitSummary {
  sha: string;
  message: string;
  date: string;
  url: string;
  files: GithubCommitFile[];
}

export interface GithubRepoProfile {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  primaryLanguage: string | null;
  languages: Record<string, number>;
  significanceScore: number;
  isFork: boolean;
  lastPushed: string;
  recentCommits: GithubCommitSummary[];
}

export interface GithubAnalysis {
  profile: {
    username: string;
    name: string | null;
    bio: string | null;
    publicRepos: number;
    followers: number;
    following: number;
    avatarUrl: string;
    profileUrl: string;
    memberSince: string;
  };
  languages: GithubLanguageProfile[];
  repositories: GithubRepoProfile[];
  summary: {
    totalReposAnalyzed: number;
    ownRepos: number;
    forkedRepos: number;
    totalCodeBytes: number;
    topLanguage: string | null;
    mostSignificantRepo: string | null;
    totalStars: number;
    totalForks: number;
  };
}

// ─── Resume Parsing ─────────────────────────────────────────────
export interface ResumeProject {
  name: string;
  description: string | null;
  github: string | null;
  technologies: string[];
}

export interface ResumeInternship {
  company: string;
  role: string;
  duration: string | null;
  description: string | null;
}

export interface ParsedResume {
  github: { username: string | null; url: string | null } | null;
  skills: string[];
  projects: ResumeProject[];
  internships: ResumeInternship[];
}

// ─── Credibility Report ─────────────────────────────────────────
export interface CredibilitySkillAnalysis {
  skill: string;
  verificationStatus: 'verified' | 'partially_verified' | 'unverified';
  evidence: string | null;
}

export interface CredibilityProjectAnalysis {
  name: string;
  source: 'resume_only' | 'github_only' | 'both';
  githubRepo: string | null;
  notes: string | null;
}

export interface CredibilityReport {
  overallScore: number;
  summary: string;
  skillsAnalysis: CredibilitySkillAnalysis[];
  projectsAnalysis: CredibilityProjectAnalysis[];
  strengths: string[];
  redFlags: string[];
  recommendations: string[];
}

// ─── AI Interview ───────────────────────────────────────────────
export interface InterviewConfig {
  stageIndex: number;
  stageName: string;
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  candidateName: string;
  existingInterviewId: string | null;
}

export interface InterviewMessage {
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp?: string;
}

export interface InterviewEvaluation {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewTranscript {
  id: string;
  candidateName: string;
  candidateEmail?: string;
  jobTitle: string;
  jobDescription?: string;
  transcript: InterviewMessage[];
  evaluation: InterviewEvaluation;
  durationSeconds: number;
  status: string;
  createdAt: string;
}

export interface InterviewListItem {
  id: string;
  candidateName: string;
  jobTitle: string;
  stageIndex: number;
  durationSeconds: number;
  evaluation: InterviewEvaluation;
  messageCount: number;
  completedAt: string;
}
