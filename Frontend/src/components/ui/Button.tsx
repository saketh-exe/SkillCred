import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const base = 'inline-flex items-center justify-center gap-2 font-[var(--font-heading)] text-[13px] font-semibold h-9 px-4 rounded-[var(--radius-sm)] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
  secondary: 'bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90',
};

export default function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
