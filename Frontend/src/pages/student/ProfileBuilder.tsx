import { useState, useCallback, useRef } from 'react';
import {
  Upload, Search, Github, FileText, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
  Star, GitFork, ExternalLink, Code, Users, BookOpen, Calendar, FileCode, FilePlus, FileMinus, FileEdit,
  ShieldCheck, AlertTriangle, TrendingUp, Briefcase, Wrench,
} from 'lucide-react';
import { Card, Badge, Button, ProgressBar } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import type {
  GithubAnalysis, GithubRepoProfile, GithubCommitSummary, GithubCommitFile,
  ParsedResume, CredibilityReport,
} from '../../types';

/* ─── Helpers ────────────────────────────────────────────────── */
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
  added: FilePlus, modified: FileEdit, removed: FileMinus,
  renamed: FileCode, copied: FileCode, changed: FileEdit, unchanged: FileCode,
};

/* ─── Sub-components (Git) ───────────────────────────────────── */
function CommitFileRow({ file }: { file: GithubCommitFile }) {
  const Icon = FILE_STATUS_ICONS[file.status] ?? FileCode;
  const color = file.status === 'added' ? 'text-[var(--success)]' : file.status === 'removed' ? 'text-[var(--danger)]' : 'text-[var(--warning)]';
  return (
    <div className="flex items-center gap-2 text-[12px] py-1 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-elevated)]">
      <Icon size={13} className={color} />
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
      <button onClick={() => commit.files.length > 0 && setOpen(o => !o)}
        className="w-full flex items-start gap-3 py-2.5 px-1 text-left hover:bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] transition-colors cursor-pointer">
        <span className="font-[var(--font-mono)] text-[11px] text-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">{commit.sha}</span>
        <span className="text-[13px] text-[var(--text-primary)] flex-1 leading-snug">{commit.message}</span>
        <span className="text-[11px] text-[var(--text-tertiary)] flex-shrink-0">{commit.date ? timeAgo(commit.date) : ''}</span>
        {commit.files.length > 0 && (open ? <ChevronUp size={14} className="text-[var(--text-tertiary)] mt-0.5" /> : <ChevronDown size={14} className="text-[var(--text-tertiary)] mt-0.5" />)}
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
            <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold text-[var(--accent)] hover:underline truncate">{repo.name}</a>
            {repo.isFork && <Badge variant="neutral">Fork</Badge>}
          </div>
          {repo.description && <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{repo.description}</p>}
        </div>
        <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--accent)] ml-2 flex-shrink-0"><ExternalLink size={15} /></a>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-3 text-[12px] text-[var(--text-tertiary)]">
        {repo.primaryLanguage && <Badge>{repo.primaryLanguage}</Badge>}
        <span className="flex items-center gap-1"><Star size={12} /> {repo.stars}</span>
        <span className="flex items-center gap-1"><GitFork size={12} /> {repo.forks}</span>
        <span>Updated {timeAgo(repo.lastPushed)}</span>
      </div>
      {totalBytes > 0 && (
        <div className="mb-3">
          <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-elevated)]">
            {topLangs.map(([lang, bytes]) => <div key={lang} style={{ width: `${(bytes / totalBytes) * 100}%` }} className="h-full first:rounded-l-full last:rounded-r-full" title={`${lang}: ${((bytes / totalBytes) * 100).toFixed(1)}%`} />)}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            {topLangs.map(([lang, bytes]) => <span key={lang} className="text-[11px] text-[var(--text-tertiary)]">{lang} <span className="font-[var(--font-mono)]">{((bytes / totalBytes) * 100).toFixed(1)}%</span></span>)}
          </div>
        </div>
      )}
      {repo.recentCommits.length > 0 && (
        <div>
          <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)] hover:underline cursor-pointer">
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

/* ─── Credibility Section ────────────────────────────────────── */
function CredibilitySection({ report }: { report: CredibilityReport }) {
  const scoreColor = report.overallScore >= 75 ? 'var(--success)' : report.overallScore >= 50 ? 'var(--warning)' : 'var(--danger)';
  const skills = report.skillsAnalysis ?? [];
  const projects = report.projectsAnalysis ?? [];
  const strengths = report.strengths ?? [];
  const redFlags = report.redFlags ?? [];
  const recommendations = report.recommendations ?? [];

  return (
    <div className="space-y-4">
      {/* Score header */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xl font-[var(--font-mono)]" style={{ borderColor: scoreColor, color: scoreColor }}>
            {report.overallScore ?? '—'}
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold flex items-center gap-2"><ShieldCheck size={16} /> Credibility Score</h3>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">{report.summary ?? 'No summary available.'}</p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Skills analysis */}
        {skills.length > 0 && (
          <Card className="p-5">
            <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2"><Wrench size={14} /> Skills Verification</h4>
            <div className="space-y-3">
              {skills.map((s, i) => (
                <div key={i} className="p-3 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{s.skill}</span>
                    <Badge variant={s.credibilityScore >= 75 ? 'success' : s.credibilityScore >= 50 ? 'warning' : 'danger'}>{s.credibilityScore}%</Badge>
                  </div>
                  <p className="text-[12px] text-[var(--text-tertiary)]">{s.evidenceFound}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Projects analysis */}
        {projects.length > 0 && (
          <Card className="p-5">
            <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2"><Code size={14} /> Projects Verification</h4>
            <div className="space-y-3">
              {projects.map((p, i) => (
                <div key={i} className="p-3 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{p.project}</span>
                    <Badge variant={p.credibilityScore >= 75 ? 'success' : p.credibilityScore >= 50 ? 'warning' : 'danger'}>{p.credibilityScore}%</Badge>
                  </div>
                  {(p.claimsVerified ?? []).length > 0 && <p className="text-[12px] text-[var(--success)]">✓ {p.claimsVerified.join(', ')}</p>}
                  {(p.discrepancies ?? []).length > 0 && <p className="text-[12px] text-[var(--danger)]">✗ {p.discrepancies.join(', ')}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Strengths */}
        {strengths.length > 0 && (
          <Card className="p-5">
            <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2 text-[var(--success)]"><TrendingUp size={14} /> Strengths</h4>
            <ul className="space-y-1.5">
              {strengths.map((s, i) => <li key={i} className="text-[13px] text-[var(--text-secondary)] flex items-start gap-2"><CheckCircle2 size={13} className="text-[var(--success)] mt-0.5 flex-shrink-0" />{s}</li>)}
            </ul>
          </Card>
        )}

        {/* Red flags */}
        {redFlags.length > 0 && (
          <Card className="p-5">
            <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2 text-[var(--danger)]"><AlertTriangle size={14} /> Red Flags</h4>
            <ul className="space-y-1.5">
              {redFlags.map((f, i) => <li key={i} className="text-[13px] text-[var(--text-secondary)] flex items-start gap-2"><AlertCircle size={13} className="text-[var(--danger)] mt-0.5 flex-shrink-0" />{f}</li>)}
            </ul>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card className="p-5">
            <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2 text-[var(--accent)]"><Briefcase size={14} /> Recommendations</h4>
            <ul className="space-y-1.5">
              {recommendations.map((r, i) => <li key={i} className="text-[13px] text-[var(--text-secondary)]">• {r}</li>)}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
type Tab = 'upload' | 'resume' | 'github' | 'credibility';

export default function ProfileBuilder() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>('upload');

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'resume' | 'github' | 'credibility' | 'done'>('idle');

  // Results
  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [githubAnalysis, setGithubAnalysis] = useState<GithubAnalysis | null>(null);
  const [credibility, setCredibility] = useState<CredibilityReport | null>(null);

  // GitHub display
  const [showAllRepos, setShowAllRepos] = useState(false);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setFile(f);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }, []);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResume(null);
    setGithubAnalysis(null);
    setCredibility(null);

    try {
      // Step 1: Parse resume (if file provided)
      let parsedResume: ParsedResume | null = null;
      if (file) {
        setStep('resume');
        const form = new FormData();
        form.append('resume', file);
        const res = await fetch('/api/resumes', { method: 'POST', body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(body.error ?? 'Failed to parse resume');
        }
        parsedResume = await res.json();
        setResume(parsedResume);
      }

      // Resolve GitHub username: explicit input > resume-extracted
      const ghUser = githubUsername.trim() || parsedResume?.github?.username || null;

      // Step 2: GitHub analysis
      if (ghUser) {
        setStep('github');
        const res = await fetch(`/api/integrations/github/analyze?username=${encodeURIComponent(ghUser)}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(body.error ?? 'GitHub analysis failed');
        }
        const ghData: GithubAnalysis = await res.json();
        setGithubAnalysis(ghData);

        // Step 3: Credibility report (needs both resume + GitHub)
        if (parsedResume) {
          setStep('credibility');
          const credRes = await fetch('/api/resumes/credibility', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume: { ...parsedResume, github: { ...parsedResume.github, username: ghUser } } }),
          });
          if (credRes.ok) {
            const credData = await credRes.json();
            setCredibility(credData.credibilityReport ?? null);
          }
        }
      }

      setStep('done');
      // Switch to the first available results tab
      if (parsedResume) setTab('resume');
      else if (ghUser) setTab('github');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('idle');
    } finally {
      setLoading(false);
    }
  }, [file, githubUsername]);

  const hasResults = !!(resume || githubAnalysis || credibility);
  const visibleRepos = showAllRepos ? githubAnalysis?.repositories ?? [] : (githubAnalysis?.repositories ?? []).slice(0, 6);
  const topLangs = (githubAnalysis?.languages ?? []).slice(0, 8);
  const maxLangBytes = topLangs[0]?.bytes ?? 1;

  const tabs: { id: Tab; label: string; icon: typeof FileText; show: boolean }[] = [
    { id: 'upload', label: 'Upload', icon: Upload, show: true },
    { id: 'resume', label: 'Resume', icon: FileText, show: !!resume },
    { id: 'github', label: 'GitHub', icon: Github, show: !!githubAnalysis },
    { id: 'credibility', label: 'Credibility', icon: ShieldCheck, show: !!credibility },
  ];

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-[24px] font-bold">Profile Builder</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Upload your resume and connect your GitHub to build and verify your profile.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border-subtle)]">
        {tabs.filter(t => t.show).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
              tab === t.id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        <div className="space-y-4">
          {/* Resume upload */}
          <Card className="p-6">
            <h3 className="text-[15px] font-semibold mb-1 flex items-center gap-2"><FileText size={16} /> Resume (PDF)</h3>
            <p className="text-[12px] text-[var(--text-tertiary)] mb-4">Upload your resume to auto-extract skills, projects, and experience.</p>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-[var(--radius-md)] p-8 text-center cursor-pointer transition-colors ${
                file ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-default)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileSelect} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle2 size={20} className="text-[var(--accent)]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{file.name}</p>
                    <p className="text-[12px] text-[var(--text-tertiary)]">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={28} className="mx-auto text-[var(--text-tertiary)] mb-2" />
                  <p className="text-sm text-[var(--text-secondary)]">Drag & drop your resume PDF here, or click to browse</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Max 10 MB · PDF only</p>
                </>
              )}
            </div>
          </Card>

          {/* GitHub username */}
          <Card className="p-6">
            <h3 className="text-[15px] font-semibold mb-1 flex items-center gap-2"><Github size={16} /> GitHub Username</h3>
            <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
              Enter your GitHub username to analyze your repos and contributions.
              {resume?.github?.username && <span className="text-[var(--accent)]"> (Auto-detected: {resume.github.username})</span>}
            </p>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={githubUsername}
                onChange={e => setGithubUsername(e.target.value)}
                placeholder={resume?.github?.username ? `Default: ${resume.github.username}` : 'e.g. octocat'}
                className="w-full h-10 pl-9 pr-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-base)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)]"
              />
            </div>
          </Card>

          {/* Error */}
          {error && (
            <Card className="p-4 border-[var(--danger)] bg-[var(--danger-subtle)]">
              <div className="flex items-center gap-2 text-[var(--danger)]">
                <AlertCircle size={16} /><span className="text-sm font-medium">{error}</span>
              </div>
            </Card>
          )}

          {/* Progress indicator */}
          {loading && (
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium">
                    {step === 'resume' && 'Parsing resume with AI...'}
                    {step === 'github' && 'Analyzing GitHub profile...'}
                    {step === 'credibility' && 'Generating credibility report...'}
                  </p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">This may take a moment</p>
                </div>
              </div>
            </Card>
          )}

          {/* Build button */}
          <Button onClick={runAnalysis} disabled={loading || (!file && !githubUsername.trim())} className="w-full h-11 text-sm">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : 'Build Profile'}
          </Button>
        </div>
      )}

      {/* Resume results tab */}
      {tab === 'resume' && resume && (
        <div className="space-y-4">
          {/* Skills */}
          {resume.skills.length > 0 && (
            <Card className="p-6">
              <h3 className="text-[15px] font-semibold mb-3 flex items-center gap-2"><Wrench size={16} /> Extracted Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map(s => <Badge key={s} variant="accent">{s}</Badge>)}
              </div>
            </Card>
          )}

          {/* Projects */}
          {resume.projects.length > 0 && (
            <Card className="p-6">
              <h3 className="text-[15px] font-semibold mb-3 flex items-center gap-2"><Code size={16} /> Projects</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {resume.projects.map((p, i) => (
                  <div key={i} className="p-4 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
                    <p className="text-[14px] font-semibold mb-1">{p.name}</p>
                    {p.description && <p className="text-[12px] text-[var(--text-secondary)] mb-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.technologies.map(t => <Badge key={t}>{t}</Badge>)}
                    </div>
                    {p.github && (
                      <a href={p.github} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[var(--accent)] hover:underline flex items-center gap-1">
                        <Github size={12} /> View on GitHub
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Internships / Experience */}
          {resume.internships.length > 0 && (
            <Card className="p-6">
              <h3 className="text-[15px] font-semibold mb-3 flex items-center gap-2"><Briefcase size={16} /> Experience</h3>
              <div className="space-y-3">
                {resume.internships.map((internship, i) => (
                  <div key={i} className="p-4 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-[14px] font-semibold">{internship.role}</p>
                        <p className="text-[13px] text-[var(--accent)]">{internship.company}</p>
                      </div>
                      {internship.duration && <Badge variant="neutral">{internship.duration}</Badge>}
                    </div>
                    {internship.description && <p className="text-[12px] text-[var(--text-secondary)] mt-1">{internship.description}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* GitHub from resume */}
          {resume.github?.username && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <Github size={15} className="text-[var(--text-tertiary)]" />
                <span className="text-[var(--text-secondary)]">GitHub detected:</span>
                <a href={resume.github.url ?? `https://github.com/${resume.github.username}`} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] font-medium hover:underline">
                  @{resume.github.username}
                </a>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* GitHub results tab */}
      {tab === 'github' && githubAnalysis && (
        <div className="space-y-6">
          {/* Profile header */}
          <Card className="p-6">
            <div className="flex items-center gap-5">
              <img src={githubAnalysis.profile.avatarUrl} alt={githubAnalysis.profile.username} className="w-16 h-16 rounded-full border-2 border-[var(--border-subtle)]" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{githubAnalysis.profile.name ?? githubAnalysis.profile.username}</h2>
                  <a href={githubAnalysis.profile.profileUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--accent)]"><ExternalLink size={14} /></a>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)]">@{githubAnalysis.profile.username}</p>
                {githubAnalysis.profile.bio && <p className="text-[13px] text-[var(--text-secondary)] mt-1">{githubAnalysis.profile.bio}</p>}
              </div>
            </div>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[var(--accent)] mb-1"><BookOpen size={16} /></div>
              <p className="text-[22px] font-bold font-[var(--font-mono)]">{githubAnalysis.summary.totalReposAnalyzed}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium">Repos Analyzed</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[var(--warning)] mb-1"><Star size={16} /></div>
              <p className="text-[22px] font-bold font-[var(--font-mono)]">{githubAnalysis.summary.totalStars}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium">Total Stars</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[var(--success)] mb-1"><Code size={16} /></div>
              <p className="text-[22px] font-bold font-[var(--font-mono)]">{formatBytes(githubAnalysis.summary.totalCodeBytes)}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium">Total Code</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[var(--accent)] mb-1"><Users size={16} /></div>
              <p className="text-[22px] font-bold font-[var(--font-mono)]">{githubAnalysis.profile.followers}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium">Followers</p>
            </Card>
          </div>

          {/* Language breakdown + quick info */}
          <div className="grid lg:grid-cols-3 gap-4">
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
            <Card className="p-6">
              <h3 className="text-[15px] font-semibold mb-4">Profile Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Public Repos</span><span className="font-[var(--font-mono)] font-medium">{githubAnalysis.profile.publicRepos}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Following</span><span className="font-[var(--font-mono)] font-medium">{githubAnalysis.profile.following}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Own Repos</span><span className="font-[var(--font-mono)] font-medium">{githubAnalysis.summary.ownRepos}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Contributed Forks</span><span className="font-[var(--font-mono)] font-medium">{githubAnalysis.summary.forkedRepos}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Total Forks</span><span className="font-[var(--font-mono)] font-medium">{githubAnalysis.summary.totalForks}</span></div>
                {githubAnalysis.summary.topLanguage && (
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Top Language</span><Badge variant="accent">{githubAnalysis.summary.topLanguage}</Badge></div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Member Since</span>
                  <span className="text-[12px] text-[var(--text-tertiary)] flex items-center gap-1"><Calendar size={12} /> {new Date(githubAnalysis.profile.memberSince).getFullYear()}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Repositories */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold">Repositories</h3>
              <span className="text-[12px] text-[var(--text-tertiary)]">Showing {visibleRepos.length} of {githubAnalysis.repositories.length} analyzed</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {visibleRepos.map(repo => <RepoCard key={repo.name} repo={repo} />)}
            </div>
            {githubAnalysis.repositories.length > 6 && (
              <div className="text-center mt-4">
                <Button variant="secondary" onClick={() => setShowAllRepos(s => !s)}>
                  {showAllRepos ? 'Show Less' : `Show All ${githubAnalysis.repositories.length} Repositories`}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credibility tab */}
      {tab === 'credibility' && credibility && <CredibilitySection report={credibility} />}
    </PageTransition>
  );
}
