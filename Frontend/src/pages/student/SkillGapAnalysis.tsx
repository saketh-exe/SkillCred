import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, BarChart3, Loader2 } from 'lucide-react';
import { Card, ProgressBar, Badge, Button } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { studentService } from '../../services/studentService';
import type { SkillGap } from '../../types';

export default function SkillGapAnalysis() {
  const nav = useNavigate();
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    studentService.getSkillGaps()
      .then(data => {
        setGaps(data);
        if (data.length > 0) setSelectedRole(data[0].targetRole);
      })
      .catch(() => setError('Failed to load skill gap data. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const current = gaps.find(g => g.targetRole === selectedRole);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-display text-[32px] tracking-tight">Skill Gap Analysis</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Understand what you need to reach your target roles.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24 text-[var(--text-tertiary)]">
          <Loader2 size={22} className="animate-spin mr-2" /> Loading analysis…
        </div>
      )}

      {!loading && error && (
        <Card className="p-8 text-center">
          <AlertTriangle size={28} className="mx-auto mb-3 text-[var(--warning)]" />
          <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">Something went wrong</p>
          <p className="text-[13px] text-[var(--text-secondary)]">{error}</p>
        </Card>
      )}

      {!loading && !error && gaps.length === 0 && (
        <Card className="p-10 text-center">
          <BarChart3 size={32} className="mx-auto mb-4 text-[var(--text-tertiary)]" />
          <h2 className="text-[17px] font-semibold text-[var(--text-primary)] mb-2">No target roles set</h2>
          <p className="text-[13px] text-[var(--text-secondary)] mb-5 max-w-sm mx-auto">
            Add target roles to your profile so we can compute your skill gaps against active job postings.
          </p>
          <Button onClick={() => nav('/student/profile-builder')}>Set Target Roles</Button>
        </Card>
      )}

      {!loading && !error && gaps.length > 0 && (
        <>
          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Target Role</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] transition-all"
            >
              {gaps.map(g => <option key={g.targetRole} value={g.targetRole}>{g.targetRole}</option>)}
            </select>
          </div>

          {current && (
            <>
              {/* Match Header */}
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold">{current.targetRole}</h2>
                  <span className="font-mono text-2xl font-medium" style={{ color: current.matchPercent >= 75 ? 'var(--green)' : current.matchPercent >= 50 ? 'var(--amber)' : 'var(--red)' }}>
                    {current.matchPercent}% Match
                  </span>
                </div>
                <ProgressBar value={current.matchPercent} />
                {current.matchPercent === 0 && current.strengths.length === 0 && current.missing.length === 0 && (
                  <p className="text-[12px] text-[var(--text-tertiary)] mt-3">
                    No active job postings were found for this role yet. Check back later or broaden your target roles.
                  </p>
                )}
              </Card>

              {/* Two-column strengths / missing */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card className="p-6">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
                    Strengths <span className="ml-1 text-[var(--success)]">({current.strengths.length})</span>
                  </h3>
                  {current.strengths.length === 0 ? (
                    <p className="text-[13px] text-[var(--text-tertiary)]">No matching strengths found for this role yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {current.strengths.map(s => (
                        <div key={s} className="flex items-center gap-2 text-sm">
                          <CheckCircle size={16} className="text-[var(--success)] shrink-0" />
                          <span className="text-[var(--text-primary)]">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                <Card className="p-6">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
                    Skills to Improve <span className="ml-1 text-[var(--warning)]">({current.missing.length})</span>
                  </h3>
                  {current.missing.length === 0 ? (
                    <p className="text-[13px] text-[var(--text-tertiary)]">You already have all the required skills — great work!</p>
                  ) : (
                    <div className="space-y-2">
                      {current.missing.map(m => (
                        <div key={m.name} className="flex items-center gap-2 text-sm">
                          <AlertTriangle size={16} className="text-[var(--warning)] shrink-0" />
                          <span className="text-[var(--text-primary)]">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Per-skill improvement cards */}
              {current.missing.length > 0 && (
                <>
                  <h3 className="text-[15px] font-semibold mb-4">Improvement Plan</h3>
                  <div className="space-y-3 mb-8">
                    {current.missing.map(m => (
                      <Card key={m.name} className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[15px] font-semibold">{m.name}</p>
                            <p className="text-[13px] text-[var(--text-secondary)] mt-1">{m.reason}</p>
                            <Badge className="mt-2">{m.proficiencyNeeded} proficiency needed</Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Timeline */}
              <Card className="p-6">
                <h3 className="text-[15px] font-semibold mb-4">Readiness Timeline</h3>
                <div className="flex items-center gap-0">
                  {['Current Skills', 'Learn Missing Skills', 'Take Verifications', 'Apply'].map((label, i) => (
                    <div key={label} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                          i === 0 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
                        }`}>{i + 1}</div>
                        <span className="text-[11px] text-[var(--text-tertiary)] mt-2 text-center max-w-[90px]">{label}</span>
                      </div>
                      {i < 3 && <div className="w-16 h-0.5 bg-[var(--border-subtle)] mx-1" />}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </PageTransition>
  );
}

