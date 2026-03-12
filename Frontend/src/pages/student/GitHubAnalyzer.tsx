import { useState, useCallback } from 'react';
import { Search, Star, GitFork, ExternalLink, Code, Users, BookOpen, Calendar, Loader2, AlertCircle, ChevronDown, ChevronUp, FileCode, FilePlus, FileMinus, FileEdit, CheckCircle } from 'lucide-react';
import { Card, Badge, Button, ProgressBar } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { studentService } from '../../services/studentService';
import type { GithubAnalysis, GithubRepoProfile, GithubCommitSummary, GithubCommitFile } from '../../types';

const API_BASE = '/api/integrations/github';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const FILE_STATUS_ICONS: Record<string, typeof FilePlus> = {
  added: FilePlus,
  modified: FileEdit,
  removed: FileMinus,
  renamed: FileCode,
  copied: FileCode,
  changed: FileEdit,
  unchanged: FileCode,
};

function CommitFileRow({ file }: { file: GithubCommitFile }) {
  const Icon = FILE_STATUS_ICONS[file.status] ?? FileCode;
  const statusColor = file.status === 'added' ? 'text-[var(--success)]' : file.status === 'removed' ? 'text-[var(--danger)]' : 'text-[var(--warning)]';
  return (
    <div className="flex items-center gap-2 text-[12px] py-1 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-elevated)]">
      <Icon size={13} className={statusColor} />
      <span className="text-[var(--text-secondary)] flex-1 truncate font-[var(--font-mono)]">{file.filename}</span>
      {file.additions > 0 && <span className="text-[var(--success)] font-[var(--font-mono)]">+{file.additions}</span>}
      {file.deletions > 0 && <span className="text-[var(--danger)] font-[var(--font-mono)]">-{file.deletions}</span>}
    </div>
  );
}

function CommitRow({ commit }: { commit: GithubCommitSummary }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border-subtle)] last:border-0">
      <button
        onClick={() => commit.files.length > 0 && setOpen(o => !o)}
        className="w-full flex items-start gap-3 py-2.5 px-1 text-left hover:bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] transition-colors cursor-pointer"
      >
        <span className="font-[var(--font-mono)] text-[11px] text-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">{commit.sha}</span>
        <span className="text-[13px] text-[var(--text-primary)] flex-1 leading-snug">{commit.message}</span>
        <span className="text-[11px] text-[var(--text-tertiary)] flex-shrink-0">{commit.date ? timeAgo(commit.date) : ''}</span>
        {commit.files.length > 0 && (
          open ? <ChevronUp size={14} className="text-[var(--text-tertiary)] mt-0.5" /> : <ChevronDown size={14} className="text-[var(--text-tertiary)] mt-0.5" />
        )}
      </button>
      {open && commit.files.length > 0 && (
        <div className="ml-8 mb-2 border-l-2 border-[var(--border-subtle)] pl-3">
          {commit.files.map((f, i) => <CommitFileRow key={i} file={f} />)}
        </div>
      )}
    </div>
  );
}

function RepoCard({ repo }: { repo: GithubRepoProfile }) {
  const [expanded, setExpanded] = useState(false);
  const langEntries = Object.entries(repo.languages);
  const totalBytes = langEntries.reduce((s, [, b]) => s + b, 0);
  const topLangs = langEntries.sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-semibold text-[var(--accent)] hover:underline truncate"
            >
              {repo.name}
            </a>
            {repo.isFork && <Badge variant="neutral">Fork</Badge>}
          </div>
          {repo.description && (
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{repo.description}</p>
          )}
        </div>
        <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--accent)] ml-2 flex-shrink-0">
          <ExternalLink size={15} />
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3 text-[12px] text-[var(--text-tertiary)]">
        {repo.primaryLanguage && <Badge>{repo.primaryLanguage}</Badge>}
        <span className="flex items-center gap-1"><Star size={12} /> {repo.stars}</span>
        <span className="flex items-center gap-1"><GitFork size={12} /> {repo.forks}</span>
        <span>Updated {timeAgo(repo.lastPushed)}</span>
      </div>

      {/* Language bar */}
      {totalBytes > 0 && (
        <div className="mb-3">
          <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-elevated)]">
            {topLangs.map(([lang, bytes]) => (
              <div
                key={lang}
                style={{ width: `${(bytes / totalBytes) * 100}%` }}
                className="h-full first:rounded-l-full last:rounded-r-full"
                title={`${lang}: ${((bytes / totalBytes) * 100).toFixed(1)}%`}
                // Use accent for top lang, then alternating colors
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            {topLangs.map(([lang, bytes]) => (
              <span key={lang} className="text-[11px] text-[var(--text-tertiary)]">
                {lang} <span className="font-[var(--font-mono)]">{((bytes / totalBytes) * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Commits toggle */}
      {repo.recentCommits.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)] hover:underline cursor-pointer"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {repo.recentCommits.length} recent commit{repo.recentCommits.length > 1 ? 's' : ''}
          </button>
          {expanded && (
            <div className="mt-2 bg-[var(--bg-base)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] p-2">
              {repo.recentCommits.map(c => <CommitRow key={c.sha} commit={c} />)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function GitHubAnalyzer() {
  const [username, setUsername] = useState('');
  const [analysis, setAnalysis] = useState<GithubAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllRepos, setShowAllRepos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const analyze = useCallback(async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setShowAllRepos(false);
    setSaved(false);

    try {
      const res = await fetch(`${API_BASE}/analyze?username=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setAnalysis(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [username]);

  const saveToProfile = useCallback(async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      await studentService.saveProfileData({ githubAnalysis: analysis });
      setSaved(true);
    } catch {
      // silent — user can retry
    } finally {
      setSaving(false);
    }
  }, [analysis]);

  const visibleRepos = showAllRepos ? analysis?.repositories ?? [] : (analysis?.repositories ?? []).slice(0, 6);
  const topLangs = (analysis?.languages ?? []).slice(0, 8);
  const maxLangBytes = topLangs[0]?.bytes ?? 1;

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-[24px] font-bold">GitHub Analyzer</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Analyze any GitHub profile to discover skills, languages, and contributions.</p>
      </div>

      {/* Search bar */}
      <Card className="p-5 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyze()}
              placeholder="Enter GitHub username..."
              className="w-full h-10 pl-9 pr-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)]"
            />
          </div>
          <Button onClick={analyze} disabled={loading || !username.trim()} className="h-10 px-5">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : 'Analyze'}
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-5 mb-6 border-[var(--danger)] bg-[var(--danger-subtle)]">
          <div className="flex items-center gap-2 text-[var(--danger)]">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="skeleton h-32 rounded-[var(--radius-md)]" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-[var(--radius-md)]" />)}
          </div>
          <div className="skeleton h-48 rounded-[var(--radius-md)]" />
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="space-y-6">
          {/* Profile header */}
          <Card className="p-6">
            <div className="flex items-center gap-5">
              <img
                src={analysis.profile.avatarUrl}
                alt={analysis.profile.username}
                className="w-16 h-16 rounded-full border-2 border-[var(--border-subtle)]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{analysis.profile.name ?? analysis.profile.username}</h2>
                  <a href={analysis.profile.profileUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--accent)]">
                    <ExternalLink size={14} />
                  </a>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)]">@{analysis.profile.username}</p>
                {analysis.profile.bio && <p className="text-[13px] text-[var(--text-secondary)] mt-1">{analysis.profile.bio}</p>}
              </div>
              <div className="flex-shrink-0">
                {saved ? (
                  <div className="flex items-center gap-1.5 text-[var(--success)] text-sm font-medium">
                    <CheckCircle size={16} />
                    Skills verified!
                  </div>
                ) : (
                  <Button onClick={saveToProfile} disabled={saving} variant="secondary" className="h-9 px-4 text-sm">
                    {saving ? <><Loader2 size={14} className="animate-spin mr-1.5" />Saving...</> : 'Save & Verify Skills'}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[var(--accent)] mb-1"><BookOpen size={16} /></div>
              <p className="text-[22px] font-bold font-[var(--font-mono)]">{analysis.summary.totalReposAnalyzed}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium">Repos Analyzed</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[var(--warning)] mb-1"><Star size={16} /></div>
              <p className="text-[22px] font-bold font-[var(--font-mono)]">{analysis.summary.totalStars}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium">Total Stars</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[var(--success)] mb-1"><Code size={16} /></div>
              <p className="text-[22px] font-bold font-[var(--font-mono)]">{formatBytes(analysis.summary.totalCodeBytes)}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium">Total Code</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[var(--accent)] mb-1"><Users size={16} /></div>
              <p className="text-[22px] font-bold font-[var(--font-mono)]">{analysis.profile.followers}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium">Followers</p>
            </Card>
          </div>

          {/* Language breakdown + quick info */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Languages */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="text-[15px] font-semibold mb-4">Language Breakdown</h3>
              <div className="space-y-3">
                {topLangs.map(lang => (
                  <div key={lang.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">{lang.name}</span>
                      <div className="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)]">
                        <span>{lang.repoCount} repo{lang.repoCount > 1 ? 's' : ''}</span>
                        <span className="font-[var(--font-mono)]">{lang.percentage}%</span>
                      </div>
                    </div>
                    <ProgressBar value={(lang.bytes / maxLangBytes) * 100} />
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick info */}
            <Card className="p-6">
              <h3 className="text-[15px] font-semibold mb-4">Profile Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Public Repos</span>
                  <span className="font-[var(--font-mono)] font-medium">{analysis.profile.publicRepos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Following</span>
                  <span className="font-[var(--font-mono)] font-medium">{analysis.profile.following}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Own Repos</span>
                  <span className="font-[var(--font-mono)] font-medium">{analysis.summary.ownRepos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Contributed Forks</span>
                  <span className="font-[var(--font-mono)] font-medium">{analysis.summary.forkedRepos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Total Forks</span>
                  <span className="font-[var(--font-mono)] font-medium">{analysis.summary.totalForks}</span>
                </div>
                {analysis.summary.topLanguage && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Top Language</span>
                    <Badge variant="accent">{analysis.summary.topLanguage}</Badge>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Member Since</span>
                  <span className="text-[12px] text-[var(--text-tertiary)] flex items-center gap-1"><Calendar size={12} /> {new Date(analysis.profile.memberSince).getFullYear()}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Repositories */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold">Repositories</h3>
              <span className="text-[12px] text-[var(--text-tertiary)]">
                Showing {visibleRepos.length} of {analysis.repositories.length} analyzed
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {visibleRepos.map(repo => (
                <RepoCard key={repo.name} repo={repo} />
              ))}
            </div>
            {analysis.repositories.length > 6 && (
              <div className="text-center mt-4">
                <Button variant="secondary" onClick={() => setShowAllRepos(s => !s)}>
                  {showAllRepos ? 'Show Less' : `Show All ${analysis.repositories.length} Repositories`}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
