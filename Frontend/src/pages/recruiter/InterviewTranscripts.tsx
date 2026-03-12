import { useEffect, useState } from 'react';
import { Card, Badge, Avatar, Modal, Button } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { recruiterService } from '../../services/recruiterService';
import type { JobPosting, InterviewListItem, InterviewTranscript } from '../../types';

export default function InterviewTranscripts() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [transcript, setTranscript] = useState<InterviewTranscript | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    recruiterService.getJobPostings().then(data => {
      setJobs(data);
      if (data.length > 0) setSelectedJob(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    setLoading(true);
    recruiterService.getInterviews(selectedJob)
      .then(setInterviews)
      .catch(() => setInterviews([]))
      .finally(() => setLoading(false));
  }, [selectedJob]);

  const openTranscript = async (interviewId: string) => {
    try {
      const t = await recruiterService.getInterviewTranscript(selectedJob, interviewId);
      setTranscript(t);
    } catch { /* ignore */ }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[32px] tracking-tight">Interview Transcripts</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Review AI interview recordings and evaluations.</p>
        </div>
        <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)}
          className="h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm">
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && interviews.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-[var(--text-tertiary)]">No completed interviews for this position yet.</p>
        </Card>
      )}

      {!loading && (
        <div className="space-y-3">
          {interviews.map(iv => (
            <Card key={iv.id} className="p-5" hover onClick={() => openTranscript(iv.id)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Avatar name={iv.candidateName} size={36} />
                  <div>
                    <p className="text-[15px] font-semibold">{iv.candidateName}</p>
                    <p className="text-[12px] text-[var(--text-tertiary)]">
                      {new Date(iv.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{fmt(iv.durationSeconds)} · {iv.messageCount} messages
                    </p>
                  </div>
                </div>
                <Badge variant={iv.evaluation.overallScore >= 70 ? 'success' : iv.evaluation.overallScore >= 40 ? 'accent' : 'danger'}>
                  {iv.evaluation.overallScore}%
                </Badge>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)]">{iv.evaluation.summary}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Full transcript modal */}
      <Modal open={!!transcript} onClose={() => setTranscript(null)} title={transcript ? `Interview — ${transcript.candidateName}` : ''} size="lg">
        {transcript && (
          <div>
            <div className="flex items-center gap-4 mb-4 text-sm text-[var(--text-secondary)]">
              <span>{transcript.jobTitle}</span>
              <span>·</span>
              <span>{fmt(transcript.durationSeconds)}</span>
              <span>·</span>
              <span>{new Date(transcript.createdAt).toLocaleString()}</span>
            </div>

            {/* Evaluation summary */}
            {transcript.evaluation && (
              <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-4 mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold"
                    style={{ borderColor: transcript.evaluation.overallScore >= 70 ? 'var(--success)' : transcript.evaluation.overallScore >= 40 ? 'var(--warning)' : 'var(--danger)' }}>
                    {transcript.evaluation.overallScore}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] flex-1">{transcript.evaluation.summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--success)] mb-1">Strengths</p>
                    <ul className="space-y-0.5">
                      {transcript.evaluation.strengths.map((s, i) => <li key={i} className="text-[var(--text-secondary)]">✓ {s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--warning)] mb-1">Improvements</p>
                    <ul className="space-y-0.5">
                      {transcript.evaluation.improvements.map((s, i) => <li key={i} className="text-[var(--text-secondary)]">→ {s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript messages */}
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Conversation</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {transcript.transcript.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm bg-[var(--bg-elevated)]">
                    {m.role === 'interviewer' ? '🤖' : '👤'}
                  </div>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                    m.role === 'candidate'
                      ? 'bg-[var(--accent)] text-white rounded-br-sm'
                      : 'bg-[var(--bg-elevated)] rounded-bl-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button onClick={() => setTranscript(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
