import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import Logo from './ui/Logo';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function DashboardNav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('skillcred-theme', dark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('skillcred-theme-change', { detail: dark ? 'dark' : 'light' }));
  }, [dark]);

  // Sync when another component (e.g. Profile ToggleTheme) changes the theme
  useEffect(() => {
    const onThemeChange = (e: Event) => {
      const t = (e as CustomEvent<string>).detail;
      setDark(prev => {
        const newVal = t === 'dark';
        return prev !== newVal ? newVal : prev;
      });
    };
    window.addEventListener('skillcred-theme-change', onThemeChange);
    return () => window.removeEventListener('skillcred-theme-change', onThemeChange);
  }, []);

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <>
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
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

    </header>
      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-6" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] p-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Log out?</h2>
            <p className="text-sm text-[var(--text-secondary)]">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)] text-[var(--text-primary)] rounded-[var(--radius-md)] font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-[var(--danger)] hover:opacity-90 text-white rounded-[var(--radius-md)] font-semibold transition cursor-pointer"
              >
                Log out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
