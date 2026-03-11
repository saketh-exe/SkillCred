import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import PageTransition from '../../components/PageTransition';

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Media', 'Consulting'];
const SIZES = ['1-50', '51-200', '201-1000', '1000+'];
const DOMAINS = ['Engineering', 'Data', 'Product', 'Design', 'Marketing', 'Operations'];

export default function RecruiterSignup() {
  const nav = useNavigate();
  const { signupRecruiter } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [companySize, setCompanySize] = useState('51-200');
  const [hiringDomains, setHiringDomains] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const toggleDomain = (d: string) => {
    setHiringDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleComplete = async () => {
    setLoading(true);
    await signupRecruiter({ name, email, avatarUrl: undefined, companyName, industry, companySize, hiringDomains, companyDescription: description });
    setLoading(false);
    nav('/recruiter/dashboard');
  };

  const inputClass = 'w-full h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] transition-all';

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4 py-12" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border-subtle) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[var(--accent)] mb-1">SkillCred</h1>
            <p className="text-sm text-[var(--text-secondary)]">Create your recruiter account</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold ${
                  step >= s ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
                }`}>{s}</div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[var(--accent)]' : 'bg-[var(--border-subtle)]'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Sarah Chen" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Work Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="sarah@company.com" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="Create a password" />
              </div>
              <Button onClick={() => setStep(2)} className="w-full mt-2">Continue</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Organization Profile</h2>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Company Name</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} placeholder="TechCorp" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Industry</label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} className={inputClass}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Company Size</label>
                <select value={companySize} onChange={e => setCompanySize(e.target.value)} className={inputClass}>
                  {SIZES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">Hiring Domains</label>
                <div className="flex flex-wrap gap-2">
                  {DOMAINS.map(d => (
                    <button
                      key={d}
                      onClick={() => toggleDomain(d)}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        hiringDomains.includes(d)
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent-text)] font-medium'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Company Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full h-24 px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] transition-all resize-none"
                  placeholder="Tell us about your company..."
                />
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1">Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-[var(--success-subtle)] flex items-center justify-center">
                <span className="text-[var(--success)] text-2xl">✓</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Your recruiter account is ready!</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Welcome to SkillCred, {name || 'there'}. Start by posting your first job to attract verified candidates.
                </p>
              </div>
              <Button onClick={handleComplete} className="w-full" disabled={loading}>
                {loading ? 'Setting up...' : 'Post your first job →'}
              </Button>
            </div>
          )}

          <p className="text-center text-[13px] text-[var(--text-tertiary)] mt-6">
            Already have an account?{' '}
            <button onClick={() => nav('/auth/login')} className="text-[var(--accent)] font-medium hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
