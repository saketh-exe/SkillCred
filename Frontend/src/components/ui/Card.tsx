import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] ${
        hover ? 'transition-all duration-150 hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)] cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
