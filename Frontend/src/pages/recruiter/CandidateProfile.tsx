import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Github } from 'lucide-react';
import { Card, Badge, Avatar, Button, ProgressBar } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import PageTransition from '../../components/PageTransition';
import { recruiterService } from '../../services/recruiterService';
import type { Candidate } from '../../types';

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    if (id) recruiterService.getCandidate(id).then(setCandidate);
  }, [id]);

  if (!candidate) return <div className="p-8 text-center text-[var(--text-tertiary)]">Loading...</div>;

  return (
    <PageTransition>
      <Link to="/recruiter/candidates" className="inline-flex items-center gap-1 text-[13px] text-[var(--accent)] font-medium hover:underline mb-4">
        <ArrowLeft size={14} /> Back to Candidates
      </Link>

      {/* Profile header */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-5">
          <Avatar name={candidate.name} size={64} />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{candidate.name}</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">{candidate.university} · {candidate.degree} · Class of {candidate.graduationYear}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.targetRoles.map(r => <Badge key={r} variant="accent">{r}</Badge>)}
            </div>
          </div>
          <div className="text-right">
            <p className="font-[var(--font-mono)] text-3xl font-medium" style={{ color: candidate.matchPercent >= 75 ? 'var(--success)' : candidate.matchPercent >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
              {candidate.matchPercent}%
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)]">Match Score</p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Readiness ring */}
        <Card className="p-6 flex flex-col items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
            <circle cx="60" cy="60" r="50" fill="none"
              stroke={candidate.readinessScore >= 75 ? 'var(--success)' : candidate.readinessScore >= 50 ? 'var(--warning)' : 'var(--danger)'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 50 * (candidate.readinessScore / 100)} ${2 * Math.PI * 50 * (1 - candidate.readinessScore / 100)}`}
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="56" textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500 }} className="fill-[var(--text-primary)]">{candidate.readinessScore}%</text>
            <text x="60" y="74" textAnchor="middle" style={{ fontFamily: 'var(--font-body)', fontSize: 10 }} className="fill-[var(--text-tertiary)]">Readiness</text>
          </svg>
        </Card>

        {/* Verified Skills */}
        <Card className="p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Verified Skills</h3>
          <div className="flex flex-wrap gap-1">
            {candidate.verifiedSkills.map(s => <Badge key={s} variant="success">{s}</Badge>)}
          </div>
          {candidate.allSkills.filter(s => !candidate.verifiedSkills.includes(s)).length > 0 && (
            <>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mt-4 mb-2">Unverified</h3>
              <div className="flex flex-wrap gap-1">
                {candidate.allSkills.filter(s => !candidate.verifiedSkills.includes(s)).map(s => <Badge key={s} variant="neutral">{s}</Badge>)}
              </div>
            </>
          )}
        </Card>

        {/* GitHub Stats */}
        <Card className="p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3 flex items-center gap-1"><Github size={14} /> GitHub</h3>
          {candidate.githubStats ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Repositories</span><span className="font-[var(--font-mono)] font-medium">{candidate.githubStats.repos}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Contributions</span><span className="font-[var(--font-mono)] font-medium">{candidate.githubStats.contributions}</span></div>
              <div>
                <span className="text-[var(--text-secondary)]">Languages</span>
                <div className="flex flex-wrap gap-1 mt-1">{candidate.githubStats.languages.map(l => <Badge key={l}>{l}</Badge>)}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">No GitHub connected</p>
          )}
        </Card>
      </div>

      {/* Assessment scores */}
      {candidate.assessmentScores && candidate.assessmentScores.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="text-[15px] font-semibold mb-4">Assessment Scores</h3>
          <div className="space-y-3">
            {candidate.assessmentScores.map(a => (
              <div key={a.skill} className="flex items-center gap-4">
                <span className="text-sm w-32">{a.skill}</span>
                <ProgressBar value={a.score} className="flex-1" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => addToast(`${candidate.name} added to pipeline`, 'success')}>Add to Pipeline</Button>
        <Button variant="secondary">Send Message</Button>
        <Button variant="secondary">Add to Comparison</Button>
      </div>
    </PageTransition>
  );
}
