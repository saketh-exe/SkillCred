import type { GithubUser, GithubRepo, LanguageBytes, CommitFile } from "./types";

const BASE = "https://api.github.com";

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "skillcred-github-analyzer",
  };
  const token = process.env["GITHUB_TOKEN"];
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function ghFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: buildHeaders() });

  if (res.status === 404) throw new Error(`GitHub user or resource not found`);
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get("x-ratelimit-reset");
    const resetAt = reset ? new Date(Number(reset) * 1000).toISOString() : "unknown";
    throw new Error(`GitHub rate limit exceeded. Resets at ${resetAt}. Set GITHUB_TOKEN to increase the limit.`);
  }
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);

  return res.json() as Promise<T>;
}

export async function fetchUser(username: string): Promise<GithubUser> {
  return ghFetch<GithubUser>(`/users/${username}`);
}

/** Fetches all public repos (handles pagination automatically, caps at 500). */
export async function fetchPublicRepos(username: string): Promise<GithubRepo[]> {
  const all: GithubRepo[] = [];
  let page = 1;

  while (all.length < 500) {
    const batch = await ghFetch<GithubRepo[]>(
      `/users/${username}/repos?type=owner&sort=pushed&per_page=100&page=${page}`
    );
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return all;
}

/** Returns language → bytes for a single repo. */
export async function fetchRepoLanguages(owner: string, repo: string): Promise<LanguageBytes> {
  return ghFetch<LanguageBytes>(`/repos/${owner}/${repo}/languages`);
}

/**
 * Fetches the list of files changed in a specific commit.
 */
export async function fetchCommitFiles(owner: string, repo: string, sha: string): Promise<CommitFile[]> {
  interface RawCommitDetail {
    files: Array<{
      filename: string;
      status: CommitFile["status"];
      additions: number;
      deletions: number;
    }>;
  }
  const data = await ghFetch<RawCommitDetail>(`/repos/${owner}/${repo}/commits/${sha}`);
  return (data.files ?? []).map((f) => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
  }));
}

interface RawCommit {
  sha: string;
  html_url: string;
  commit: { message: string; author: { date: string } | null };
}

/**
 * Returns true if `author` has at least one commit in the repo.
 * Used to filter out forks the user never actually contributed to.
 */
export async function hasUserCommits(owner: string, repo: string, author: string): Promise<boolean> {
  try {
    const commits = await ghFetch<unknown[]>(
      `/repos/${owner}/${repo}/commits?author=${encodeURIComponent(author)}&per_page=1`
    );
    return commits.length > 0;
  } catch {
    // If we can't check (e.g. empty repo), treat as no contribution
    return false;
  }
}

/**
 * Fetches the most recent commits by `author` in a repo (up to `limit`).
 * Returns only the first line of each commit message.
 */
export async function fetchUserCommits(
  owner: string,
  repo: string,
  author: string,
  limit = 10
): Promise<import("./types").CommitSummary[]> {
  try {
    const raw = await ghFetch<RawCommit[]>(
      `/repos/${owner}/${repo}/commits?author=${encodeURIComponent(author)}&per_page=${limit}`
    );
    return raw.map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split("\n")[0]?.trim() ?? "",
      date: c.commit.author?.date ?? "",
      url: c.html_url,
      files: [],
    }));
  } catch {
    return [];
  }
}
