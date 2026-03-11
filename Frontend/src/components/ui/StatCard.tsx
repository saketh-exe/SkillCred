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
    <Card className={`p-5 group hover:shadow-[var(--shadow-md)] transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[26px] font-medium text-[var(--text-primary)] tracking-tight">{value}</p>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">{label}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-3 text-[11px] font-medium flex items-center gap-1 ${trend.up ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
          <span>{trend.up ? '↑' : '↓'}</span>
          <span>{trend.delta}</span>
        </div>
      )}
    </Card>
  );
}
