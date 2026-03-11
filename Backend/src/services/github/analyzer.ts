import { fetchUser, fetchPublicRepos, fetchRepoLanguages, hasUserCommits, fetchUserCommits, fetchCommitFiles } from "./client";
import type {
  GithubAnalysis,
  LanguageProfile,
  RepoProfile,
  LanguageBytes,
  GithubRepo,
  CommitFile,
} from "./types";

/**
 * Significance of a repo as a single number.
 * stars are the strongest signal, then forks, then raw size.
 */
function repoScore(r: Pick<GithubRepo, "stargazers_count" | "forks_count" | "size">): number {
  return r.stargazers_count * 3 + r.forks_count * 2 + Math.floor(r.size / 50);
}

/** Run an async check for each repo in concurrent batches. */
async function inBatches<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize = 10
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}

export async function analyzeGithubProfile(username: string): Promise<GithubAnalysis> {
  // 1. Fetch user + all public repos in parallel
  const [user, allRepos] = await Promise.all([
    fetchUser(username),
    fetchPublicRepos(username),
  ]);

  // 2. Exclude archived repos
  const activeRepos = allRepos.filter((r) => !r.archived);

  // 3. For forked repos, discard those where the user never made a single commit
  //    (e.g. "starred by forking" repos like a Microsoft repo with zero personal commits)
  const ownRepos = activeRepos.filter((r) => !r.fork);
  const forkedRepos = activeRepos.filter((r) => r.fork);

  const forkHasCommits = await inBatches(
    forkedRepos,
    (r) => hasUserCommits(user.login, r.name, user.login),
    10
  );
  const contributedForks = forkedRepos.filter((_, i) => forkHasCommits[i]);

  const meaningfulRepos = [...ownRepos, ...contributedForks];

  // 4. Sort by significance, cap language fetching at top 100
  const sorted = [...meaningfulRepos].sort((a, b) => repoScore(b) - repoScore(a));
  const toAnalyze = sorted.slice(0, 100);

  // 5. Fetch language breakdown + recent commits per repo in parallel
  const [languageMaps, commitMaps] = await Promise.all([
    inBatches(
      toAnalyze,
      (r) => fetchRepoLanguages(user.login, r.name).catch(() => ({} as LanguageBytes)),
      10
    ),
    inBatches(
      toAnalyze,
      (r) => fetchUserCommits(user.login, r.name, user.login, 10),
      10
    ),
  ]);

  // 6. Build repo profiles
  const repoProfiles: RepoProfile[] = toAnalyze.map((r, i) => ({
    name: r.name,
    description: r.description,
    url: r.html_url,
    stars: r.stargazers_count,
    forks: r.forks_count,
    primaryLanguage: r.language,
    languages: languageMaps[i] ?? {},
    significanceScore: repoScore(r),
    isFork: r.fork,
    lastPushed: r.pushed_at,
    recentCommits: commitMaps[i] ?? [],
  }));

  // 6b. Fetch commit files for the top 10 repos (those actually shown in the UI)
  //     Batched so we don't hammer the API. Each commit = 1 API call.
  const topRepos = repoProfiles.slice(0, 10);
  const commitPairs = topRepos.flatMap((r) =>
    r.recentCommits.map((c) => ({ repoName: r.name, sha: c.sha }))
  );
  const fileResults = await inBatches(
    commitPairs,
    ({ repoName, sha }) =>
      fetchCommitFiles(user.login, repoName, sha).catch(() => [] as CommitFile[]),
    10
  );
  // Merge files back into commits
  let fileIdx = 0;
  for (const repo of topRepos) {
    for (const commit of repo.recentCommits) {
      commit.files = fileResults[fileIdx++] ?? [];
    }
  }

  // 7. Aggregate language stats across all analyzed repos
  const langBytes: Record<string, number> = {};
  const langRepos: Record<string, Set<string>> = {};
  const langSignificance: Record<string, number> = {};

  for (const repo of repoProfiles) {
    const totalRepoBytes = Object.values(repo.languages).reduce((s, v) => s + v, 0);
    if (totalRepoBytes === 0) continue;

    for (const [lang, bytes] of Object.entries(repo.languages)) {
      langBytes[lang] = (langBytes[lang] ?? 0) + bytes;

      if (!langRepos[lang]) langRepos[lang] = new Set();
      langRepos[lang]!.add(repo.name);

      // Significance: repo's score weighted by how much of that repo is this language
      langSignificance[lang] =
        (langSignificance[lang] ?? 0) + repo.significanceScore * (bytes / totalRepoBytes);
    }
  }

  const totalBytes = Object.values(langBytes).reduce((s, v) => s + v, 0);

  const languages: LanguageProfile[] = Object.entries(langBytes)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
      repoCount: langRepos[name]?.size ?? 0,
      significanceScore: Math.round(langSignificance[name] ?? 0),
    }))
    .sort((a, b) => b.bytes - a.bytes);

  // 8. Summary stats (over all public repos, not just analyzed subset)
  const totalStars = allRepos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = allRepos.reduce((s, r) => s + r.forks_count, 0);
  const mostSignificant = repoProfiles[0] ?? null;

  return {
    profile: {
      username: user.login,
      name: user.name,
      bio: user.bio,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      memberSince: user.created_at,
    },
    languages,
    repositories: repoProfiles,
    summary: {
      totalReposAnalyzed: toAnalyze.length,
      ownRepos: ownRepos.length,
      /** forks where the user actually made commits */
      forkedRepos: contributedForks.length,
      totalCodeBytes: totalBytes,
      topLanguage: languages[0]?.name ?? null,
      mostSignificantRepo: mostSignificant?.name ?? null,
      totalStars,
      totalForks,
    },
  };
}
