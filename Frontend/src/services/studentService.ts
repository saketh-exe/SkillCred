import type {
  StudentUser, Skill, JobMatch, Application, Feedback,
  SkillGap, Notification, Project,
} from '../types';

const delay = <T>(data: T, ms = 300): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

const mockStudent: StudentUser = {
  id: 's1',
  name: 'Alex Johnson',
  email: 'alex.johnson@university.edu',
  role: 'student',
  university: 'Stanford University',
  degree: 'B.S. Computer Science',
  graduationYear: 2026,
  skills: ['Python', 'JavaScript', 'TypeScript', 'React', 'SQL', 'Node.js', 'REST APIs', 'Git', 'PostgreSQL', 'Docker'],
  targetRoles: ['Backend Developer', 'Full Stack Developer'],
  experienceLevel: 'Intermediate',
  profileVisible: true,
};

const mockSkills: Skill[] = [
  { id: 'sk1', name: 'Python', icon: '🐍', category: 'Backend', status: 'Verified', difficulty: 'Intermediate', score: 90 },
  { id: 'sk2', name: 'JavaScript', icon: '⚡', category: 'Web', status: 'Verified', difficulty: 'Intermediate', score: 85 },
  { id: 'sk3', name: 'TypeScript', icon: '🔷', category: 'Web', status: 'Verified', difficulty: 'Intermediate', score: 82 },
  { id: 'sk4', name: 'React', icon: '⚛️', category: 'Web', status: 'Verified', difficulty: 'Intermediate', score: 88 },
  { id: 'sk5', name: 'SQL', icon: '🗃️', category: 'Data', status: 'Verified', difficulty: 'Intermediate', score: 80 },
  { id: 'sk6', name: 'Node.js', icon: '🟢', category: 'Backend', status: 'Verified', difficulty: 'Intermediate', score: 78 },
  { id: 'sk7', name: 'REST APIs', icon: '🔌', category: 'Backend', status: 'Verified', difficulty: 'Intermediate', score: 85 },
  { id: 'sk8', name: 'Docker', icon: '🐳', category: 'DevOps', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk9', name: 'Kubernetes', icon: '☸️', category: 'DevOps', status: 'Not Verified', difficulty: 'Advanced' },
  { id: 'sk10', name: 'AWS', icon: '☁️', category: 'DevOps', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk11', name: 'CI/CD', icon: '🔄', category: 'DevOps', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk12', name: 'Git', icon: '📦', category: 'DevOps', status: 'Verified', difficulty: 'Beginner', score: 92 },
  { id: 'sk13', name: 'PostgreSQL', icon: '🐘', category: 'Data', status: 'In Progress', difficulty: 'Intermediate' },
  { id: 'sk14', name: 'MongoDB', icon: '🍃', category: 'Data', status: 'Not Verified', difficulty: 'Beginner' },
  { id: 'sk15', name: 'Redis', icon: '🔴', category: 'Data', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk16', name: 'GraphQL', icon: '◈', category: 'Backend', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk17', name: 'System Design', icon: '🏗️', category: 'Backend', status: 'Not Verified', difficulty: 'Advanced' },
  { id: 'sk18', name: 'Machine Learning', icon: '🤖', category: 'Data', status: 'Not Verified', difficulty: 'Advanced' },
  { id: 'sk19', name: 'React Native', icon: '📱', category: 'Mobile', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk20', name: 'Flutter', icon: '🦋', category: 'Mobile', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk21', name: 'Java', icon: '☕', category: 'Backend', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk22', name: 'Go', icon: '🐹', category: 'Backend', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk23', name: 'Vue.js', icon: '💚', category: 'Web', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk24', name: 'Angular', icon: '🅰️', category: 'Web', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk25', name: 'Next.js', icon: '▲', category: 'Web', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk26', name: 'Django', icon: '🎸', category: 'Backend', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk27', name: 'Spring Boot', icon: '🌱', category: 'Backend', status: 'Not Verified', difficulty: 'Intermediate' },
  { id: 'sk28', name: 'TensorFlow', icon: '🧠', category: 'Data', status: 'Not Verified', difficulty: 'Advanced' },
  { id: 'sk29', name: 'C++', icon: '⊕', category: 'Backend', status: 'Not Verified', difficulty: 'Advanced' },
  { id: 'sk30', name: 'Rust', icon: '🦀', category: 'Backend', status: 'Not Verified', difficulty: 'Advanced' },
];

const mockJobs: JobMatch[] = [
  {
    jobId: 'j1', title: 'Backend Developer', company: 'TechCorp',
    matchPercent: 94, readinessPercent: 82,
    requiredSkills: [
      { name: 'Python', verified: true }, { name: 'REST APIs', verified: true },
      { name: 'SQL', verified: true }, { name: 'Docker', verified: false },
      { name: 'CI/CD', verified: false },
    ],
    location: 'San Francisco, CA', experienceLevel: 'Intermediate',
  },
  {
    jobId: 'j2', title: 'Full Stack Engineer', company: 'InnovateLab',
    matchPercent: 87, readinessPercent: 76,
    requiredSkills: [
      { name: 'React', verified: true }, { name: 'Node.js', verified: true },
      { name: 'TypeScript', verified: true }, { name: 'PostgreSQL', verified: false },
      { name: 'AWS', verified: false },
    ],
    location: 'Remote', experienceLevel: 'Intermediate',
  },
  {
    jobId: 'j3', title: 'Software Engineer II', company: 'DataFlow Inc',
    matchPercent: 78, readinessPercent: 68,
    requiredSkills: [
      { name: 'Python', verified: true }, { name: 'SQL', verified: true },
      { name: 'System Design', verified: false }, { name: 'Kubernetes', verified: false },
      { name: 'Redis', verified: false },
    ],
    location: 'New York, NY', experienceLevel: 'Advanced',
  },
  {
    jobId: 'j4', title: 'Frontend Developer', company: 'DesignHub',
    matchPercent: 92, readinessPercent: 88,
    requiredSkills: [
      { name: 'React', verified: true }, { name: 'TypeScript', verified: true },
      { name: 'JavaScript', verified: true }, { name: 'Next.js', verified: false },
    ],
    location: 'Austin, TX', experienceLevel: 'Intermediate',
  },
  {
    jobId: 'j5', title: 'Platform Engineer', company: 'CloudScale',
    matchPercent: 62, readinessPercent: 55,
    requiredSkills: [
      { name: 'Docker', verified: false }, { name: 'Kubernetes', verified: false },
      { name: 'AWS', verified: false }, { name: 'CI/CD', verified: false },
      { name: 'Python', verified: true },
    ],
    location: 'Seattle, WA', experienceLevel: 'Advanced',
  },
];

const mockApplications: Application[] = [
  {
    id: 'a1', jobId: 'j1', company: 'TechCorp', role: 'Backend Developer',
    appliedDate: '2026-02-28', status: 'In Pipeline', pipelineStage: 2, pipelineTotal: 4,
    stages: [
      { name: 'Profile Review', completed: true, score: 90 },
      { name: 'Online Assessment', completed: true, score: 85 },
      { name: 'AI Interview', completed: false },
      { name: 'Final Review', completed: false },
    ],
  },
  {
    id: 'a2', jobId: 'j2', company: 'InnovateLab', role: 'Full Stack Engineer',
    appliedDate: '2026-03-02', status: 'Pending Review',
    stages: [
      { name: 'Profile Review', completed: false },
      { name: 'Technical Screen', completed: false },
      { name: 'Final', completed: false },
    ],
  },
  {
    id: 'a3', jobId: 'j4', company: 'DesignHub', role: 'Frontend Developer',
    appliedDate: '2026-01-15', status: 'Hired',
    stages: [
      { name: 'Profile Review', completed: true, score: 95 },
      { name: 'Code Challenge', completed: true, score: 88 },
      { name: 'Final Interview', completed: true, score: 92, feedback: 'Excellent communication and technical depth.' },
    ],
  },
  {
    id: 'a4', jobId: 'j5', company: 'CloudScale', role: 'Platform Engineer',
    appliedDate: '2026-02-10', status: 'Rejected',
    stages: [
      { name: 'Profile Review', completed: true, score: 65 },
      { name: 'Technical Screen', completed: true, score: 48, feedback: 'Needs more DevOps experience.' },
    ],
  },
];

const mockFeedback: Feedback[] = [
  {
    id: 'f1', company: 'DesignHub', role: 'Frontend Developer',
    recruiterName: 'Sarah Chen', date: '2026-01-22',
    strengths: ['Strong React fundamentals', 'Clean code practices', 'Great communication'],
    improvements: ['System design thinking', 'Testing practices'],
    notes: 'Alex showed excellent potential. Would recommend for future roles.',
    rating: 4,
  },
  {
    id: 'f2', company: 'CloudScale', role: 'Platform Engineer',
    recruiterName: 'Mike Roberts', date: '2026-02-18',
    strengths: ['Strong programming fundamentals', 'Quick learner'],
    improvements: ['Docker & containerization', 'CI/CD pipelines', 'Cloud infrastructure'],
    notes: 'Good foundation but needs more hands-on DevOps experience.',
    rating: 3,
  },
];

const mockSkillGaps: SkillGap[] = [
  {
    targetRole: 'Backend Developer',
    matchPercent: 68,
    strengths: ['Python', 'REST APIs', 'SQL', 'Node.js', 'Git'],
    missing: [
      { name: 'Docker', reason: 'Docker is used by 87% of Backend Developer job postings', proficiencyNeeded: 'Intermediate' },
      { name: 'CI/CD', reason: 'Continuous integration is essential for modern backend workflows', proficiencyNeeded: 'Intermediate' },
      { name: 'Redis', reason: 'Caching with Redis is required in 62% of backend roles', proficiencyNeeded: 'Intermediate' },
      { name: 'System Design', reason: 'System design is tested in 78% of backend interviews', proficiencyNeeded: 'Advanced' },
    ],
  },
  {
    targetRole: 'Full Stack Developer',
    matchPercent: 75,
    strengths: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'SQL', 'Git'],
    missing: [
      { name: 'Next.js', reason: 'Next.js is the most popular full-stack React framework', proficiencyNeeded: 'Intermediate' },
      { name: 'AWS', reason: 'Cloud deployment knowledge is expected for full-stack roles', proficiencyNeeded: 'Intermediate' },
      { name: 'Docker', reason: 'Containerization is required for modern deployment workflows', proficiencyNeeded: 'Beginner' },
    ],
  },
];

const mockProjects: Project[] = [
  {
    id: 'p1', title: 'Task Management API',
    description: 'RESTful API built with Node.js and Express with PostgreSQL database, JWT auth, and comprehensive test suite.',
    techStack: ['Node.js', 'Express', 'PostgreSQL', 'Jest'],
    githubUrl: 'https://github.com/alexjohnson/task-api',
  },
  {
    id: 'p2', title: 'E-commerce Dashboard',
    description: 'React-based admin dashboard with real-time analytics, inventory management, and order tracking.',
    techStack: ['React', 'TypeScript', 'Recharts', 'Tailwind CSS'],
    githubUrl: 'https://github.com/alexjohnson/ecom-dash',
  },
];

const mockNotifications: Notification[] = [
  { id: 'n1', message: 'Your Python skill verification was approved!', timestamp: '2026-03-10T14:30:00', read: false, type: 'success' },
  { id: 'n2', message: 'New job match: Backend Developer at TechCorp (94% match)', timestamp: '2026-03-09T10:15:00', read: false, type: 'info' },
  { id: 'n3', message: 'Feedback received from DesignHub', timestamp: '2026-03-08T16:45:00', read: true, type: 'info' },
  { id: 'n4', message: 'Application advanced to Stage 2 at TechCorp', timestamp: '2026-03-07T09:00:00', read: true, type: 'success' },
  { id: 'n5', message: 'Your React skill badge expires in 30 days', timestamp: '2026-03-06T12:00:00', read: true, type: 'warning' },
];

export const studentService = {
  getProfile: () => delay(mockStudent),
  updateProfile: (data: Partial<StudentUser>) => delay({ ...mockStudent, ...data }),
  getSkills: () => delay(mockSkills),
  getJobs: () => delay(mockJobs),
  getApplications: () => delay(mockApplications),
  getFeedback: () => delay(mockFeedback),
  getSkillGaps: () => delay(mockSkillGaps),
  getProjects: () => delay(mockProjects),
  getNotifications: () => delay(mockNotifications),
};
