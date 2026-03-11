import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import Logo from './ui/Logo';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';
import { useEffect, useState } from 'react';

export default function DashboardNav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('skillcred-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <header className="h-14 glass border-b border-[var(--border-subtle)] flex items-center px-6 flex-shrink-0 sticky top-0 z-40">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span className="text-lg font-bold text-[var(--text-primary)]">Skill<span className="text-[var(--accent)]">Cred</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)] transition-all cursor-pointer"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="w-px h-5 bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-2">
            <Avatar name={user?.name ?? ''} size={30} />
            <span className="text-[13px] font-medium text-[var(--text-primary)] hidden sm:inline">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
