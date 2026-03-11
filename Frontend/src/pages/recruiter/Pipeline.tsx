import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Card, Badge, Avatar } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import PageTransition from '../../components/PageTransition';
import { recruiterService } from '../../services/recruiterService';
import type { JobPosting, PipelineCandidate, PipelineStage } from '../../types';

interface StageWithCandidates extends PipelineStage {
  candidates: PipelineCandidate[];
}

export default function Pipeline() {
  const { addToast } = useToast();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [columns, setColumns] = useState<StageWithCandidates[]>([]);

  useEffect(() => {
    recruiterService.getJobPostings().then(data => {
      setJobs(data);
      if (data.length > 0) setSelectedJob(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    recruiterService.getPipeline(selectedJob).then(data => {
      const cols: StageWithCandidates[] = data.stages.map(s => ({
        ...s,
        candidates: data.candidates.filter(c => c.stageId === s.id),
      }));
      setColumns(cols);
    });
  }, [selectedJob]);

  const moveCandidate = async (candidateId: string, fromStage: string, toStage: string) => {
    // Optimistic UI update
    setColumns(prev => {
      const updated = prev.map(s => ({ ...s, candidates: [...s.candidates] }));
      const from = updated.find(s => s.id === fromStage);
      const to = updated.find(s => s.id === toStage);
      if (!from || !to) return prev;
      const idx = from.candidates.findIndex(c => c.id === candidateId);
      if (idx === -1) return prev;
      const [candidate] = from.candidates.splice(idx, 1);
      to.candidates.push({ ...candidate, stageId: toStage });
      return updated;
    });
    try {
      await recruiterService.moveCandidate(selectedJob, candidateId, toStage);
      addToast('Candidate moved', 'success');
    } catch {
      addToast('Failed to move candidate', 'error');
      // Reload pipeline to restore correct state
      recruiterService.getPipeline(selectedJob).then(data => {
        const cols: StageWithCandidates[] = data.stages.map(s => ({
          ...s,
          candidates: data.candidates.filter(c => c.stageId === s.id),
        }));
        setColumns(cols);
      }).catch(() => {/* ignore reload failure */});
    }
  };

  const rejectCandidate = async (candidateId: string) => {
    try {
      await recruiterService.rejectCandidate(selectedJob, candidateId);
      addToast('Candidate rejected', 'info');
      const data = await recruiterService.getPipeline(selectedJob);
      setColumns(data.stages.map(s => ({ ...s, candidates: data.candidates.filter(c => c.stageId === s.id) })));
    } catch {
      addToast('Failed to reject candidate', 'error');
    }
  };

  const hireCandidate = async (candidateId: string) => {
    try {
      await recruiterService.hireCandidate(selectedJob, candidateId);
      addToast('Candidate hired!', 'success');
      const data = await recruiterService.getPipeline(selectedJob);
      setColumns(data.stages.map(s => ({ ...s, candidates: data.candidates.filter(c => c.stageId === s.id) })));
    } catch {
      addToast('Failed to hire candidate', 'error');
    }
  };

  const stageColor = (type: string) => {
    switch (type) {
      case 'Profile Review': return '#6366f1';
      case 'GitHub Analysis': return '#8b5cf6';
      case 'Online Assessment': return '#f59e0b';
      case 'AI Interview': return '#10b981';
      case 'Final': return '#2b5ce6';
      default: return '#64748b';
    }
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[32px] tracking-tight">Pipeline</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Track candidates through evaluation stages.</p>
        </div>
        <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className="h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm">
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((stage, stageIdx) => (
          <div key={stage.id} className="min-w-[280px] w-[280px] flex-shrink-0">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: stageColor(stage.type) }} />
              <h3 className="text-sm font-semibold flex-1">{stage.name}</h3>
              <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-tertiary)]">{stage.candidates.length}</span>
            </div>
            
            <div className="space-y-2 min-h-[200px] bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-2">
              {stage.candidates.map((c: PipelineCandidate) => (
                <Card key={c.id} className="p-3 bg-[var(--bg-surface)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={c.name} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{c.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    {c.score != null && <Badge variant="accent">{c.score} pts</Badge>}
                    <Badge variant={c.status === 'active' ? 'success' : c.status === 'rejected' ? 'danger' : c.status === 'hired' ? 'accent' : 'neutral'}>{c.status}</Badge>
                  </div>
                  <div className="flex gap-1">
                    {c.status === 'active' && stageIdx > 0 && (
                      <button onClick={() => moveCandidate(c.id, stage.id, columns[stageIdx - 1].id)}
                        className="flex-1 h-6 text-[10px] font-medium bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded hover:bg-[var(--accent-subtle)] transition-colors">
                        &larr; Back
                      </button>
                    )}
                    {c.status === 'active' && stageIdx < columns.length - 1 && (
                      <button onClick={() => moveCandidate(c.id, stage.id, columns[stageIdx + 1].id)}
                        className="flex-1 h-6 text-[10px] font-medium bg-[var(--accent)] text-white rounded hover:opacity-90 transition-colors">
                        Advance &rarr;
                      </button>
                    )}
                    {c.status === 'active' && stageIdx === columns.length - 1 && (
                      <button onClick={() => hireCandidate(c.id)}
                        className="flex-1 h-6 text-[10px] font-medium bg-[var(--success)] text-white rounded hover:opacity-90 transition-colors">
                        ✓ Hire
                      </button>
                    )}
                    {c.status === 'active' && (
                      <button onClick={() => rejectCandidate(c.id)}
                        className="h-6 w-6 flex items-center justify-center text-[var(--danger)] border border-[var(--border-subtle)] rounded hover:bg-[var(--danger)] hover:text-white transition-colors flex-shrink-0">
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
              {stage.candidates.length === 0 && (
                <p className="text-center text-[12px] text-[var(--text-tertiary)] py-8">No candidates</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}
