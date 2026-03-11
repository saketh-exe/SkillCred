import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import PageTransition from '../../components/PageTransition';
import { recruiterService } from '../../services/recruiterService';
import { SKILLS_LIST } from '../../services/constants';
import type { JobPosting, RequiredSkill, PipelineStage, StageType, Difficulty, WorkMode, EmploymentType, ExperienceLevel } from '../../types';

const STAGE_TYPES: StageType[] = ['Profile Review', 'GitHub Analysis', 'Online Assessment', 'AI Interview', 'Final'];

export default function JobPostings() {
  const { addToast } = useToast();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(1);

  // Form state
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('Hybrid');
  const [empType, setEmpType] = useState<EmploymentType>('Full-time');
  const [expLevel, setExpLevel] = useState<ExperienceLevel>('Intermediate');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [reqSkills, setReqSkills] = useState<RequiredSkill[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);

  useEffect(() => { recruiterService.getJobPostings().then(setJobs); }, []);

  const addSkill = (name: string) => {
    if (reqSkills.find(s => s.name === name)) return;
    setReqSkills(prev => [...prev, { name, proficiency: 'Intermediate', mustHave: true }]);
  };
  const removeSkill = (name: string) => setReqSkills(prev => prev.filter(s => s.name !== name));
  const updateSkill = (name: string, updates: Partial<RequiredSkill>) => {
    setReqSkills(prev => prev.map(s => s.name === name ? { ...s, ...updates } : s));
  };

  const addStage = (type: StageType) => {
    setPipeline(prev => [...prev, { id: `new-${Date.now()}`, name: type, type, description: '', maxAdvancing: 10 }]);
  };
  const removeStage = (id: string) => setPipeline(prev => prev.filter(s => s.id !== id));

  const resetForm = () => {
    setTitle(''); setDepartment(''); setLocation(''); setWorkMode('Hybrid');
    setEmpType('Full-time'); setExpLevel('Intermediate'); setSalary('');
    setDescription(''); setReqSkills([]); setPipeline([]);
  };

  const handlePublish = async () => {
    try {
      const newJob = await recruiterService.createJob({
        title, department, location, workMode,
        employmentType: empType,
        experienceLevel: expLevel,
        salaryRange: salary || undefined,
        description,
        requiredSkills: reqSkills,
        pipeline,
        status: 'Active',
        applicantCount: 0,
        inPipelineCount: 0,
        topMatchPercent: 0,
      });
      setJobs(prev => [newJob, ...prev]);
      addToast('Job posting published successfully!', 'success');
      setShowCreate(false);
      setCreateStep(1);
      resetForm();
    } catch {
      addToast('Failed to create job posting. Please try again.', 'error');
    }
  };

  const inputClass = 'w-full h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)]';

  const statusVariant = (s: string) => s === 'Active' ? 'success' as const : s === 'Draft' ? 'default' as const : 'neutral' as const;

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[32px] tracking-tight">Job Postings</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage your open positions and attract verified talent.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Create Job Posting</Button>
      </div>

      {/* Job Postings Table */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--bg-elevated)]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Title</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Applicants</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Top Match</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Created</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] h-[52px]">
                <td className="px-4 text-sm font-medium">{job.title}</td>
                <td className="px-4"><Badge variant={statusVariant(job.status)}>{job.status}</Badge></td>
                <td className="px-4 font-[var(--font-mono)] text-sm">{job.applicantCount}</td>
                <td className="px-4"><Badge variant="accent">{job.topMatchPercent}%</Badge></td>
                <td className="px-4 text-sm text-[var(--text-tertiary)]">{new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                <td className="px-4">
                  <div className="flex gap-2">
                    <Button variant="ghost" className="text-xs h-7 px-2">Edit</Button>
                    <Button variant="ghost" className="text-xs h-7 px-2">Candidates</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Create Job Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setCreateStep(1); resetForm(); }} title="Create Job Posting" size="xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold ${
                createStep >= s ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
              }`}>{s}</div>
              {s < 4 && <div className={`w-8 h-0.5 ${createStep > s ? 'bg-[var(--accent)]' : 'bg-[var(--border-subtle)]'}`} />}
            </div>
          ))}
        </div>

        {createStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Role Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Job Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="Backend Developer" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Department</label>
                <input value={department} onChange={e => setDepartment(e.target.value)} className={inputClass} placeholder="Engineering" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} className={inputClass} placeholder="San Francisco, CA" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Work Mode</label>
                <select value={workMode} onChange={e => setWorkMode(e.target.value as WorkMode)} className={inputClass}>
                  <option>Remote</option><option>Hybrid</option><option>Onsite</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Employment Type</label>
                <select value={empType} onChange={e => setEmpType(e.target.value as EmploymentType)} className={inputClass}>
                  <option>Full-time</option><option>Part-time</option><option>Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Experience Level</label>
                <select value={expLevel} onChange={e => setExpLevel(e.target.value as ExperienceLevel)} className={inputClass}>
                  <option value="Beginner">Junior</option><option value="Intermediate">Mid</option><option value="Advanced">Senior</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Salary Range (optional)</label>
                <input value={salary} onChange={e => setSalary(e.target.value)} className={inputClass} placeholder="$120k-$160k" />
              </div>
              <div className="col-span-2">
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Job Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] resize-none" placeholder="Describe the role..." />
              </div>
            </div>
            <div className="flex justify-end"><Button onClick={() => setCreateStep(2)}>Next</Button></div>
          </div>
        )}

        {createStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Required Skills</h3>
            <div>
              <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">Add skills</label>
              <div className="flex flex-wrap gap-1 mb-4 max-h-40 overflow-y-auto">
                {SKILLS_LIST.filter(s => !reqSkills.find(rs => rs.name === s)).map(s => (
                  <button key={s} onClick={() => addSkill(s)} className="px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-text)] transition-colors">{s}</button>
                ))}
              </div>
            </div>
            {reqSkills.length > 0 && (
              <div className="space-y-2">
                {reqSkills.map(s => (
                  <div key={s.name} className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]">
                    <span className="text-sm font-medium flex-1">{s.name}</span>
                    <select value={s.proficiency} onChange={e => updateSkill(s.name, { proficiency: e.target.value as Difficulty })} className="h-8 px-2 border border-[var(--border-default)] rounded text-xs bg-[var(--bg-surface)]">
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                    <button onClick={() => updateSkill(s.name, { mustHave: !s.mustHave })} className={`text-xs px-2 py-1 rounded border ${s.mustHave ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent-text)]' : 'border-[var(--border-subtle)] text-[var(--text-tertiary)]'}`}>
                      {s.mustHave ? 'Must have' : 'Nice to have'}
                    </button>
                    <button onClick={() => removeSkill(s.name)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)]">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setCreateStep(1)}>Back</Button>
              <Button onClick={() => setCreateStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {createStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Evaluation Pipeline</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {STAGE_TYPES.map(t => (
                <Button key={t} variant="secondary" className="text-xs" onClick={() => addStage(t)}><Plus size={14} /> {t}</Button>
              ))}
            </div>
            {pipeline.length > 0 && (
              <div className="space-y-2">
                {pipeline.map((stage, i) => (
                  <div key={stage.id} className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]">
                    <span className="text-sm font-semibold text-[var(--accent)] w-6">{i + 1}</span>
                    <span className="text-sm font-medium flex-1">{stage.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-[var(--text-tertiary)]">Max advancing:</span>
                      <input type="number" value={stage.maxAdvancing} onChange={e => setPipeline(prev => prev.map(s => s.id === stage.id ? { ...s, maxAdvancing: Number(e.target.value) } : s))} className="w-16 h-7 px-2 border border-[var(--border-default)] rounded text-xs text-center bg-[var(--bg-surface)]" />
                    </div>
                    <button onClick={() => removeStage(stage.id)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)]">×</button>
                  </div>
                ))}
              </div>
            )}
            {/* Pipeline preview */}
            {pipeline.length > 0 && (
              <div className="mt-4 p-4 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Pipeline Preview</p>
                <div className="flex items-center gap-0">
                  {pipeline.map((s, i) => (
                    <div key={s.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-semibold">{i + 1}</div>
                        <span className="text-[10px] text-[var(--text-tertiary)] mt-1 text-center max-w-[80px]">{s.name}</span>
                      </div>
                      {i < pipeline.length - 1 && <div className="w-10 h-0.5 bg-[var(--accent)] mx-1" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setCreateStep(2)}>Back</Button>
              <Button onClick={() => setCreateStep(4)}>Next</Button>
            </div>
          </div>
        )}

        {createStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review & Publish</h3>
            <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-5 space-y-3 text-sm">
              <div><span className="text-[var(--text-tertiary)]">Title:</span> <span className="font-medium">{title || '—'}</span></div>
              <div><span className="text-[var(--text-tertiary)]">Department:</span> <span className="font-medium">{department || '—'}</span></div>
              <div><span className="text-[var(--text-tertiary)]">Location:</span> <span className="font-medium">{location || '—'} ({workMode})</span></div>
              <div><span className="text-[var(--text-tertiary)]">Type:</span> <span className="font-medium">{empType} · {expLevel}</span></div>
              {salary && <div><span className="text-[var(--text-tertiary)]">Salary:</span> <span className="font-medium">{salary}</span></div>}
              <div>
                <span className="text-[var(--text-tertiary)]">Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {reqSkills.map(s => <Badge key={s.name} variant={s.mustHave ? 'accent' : 'default'}>{s.name} ({s.proficiency})</Badge>)}
                </div>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Pipeline:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {pipeline.map((s, i) => <Badge key={s.id}>{i + 1}. {s.name}</Badge>)}
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setCreateStep(3)}>Back</Button>
              <Button onClick={handlePublish}>Publish Job</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
