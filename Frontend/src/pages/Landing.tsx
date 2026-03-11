import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, Shield, Brain, BarChart3, Target, Users, CheckCircle, Zap, ArrowRight, ChevronRight, FileCheck, GitBranch, Star, Quote } from 'lucide-react';
import { Button, Card } from '../components/ui';
import PageTransition from '../components/PageTransition';

const stats = [
  { value: '10,000+', label: 'Students Verified', icon: <Users size={20} /> },
  { value: '500+', label: 'Recruiters Active', icon: <Building2 size={20} /> },
  { value: '94%', label: 'Hiring Accuracy', icon: <Target size={20} /> },
  { value: '3.2x', label: 'Faster Placements', icon: <Zap size={20} /> },
];

const features = [
  { icon: <Shield size={24} />, title: 'Skill Verification', desc: 'Validate your technical skills with standardized assessments and earn verified badges that recruiters trust.', color: 'var(--accent)' },
  { icon: <Brain size={24} />, title: 'Smart Matching', desc: 'AI-powered matching connects students with the right opportunities based on verified skills and preferences.', color: 'var(--success)' },
  { icon: <BarChart3 size={24} />, title: 'Skill Gap Insights', desc: 'See exactly what skills you need to develop for your target roles with personalized improvement plans.', color: 'var(--warning)' },
  { icon: <Zap size={24} />, title: 'Readiness Score', desc: 'Get a real-time readiness score that shows how prepared you are for specific positions and roles.', color: 'var(--danger)' },
];

const steps = [
  { num: '01', title: 'Create Your Profile', desc: 'Sign up and tell us about your skills, experience, and career goals.', icon: <FileCheck size={22} /> },
  { num: '02', title: 'Verify Your Skills', desc: 'Take standardized assessments to earn verified skill badges on your profile.', icon: <Shield size={22} /> },
  { num: '03', title: 'Get Matched', desc: 'Our AI matches you with roles that fit your verified skills and preferences.', icon: <GitBranch size={22} /> },
  { num: '04', title: 'Land the Job', desc: 'Apply with confidence backed by verified credentials and recruiter insights.', icon: <Star size={22} /> },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer at Google', quote: 'SkillCred helped me stand out. My verified badges gave recruiters confidence in my abilities before the first interview.', avatar: 'PS' },
  { name: 'Marcus Webb', role: 'Engineering Manager at Stripe', quote: 'We reduced mis-hires by 60% using SkillCred. The verified skill data is a game-changer for our hiring pipeline.', avatar: 'MW' },
  { name: 'Emily Zhang', role: 'Data Scientist at Meta', quote: 'The skill gap analysis showed me exactly what to learn. Within 3 months I was job-ready and matched with my dream role.', avatar: 'EZ' },
];

const faqs = [
  { q: 'How does skill verification work?', a: 'You take a timed, standardized assessment for each skill. Passing earns you a verified badge visible to recruiters. Assessments are designed by industry experts.' },
  { q: 'Is SkillCred free for students?', a: 'Yes! SkillCred is completely free for students. Create your profile, verify skills, and get matched with opportunities at no cost.' },
  { q: 'How are matches calculated?', a: 'Our AI compares your verified skills, preferences, and experience against job requirements to calculate a match percentage and rank opportunities.' },
  { q: 'Can I retake a skill assessment?', a: 'Yes, you can retake assessments after a cooldown period. Your best score is displayed on your profile.' },
];

export default function Landing() {
  const nav = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)]">
        {/* Nav */}
        <header className="h-14 bg-[var(--bg-surface)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] flex items-center px-6 sticky top-0 z-50">
          <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between">
            <h1 className="text-xl font-bold text-[var(--accent)]">SkillCred</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => nav('/auth/login')}>Sign In</Button>
              <Button onClick={() => nav('/auth/signup/student')}>Get Started</Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-subtle)] via-[var(--bg-base)] to-[var(--bg-base)]" />
          <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full bg-[var(--accent)] opacity-[0.03] blur-3xl" />
          <div className="absolute bottom-0 left-[5%] w-[400px] h-[400px] rounded-full bg-[var(--success)] opacity-[0.03] blur-3xl" />

          <div className="relative max-w-[1280px] mx-auto px-8 pt-24 pb-20">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[12px] font-semibold mb-6 border border-[var(--accent)]/10">
                <Zap size={12} /> Trusted by 500+ companies hiring smarter
              </div>
              <h2 className="text-[48px] md:text-[56px] font-bold leading-[1.05] text-[var(--text-primary)] mb-5 tracking-tight">
                Hiring built on <span className="text-[var(--accent)]">skills</span>,<br />not guesswork.
              </h2>
              <p className="text-[18px] text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
                SkillCred connects verified student talent with forward-thinking recruiters through skill-based assessments, smart matching, and transparent hiring pipelines.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 mt-8 mb-16">
              <Button onClick={() => nav('/auth/signup/student')} className="h-11 px-6 text-[14px]">
                Start for Free <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" onClick={() => nav('/auth/signup/recruiter')} className="h-11 px-6 text-[14px]">
                I'm a Recruiter <ChevronRight size={16} />
              </Button>
            </div>

            {/* Dual CTA Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Student CTA */}
              <Card className="p-8 relative overflow-hidden group" hover>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-[0.04] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-[0.08] transition-opacity" />
                <div className="w-14 h-14 mb-5 rounded-[var(--radius-md)] bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                  <GraduationCap size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">For Students</h3>
                <p className="text-[13px] text-[var(--text-secondary)] mb-5">Prove your skills, get discovered, and land your dream role.</p>
                <ul className="text-sm text-[var(--text-secondary)] space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Verify your skills and earn trusted badges</li>
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Get matched with relevant opportunities</li>
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Receive actionable feedback from recruiters</li>
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Track your readiness with skill gap analysis</li>
                </ul>
                <Button onClick={() => nav('/auth/signup/student')} className="w-full">Get Started as Student <ArrowRight size={14} /></Button>
              </Card>

              {/* Recruiter CTA */}
              <Card className="p-8 relative overflow-hidden group" hover>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--success)] opacity-[0.04] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-[0.08] transition-opacity" />
                <div className="w-14 h-14 mb-5 rounded-[var(--radius-md)] bg-[var(--success-subtle)] flex items-center justify-center text-[var(--success)]">
                  <Building2 size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">For Recruiters</h3>
                <p className="text-[13px] text-[var(--text-secondary)] mb-5">Find pre-verified talent and hire with confidence.</p>
                <ul className="text-sm text-[var(--text-secondary)] space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Discover pre-verified, job-ready talent</li>
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Build custom evaluation pipelines</li>
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Compare candidates side-by-side</li>
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Reduce mis-hires with data-driven insights</li>
                </ul>
                <Button onClick={() => nav('/auth/signup/recruiter')} className="w-full">Get Started as Recruiter <ArrowRight size={14} /></Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="max-w-[1280px] mx-auto px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-[var(--radius-sm)] bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center">
                  {s.icon}
                </div>
                <p className="text-[28px] font-bold text-[var(--text-primary)] tracking-tight">{s.value}</p>
                <p className="text-[13px] text-[var(--text-tertiary)] font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-[1280px] mx-auto px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">Platform Features</p>
            <h3 className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight">Everything you need to hire smarter</h3>
            <p className="text-[15px] text-[var(--text-secondary)] mt-3 max-w-xl mx-auto">From verified skill assessments to AI-powered matching, SkillCred gives you the tools to build a better hiring process.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(f => (
              <Card key={f.title} className="p-6 relative overflow-hidden" hover>
                <div className="w-12 h-12 rounded-[var(--radius-sm)] flex items-center justify-center mb-4" style={{ backgroundColor: `color-mix(in srgb, ${f.color} 10%, transparent)`, color: f.color }}>
                  {f.icon}
                </div>
                <h4 className="text-[15px] font-semibold mb-2">{f.title}</h4>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works - Steps */}
        <section className="bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]">
          <div className="max-w-[1280px] mx-auto px-8 py-24">
            <div className="text-center mb-14">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">How It Works</p>
              <h3 className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight">Get started in 4 simple steps</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s, i) => (
                <div key={s.num} className="relative">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-[1px] border-t-2 border-dashed border-[var(--border-default)]" />
                  )}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center">
                      {s.icon}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1 block">Step {s.num}</span>
                    <h4 className="text-[15px] font-semibold mb-2 text-[var(--text-primary)]">{s.title}</h4>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-[220px] mx-auto">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-[1280px] mx-auto px-8 py-24">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">Testimonials</p>
            <h3 className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight">Loved by students and recruiters</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <Card key={t.name} className="p-6" hover>
                <Quote size={20} className="text-[var(--accent)] opacity-40 mb-3" />
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <div className="w-9 h-9 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{t.name}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]">
          <div className="max-w-[720px] mx-auto px-8 py-24">
            <div className="text-center mb-14">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">FAQ</p>
              <h3 className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight">Frequently asked questions</h3>
            </div>
            <div className="space-y-4">
              {faqs.map(f => (
                <div key={f.q} className="border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-5 bg-[var(--bg-elevated)]">
                  <h4 className="text-[14px] font-semibold text-[var(--text-primary)] mb-2">{f.q}</h4>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-[1280px] mx-auto px-8 py-24">
          <Card className="p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-subtle)] to-transparent" />
            <div className="relative">
              <h3 className="text-[28px] font-bold text-[var(--text-primary)] tracking-tight mb-3">Ready to transform your hiring?</h3>
              <p className="text-[15px] text-[var(--text-secondary)] max-w-lg mx-auto mb-8">Join thousands of students and recruiters already using SkillCred to build better careers and teams.</p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => nav('/auth/signup/student')} className="h-11 px-6 text-[14px]">
                  Get Started Free <ArrowRight size={16} />
                </Button>
                <Button variant="secondary" onClick={() => nav('/auth/login')} className="h-11 px-6 text-[14px]">
                  Sign In
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="max-w-[1280px] mx-auto px-8 py-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="text-lg font-bold text-[var(--accent)]">SkillCred</span>
                <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Skill-based hiring for the modern workforce.</p>
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
