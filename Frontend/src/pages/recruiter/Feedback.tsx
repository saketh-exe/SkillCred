import { useEffect, useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Card, Badge, Button, Avatar } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import PageTransition from '../../components/PageTransition';
import { recruiterService } from '../../services/recruiterService';
import type { Feedback as FeedbackType, Candidate, JobPosting } from '../../types';

export default function RecruiterFeedback() {
  const { addToast } = useToast();
  const [feedbackList, setFeedbackList] = useState<FeedbackType[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [rating, setRating] = useState(4);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    recruiterService.getFeedback().then(setFeedbackList);
    recruiterService.getCandidates().then(setCandidates);
    recruiterService.getJobPostings().then(setJobs);
  }, []);

  const handleSubmit = async () => {
    if (!selectedCandidate) { addToast('Select a candidate first', 'error'); return; }
    if (!selectedJob) { addToast('Select a job first', 'error'); return; }
    const job = jobs.find(j => j.id === selectedJob);
    if (!job) { addToast('Job not found', 'error'); return; }
    try {
      await recruiterService.submitFeedback({
        studentId: selectedCandidate,
        jobId: selectedJob,
        role: job.title,
        strengths: strengths.split('\n').map(s => s.trim()).filter(Boolean),
        improvements: improvements.split('\n').map(s => s.trim()).filter(Boolean),
        notes: comments.trim() || undefined,
        rating,
      });
      addToast('Feedback submitted!', 'success');
      recruiterService.getFeedback().then(setFeedbackList);
      setSelectedCandidate('');
      setSelectedJob('');
      setRating(4);
      setStrengths('');
      setImprovements('');
      setComments('');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to submit feedback', 'error');
    }
  };

  const inputClass = 'w-full h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)]';

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-display text-[32px] tracking-tight">Feedback</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Provide structured feedback to candidates to help them grow.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Send feedback form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2"><Send size={16} /> Send Feedback</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Candidate</label>
                <select value={selectedCandidate} onChange={e => setSelectedCandidate(e.target.value)} className={inputClass}>
                  <option value="">Select candidate...</option>
                  {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Job Position</label>
                <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className={inputClass}>
                  <option value="">Select job...</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setRating(s)} className="p-0.5">
                      <Star size={20} fill={s <= rating ? 'var(--warning)' : 'none'} stroke={s <= rating ? 'var(--warning)' : 'var(--text-tertiary)'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Strengths</label>
                <textarea value={strengths} onChange={e => setStrengths(e.target.value)} rows={3} className="w-full px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] resize-none" placeholder="What did they do well? (one per line)" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Areas for Improvement</label>
                <textarea value={improvements} onChange={e => setImprovements(e.target.value)} rows={3} className="w-full px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] resize-none" placeholder="What could they improve? (one per line)" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Additional Comments</label>
                <textarea value={comments} onChange={e => setComments(e.target.value)} rows={2} className="w-full px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] resize-none" placeholder="Any other notes..." />
              </div>
              <Button onClick={handleSubmit} className="w-full">Submit Feedback</Button>
            </div>
          </Card>
        </div>

        {/* Feedback history */}
        <div className="lg:col-span-3">
          <h3 className="text-[15px] font-semibold mb-4">Feedback History</h3>
          {feedbackList.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-[var(--text-tertiary)]">No feedback sent yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {feedbackList.map(fb => (
                <Card key={fb.id} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={fb.candidateName || fb.recruiterName || ''} size={32} />
                      <div>
                        <p className="text-[14px] font-semibold">{fb.candidateName || 'Unknown'}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{fb.role} · {new Date(fb.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} fill={i < fb.rating ? 'var(--warning)' : 'none'} stroke={i < fb.rating ? 'var(--warning)' : 'var(--text-tertiary)'} />
                      ))}
                    </div>
                  </div>
                  {fb.strengths.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Strengths:</span>
                      <div className="flex flex-wrap gap-1 mt-1">{fb.strengths.map(s => <Badge key={s} variant="success">{s}</Badge>)}</div>
                    </div>
                  )}
                  {fb.improvements.length > 0 && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Improve:</span>
                      <div className="flex flex-wrap gap-1 mt-1">{fb.improvements.map(s => <Badge key={s} variant="warning">{s}</Badge>)}</div>
                    </div>
                  )}
                  {fb.notes && <p className="text-sm text-[var(--text-secondary)] mt-2">{fb.notes}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
