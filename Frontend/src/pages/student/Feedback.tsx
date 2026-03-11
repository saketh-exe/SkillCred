import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare } from 'lucide-react';
import { Card, Badge } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { studentService } from '../../services/studentService';
import type { Feedback } from '../../types';

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => { studentService.getFeedback().then(setFeedback); }, []);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-display text-[32px] tracking-tight">Recruiter Feedback</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Insights from recruiters to help you grow.</p>
      </div>

      {feedback.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare size={40} className="mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-secondary)] mb-1">No feedback received yet.</p>
          <p className="text-sm text-[var(--text-tertiary)]">Apply to roles and complete evaluations to receive recruiter insights.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedback.map(f => (
            <Card key={f.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[15px] font-semibold">{f.role}</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">{f.company} · {f.recruiterName}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{new Date(f.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className={i < f.rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--border-default)]'} />
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--success)] mb-2">Strengths</p>
                  <div className="space-y-1">
                    {f.strengths.map(s => (
                      <div key={s} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                        <span className="text-[var(--success)]">✓</span> {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--warning)] mb-2">Needs Improvement</p>
                  <div className="space-y-1">
                    {f.improvements.map(s => (
                      <div key={s} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                        <span className="text-[var(--warning)]">!</span> {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {f.notes && (
                <div className="bg-[var(--bg-elevated)] p-3 rounded-[var(--radius-sm)] text-sm text-[var(--text-secondary)] mb-4">
                  {f.notes}
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Take Action</p>
                <div className="flex flex-wrap gap-2">
                  {f.improvements.map(s => (
                    <Link key={s} to="/student/skills">
                      <Badge variant="warning" className="cursor-pointer hover:opacity-80">{s} — Verify</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
