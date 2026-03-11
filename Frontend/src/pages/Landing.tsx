import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GraduationCap, Building2, Shield, Brain, BarChart3, Target,
  Users, Zap, ArrowRight, ChevronRight, FileCheck, GitBranch,
  Star, CheckCircle, Sparkles, TrendingUp, Award, Code,
} from 'lucide-react';
import { Button } from '../components/ui';
import PageTransition from '../components/PageTransition';

/* ─── data ─── */
const stats = [
  { value: 10000, suffix: '+', label: 'Students Verified', icon: <Users size={20} /> },
  { value: 500, suffix: '+', label: 'Recruiters Active', icon: <Building2 size={20} /> },
  { value: 94, suffix: '%', label: 'Hiring Accuracy', icon: <Target size={20} /> },
  { value: 3.2, suffix: 'x', label: 'Faster Placements', icon: <Zap size={20} /> },
];

const features = [
  { icon: <Shield size={22} />, title: 'Skill Verification', desc: 'Validate technical skills with standardized assessments and earn verified badges recruiters trust.', color: 'var(--accent)' },
  { icon: <Brain size={22} />, title: 'Smart Matching', desc: 'AI-powered matching connects students with the right opportunities based on verified skills.', color: 'var(--green)' },
  { icon: <BarChart3 size={22} />, title: 'Skill Gap Insights', desc: 'See exactly what skills you need for your target roles with personalized improvement plans.', color: 'var(--amber)' },
  { icon: <TrendingUp size={22} />, title: 'Readiness Score', desc: 'Get a real-time readiness score showing how prepared you are for specific positions.', color: 'var(--pink)' },
];

const steps = [
  { num: '01', title: 'Create Your Profile', desc: 'Sign up and upload your resume or connect GitHub to get started.', icon: <FileCheck size={20} /> },
  { num: '02', title: 'Verify Skills', desc: 'Take standardized assessments to earn verified badges on your profile.', icon: <Shield size={20} /> },
  { num: '03', title: 'Get Matched', desc: 'Our AI matches you with roles that fit your verified skills and goals.', icon: <GitBranch size={20} /> },
  { num: '04', title: 'Land the Job', desc: 'Apply with confidence backed by verified credentials and data.', icon: <Star size={20} /> },
];

const skills = [
  'React', 'TypeScript', 'Python', 'Node.js', 'Docker', 'AWS', 'SQL',
  'GraphQL', 'Kubernetes', 'Rust', 'Go', 'Java', 'TensorFlow', 'Redis',
  'PostgreSQL', 'Git', 'REST APIs', 'MongoDB', 'CI/CD', 'System Design',
];

/* ─── counter hook ─── */
function useCountUp(end: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setVal(Number((ease * end).toFixed(end % 1 !== 0 ? 1 : 0)));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return { val, ref };
}

function StatCounter({ value, suffix, label, icon }: { value: number; suffix: string; label: string; icon: React.ReactNode }) {
  const { val, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center">
        {icon}
      </div>
      <p className="font-display text-[36px] text-[var(--text-primary)] tracking-tight leading-none">
        {val}{suffix}
      </p>
      <p className="text-[13px] text-[var(--text-tertiary)] mt-1 font-medium">{label}</p>
    </div>
  );
}

export default function Landing() {
  const nav = useNavigate();
  const [mouse, setMouse] = useState({ x: -500, y: -500 });
  const [hoveredCta, setHoveredCta] = useState<'student' | 'recruiter' | null>(null);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] noise" onMouseMove={handleMouse}>
        {/* Cursor glow */}
        <div className="cursor-glow" style={{ left: mouse.x, top: mouse.y }} />

        {/* ── Nav ── */}
        <header className="h-14 glass border-b border-[var(--border-subtle)] flex items-center px-6 sticky top-0 z-50">
          <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">Skill<span className="text-[var(--accent)]">Cred</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => nav('/auth/login')}>Sign In</Button>
              <Button onClick={() => nav('/auth/signup/student')}>Get Started</Button>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* Grid + glow orbs */}
          <div className="page-bg absolute inset-0" />
          <div className="glow-orb glow-orb-accent" />
          <div className="glow-orb glow-orb-green" />

          <div className="relative max-w-[1200px] mx-auto px-8 pt-28 pb-16 z-10">
            <div className="text-center mb-8 animate-fadeUp">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[12px] font-semibold mb-8 border border-[var(--accent)]/15">
                <Sparkles size={12} /> Trusted by 500+ companies hiring smarter
              </div>
              <h2 className="font-display text-[52px] md:text-[68px] leading-[1.02] text-[var(--text-primary)] mb-6 tracking-tight">
                Hiring built on{' '}
                <span className="relative inline-block">
                  <span className="text-[var(--accent)]">verified skills</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M2 6C50 2 150 2 198 6" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                  </svg>
                </span>
                ,<br />not guesswork.
              </h2>
              <p className="text-[17px] text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
                SkillCred connects verified student talent with forward-thinking recruiters through skill-based assessments, smart matching, and transparent hiring pipelines.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 mt-10 mb-20 animate-fadeUp" style={{ animationDelay: '0.15s' }}>
              <Button onClick={() => nav('/auth/signup/student')} className="h-11 px-7 text-[14px] shadow-lg shadow-[var(--accent)]/20">
                Start for Free <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" onClick={() => nav('/auth/signup/recruiter')} className="h-11 px-7 text-[14px]">
                I'm a Recruiter <ChevronRight size={16} />
              </Button>
            </div>

            {/* Floating cards */}
            <div className="relative max-w-4xl mx-auto h-[220px] hidden md:block">
              {/* Card 1 — Skill badge */}
              <div className="absolute left-[5%] top-4 animate-float1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-lg w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={16} className="text-[var(--green)]" />
                  <span className="text-[13px] font-semibold">React Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 flex-1 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div className="h-full w-[92%] rounded-full bg-[var(--green)]" />
                  </div>
                  <span className="text-[11px] font-mono text-[var(--green)]">92%</span>
                </div>
              </div>

              {/* Card 2 — Match score */}
              <div className="absolute right-[5%] top-2 animate-float2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-lg w-[210px]" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-[var(--accent)]" />
                  <span className="text-[13px] font-semibold">Job Match</span>
                </div>
                <div className="text-center">
                  <span className="font-display text-[32px] text-[var(--accent)]">87%</span>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Backend Developer at Stripe</p>
                </div>
              </div>

              {/* Card 3 — Code snippet */}
              <div className="absolute left-[30%] top-[60px] animate-float1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-lg w-[240px]" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Code size={14} className="text-[var(--pink)]" />
                  <span className="text-[12px] font-semibold text-[var(--text-secondary)]">GitHub Analysis</span>
                </div>
                <div className="font-mono text-[11px] text-[var(--text-tertiary)] space-y-1">
                  <div><span className="text-[var(--green)]">156</span> contributions</div>
                  <div><span className="text-[var(--accent)]">12</span> repositories</div>
                  <div><span className="text-[var(--amber)]">A+</span> code quality</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Skill Ticker ── */}
        <div className="section-line" />
        <section className="py-6 overflow-hidden">
          <div className="ticker-track">
            <div className="ticker-inner">
              {[...skills, ...skills].map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[13px] font-medium text-[var(--text-secondary)] whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>
        <div className="section-line" />

        {/* ── Split CTA ── */}
        <section className="max-w-[1200px] mx-auto px-8 py-24">
          <div className="text-center mb-14 animate-fadeUp">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">Choose Your Path</p>
            <h3 className="font-display text-[40px] text-[var(--text-primary)] tracking-tight">Built for both sides of the table.</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Student */}
            <div
              onClick={() => nav('/auth/signup/student')}
              onMouseEnter={() => setHoveredCta('student')}
              onMouseLeave={() => setHoveredCta(null)}
              className={`relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8 cursor-pointer transition-all duration-300 overflow-hidden group ${
                hoveredCta === 'student' ? 'shadow-xl border-[var(--accent)]/30 scale-[1.01]' : hoveredCta === 'recruiter' ? 'opacity-60 scale-[0.99]' : 'shadow-md hover:shadow-lg'
              }`}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)] opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-[0.08] group-hover:scale-125 transition-all duration-500" />
              <div className="w-14 h-14 mb-5 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                <GraduationCap size={28} />
              </div>
              <h3 className="font-display text-[28px] mb-2">For Students</h3>
              <p className="text-[14px] text-[var(--text-secondary)] mb-6 leading-relaxed">Prove your skills, get discovered, and land your dream role.</p>
              <ul className="text-[13px] text-[var(--text-secondary)] space-y-3 mb-8">
                <li className="flex items-start gap-2.5"><CheckCircle size={16} className="text-[var(--green)] mt-0.5 flex-shrink-0" /> Verify your skills and earn trusted badges</li>
                <li className="flex items-start gap-2.5"><CheckCircle size={16} className="text-[var(--green)] mt-0.5 flex-shrink-0" /> Get matched with relevant opportunities</li>
                <li className="flex items-start gap-2.5"><CheckCircle size={16} className="text-[var(--green)] mt-0.5 flex-shrink-0" /> Receive actionable feedback from recruiters</li>
                <li className="flex items-start gap-2.5"><CheckCircle size={16} className="text-[var(--green)] mt-0.5 flex-shrink-0" /> Track readiness with skill gap analysis</li>
              </ul>
              <Button className="w-full h-11 text-[14px]">Get Started as Student <ArrowRight size={14} /></Button>
            </div>

            {/* Recruiter */}
            <div
              onClick={() => nav('/auth/signup/recruiter')}
              onMouseEnter={() => setHoveredCta('recruiter')}
              onMouseLeave={() => setHoveredCta(null)}
              className={`relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8 cursor-pointer transition-all duration-300 overflow-hidden group ${
                hoveredCta === 'recruiter' ? 'shadow-xl border-[var(--green)]/30 scale-[1.01]' : hoveredCta === 'student' ? 'opacity-60 scale-[0.99]' : 'shadow-md hover:shadow-lg'
              }`}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--green)] opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-[0.08] group-hover:scale-125 transition-all duration-500" />
              <div className="w-14 h-14 mb-5 rounded-2xl bg-[var(--green-bg)] flex items-center justify-center text-[var(--green)]">
                <Building2 size={28} />
              </div>
              <h3 className="font-display text-[28px] mb-2">For Recruiters</h3>
              <p className="text-[14px] text-[var(--text-secondary)] mb-6 leading-relaxed">Find pre-verified talent and hire with confidence.</p>
              <ul className="text-[13px] text-[var(--text-secondary)] space-y-3 mb-8">
                <li className="flex items-start gap-2.5"><CheckCircle size={16} className="text-[var(--green)] mt-0.5 flex-shrink-0" /> Discover pre-verified, job-ready talent</li>
                <li className="flex items-start gap-2.5"><CheckCircle size={16} className="text-[var(--green)] mt-0.5 flex-shrink-0" /> Build custom evaluation pipelines</li>
                <li className="flex items-start gap-2.5"><CheckCircle size={16} className="text-[var(--green)] mt-0.5 flex-shrink-0" /> Compare candidates side-by-side</li>
                <li className="flex items-start gap-2.5"><CheckCircle size={16} className="text-[var(--green)] mt-0.5 flex-shrink-0" /> Reduce mis-hires with data-driven insights</li>
              </ul>
              <Button className="w-full h-11 text-[14px] bg-[var(--green)] hover:bg-[var(--emerald)]">Get Started as Recruiter <ArrowRight size={14} /></Button>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <div className="section-line" />
        <section className="bg-[var(--bg-surface)]/60 glass border-y border-[var(--border-subtle)]">
          <div className="max-w-[1200px] mx-auto px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} icon={s.icon} />
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-[1200px] mx-auto px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">Platform Features</p>
            <h3 className="font-display text-[40px] text-[var(--text-primary)] tracking-tight">Everything you need to hire smarter</h3>
            <p className="text-[15px] text-[var(--text-secondary)] mt-3 max-w-xl mx-auto">From verified assessments to AI matching, SkillCred gives you tools to build a better hiring process.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
            {features.map(f => (
              <div
                key={f.title}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 transition-all duration-200 hover:shadow-lg hover:border-[var(--border-default)] hover:-translate-y-1 group"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: `color-mix(in srgb, ${f.color} 12%, transparent)`, color: f.color }}>
                  {f.icon}
                </div>
                <h4 className="text-[15px] font-semibold mb-2">{f.title}</h4>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <div className="section-line" />
        <section className="bg-[var(--bg-surface)]/40">
          <div className="max-w-[1200px] mx-auto px-8 py-24">
            <div className="text-center mb-14">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-3">How It Works</p>
              <h3 className="font-display text-[40px] text-[var(--text-primary)] tracking-tight">Get started in 4 simple steps</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
              {steps.map((s, i) => (
                <div key={s.num} className="relative text-center group">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-[calc(50%+36px)] w-[calc(100%-72px)] h-[2px] border-t-2 border-dashed border-[var(--border-default)]" />
                  )}
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center transition-all duration-200 group-hover:bg-[var(--accent)] group-hover:text-white group-hover:shadow-lg group-hover:shadow-[var(--accent)]/20">
                    {s.icon}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1 block font-mono">Step {s.num}</span>
                  <h4 className="text-[15px] font-semibold mb-2">{s.title}</h4>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-[200px] mx-auto">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="section-line" />

        {/* ── Final CTA ── */}
        <section className="max-w-[1200px] mx-auto px-8 py-24">
          <div className="relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-subtle)] via-transparent to-[var(--green-bg)] opacity-60" />
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--accent)] rounded-full opacity-[0.04] -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative">
              <h3 className="font-display text-[36px] text-[var(--text-primary)] tracking-tight mb-3">Ready to transform your hiring?</h3>
              <p className="text-[15px] text-[var(--text-secondary)] max-w-lg mx-auto mb-8">Join thousands of students and recruiters already using SkillCred to build better careers and teams.</p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => nav('/auth/signup/student')} className="h-11 px-7 text-[14px] shadow-lg shadow-[var(--accent)]/20">
                  Get Started Free <ArrowRight size={16} />
                </Button>
                <Button variant="secondary" onClick={() => nav('/auth/login')} className="h-11 px-7 text-[14px]">
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 glass">
          <div className="max-w-[1200px] mx-auto px-8 py-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center">
                  <Sparkles size={12} className="text-white" />
                </div>
                <span className="text-lg font-bold">Skill<span className="text-[var(--accent)]">Cred</span></span>
              </div>
              <div className="flex gap-8 text-[13px] text-[var(--text-secondary)]">
                <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">About</span>
                <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">Privacy</span>
                <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">Terms</span>
                <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">Contact</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] text-[12px] text-[var(--text-tertiary)]">
              &copy; {new Date().getFullYear()} SkillCred. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
