import { useState, type ReactNode } from 'react';

interface Tab {
  label: string;
  value: string;
}

interface Props {
  tabs: Tab[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  children?: (activeTab: string) => ReactNode;
}

export default function Tabs({ tabs, defaultValue, onChange, children }: Props) {
  const [active, setActive] = useState(defaultValue ?? tabs[0]?.value ?? '');

  const handleClick = (value: string) => {
    setActive(value);
    onChange?.(value);
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-[var(--border-subtle)]">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleClick(tab.value)}
            className={`px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
              active === tab.value
                ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children && <div className="pt-4">{children(active)}</div>}
    </div>
  );
}
