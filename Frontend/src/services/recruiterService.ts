import { apiFetch } from './api';
import type {
  RecruiterUser, JobPosting, Candidate, PipelineCandidate,
  Feedback, Organization, Notification,
} from '../types';

type ApiDoc = { _id: string; [key: string]: unknown };
const withId = <T extends { id: string }>(doc: T & Partial<ApiDoc>): T =>
  ({ ...doc, id: (doc._id as string | undefined) ?? doc.id });

export const recruiterService = {
  getProfile: () =>
    apiFetch<RecruiterUser>('/recruiter/profile').then(withId),

  updateProfile: (data: Partial<RecruiterUser>) =>
    apiFetch<RecruiterUser>('/recruiter/profile', {
      method: 'PATCH', body: JSON.stringify(data),
    }).then(withId),

  getJobPostings: () =>
    apiFetch<JobPosting[]>('/recruiter/jobs').then(jobs =>
      jobs.map(j => withId(j as JobPosting & Partial<ApiDoc>))
    ),

  createJob: (data: Partial<JobPosting>) =>
    apiFetch<JobPosting>('/recruiter/jobs', {
      method: 'POST', body: JSON.stringify(data),
    }).then(withId),

  updateJob: (id: string, data: Partial<JobPosting>) =>
    apiFetch<JobPosting>(`/recruiter/jobs/${id}`, {
      method: 'PATCH', body: JSON.stringify(data),
    }).then(withId),

  deleteJob: (id: string) =>
    apiFetch<{ ok: boolean }>(`/recruiter/jobs/${id}`, { method: 'DELETE' }),

  getCandidates: () =>
    apiFetch<Candidate[]>('/recruiter/candidates').then(cs =>
      cs.map(c => withId(c as Candidate & Partial<ApiDoc>))
    ),

  getCandidate: (id: string) =>
    apiFetch<Candidate>(`/recruiter/candidates/${id}`).then(withId),

  getPipeline: (jobId: string) =>
    apiFetch<{ stages: JobPosting['pipeline']; candidates: PipelineCandidate[] }>(
      `/recruiter/pipeline/${jobId}`
    ),

  getFeedback: () =>
    apiFetch<Feedback[]>('/recruiter/feedback').then(fs =>
      fs.map(f => withId(f as Feedback & Partial<ApiDoc>))
    ),

  submitFeedback: (data: {
    studentId: string; jobId: string; role: string;
    strengths: string[]; improvements: string[]; notes?: string; rating: number;
  }) =>
    apiFetch<Feedback>('/recruiter/feedback', {
      method: 'POST', body: JSON.stringify(data),
    }).then(withId),

  getOrganization: () =>
    apiFetch<RecruiterUser>('/recruiter/profile').then(p => {
      const org: Organization = {
        name: p.companyName,
        industry: p.industry,
        size: p.companySize,
        website: p.companyWebsite ?? '',
        hiringDomains: p.hiringDomains,
        about: p.companyDescription,
        teamMembers: [],
      };
      return org;
    }),

  getNotifications: () =>
    apiFetch<Notification[]>('/recruiter/notifications').then(ns =>
      ns.map(n => withId(n as Notification & Partial<ApiDoc>))
    ),

  markNotificationRead: (id: string) =>
    apiFetch<{ ok: boolean }>(`/recruiter/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    apiFetch<{ ok: boolean }>('/recruiter/notifications/read-all', { method: 'PATCH' }),

  moveCandidate: (jobId: string, studentId: string, toStageId: string) =>
    apiFetch<{ ok: boolean }>(`/recruiter/pipeline/${jobId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ studentId, toStageId }),
    }),

  compareCandidates: (ids: string[]) =>
    apiFetch<Candidate[]>('/recruiter/compare', {
      method: 'POST', body: JSON.stringify({ ids }),
    }).then(cs => cs.map(c => withId(c as Candidate & Partial<ApiDoc>))),

  rejectCandidate: (jobId: string, studentId: string) =>
    apiFetch<{ ok: boolean }>(`/recruiter/pipeline/${jobId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ studentId }),
    }),

  hireCandidate: (jobId: string, studentId: string) =>
    apiFetch<{ ok: boolean }>(`/recruiter/pipeline/${jobId}/hire`, {
      method: 'PATCH',
      body: JSON.stringify({ studentId }),
    }),
};
