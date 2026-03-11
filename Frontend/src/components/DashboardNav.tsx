import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';

export default function DashboardNav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <header className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center px-6 flex-shrink-0 sticky top-0 z-40">
      <div className="w-full flex items-center justify-between">
        <span className="text-lg font-bold text-[var(--accent)]">SkillCred</span>
        <div className="flex items-center gap-3">
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
