import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, MapPin, X } from 'lucide-react';
import { Card, Badge, Button, ProgressBar } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import PageTransition from '../../components/PageTransition';
import { studentService } from '../../services/studentService';
import type { JobMatch } from '../../types';

export default function JobMatches() {
  const { addToast } = useToast();
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [search, setSearch] = useState('');
  const [minMatch, setMinMatch] = useState(50);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

  useEffect(() => { studentService.getJobs().then(setJobs); }, []);

  const filtered = jobs
    .filter(j => j.matchPercent >= minMatch)
    .filter(j => {
      if (!search) return true;
      const q = search.toLowerCase();
      return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    });

  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = async (job: JobMatch) => {
    if (applying) return;
    setApplying(job.jobId);
    try {
      await studentService.applyToJob(job.jobId);
      addToast(`Applied to ${job.title} at ${job.company}!`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to apply';
      if (msg.toLowerCase().includes('already')) {
        addToast(`Already applied to ${job.title}`, 'info');
      } else {
        addToast(msg, 'error');
      }
    } finally {
      setApplying(null);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-display text-[32px] tracking-tight">Job Matches</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Opportunities matched to your verified skills.</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by role or company..."
            className="w-full h-[38px] pl-9 pr-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-[var(--text-tertiary)]" />
          <span className="text-[13px] text-[var(--text-secondary)]">Min match:</span>
          <select
            value={minMatch}
            onChange={e => setMinMatch(Number(e.target.value))}
            className="h-[38px] px-2 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm"
          >
            <option value={0}>0%+</option>
            <option value={50}>50%+</option>
            <option value={70}>70%+</option>
            <option value={90}>90%+</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Job list */}
        <div className="flex-1 space-y-3">
          {filtered.length === 0 && (
            <Card className="p-10 text-center">
              <p className="text-(--text-tertiary) mb-2">No jobs match your filters.</p>
              <Button variant="ghost" onClick={() => { setSearch(''); setMinMatch(0); }}>Reset Filters</Button>
            </Card>
          )}
          {filtered.map(job => (
            <Card
              key={job.jobId}
              className={`p-5 ${selectedJob?.jobId === job.jobId ? 'border-[var(--accent)]' : ''}`}
              hover
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[15px] font-semibold">{job.title}</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">{job.company}</p>
                </div>
                <Badge variant={job.matchPercent >= 80 ? 'success' : job.matchPercent >= 60 ? 'warning' : 'danger'}>
                  {job.matchPercent}% match
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {job.requiredSkills.map(s => (
                  <Badge key={s.name} variant={s.verified ? 'success' : 'warning'}>{s.name}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[13px] text-[var(--text-tertiary)] mb-3">
                <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                <span>{job.experienceLevel}</span>
              </div>
              <div className="mb-3">
                <span className="text-[11px] text-[var(--text-tertiary)]">Your Readiness</span>
                <ProgressBar value={job.readinessPercent} />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 text-xs h-8" onClick={e => { e.stopPropagation(); setSelectedJob(job); }}>View Details</Button>
                <Button className="flex-1 text-xs h-8" disabled={applying === job.jobId} onClick={e => { e.stopPropagation(); handleApply(job); }}>{applying === job.jobId ? 'Applying…' : 'Apply Now'}</Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Detail side panel */}
        {selectedJob && (
          <div className="hidden lg:block w-[380px] sticky top-20 self-start">
            <Card className="p-6 border-[var(--accent)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedJob.title}</h2>
                <button onClick={() => setSelectedJob(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">{selectedJob.company} · {selectedJob.location}</p>
              <div className="mb-4">
                <Badge variant="accent" className="text-base px-3 py-1">{selectedJob.matchPercent}% match</Badge>
              </div>
              <div className="mb-4">
                <p className="text-sm text-[var(--text-secondary)] mb-2">This role requires experience building scalable backend systems with a focus on API design, database management, and cloud infrastructure.</p>
              </div>
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Required Skills</p>
                <div className="space-y-1">
                  {selectedJob.requiredSkills.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <span>{s.name}</span>
                      <Badge variant={s.verified ? 'success' : 'warning'}>{s.verified ? 'Verified' : 'Missing'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Readiness Score</p>
                <ProgressBar value={selectedJob.readinessPercent} />
              </div>
              <Button className="w-full" disabled={applying === selectedJob.jobId} onClick={() => handleApply(selectedJob)}>{applying === selectedJob.jobId ? 'Applying…' : 'Apply Now'}</Button>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
