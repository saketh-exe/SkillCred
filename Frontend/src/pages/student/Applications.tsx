import { useEffect, useState } from 'react';
import { Card, Badge, Tabs, Modal, Button } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { studentService } from '../../services/studentService';
import type { Application, ApplicationStatus } from '../../types';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'All' },
  { label: 'Pending Review', value: 'Pending Review' },
  { label: 'In Pipeline', value: 'In Pipeline' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Hired', value: 'Hired' },
];

const statusVariant = (s: ApplicationStatus) => {
  switch (s) {
    case 'Hired': return 'success' as const;
    case 'Rejected': return 'danger' as const;
    case 'In Pipeline': return 'accent' as const;
    default: return 'default' as const;
  }
};

export default function Applications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState('All');
  const [detail, setDetail] = useState<Application | null>(null);

  useEffect(() => { studentService.getApplications().then(setApps); }, []);

  const filtered = filter === 'All' ? apps : apps.filter(a => a.status === filter);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-[24px] font-bold">Applications</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Track your job applications and pipeline progress.</p>
      </div>

      <Tabs tabs={STATUS_TABS} defaultValue="All" onChange={setFilter}>
        {() => (
          <div className="space-y-3 mt-4">
            {filtered.length === 0 && (
              <Card className="p-10 text-center">
                <p className="text-[var(--text-tertiary)]">No applications found.</p>
              </Card>
            )}
            {filtered.map(app => (
              <Card key={app.id} className="p-5" hover onClick={() => setDetail(app)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[15px] font-semibold">{app.role}</p>
                    <p className="text-[13px] text-[var(--text-secondary)]">{app.company}</p>
                  </div>
                  <Badge variant={statusVariant(app.status)}>
                    {app.status}{app.status === 'In Pipeline' && app.pipelineStage != null ? ` — Stage ${app.pipelineStage} of ${app.pipelineTotal}` : ''}
                  </Badge>
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)] mb-3">Applied {new Date(app.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                {app.stages && (
                  <div className="flex items-center gap-0">
                    {app.stages.map((stage, i) => (
                      <div key={i} className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                          stage.completed ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
                        }`}>{i + 1}</div>
                        {i < app.stages!.length - 1 && (
                          <div className={`w-8 h-0.5 ${stage.completed ? 'bg-[var(--accent)]' : 'bg-[var(--border-subtle)]'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Tabs>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.role} at ${detail.company}` : ''} size="lg">
        {detail && (
          <div>
            <Badge variant={statusVariant(detail.status)} className="mb-4">{detail.status}</Badge>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Applied {new Date(detail.appliedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Pipeline</h3>
            <div className="space-y-3 mb-6">
              {detail.stages?.map((stage, i) => (
                <div key={i} className={`p-4 rounded-[var(--radius-sm)] border ${stage.completed ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border-subtle)]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stage.name}</span>
                    {stage.score != null && <span className="font-[var(--font-mono)] text-sm">{stage.score}%</span>}
                  </div>
                  {stage.feedback && <p className="text-xs text-[var(--text-secondary)] mt-1 bg-[var(--bg-elevated)] p-2 rounded mt-2">{stage.feedback}</p>}
                </div>
              ))}
            </div>
            <Button onClick={() => setDetail(null)}>Close</Button>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
