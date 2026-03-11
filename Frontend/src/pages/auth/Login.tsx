import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4 page-bg noise">
        <div className="w-full max-w-md animate-scaleIn">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] p-8 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)] rounded-full opacity-[0.04] -translate-y-1/2 translate-x-1/2 blur-2xl" />

            <div className="relative text-center mb-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[var(--accent)] flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <h1 className="font-display text-[28px] text-[var(--text-primary)] mb-1">Welcome back</h1>
              <p className="text-[13px] text-[var(--text-secondary)]">Sign in to your SkillCred account</p>
            </div>

            {/* Role toggle */}
            <div className="relative flex mb-6 bg-[var(--bg-elevated)] rounded-xl p-1">
              {(['student', 'recruiter'] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 text-[13px] font-medium rounded-[10px] transition-all duration-200 capitalize cursor-pointer ${
                    role === r ? 'bg-[var(--bg-surface)] shadow-[var(--shadow-md)] text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
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
                  className="w-full h-[42px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] transition-all"
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
                  className="w-full h-[42px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] transition-all"
                  placeholder="Enter your password"
                />
              </div>
              <Button type="submit" className="w-full h-11 text-[14px]" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-[13px] text-[var(--text-tertiary)] mt-6">
              Don&apos;t have an account?{' '}
              <button onClick={() => nav(role === 'student' ? '/auth/signup/student' : '/auth/signup/recruiter')} className="text-[var(--accent)] font-medium hover:underline cursor-pointer">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
