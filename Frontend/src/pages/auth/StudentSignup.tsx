import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { SKILLS_LIST, TARGET_ROLES } from '../../services/constants';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import type { ExperienceLevel, ParsedResume } from '../../types';

const YEARS = Array.from({ length: 6 }, (_, i) => 2024 + i);

export default function StudentSignup() {
  const nav = useNavigate();
  const { signupStudent } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [gradYear, setGradYear] = useState(2026);

  // Step 2
  const [skills, setSkills] = useState<string[]>([]);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceLevel>('Beginner');

  // Resume upload
  const resumeRef = useRef<HTMLInputElement>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeParsed, setResumeParsed] = useState(false);

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
      // Auto-fill skills from resume
      const newSkills = new Set(skills);
      data.skills.forEach(s => {
        const match = SKILLS_LIST.find(k => k.toLowerCase() === s.toLowerCase());
        if (match) newSkills.add(match);
      });
      setSkills([...newSkills]);
      setResumeParsed(true);
    } catch { /* silently fail, user can still pick manually */ } finally {
      setResumeUploading(false);
    }
  };

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleComplete = async () => {
    setLoading(true);
    await signupStudent({ name, email, avatarUrl: undefined, university, degree, graduationYear: gradYear, skills, targetRoles, experienceLevel: experience });
    setLoading(false);
    nav('/student/dashboard');
  };

  const inputClass = 'w-full h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] transition-all';

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4 py-12" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border-subtle) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[var(--accent)] mb-1">SkillCred</h1>
            <p className="text-sm text-[var(--text-secondary)]">Create your student account</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold ${
                  step >= s ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
                }`}>{s}</div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[var(--accent)]' : 'bg-[var(--border-subtle)]'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Alex Johnson" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="alex@university.edu" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="Create a password" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">University</label>
                <input value={university} onChange={e => setUniversity(e.target.value)} className={inputClass} placeholder="Stanford University" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Degree</label>
                  <input value={degree} onChange={e => setDegree(e.target.value)} className={inputClass} placeholder="B.S. Computer Science" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Graduation Year</label>
                  <select value={gradYear} onChange={e => setGradYear(Number(e.target.value))} className={inputClass}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <Button onClick={() => setStep(2)} className="w-full mt-2">Continue</Button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold mb-4">Skills & Interests</h2>

              {/* Resume upload shortcut */}
              <div className="p-4 bg-[var(--bg-elevated)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                <input ref={resumeRef} type="file" accept="application/pdf" className="hidden" onChange={handleResumeUpload} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-fill from Resume</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Upload your resume to auto-select matching skills</p>
                  </div>
                  <Button variant="secondary" onClick={() => resumeRef.current?.click()} disabled={resumeUploading}>
                    {resumeUploading ? <><Loader2 size={14} className="animate-spin" /> Parsing...</> : resumeParsed ? <><CheckCircle2 size={14} /> Uploaded</> : <><Upload size={14} /> Upload PDF</>}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">Skills (select all that apply)</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {SKILLS_LIST.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleItem(skills, s, setSkills)}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        skills.includes(s)
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent-text)] font-medium'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">Target Roles</label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_ROLES.map(r => (
                    <button
                      key={r}
                      onClick={() => toggleItem(targetRoles, r, setTargetRoles)}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        targetRoles.includes(r)
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent-text)] font-medium'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Experience Level</label>
                <select value={experience} onChange={e => setExperience(e.target.value as ExperienceLevel)} className={inputClass}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1">Continue</Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold mb-4">Review Your Profile</h2>
              <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-5 space-y-3">
                <div><span className="text-[13px] text-[var(--text-tertiary)]">Name:</span> <span className="text-sm font-medium">{name || '—'}</span></div>
                <div><span className="text-[13px] text-[var(--text-tertiary)]">Email:</span> <span className="text-sm font-medium">{email || '—'}</span></div>
                <div><span className="text-[13px] text-[var(--text-tertiary)]">University:</span> <span className="text-sm font-medium">{university || '—'}</span></div>
                <div><span className="text-[13px] text-[var(--text-tertiary)]">Degree:</span> <span className="text-sm font-medium">{degree || '—'}</span></div>
                <div><span className="text-[13px] text-[var(--text-tertiary)]">Grad Year:</span> <span className="text-sm font-medium font-[var(--font-mono)]">{gradYear}</span></div>
                <div>
                  <span className="text-[13px] text-[var(--text-tertiary)]">Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skills.map(s => <Badge key={s}>{s}</Badge>)}
                    {skills.length === 0 && <span className="text-sm text-[var(--text-tertiary)]">None selected</span>}
                  </div>
                </div>
                <div>
                  <span className="text-[13px] text-[var(--text-tertiary)]">Target Roles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {targetRoles.map(r => <Badge key={r} variant="accent">{r}</Badge>)}
                    {targetRoles.length === 0 && <span className="text-sm text-[var(--text-tertiary)]">None selected</span>}
                  </div>
                </div>
                <div><span className="text-[13px] text-[var(--text-tertiary)]">Experience:</span> <Badge>{experience}</Badge></div>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
                <Button onClick={handleComplete} className="flex-1" disabled={loading}>
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-[13px] text-[var(--text-tertiary)] mt-6">
            Already have an account?{' '}
            <button onClick={() => nav('/auth/login')} className="text-[var(--accent)] font-medium hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
