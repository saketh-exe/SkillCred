import type { SkillGap } from '../types';

const delay = <T>(data: T, ms = 300): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

export const matchService = {
  getMatchScore: (_studentId: string, _jobId: string): Promise<{ matchPercent: number; readinessPercent: number }> =>
    delay({ matchPercent: 84, readinessPercent: 78 }),

  getSkillGap: (_studentId: string, role: string): Promise<SkillGap> =>
    delay({
      targetRole: role,
      matchPercent: 68,
      strengths: ['Python', 'REST APIs', 'SQL'],
      missing: [
        { name: 'Docker', reason: `Docker is used by 87% of ${role} job postings`, proficiencyNeeded: 'Intermediate' },
        { name: 'CI/CD', reason: 'Continuous integration is essential for modern workflows', proficiencyNeeded: 'Intermediate' },
        { name: 'System Design', reason: `System design is tested in 78% of ${role} interviews`, proficiencyNeeded: 'Advanced' },
      ],
    }),
};
