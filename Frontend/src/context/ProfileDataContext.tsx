import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ParsedResume, GithubAnalysis, CredibilityReport } from '../types';

interface ProfileData {
  resume: ParsedResume | null;
  githubAnalysis: GithubAnalysis | null;
  credibility: CredibilityReport | null;
}

interface ProfileDataState extends ProfileData {
  setResume: (data: ParsedResume | null) => void;
  setGithubAnalysis: (data: GithubAnalysis | null) => void;
  setCredibility: (data: CredibilityReport | null) => void;
  hasProfileData: boolean;
}

const STORAGE_KEY = 'skillcred_profile_data';

function loadFromStorage(): ProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { resume: null, githubAnalysis: null, credibility: null };
}

function saveToStorage(data: ProfileData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

const ProfileDataContext = createContext<ProfileDataState | undefined>(undefined);

export function ProfileDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProfileData>(loadFromStorage);

  const update = useCallback((partial: Partial<ProfileData>) => {
    setData(prev => {
      const next = { ...prev, ...partial };
      saveToStorage(next);
      return next;
    });
  }, []);

  const setResume = useCallback((resume: ParsedResume | null) => update({ resume }), [update]);
  const setGithubAnalysis = useCallback((githubAnalysis: GithubAnalysis | null) => update({ githubAnalysis }), [update]);
  const setCredibility = useCallback((credibility: CredibilityReport | null) => update({ credibility }), [update]);

  const hasProfileData = !!(data.resume || data.githubAnalysis || data.credibility);

  return (
    <ProfileDataContext.Provider value={{ ...data, setResume, setGithubAnalysis, setCredibility, hasProfileData }}>
      {children}
    </ProfileDataContext.Provider>
  );
}

export function useProfileData() {
  const ctx = useContext(ProfileDataContext);
  if (!ctx) throw new Error('useProfileData must be used within ProfileDataProvider');
  return ctx;
}
