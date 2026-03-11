import { useEffect, useState, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('skillcred-theme') as Theme) ?? 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // Add lightwind class for smooth transition
  root.classList.add('lightwind');
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('skillcred-theme', theme);
  // Remove lightwind after transition completes to avoid interfering with other animations
  setTimeout(() => root.classList.remove('lightwind'), 500);
}

export function ToggleTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Initialise on mount without transition
  useEffect(() => {
    const stored = getStoredTheme();
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors cursor-pointer select-none"
    >
      <span className="relative w-5 h-5">
        <Sun
          size={18}
          className="absolute inset-0 m-auto transition-all duration-300"
          style={{
            opacity: isDark ? 0 : 1,
            transform: isDark ? 'rotate(-90deg) scale(0.5)' : 'rotate(0) scale(1)',
          }}
        />
        <Moon
          size={18}
          className="absolute inset-0 m-auto transition-all duration-300"
          style={{
            opacity: isDark ? 1 : 0,
            transform: isDark ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0.5)',
          }}
        />
      </span>
      <span className="text-[13px] font-medium">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
