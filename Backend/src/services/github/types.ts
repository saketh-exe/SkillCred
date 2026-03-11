wwwwwwwwwwwwwww// ─── Raw GitHub API shapes ───────────────────────────────────────────────────

export interface GithubUser {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  avatar_url: string;
  html_url: string;
  created_at: string;
}

export interface GithubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  size: number; // KB
  language: string | null;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
  created_at: string;
}

export type LanguageBytes = Record<string, number>;

export interface CommitFile {
  filename: string;
  status: "added" | "modified" | "removed" | "renamed" | "copied" | "changed" | "unchanged";
  additions: number;
  deletions: number;
}

export interface CommitSummary {
  sha: string;
  message: string; // first line only
  date: string;
  url: string;
  files: CommitFile[];
}

// ─── Analyzed output shapes ───────────────────────────────────────────────────

export interface LanguageProfile {
  name: string;
  /** Total bytes written in this language across all analyzed repos */
  bytes: number;
  /** % of total code */
  percentage: number;
  /** Number of repos that contain this language */
  repoCount: number;
  /**
   * Weighted significance score.
   * Accumulated as: repo_significance * (lang_bytes / total_repo_bytes)
   * Higher = more impactful usage (popular repos, large portion of codebase)
   */
  significanceScore: number;
}

export interface RepoProfile {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  primaryLanguage: string | null;
  /** Language → byte count for this repo */
  languages: LanguageBytes;
  /** stars*3 + forks*2 + floor(size/50) */
  significanceScore: number;
  isFork: boolean;
  lastPushed: string;
  /** Most recent commits by this user in this repo (up to 10) */
  recentCommits: CommitSummary[];
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
  /** Sorted by total bytes desc */
  languages: LanguageProfile[];
  /** All analyzed repos, sorted by significance desc */
  repositories: RepoProfile[];
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
