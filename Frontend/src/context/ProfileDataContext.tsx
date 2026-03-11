import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ParsedResume, GithubAnalysis, CredibilityReport } from '../types';
import { apiFetch, getToken } from '../services/api';

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

  // Load from backend on mount (backend wins over localStorage)
  useEffect(() => {
    if (!getToken()) return;
    apiFetch<{ parsedResume: unknown; githubAnalysis: unknown; credibilityReport: unknown }>(
      '/student/profile-data'
    ).then(remote => {
      if (remote.parsedResume || remote.githubAnalysis || remote.credibilityReport) {
        const loaded: ProfileData = {
          resume: (remote.parsedResume as ParsedResume) ?? null,
          githubAnalysis: (remote.githubAnalysis as GithubAnalysis) ?? null,
          credibility: (remote.credibilityReport as CredibilityReport) ?? null,
        };
        setData(loaded);
        saveToStorage(loaded);
      }
    }).catch(() => { /* not authenticated or offline */ });
  }, []);

  const update = useCallback((partial: Partial<ProfileData>) => {
    setData(prev => {
      const next = { ...prev, ...partial };
      saveToStorage(next);
      // Persist to backend (fire-and-forget)
      if (getToken()) {
        apiFetch<{ ok: boolean }>('/student/profile-data', {
          method: 'PATCH',
          body: JSON.stringify({
            parsedResume: next.resume,
            githubAnalysis: next.githubAnalysis,
            credibilityReport: next.credibility,
          }),
        }).catch(() => {});
      }
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
