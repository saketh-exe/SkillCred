import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, ProgressBar, Badge, Button } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { studentService } from '../../services/studentService';
import type { SkillGap } from '../../types';

export default function SkillGapAnalysis() {
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    studentService.getSkillGaps().then(data => {
      setGaps(data);
      if (data.length > 0) setSelectedRole(data[0].targetRole);
    });
  }, []);

  const current = gaps.find(g => g.targetRole === selectedRole);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-[24px] font-bold">Skill Gap Analysis</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Understand what you need to reach your target roles.</p>
      </div>

      {/* Role selector */}
      <div className="mb-6">
        <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Target Role</label>
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          className="h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)]"
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
              <span className="font-[var(--font-mono)] text-2xl font-medium" style={{ color: current.matchPercent >= 75 ? 'var(--success)' : current.matchPercent >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                {current.matchPercent}% Match
              </span>
            </div>
            <ProgressBar value={current.matchPercent} />
          </Card>

          {/* Two-column strengths / missing */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">Strengths</h3>
              <div className="space-y-2">
                {current.strengths.map(s => (
                  <div key={s} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-[var(--success)]" />
                    <span className="text-[var(--text-primary)]">{s}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">Skills to Improve</h3>
              <div className="space-y-2">
                {current.missing.map(m => (
                  <div key={m.name} className="flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} className="text-[var(--warning)]" />
                    <span className="text-[var(--text-primary)]">{m.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Per-skill improvement cards */}
          <h3 className="text-[15px] font-semibold mb-4">Improvement Plan</h3>
          <div className="space-y-3 mb-8">
            {current.missing.map(m => (
              <Card key={m.name} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[15px] font-semibold">{m.name}</p>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">{m.reason}</p>
                    <Badge className="mt-2">{m.proficiencyNeeded} proficiency needed</Badge>
                  </div>
                  <Link to="/student/gap-analysis">
                    <Button variant="secondary" className="text-xs h-8">Learn More</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

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
    </PageTransition>
  );
}
