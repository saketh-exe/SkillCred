import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, StudentUser, RecruiterUser } from '../types';

interface AuthState {
  user: (StudentUser | RecruiterUser) | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: Role) => Promise<void>;
  signupStudent: (data: Omit<StudentUser, 'id' | 'role' | 'profileVisible'>) => Promise<void>;
  signupRecruiter: (data: Omit<RecruiterUser, 'id' | 'role'>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const mockStudentUser: StudentUser = {
  id: 's1', name: 'Alex Johnson', email: 'alex@university.edu', role: 'student',
  university: 'Stanford University', degree: 'B.S. Computer Science', graduationYear: 2026,
  skills: ['Python', 'JavaScript', 'TypeScript', 'React', 'SQL', 'Node.js', 'REST APIs'],
  targetRoles: ['Backend Developer', 'Full Stack Developer'],
  experienceLevel: 'Intermediate', profileVisible: true,
};

const mockRecruiterUser: RecruiterUser = {
  id: 'r1', name: 'Sarah Chen', email: 'sarah@techcorp.com', role: 'recruiter',
  companyName: 'TechCorp', industry: 'Technology', companySize: '201-1000',
  hiringDomains: ['Engineering', 'Data', 'Product'],
  companyDescription: 'Leading technology company building next-generation developer tools.',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(StudentUser | RecruiterUser) | null>(null);

  const login = useCallback(async (_email: string, _password: string, role: Role) => {
    await new Promise(r => setTimeout(r, 500));
    setUser(role === 'student' ? mockStudentUser : mockRecruiterUser);
  }, []);

  const signupStudent = useCallback(async (data: Omit<StudentUser, 'id' | 'role' | 'profileVisible'>) => {
    await new Promise(r => setTimeout(r, 500));
    setUser({ ...data, id: 's-new', role: 'student', profileVisible: true });
  }, []);

  const signupRecruiter = useCallback(async (data: Omit<RecruiterUser, 'id' | 'role'>) => {
    await new Promise(r => setTimeout(r, 500));
    setUser({ ...data, id: 'r-new', role: 'recruiter' });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signupStudent, signupRecruiter, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
