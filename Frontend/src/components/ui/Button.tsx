import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const base = 'inline-flex items-center justify-center gap-2 text-[13px] font-semibold h-9 px-4 rounded-[var(--radius-sm)] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:shadow-md hover:shadow-[var(--accent)]/15',
  secondary: 'bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90 hover:shadow-md hover:shadow-[var(--danger)]/15',
  outline: 'bg-transparent border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent)]/50',
};

export default function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
