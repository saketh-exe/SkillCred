import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import type { Role } from '../../types';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password, role);
    setLoading(false);
    nav(role === 'student' ? '/student/dashboard' : '/recruiter/dashboard');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border-subtle) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-[var(--accent)] mb-1">SkillCred</h1>
            <p className="text-sm text-[var(--text-secondary)]">Sign in to your account</p>
          </div>

          {/* Role toggle */}
          <div className="flex mb-6 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] p-1">
            {(['student', 'recruiter'] as Role[]).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-[13px] font-medium rounded-[var(--radius-sm)] transition-all capitalize ${
                  role === r ? 'bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] transition-all"
                placeholder={role === 'student' ? 'alex@university.edu' : 'sarah@company.com'}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] transition-all"
                placeholder="Enter your password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-[13px] text-[var(--text-tertiary)] mt-6">
            Don&apos;t have an account?{' '}
            <button onClick={() => nav(role === 'student' ? '/auth/signup/student' : '/auth/signup/recruiter')} className="text-[var(--accent)] font-medium hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
