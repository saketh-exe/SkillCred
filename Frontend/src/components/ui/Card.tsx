import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  lift?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, lift = false, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] ${
        hover ? 'transition-all duration-200 hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)] cursor-pointer' : ''
      } ${
        lift ? 'transition-all duration-200 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 hover:border-[var(--border-default)] cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
