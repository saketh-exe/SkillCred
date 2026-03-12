import { apiFetch } from './api';
import type {
  StudentUser, Skill, JobMatch, Application, Feedback,
  SkillGap, Notification, Project, ParsedResume, GithubAnalysis, CredibilityReport,
  AssessmentConfig, AssessmentData, AssessmentVerificationResult,
  InterviewConfig, InterviewEvaluation,
} from '../types';

export const studentService = {
  getProfile: () =>
    apiFetch<StudentUser>('/student/profile').then(u => ({ ...u, id: (u as unknown as { _id: string })._id ?? u.id })),

  updateProfile: (data: Partial<StudentUser>) =>
    apiFetch<StudentUser>('/student/profile', {
      method: 'PATCH', body: JSON.stringify(data),
    }).then(u => ({ ...u, id: (u as unknown as { _id: string })._id ?? u.id })),

  getSkills: () =>
    apiFetch<Skill[]>('/student/skills'),

  addSkill: (name: string) =>
    apiFetch<Skill>('/student/skills', { method: 'POST', body: JSON.stringify({ name }) }),

  updateSkill: (id: string, data: { score?: number; status?: string }) =>
    apiFetch<Skill>(`/student/skills/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getJobs: () =>
    apiFetch<JobMatch[]>('/student/jobs'),

  getApplications: () =>
    apiFetch<Application[]>('/student/applications'),

  applyToJob: (jobId: string) =>
    apiFetch<Application>('/student/applications', { method: 'POST', body: JSON.stringify({ jobId }) }),

  getFeedback: () =>
    apiFetch<Feedback[]>('/student/feedback'),

  getSkillGaps: () =>
    apiFetch<SkillGap[]>('/student/skill-gaps'),

  getNotifications: () =>
    apiFetch<Notification[]>('/student/notifications'),

  markNotificationRead: (id: string) =>
    apiFetch<{ ok: boolean }>(`/student/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    apiFetch<{ ok: boolean }>('/student/notifications/read-all', { method: 'PATCH' }),

  // These remain local-only (resume/github data is already handled by ProfileDataContext)
  getProjects: (): Promise<Project[]> => Promise.resolve([]),

  getProfileData: () =>
    apiFetch<{ parsedResume: ParsedResume | null; githubAnalysis: GithubAnalysis | null; credibilityReport: CredibilityReport | null }>(
      '/student/profile-data'
    ),

  saveProfileData: (data: { parsedResume?: ParsedResume | null; githubAnalysis?: GithubAnalysis | null; credibilityReport?: CredibilityReport | null }) =>
    apiFetch<{ ok: boolean }>('/student/profile-data', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ── Pipeline Assessments ────────────────────────────────────
  getAssessmentConfig: (appId: string) =>
    apiFetch<AssessmentConfig>(`/student/applications/${appId}/assessment`),

  generateAssessment: (appId: string) =>
    apiFetch<{ success: boolean; data: AssessmentData }>(`/student/applications/${appId}/assessment/generate`, {
      method: 'POST',
    }),

  submitAssessmentForStage: (appId: string, data: {
    answers: Array<{ questionId: string; selectedAnswer: string }>;
    answerKey: Array<{ questionId: string; skill: string; correctAnswer: string; explanation: string }>;
    report?: unknown;
  }) =>
    apiFetch<{ success: boolean; data: AssessmentVerificationResult }>(`/student/applications/${appId}/assessment/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── AI Interview ────────────────────────────────────────────
  // Live audio interview uses WebSocket (see AIInterview.tsx)
  // These endpoints handle config loading and post-interview evaluation only
  getInterviewConfig: (appId: string) =>
    apiFetch<InterviewConfig>(`/student/applications/${appId}/interview`),

  endInterview: (appId: string, interviewId: string, durationSeconds: number) =>
    apiFetch<{ success: boolean; evaluation: InterviewEvaluation }>(`/student/applications/${appId}/interview/end`, {
      method: 'POST',
      body: JSON.stringify({ interviewId, durationSeconds }),
    }),
};
