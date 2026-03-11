import type {
  RecruiterUser, JobPosting, Candidate, PipelineCandidate,
  Feedback, Organization, Notification,
} from '../types';

const delay = <T>(data: T, ms = 300): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

const mockRecruiter: RecruiterUser = {
  id: 'r1',
  name: 'Sarah Chen',
  email: 'sarah.chen@techcorp.com',
  role: 'recruiter',
  companyName: 'TechCorp',
  industry: 'Technology',
  companySize: '201-1000',
  hiringDomains: ['Engineering', 'Data', 'Product'],
  companyDescription: 'TechCorp is a leading technology company building next-generation developer tools and cloud infrastructure solutions.',
  companyWebsite: 'https://techcorp.example.com',
};

const mockJobPostings: JobPosting[] = [
  {
    id: 'j1', title: 'Backend Developer', company: 'TechCorp',
    department: 'Engineering', location: 'San Francisco, CA', workMode: 'Hybrid',
    employmentType: 'Full-time', experienceLevel: 'Intermediate', salaryRange: '$120k–$160k',
    description: 'We are looking for a Backend Developer to build robust APIs and microservices for our cloud platform.',
    requiredSkills: [
      { name: 'Python', proficiency: 'Intermediate', mustHave: true },
      { name: 'REST APIs', proficiency: 'Intermediate', mustHave: true },
      { name: 'SQL', proficiency: 'Intermediate', mustHave: true },
      { name: 'Docker', proficiency: 'Intermediate', mustHave: true },
      { name: 'CI/CD', proficiency: 'Beginner', mustHave: false },
    ],
    pipeline: [
      { id: 'ps1', name: 'Profile Review', type: 'Profile Review', description: 'Initial screening of candidate profile and skills', maxAdvancing: 20 },
      { id: 'ps2', name: 'Online Assessment', type: 'Online Assessment', description: 'Technical skills assessment covering Python and system design', maxAdvancing: 10 },
      { id: 'ps3', name: 'AI Interview', type: 'AI Interview', description: 'AI-powered technical interview simulation', maxAdvancing: 5 },
      { id: 'ps4', name: 'Final Review', type: 'Final', description: 'Final team review and decision', maxAdvancing: 3 },
    ],
    status: 'Active', applicantCount: 32, inPipelineCount: 8, topMatchPercent: 94,
    createdAt: '2026-02-15',
  },
  {
    id: 'j2', title: 'Full Stack Engineer', company: 'TechCorp',
    department: 'Engineering', location: 'Remote', workMode: 'Remote',
    employmentType: 'Full-time', experienceLevel: 'Intermediate', salaryRange: '$110k–$150k',
    description: 'Join our product team to build full-stack features for our SaaS platform using React and Node.js.',
    requiredSkills: [
      { name: 'React', proficiency: 'Intermediate', mustHave: true },
      { name: 'Node.js', proficiency: 'Intermediate', mustHave: true },
      { name: 'TypeScript', proficiency: 'Intermediate', mustHave: true },
      { name: 'PostgreSQL', proficiency: 'Beginner', mustHave: false },
      { name: 'AWS', proficiency: 'Beginner', mustHave: false },
    ],
    pipeline: [
      { id: 'ps5', name: 'Profile Review', type: 'Profile Review', description: 'Resume and skill verification check', maxAdvancing: 15 },
      { id: 'ps6', name: 'Technical Screen', type: 'Online Assessment', description: 'Coding challenge and system design', maxAdvancing: 8 },
      { id: 'ps7', name: 'Final', type: 'Final', description: 'Team fit and offer decision', maxAdvancing: 3 },
    ],
    status: 'Active', applicantCount: 24, inPipelineCount: 6, topMatchPercent: 87,
    createdAt: '2026-02-20',
  },
  {
    id: 'j3', title: 'Data Engineer', company: 'TechCorp',
    department: 'Data', location: 'New York, NY', workMode: 'Onsite',
    employmentType: 'Full-time', experienceLevel: 'Advanced', salaryRange: '$140k–$180k',
    description: 'Build and maintain our data pipeline infrastructure processing billions of events daily.',
    requiredSkills: [
      { name: 'Python', proficiency: 'Advanced', mustHave: true },
      { name: 'SQL', proficiency: 'Advanced', mustHave: true },
      { name: 'Spark', proficiency: 'Intermediate', mustHave: true },
      { name: 'AWS', proficiency: 'Intermediate', mustHave: true },
    ],
    pipeline: [
      { id: 'ps8', name: 'Profile Review', type: 'Profile Review', description: 'Initial screening', maxAdvancing: 12 },
      { id: 'ps9', name: 'GitHub Analysis', type: 'GitHub Analysis', description: 'Code quality review', maxAdvancing: 6 },
      { id: 'ps10', name: 'Assessment', type: 'Online Assessment', description: 'Data engineering challenge', maxAdvancing: 3 },
      { id: 'ps11', name: 'Final', type: 'Final', description: 'Final review', maxAdvancing: 2 },
    ],
    status: 'Active', applicantCount: 18, inPipelineCount: 5, topMatchPercent: 82,
    createdAt: '2026-03-01',
  },
  {
    id: 'j4', title: 'DevOps Intern', company: 'TechCorp',
    department: 'Engineering', location: 'San Francisco, CA', workMode: 'Hybrid',
    employmentType: 'Internship', experienceLevel: 'Beginner', salaryRange: '$35/hr',
    description: 'Summer internship opportunity in our infrastructure team.',
    requiredSkills: [
      { name: 'Docker', proficiency: 'Beginner', mustHave: true },
      { name: 'Git', proficiency: 'Beginner', mustHave: true },
      { name: 'Python', proficiency: 'Beginner', mustHave: false },
    ],
    pipeline: [
      { id: 'ps12', name: 'Profile Review', type: 'Profile Review', description: 'Initial screening', maxAdvancing: 10 },
      { id: 'ps13', name: 'Assessment', type: 'Online Assessment', description: 'Basic DevOps quiz', maxAdvancing: 5 },
    ],
    status: 'Draft', applicantCount: 13, inPipelineCount: 4, topMatchPercent: 76,
    createdAt: '2026-03-05',
  },
];

const mockCandidates: Candidate[] = [
  {
    id: 's1', name: 'Alex Johnson', university: 'Stanford University',
    degree: 'B.S. Computer Science', graduationYear: 2026,
    verifiedSkills: ['Python', 'JavaScript', 'TypeScript', 'React', 'SQL', 'Node.js', 'REST APIs'],
    allSkills: ['Python', 'JavaScript', 'TypeScript', 'React', 'SQL', 'Node.js', 'REST APIs', 'Git', 'PostgreSQL'],
    targetRoles: ['Backend Developer', 'Full Stack Developer'],
    experienceLevel: 'Intermediate', matchPercent: 94, readinessScore: 82,
    hasProjects: true, hasGitHub: true,
    projects: [
      { id: 'p1', title: 'Task Management API', description: 'REST API with Node.js', techStack: ['Node.js', 'PostgreSQL'], githubUrl: '#' },
    ],
    githubStats: { repos: 23, languages: ['Python', 'TypeScript', 'JavaScript'], contributions: 847 },
    assessmentScores: [{ skill: 'Python', score: 90 }, { skill: 'SQL', score: 80 }],
  },
  {
    id: 's2', name: 'Maria Garcia', university: 'MIT',
    degree: 'B.S. Computer Science', graduationYear: 2026,
    verifiedSkills: ['Python', 'Java', 'SQL', 'Docker', 'AWS'],
    allSkills: ['Python', 'Java', 'SQL', 'Docker', 'AWS', 'Kubernetes', 'CI/CD'],
    targetRoles: ['Backend Developer', 'DevOps Engineer'],
    experienceLevel: 'Advanced', matchPercent: 91, readinessScore: 88,
    hasProjects: true, hasGitHub: true,
    githubStats: { repos: 31, languages: ['Python', 'Java', 'Go'], contributions: 1203 },
    assessmentScores: [{ skill: 'Python', score: 95 }, { skill: 'Docker', score: 88 }],
  },
  {
    id: 's3', name: 'James Wilson', university: 'UC Berkeley',
    degree: 'B.S. Data Science', graduationYear: 2027,
    verifiedSkills: ['Python', 'SQL', 'React'],
    allSkills: ['Python', 'SQL', 'React', 'JavaScript', 'Pandas'],
    targetRoles: ['Data Engineer', 'Full Stack Developer'],
    experienceLevel: 'Beginner', matchPercent: 72, readinessScore: 65,
    hasProjects: true, hasGitHub: false,
    assessmentScores: [{ skill: 'Python', score: 75 }],
  },
  {
    id: 's4', name: 'Emily Davis', university: 'Carnegie Mellon',
    degree: 'M.S. Software Engineering', graduationYear: 2026,
    verifiedSkills: ['TypeScript', 'React', 'Node.js', 'Docker', 'SQL', 'System Design'],
    allSkills: ['TypeScript', 'React', 'Node.js', 'Docker', 'SQL', 'System Design', 'AWS', 'Redis'],
    targetRoles: ['Full Stack Developer', 'Software Architect'],
    experienceLevel: 'Advanced', matchPercent: 89, readinessScore: 91,
    hasProjects: true, hasGitHub: true,
    githubStats: { repos: 45, languages: ['TypeScript', 'Python', 'Go'], contributions: 2150 },
    assessmentScores: [{ skill: 'TypeScript', score: 92 }, { skill: 'System Design', score: 85 }],
  },
  {
    id: 's5', name: 'Ryan Kim', university: 'Georgia Tech',
    degree: 'B.S. Computer Science', graduationYear: 2026,
    verifiedSkills: ['Python', 'React', 'JavaScript'],
    allSkills: ['Python', 'React', 'JavaScript', 'Node.js', 'SQL'],
    targetRoles: ['Frontend Developer', 'Full Stack Developer'],
    experienceLevel: 'Intermediate', matchPercent: 78, readinessScore: 72,
    hasProjects: true, hasGitHub: true,
    githubStats: { repos: 15, languages: ['JavaScript', 'Python'], contributions: 523 },
  },
  {
    id: 's6', name: 'Priya Patel', university: 'University of Washington',
    degree: 'B.S. Computer Engineering', graduationYear: 2027,
    verifiedSkills: ['Python', 'C++', 'Docker'],
    allSkills: ['Python', 'C++', 'Docker', 'Kubernetes', 'AWS'],
    targetRoles: ['DevOps Engineer', 'Backend Developer'],
    experienceLevel: 'Intermediate', matchPercent: 68, readinessScore: 60,
    hasProjects: false, hasGitHub: true,
    githubStats: { repos: 8, languages: ['Python', 'C++'], contributions: 312 },
  },
];

const mockPipelineCandidates: PipelineCandidate[] = [
  { id: 's1', name: 'Alex Johnson', stageId: 'ps2', score: 85, status: 'active' },
  { id: 's2', name: 'Maria Garcia', stageId: 'ps3', score: 92, status: 'active' },
  { id: 's4', name: 'Emily Davis', stageId: 'ps2', score: 88, status: 'active' },
  { id: 's5', name: 'Ryan Kim', stageId: 'ps1', score: 75, status: 'active' },
  { id: 's3', name: 'James Wilson', stageId: 'ps1', score: 68, status: 'active' },
  { id: 's6', name: 'Priya Patel', stageId: 'ps1', score: 62, status: 'rejected', notes: 'Missing key skills' },
];

const mockRecruiterFeedback: Feedback[] = [
  {
    id: 'rf1', candidateId: 's1', candidateName: 'Alex Johnson',
    company: 'TechCorp', role: 'Backend Developer', recruiterName: 'Sarah Chen',
    date: '2026-03-08', strengths: ['Strong Python skills', 'Clean API design', 'Good communication'],
    improvements: ['Docker knowledge', 'System design depth'], rating: 4,
  },
  {
    id: 'rf2', candidateId: 's3', candidateName: 'James Wilson',
    company: 'TechCorp', role: 'Data Engineer', recruiterName: 'Sarah Chen',
    date: '2026-03-06', strengths: ['Good SQL fundamentals'],
    improvements: ['Needs more project experience', 'Data pipeline knowledge', 'Cloud platforms'],
    rating: 2,
  },
];

const mockOrganization: Organization = {
  name: 'TechCorp',
  industry: 'Technology',
  size: '201-1000',
  website: 'https://techcorp.example.com',
  hiringDomains: ['Engineering', 'Data', 'Product'],
  about: 'TechCorp is a leading technology company building next-generation developer tools and cloud infrastructure solutions. Founded in 2018, we serve over 50,000 developers worldwide.',
  teamMembers: [
    { name: 'Sarah Chen', email: 'sarah.chen@techcorp.com', role: 'Lead Recruiter' },
    { name: 'Mike Roberts', email: 'mike.roberts@techcorp.com', role: 'Technical Recruiter' },
    { name: 'Lisa Wang', email: 'lisa.wang@techcorp.com', role: 'HR Manager' },
  ],
};

const mockRecruiterNotifications: Notification[] = [
  { id: 'rn1', message: 'New application received for Backend Developer', timestamp: '2026-03-10T15:00:00', read: false, type: 'info' },
  { id: 'rn2', message: 'Maria Garcia advanced to AI Interview stage', timestamp: '2026-03-09T11:30:00', read: false, type: 'success' },
  { id: 'rn3', message: 'Assessment results available for Alex Johnson', timestamp: '2026-03-08T14:00:00', read: true, type: 'info' },
  { id: 'rn4', message: 'DevOps Intern posting expires in 7 days', timestamp: '2026-03-07T09:00:00', read: true, type: 'warning' },
];

export const recruiterService = {
  getProfile: () => delay(mockRecruiter),
  getJobPostings: () => delay(mockJobPostings),
  getCandidates: () => delay(mockCandidates),
  getCandidate: (id: string) => delay(mockCandidates.find(c => c.id === id) ?? mockCandidates[0]),
  getPipeline: (jobId: string) => delay({
    stages: mockJobPostings.find(j => j.id === jobId)?.pipeline ?? mockJobPostings[0].pipeline,
    candidates: mockPipelineCandidates,
  }),
  getFeedback: () => delay(mockRecruiterFeedback),
  getOrganization: () => delay(mockOrganization),
  getNotifications: () => delay(mockRecruiterNotifications),
  compareCandidates: (ids: string[]) => delay(mockCandidates.filter(c => ids.includes(c.id))),
};
