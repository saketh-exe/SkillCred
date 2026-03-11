import { useEffect, useState } from 'react';
import { Card, Badge, Avatar, Button, ProgressBar } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { recruiterService } from '../../services/recruiterService';
import type { Candidate } from '../../types';

export default function Compare() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => { recruiterService.getCandidates().then(setCandidates); }, []);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const compared = candidates.filter(c => selected.includes(c.id));

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-display text-[32px] tracking-tight">Compare Candidates</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Side-by-side comparison of up to 4 candidates.</p>
      </div>

      {/* Candidate selector */}
      <Card className="p-4 mb-6">
        <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-2">Select candidates to compare ({selected.length}/4)</p>
        <div className="flex flex-wrap gap-2">
          {candidates.map(c => (
            <button key={c.id} onClick={() => toggle(c.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                selected.includes(c.id) 
                  ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent-text)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}>
              <Avatar name={c.name} size={22} />
              {c.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Comparison table */}
      {compared.length >= 2 ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-[var(--bg-elevated)]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] w-40">Attribute</th>
                {compared.map(c => (
                  <th key={c.id} className="text-center px-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <Avatar name={c.name} size={36} />
                      <span className="text-sm font-semibold">{c.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="Match %">
                {compared.map(c => (
                  <td key={c.id} className="px-4 py-3 text-center">
                    <span className="font-[var(--font-mono)] text-lg font-medium" style={{ color: c.matchPercent >= 75 ? 'var(--success)' : c.matchPercent >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                      {c.matchPercent}%
                    </span>
                  </td>
                ))}
              </Row>
              <Row label="Readiness">
                {compared.map(c => (
                  <td key={c.id} className="px-4 py-3">
                    <ProgressBar value={c.readinessScore} />
                    <span className="text-[11px] font-[var(--font-mono)] text-[var(--text-tertiary)]">{c.readinessScore}%</span>
                  </td>
                ))}
              </Row>
              <Row label="University">
                {compared.map(c => <td key={c.id} className="px-4 py-3 text-center text-sm">{c.university}</td>)}
              </Row>
              <Row label="Verified Skills">
                {compared.map(c => (
                  <td key={c.id} className="px-4 py-3 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {c.verifiedSkills.map(s => <Badge key={s} variant="success">{s}</Badge>)}
                    </div>
                  </td>
                ))}
              </Row>
              <Row label="GitHub">
                {compared.map(c => (
                  <td key={c.id} className="px-4 py-3 text-center">
                    {c.hasGitHub ? (
                      <div className="text-sm">
                        <span className="font-[var(--font-mono)] text-[var(--success)]">{c.githubStats?.contributions || 0}</span>
                        <span className="text-[var(--text-tertiary)]"> contribs</span>
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--text-tertiary)]">—</span>
                    )}
                  </td>
                ))}
              </Row>
              <Row label="Assessments">
                {compared.map(c => (
                  <td key={c.id} className="px-4 py-3 text-center">
                    {c.assessmentScores?.map(a => (
                      <div key={a.skill} className="text-xs mb-1">
                        {a.skill}: <span className="font-[var(--font-mono)] font-medium">{a.score}%</span>
                      </div>
                    )) ?? <span className="text-sm text-[var(--text-tertiary)]">—</span>}
                  </td>
                ))}
              </Row>
              <Row label="Actions">
                {compared.map(c => (
                  <td key={c.id} className="px-4 py-3 text-center"><Button className="text-xs h-8">Shortlist</Button></td>
                ))}
              </Row>
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-10 text-center">
          <p className="text-[var(--text-tertiary)]">Select at least 2 candidates above to compare.</p>
        </Card>
      )}
    </PageTransition>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-[var(--border-subtle)]">
      <td className="px-4 py-3 text-[13px] font-medium text-[var(--text-secondary)] whitespace-nowrap">{label}</td>
      {children}
    </tr>
  );
}
