import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GraduationCap, Building2, Shield, Brain, BarChart3,
  Users, Zap, ArrowRight, FileCheck, GitBranch,
  CheckCircle, TrendingUp, Award, Code, Target,
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import { Button } from '../components/ui';
import { ToggleTheme } from '../components/ui/toggle-theme';
import PageTransition from '../components/PageTransition';

/* ─── data ─── */
const statsData = [
  { value: 12400, suffix: '+', label: 'Students Verified', sub: 'and growing every day', color: 'var(--accent)' },
  { value: 680, suffix: '+', label: 'Partner Recruiters', sub: 'across 40+ industries', color: 'var(--emerald)' },
  { value: 96, suffix: '%', label: 'Hiring Accuracy', sub: 'vs. 61% industry average', color: 'var(--amber)' },
];

const features = [
  { icon: <Shield size={22} />, title: 'Skill Verification', desc: 'Rigorous assessments that validate real competency — not just résumé claims.', color: '#6366F1' },
  { icon: <Brain size={22} />, title: 'Smart Matching', desc: 'AI-powered scoring between candidate skill depth and role requirements.', color: '#10B981' },
  { icon: <BarChart3 size={22} />, title: 'Gap Insights', desc: 'A precise learning path showing exactly what skills close the gap to your target role.', color: '#F59E0B' },
  { icon: <TrendingUp size={22} />, title: 'Readiness Score', desc: 'One honest number — how prepared you are, calculated from verified data only.', color: '#EC4899' },
];

const steps = [
  { num: '01', icon: <FileCheck size={22} />, title: 'Verify Skills', desc: 'Take structured assessments. Earn verified badges that prove your actual competency.', color: '#6366F1' },
  { num: '02', icon: <GitBranch size={22} />, title: 'Get Matched', desc: 'Our engine ranks you against job requirements using verified data — not self-reported experience.', color: '#10B981' },
  { num: '03', icon: <Award size={22} />, title: 'Get Hired', desc: 'Apply with confidence. Recruiters see your match score and credentials upfront.', color: '#F59E0B' },
];

const skills = [
  'React', 'TypeScript', 'Python', 'Node.js', 'Docker', 'AWS', 'SQL',
  'GraphQL', 'Kubernetes', 'Rust', 'Go', 'Java', 'TensorFlow', 'Redis',
  'PostgreSQL', 'Git', 'REST APIs', 'MongoDB', 'CI/CD', 'System Design',
];

const avatarColors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];
const avatarInitials = ['AP', 'CM', 'YT', 'LK', 'SR'];

/* ─── hooks ─── */
function useCountUp(end: number, active: boolean, duration = 1800) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * end));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, end, duration]);
  return val;
}

function useInView(threshold = 0.2): [React.RefObject<HTMLElement>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── stat counter ─── */
function StatCounter({ value, suffix, label, sub, color }: { value: number; suffix: string; label: string; sub: string; color: string }) {
  const [ref, inView] = useInView(0.3);
  const val = useCountUp(value, inView);
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center py-10 px-8">
      <p className="font-display text-[clamp(40px,5.5vw,64px)] leading-none mb-2" style={{ color }}>
        {val.toLocaleString()}{suffix}
      </p>
      <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">{label}</p>
      <p className="text-[13px] text-[var(--text-tertiary)]">{sub}</p>
    </div>
  );
}

export default function Landing() {
  const nav = useNavigate();
  const [mouse, setMouse] = useState({ x: -500, y: -500 });
  const [featRef, featInView] = useInView(0.1);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] noise" onMouseMove={handleMouse}>
        {/* Cursor glow */}
        <div className="cursor-glow" style={{ left: mouse.x, top: mouse.y }} />

        {/* Page-wide grid + atmospheric glow orbs */}
        <div className="page-bg fixed inset-0 pointer-events-none z-0" />
        <div className="glow-orb glow-orb-accent" />
        <div className="glow-orb glow-orb-green" />

        {/* ── Nav ── */}
        <header className="h-[62px] glass border-b border-[var(--border-subtle)] flex items-center px-[5%] sticky top-0 z-50">
          <div className="flex items-center gap-2 flex-1">
            <Logo size={22} />
            <span className="text-[16px] font-bold tracking-tight text-[var(--text-primary)]">
              Skill<span className="text-[var(--accent)]">Cred</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <ToggleTheme />
            <Button variant="ghost" onClick={() => nav('/auth/login')}>Sign In</Button>
            <Button onClick={() => nav('/auth/signup/student')}>Get Started</Button>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-[5%] pt-[120px] pb-20">
          {/* Spinning ring ornament */}
          <div className="absolute top-[11%] right-[10%] opacity-[0.12] pointer-events-none hidden lg:block"
            style={{ animation: 'spinSlow 30s linear infinite' }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="80" stroke="var(--accent)" strokeWidth="1" fill="none" strokeDasharray="8 6" />
              <circle cx="90" cy="90" r="55" stroke="var(--accent)" strokeWidth=".5" fill="none" strokeDasharray="4 8" />
            </svg>
          </div>

          {/* Floating card — left: Match Score */}
          <div className="animate-float1 absolute left-[3%] top-[34%] z-10 hidden lg:block">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-lg w-[178px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Match Score</p>
              <div className="flex items-center gap-3">
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="17" fill="none" stroke="var(--bg-elevated)" strokeWidth="4" />
                  <circle cx="22" cy="22" r="17" fill="none" stroke="var(--green)" strokeWidth="4"
                    strokeDasharray="107" strokeDashoffset="11" transform="rotate(-90 22 22)" strokeLinecap="round" />
                  <text x="22" y="26" textAnchor="middle" fill="var(--green)" style={{ fontSize: 10, fontWeight: 700, fontFamily: 'DM Sans' }}>94%</text>
                </svg>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">Aisha P.</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">Backend Dev</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating card — right: Badge Earned */}
          <div className="animate-float2 absolute right-[3%] top-[30%] z-10 hidden lg:block" style={{ animationDelay: '1s' }}>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-lg w-[190px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Badge Earned</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl"
                  style={{ background: 'rgba(99,102,241,.12)' }}>🐍</div>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">Python</p>
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--green)' }}>✓ Verified · 92%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating card — bottom-right: New Match */}
          <div className="animate-float1 absolute right-[6%] bottom-[22%] z-10 hidden lg:block" style={{ animationDelay: '2s' }}>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-3.5 shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">New Match</p>
              <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-2">Stripe · Backend Dev</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
                <Target size={10} /> 94% match
              </span>
            </div>
          </div>

          {/* Hero text */}
          <div className="relative z-10 text-center max-w-[840px] w-full animate-fadeUp">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[12px] font-semibold text-[var(--text-secondary)] mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse inline-block" />
              Now in early access — 12,400+ students verified
            </div>

            <h1 className="font-display text-[clamp(44px,7.5vw,88px)] leading-[1.04] text-[var(--text-primary)] tracking-[-2px] mb-7">
              Hiring built on{' '}
              <span className="relative inline-block italic">
                skills
                <svg className="absolute -bottom-1.5 left-0 w-full overflow-visible pointer-events-none" height="10" viewBox="0 0 300 10" preserveAspectRatio="none">
                  <path d="M0 8 C80 0,160 12,300 6" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              , not<br />guesswork.
            </h1>

            <p className="text-[18px] text-[var(--text-secondary)] max-w-[540px] mx-auto leading-[1.75] mb-10">
              The platform that verifies what candidates actually know and matches them to roles with precision — not keyword filters.
            </p>

            <div className="flex gap-3 justify-center flex-wrap mb-14">
              <Button onClick={() => nav('/auth/signup/student')} className="h-12 px-7 text-[15px] shadow-lg shadow-[var(--accent)]/20">
                <Zap size={16} /> Start as Student
              </Button>
              <Button variant="secondary" onClick={() => nav('/auth/signup/recruiter')} className="h-12 px-7 text-[15px]">
                Hire verified talent <ArrowRight size={16} />
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex">
                {avatarInitials.map((init, i) => (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2"
                    style={{
                      background: avatarColors[i] + '22',
                      borderColor: avatarColors[i] + '55',
                      color: avatarColors[i],
                      marginLeft: i > 0 ? -9 : 0,
                      zIndex: 5 - i,
                      position: 'relative',
                    }}>
                    {init}
                  </div>
                ))}
              </div>
              <span className="text-[13px] text-[var(--text-secondary)]">
                Joined by <strong className="text-[var(--text-primary)]">12,400+</strong> students this year
              </span>
            </div>
          </div>
        </section>

        {/* ── Skill Ticker ── */}
        <div className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-3.5 overflow-hidden">
          <div className="ticker-track">
            <div className="ticker-inner">
              {[...skills, ...skills].map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[12px] font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)] opacity-60 inline-block" />{s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Split — For Students / For Recruiters ── */}
        <section className="flex min-h-[560px] border-b border-[var(--border-subtle)]">
          {[
            {
              id: 'student' as const,
              tag: 'For Students', tagColor: '#6366F1', tagBg: 'rgba(99,102,241,.08)',
              icon: <GraduationCap size={26} />,
              headline: 'Prove what you know.\nLand what you deserve.',
              sub: 'Get verified on your actual skills. See your match score before applying. Know exactly what to learn next.',
              cta: 'Start as Student →',
              path: '/auth/signup/student',
              items: ['Skill verification badges', 'Job match scoring', 'Gap analysis per role', 'Readiness roadmap'],
              accentGlow: 'rgba(99,102,241,.06)',
            },
            {
              id: 'recruiter' as const,
              tag: 'For Recruiters', tagColor: '#10B981', tagBg: 'rgba(16,185,129,.08)',
              icon: <Building2 size={26} />,
              headline: 'Hire people who can\nactually do the job.',
              sub: 'Browse verified candidates ranked by skill depth. Build smart evaluation pipelines. Make data-backed decisions.',
              cta: 'Start hiring →',
              path: '/auth/signup/recruiter',
              items: ['Verified talent pool', 'Match score ranking', 'Custom pipelines', 'Candidate comparison'],
              accentGlow: 'rgba(16,185,129,.06)',
            },
          ].map((side, idx) => (
            <div
              key={side.id}
  className="relative flex-1 flex flex-col justify-center px-12 py-16 cursor-pointer overflow-hidden"
              style={{ borderRight: idx === 0 ? '1px solid var(--border-subtle)' : 'none' }}
              onClick={() => nav(side.path)}
            >
              {/* Dot grid */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: .5 }} />
              {/* Accent glow */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle at top right, ${side.accentGlow} 0%, transparent 70%)` }} />

              <div className="relative z-10 max-w-sm">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-5"
                  style={{ background: side.tagBg, color: side.tagColor }}>
                  <span className="text-base">{idx === 0 ? '⚡' : '◈'}</span> {side.tag}
                </div>
                <h2 className="font-display text-[clamp(26px,3vw,40px)] leading-[1.12] tracking-tight mb-4 whitespace-pre-line text-[var(--text-primary)]">
                  {side.headline}
                </h2>
                <p className="text-[14px] text-[var(--text-secondary)] leading-[1.7] mb-7 max-w-xs">{side.sub}</p>
                <ul className="space-y-2.5 mb-8">
                  {side.items.map(it => (
                    <li key={it} className="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
                      <CheckCircle size={14} style={{ color: side.tagColor, flexShrink: 0 }} />{it}
                    </li>
                  ))}
                </ul>
                <button
                  className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                  style={{ background: side.tagColor, boxShadow: `0 4px 16px ${side.tagColor}30` }}>
                  {side.cta}
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* ── Stats ── */}
        <section className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center pt-16 pb-10">
              <p className="text-[11px] font-bold uppercase tracking-[.15em] text-[var(--text-tertiary)] mb-4">By the numbers</p>
              <h2 className="font-display text-[clamp(28px,4.5vw,48px)] tracking-tight leading-[1.1] text-[var(--text-primary)]">
                The platform <em className="italic">actually</em> working
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
              {statsData.map(s => (
                <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} sub={s.sub} color={s.color} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section ref={featRef as React.RefObject<HTMLElement>} className="py-24 px-[5%] bg-[var(--bg-base)]">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.15em] text-[var(--text-tertiary)] mb-4">Why SkillCred</p>
                <h2 className="font-display text-[clamp(28px,3.8vw,46px)] tracking-tight leading-[1.1] text-[var(--text-primary)]">
                  Built for clarity<br />in a noisy market.
                </h2>
              </div>
              <p className="text-[15px] text-[var(--text-secondary)] leading-[1.8]">
                Most hiring platforms optimize for volume. We optimize for precision — building every feature around:{' '}
                <em className="italic text-[var(--text-primary)]">can this person actually do the job?</em>
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-7 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[var(--border-default)]"
                  style={{
                    opacity: featInView ? 1 : 0,
                    transform: featInView ? 'translateY(0)' : 'translateY(24px)',
                    transition: `opacity .6s ${i * 0.1}s, transform .6s ${i * 0.1}s, box-shadow .2s, border-color .2s`,
                  }}
                >
                  <span className="font-display text-[12px] text-[var(--text-tertiary)] absolute top-5 right-5">0{i + 1}</span>
                  <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
                    style={{ background: `radial-gradient(circle at top right, ${f.color}12 0%, transparent 70%)` }} />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: f.color + '18', border: `1px solid ${f.color}28`, color: f.color }}>
                    {f.icon}
                  </div>
                  <h3 className="text-[16px] font-bold mb-2.5 text-[var(--text-primary)]">{f.title}</h3>
                  <p className="text-[14px] text-[var(--text-secondary)] leading-[1.65]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <div className="section-line" />
        <section className="bg-[var(--bg-surface)]/50 py-24 px-[5%]">
          <div className="max-w-[860px] mx-auto">
            <div className="text-center mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[.15em] text-[var(--text-tertiary)] mb-4">How It Works</p>
              <h2 className="font-display text-[clamp(28px,4vw,46px)] tracking-tight text-[var(--text-primary)]">
                Three steps to better hiring
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-0 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-[26px] left-[20%] w-[60%] h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)' }} />
              {steps.map((s, i) => (
                <div key={s.num} className="text-center px-8 group">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10 transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg"
                    style={{ background: s.color + '18', border: `1px solid ${s.color}30`, color: s.color, boxShadow: `0 0 0 0 ${s.color}30` }}>
                    {s.icon}
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: s.color }}>{s.num}</p>
                  <h3 className="text-[16px] font-bold mb-2.5 text-[var(--text-primary)]">{s.title}</h3>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-[1.65]">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="section-line" />

        {/* ── Final CTA ── */}
        <section className="py-24 px-[5%]">
          <div className="max-w-[740px] mx-auto">
            <div className="relative bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-xl)] py-16 px-12 text-center overflow-hidden">
              {/* Dot grid background */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              {/* Center glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,.06) 0%, transparent 70%)' }} />
              <div className="relative z-10">
                <h2 className="font-display text-[clamp(26px,4vw,46px)] tracking-tight leading-[1.1] mb-4 text-[var(--text-primary)]">
                  Stop guessing.<br />
                  <em className="italic text-[var(--accent)]">Start knowing.</em>
                </h2>
                <p className="text-[15px] text-[var(--text-secondary)] mb-10 leading-[1.7] max-w-md mx-auto">
                  Join thousands of students and recruiters building a better hiring experience.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => nav('/auth/signup/student')} className="h-11 px-7 text-[14px] shadow-lg shadow-[var(--accent)]/20">
                    Get started free
                  </Button>
                  <Button variant="secondary" onClick={() => nav('/auth/signup/recruiter')} className="h-11 px-7 text-[14px]">
                    For recruiters →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-[var(--border-subtle)] glass">
          <div className="max-w-[1100px] mx-auto px-[5%] py-9 flex flex-col md:flex-row items-center justify-between gap-5 flex-wrap">
            <div className="flex items-center gap-2">
              <Logo size={18} />
              <span className="text-[15px] font-bold">Skill<span className="text-[var(--accent)]">Cred</span></span>
            </div>
            <div className="flex gap-6 text-[13px] text-[var(--text-secondary)]">
              {['Privacy', 'Terms', 'Blog', 'Careers', 'Contact'].map(l => (
                <span key={l} className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">{l}</span>
              ))}
            </div>
            <span className="text-[12px] text-[var(--text-tertiary)]">© {new Date().getFullYear()} SkillCred, Inc.</span>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
