import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Avatar, Button } from '../../components/ui';
import { ToggleTheme } from '@/components/ui/toggle-theme';
import PageTransition from '../../components/PageTransition';
import { useAuth } from '../../context/AuthContext';
import { useProfileData } from '../../context/ProfileDataContext';
import { studentService } from '../../services/studentService';
import { useToast } from '../../components/ui/Toast';
import { Upload, Loader2, CheckCircle2, Github, ExternalLink, Briefcase, ShieldCheck } from 'lucide-react';
import type { Skill, Project, StudentUser, ParsedResume } from '../../types';

export default function StudentProfile() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { resume: savedResume, githubAnalysis, credibility } = useProfileData();
  const student = user as StudentUser | null;
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [visible, setVisible] = useState(true);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeData, setResumeData] = useState<ParsedResume | null>(savedResume);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    studentService.getSkills().then(setSkills);
    studentService.getProjects().then(setProjects);
  }, []);

  // Merge: use resume skills if available, else fall back to mock verified skills
  const allSkills = savedResume?.skills ?? [];
  const verifiedSkills = skills.filter(s => s.status === 'Verified');
  const displaySkills = allSkills.length > 0 ? allSkills : verifiedSkills.map(s => s.name);

  // Projects: use resume projects if available, else mock projects
  const resumeProjects = savedResume?.projects ?? [];
  const displayProjects = resumeProjects.length > 0 ? resumeProjects : null;

  // Internships from resume
  const internships = savedResume?.internships ?? [];

  // Credibility score
  const credibilityScore = credibility?.overallScore ?? null;

  // GitHub stats
  const ghProfile = githubAnalysis?.profile ?? null;
  const ghSummary = githubAnalysis?.summary ?? null;

  // Applications count from mock (could be dynamic later)
  const [applications, setApplications] = useState(0);
  useEffect(() => {
    studentService.getApplications().then(apps => setApplications(apps.length));
  }, []);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      const res = await fetch('/api/resumes', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const data: ParsedResume = await res.json();
      setResumeData(data);
      addToast('Resume parsed successfully!', 'success');
    } catch {
      addToast('Failed to parse resume', 'error');
    } finally {
      setResumeUploading(false);
    }
  };

  if (!student) return null;

  return (
    <PageTransition>
      {/* Header */}
      <Card className="p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-subtle)] to-transparent opacity-40" />
        <div className="relative flex items-center gap-5">
          {ghProfile?.avatarUrl ? (
            <img src={ghProfile.avatarUrl} alt={student.name} className="w-16 h-16 rounded-full border-2 border-[var(--border-subtle)]" />
          ) : (
            <Avatar name={student.name} size={64} />
          )}
          <div className="flex-1">
            <h1 className="font-display text-[28px] tracking-tight">{ghProfile?.name ?? student.name}</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">{student.university} · {student.degree} · Class of {student.graduationYear}</p>
            {ghProfile?.bio && <p className="text-[12px] text-[var(--text-tertiary)] mt-1">{ghProfile.bio}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {student.targetRoles.map(r => <Badge key={r} variant="accent">{r}</Badge>)}
              {ghProfile && (
                <a href={ghProfile.profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)]">
                  <Github size={13} /> @{ghProfile.username}
                </a>
              )}
            </div>
          </div>
          <Button variant="outline">Edit Profile</Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Skills */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold">Skills</h2>
            {savedResume && <Badge variant="accent">{displaySkills.length} from resume</Badge>}
          </div>
          {displaySkills.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No skills yet. <Link to="/student/profile-builder" className="text-[var(--accent)] hover:underline">Upload your resume</Link> to get started.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {displaySkills.map(s => {
                const verified = verifiedSkills.some(v => v.name.toLowerCase() === (typeof s === 'string' ? s : s).toLowerCase());
                return <Badge key={typeof s === 'string' ? s : s} variant={verified ? 'success' : 'accent'}>{typeof s === 'string' ? s : s}</Badge>;
              })}
            </div>
          )}
        </Card>

        {/* Education */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold mb-4">Education</h2>
          <p className="text-sm font-medium">{student.university}</p>
          <p className="text-[13px] text-[var(--text-secondary)]">{student.degree}</p>
          <p className="text-[13px] text-[var(--text-tertiary)]">Expected {student.graduationYear}</p>
        </Card>

        {/* Projects */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold">Projects</h2>
            {!displayProjects && !projects.length && (
              <Link to="/student/profile-builder" className="text-[12px] text-[var(--accent)] hover:underline">Add via Profile Builder</Link>
            )}
          </div>
          {displayProjects ? (
            <div className="grid md:grid-cols-2 gap-4">
              {displayProjects.map((p, i) => (
                <div key={i} className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all duration-200">
                  <p className="text-[15px] font-semibold mb-1">{p.name}</p>
                  {p.description && <p className="text-[13px] text-[var(--text-secondary)] mb-2">{p.description}</p>}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.technologies.map(t => <Badge key={t}>{t}</Badge>)}
                  </div>
                  {p.github && <a href={p.github} className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1" target="_blank" rel="noopener noreferrer"><Github size={12} /> View on GitHub</a>}
                </div>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map(p => (
                <div key={p.id} className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all duration-200">
                  <p className="text-[15px] font-semibold mb-1">{p.title}</p>
                  <p className="text-[13px] text-[var(--text-secondary)] mb-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.techStack.map(t => <Badge key={t}>{t}</Badge>)}
                  </div>
                  {p.githubUrl && <a href={p.githubUrl} className="text-xs text-[var(--accent)] hover:underline" target="_blank" rel="noopener noreferrer">View on GitHub</a>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">No projects added yet.</p>
          )}
        </Card>

        {/* Experience / Internships */}
        {internships.length > 0 && (
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-[15px] font-semibold mb-4 flex items-center gap-2"><Briefcase size={15} /> Experience</h2>
            <div className="space-y-3">
              {internships.map((exp, i) => (
                <div key={i} className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-[14px] font-semibold">{exp.role}</p>
                      <p className="text-[13px] text-[var(--accent)]">{exp.company}</p>
                    </div>
                    {exp.duration && <Badge variant="neutral">{exp.duration}</Badge>}
                  </div>
                  {exp.description && <p className="text-[12px] text-[var(--text-secondary)] mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* GitHub Summary */}
        {ghSummary && (
          <Card className="p-6">
            <h2 className="text-[15px] font-semibold mb-4 flex items-center gap-2"><Github size={15} /> GitHub Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Repos Analyzed</span><span className="font-mono font-medium">{ghSummary.totalReposAnalyzed}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Own Repos</span><span className="font-mono font-medium">{ghSummary.ownRepos}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Total Stars</span><span className="font-mono font-medium">{ghSummary.totalStars}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Total Forks</span><span className="font-mono font-medium">{ghSummary.totalForks}</span></div>
              {ghSummary.topLanguage && <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Top Language</span><Badge variant="accent">{ghSummary.topLanguage}</Badge></div>}
            </div>
            <Link to="/student/profile-builder" className="mt-3 inline-flex items-center gap-1 text-[12px] text-[var(--accent)] hover:underline">
              View full analysis <ExternalLink size={12} />
            </Link>
          </Card>
        )}

        {/* Stats Summary */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold mb-4">Stats Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Skills Identified</span><span className="font-mono font-medium">{displaySkills.length}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Verified Skills</span><span className="font-mono font-medium">{verifiedSkills.length}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Applications</span><span className="font-mono font-medium">{applications}</span></div>
            {credibilityScore !== null && (
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1"><ShieldCheck size={13} /> Credibility</span>
                <span className={`font-mono font-medium ${credibilityScore >= 75 ? 'text-[var(--green)]' : credibilityScore >= 50 ? 'text-[var(--amber)]' : 'text-[var(--red)]'}`}>{credibilityScore}%</span>
              </div>
            )}
          </div>
        </Card>

        {/* Profile Visibility */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold mb-4">Profile Visibility</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Make profile visible to recruiters</p>
            <button
              onClick={() => { setVisible(v => !v); addToast(visible ? 'Profile hidden from recruiters' : 'Profile visible to recruiters', 'info'); }}
              className={`w-11 h-6 rounded-full transition-colors ${visible ? 'bg-[var(--accent)]' : 'bg-[var(--border-default)]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${visible ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">UI Mode</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Switch between light and dark theme</p>
            </div>
            <ToggleTheme />
          </div>
        </Card>

        {/* Resume Upload */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold mb-4">Resume</h2>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleResumeUpload} />
          {(resumeData || savedResume) ? (
            <div>
              <div className="flex items-center gap-2 mb-3 text-[var(--success)]">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">Resume parsed</span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-[var(--text-secondary)]"><span className="font-medium">{(resumeData ?? savedResume)!.skills.length}</span> skills extracted</p>
                <p className="text-[var(--text-secondary)]"><span className="font-medium">{(resumeData ?? savedResume)!.projects.length}</span> projects found</p>
                <p className="text-[var(--text-secondary)]"><span className="font-medium">{(resumeData ?? savedResume)!.internships.length}</span> experiences found</p>
              </div>
              <Button variant="secondary" onClick={() => fileRef.current?.click()} className="mt-3 w-full" disabled={resumeUploading}>
                {resumeUploading ? <><Loader2 size={14} className="animate-spin" /> Parsing...</> : 'Upload New Resume'}
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-3">Upload your resume to auto-extract skills and experience.</p>
              <Button onClick={() => fileRef.current?.click()} className="w-full" disabled={resumeUploading}>
                {resumeUploading ? <><Loader2 size={14} className="animate-spin" /> Parsing...</> : <><Upload size={14} /> Upload Resume (PDF)</>}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
