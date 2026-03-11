import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Role, StudentUser, RecruiterUser } from '../types';

const API_BASE = '/api/auth';
const TOKEN_KEY = 'skillcred_token';

interface AuthState {
  user: (StudentUser | RecruiterUser) | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, role: Role) => Promise<void>;
  signupStudent: (data: Omit<StudentUser, 'id' | 'role' | 'profileVisible'> & { password: string }) => Promise<void>;
  signupRecruiter: (data: Omit<RecruiterUser, 'id' | 'role'> & { password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function normalizeUser(raw: Record<string, unknown>): StudentUser | RecruiterUser {
  // MongoDB returns _id, map it to id
  return { ...raw, id: (raw._id as string) ?? (raw.id as string) } as StudentUser | RecruiterUser;
}

async function apiFetch<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(StudentUser | RecruiterUser) | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }
    apiFetch<{ user: Record<string, unknown> }>('/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ user: u }) => setUser(normalizeUser(u)))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, _role: Role) => {
    const { token, user: u } = await apiFetch<{ token: string; user: Record<string, unknown> }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, token);
    setUser(normalizeUser(u));
  }, []);

  const signupStudent = useCallback(async (data: Omit<StudentUser, 'id' | 'role' | 'profileVisible'> & { password: string }) => {
    const { token, user: u } = await apiFetch<{ token: string; user: Record<string, unknown> }>('/signup/student', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem(TOKEN_KEY, token);
    setUser(normalizeUser(u));
  }, []);

  const signupRecruiter = useCallback(async (data: Omit<RecruiterUser, 'id' | 'role'> & { password: string }) => {
    const { token, user: u } = await apiFetch<{ token: string; user: Record<string, unknown> }>('/signup/recruiter', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem(TOKEN_KEY, token);
    setUser(normalizeUser(u));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, signupStudent, signupRecruiter, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
