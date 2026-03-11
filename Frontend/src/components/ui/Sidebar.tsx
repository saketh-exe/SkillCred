import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

interface Props {
  items: NavItem[];
  header?: ReactNode;
}

export default function Sidebar({ items, header }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-14 h-[calc(100vh-56px)] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-[220px]'
      }`}
    >
      {header && !collapsed && <div className="p-4 border-b border-[var(--border-subtle)]">{header}</div>}
      <nav className="flex-1 py-2 overflow-y-auto">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.endsWith('dashboard')}
            className={({ isActive }) =>
              `flex items-center gap-3 h-9 mx-2 px-3 rounded-[var(--radius-sm)] text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border-l-2 border-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-center h-10 border-t border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
