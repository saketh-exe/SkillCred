import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'neutral' | 'pink' | 'emerald';

interface Props {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]',
  success: 'bg-[var(--green-bg)] border-[var(--green)]/20 text-[var(--green)]',
  warning: 'bg-[var(--amber-bg)] border-[var(--amber)]/20 text-[var(--amber)]',
  danger: 'bg-[var(--red-bg)] border-[var(--red)]/20 text-[var(--red)]',
  accent: 'bg-[var(--accent-subtle)] border-[var(--accent)]/20 text-[var(--accent-text)] font-mono',
  neutral: 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-tertiary)]',
  pink: 'bg-[var(--pink-bg)] border-[var(--pink)]/20 text-[var(--pink)]',
  emerald: 'bg-[var(--emerald-bg)] border-[var(--emerald)]/20 text-[var(--emerald)]',
};

export default function Badge({ variant = 'default', children, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full border font-medium tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
