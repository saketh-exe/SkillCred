import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'neutral';

interface Props {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]',
  success: 'bg-[var(--success-subtle)] border-[#BBF7D0] text-[var(--success)]',
  warning: 'bg-[var(--warning-subtle)] border-[#FDE68A] text-[var(--warning)]',
  danger: 'bg-[var(--danger-subtle)] border-[#FECACA] text-[var(--danger)]',
  accent: 'bg-[var(--accent-subtle)] border-[#BFDBFE] text-[var(--accent-text)] font-[var(--font-mono)]',
  neutral: 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-tertiary)]',
};

export default function Badge({ variant = 'default', children, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
