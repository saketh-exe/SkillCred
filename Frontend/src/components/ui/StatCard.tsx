import type { ReactNode } from 'react';
import Card from './Card';

interface Props {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: { delta: string; up: boolean };
  className?: string;
}

export default function StatCard({ icon, value, label, trend, className = '' }: Props) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-[var(--font-mono)] text-2xl font-medium text-[var(--text-primary)]">{value}</p>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">{label}</p>
        </div>
        <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]">
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-3 text-xs font-medium flex items-center gap-1 ${trend.up ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          <span>{trend.up ? '↑' : '↓'}</span>
          <span>{trend.delta}</span>
        </div>
      )}
    </Card>
  );
}
