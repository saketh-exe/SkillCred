import { useState, type ReactNode } from 'react';

interface Props {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-xs font-medium text-white bg-[var(--bg-overlay)] rounded-[var(--radius-sm)] whitespace-nowrap z-50 shadow-[var(--shadow-md)]">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--bg-overlay)]" />
        </div>
      )}
    </div>
  );
}
