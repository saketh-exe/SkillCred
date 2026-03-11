import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, Shield, Brain, BarChart3, Target, Users, CheckCircle, Zap } from 'lucide-react';
import { Button, Card } from '../components/ui';
import PageTransition from '../components/PageTransition';

const stats = [
  { label: '10,000+ students verified', icon: <Users size={18} /> },
  { label: '500+ recruiters', icon: <Building2 size={18} /> },
  { label: '94% hiring accuracy', icon: <Target size={18} /> },
];

const features = [
  { icon: <Shield size={24} />, title: 'Skill Verification', desc: 'Validate your technical skills with standardized assessments and earn verified badges.' },
  { icon: <Brain size={24} />, title: 'Smart Matching', desc: 'AI-powered matching connects students with the right opportunities based on verified skills.' },
  { icon: <BarChart3 size={24} />, title: 'Skill Gap Insights', desc: 'Understand exactly what skills you need to develop for your target roles.' },
  { icon: <Zap size={24} />, title: 'Readiness Score', desc: 'Get a real-time readiness score that shows how prepared you are for specific positions.' },
];

export default function Landing() {
  const nav = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)]">
        {/* Nav */}
        <header className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center px-6">
          <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between">
            <h1 className="text-xl font-bold text-[var(--accent)]">SkillCred</h1>
            <Button variant="ghost" onClick={() => nav('/auth/login')}>Sign In</Button>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-[1280px] mx-auto px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-[38px] font-bold leading-[1.1] text-[var(--text-primary)] mb-4">
              Hiring built on skills, not guesswork.
            </h2>
            <p className="text-[17px] text-[var(--text-secondary)] max-w-2xl mx-auto">
              SkillCred connects verified student talent with forward-thinking recruiters through skill-based assessments, smart matching, and transparent pipelines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Student CTA */}
            <Card className="p-8 text-center" hover>
              <div className="w-14 h-14 mx-auto mb-5 rounded-[var(--radius-md)] bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                <GraduationCap size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">For Students</h3>
              <ul className="text-sm text-[var(--text-secondary)] space-y-2 mb-6 text-left">
                <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Verify your skills and earn badges</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Get matched with relevant opportunities</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Receive actionable feedback from recruiters</li>
              </ul>
              <Button onClick={() => nav('/auth/signup/student')} className="w-full">Get Started as Student</Button>
            </Card>

            {/* Recruiter CTA */}
            <Card className="p-8 text-center" hover>
              <div className="w-14 h-14 mx-auto mb-5 rounded-[var(--radius-md)] bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                <Building2 size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">For Recruiters</h3>
              <ul className="text-sm text-[var(--text-secondary)] space-y-2 mb-6 text-left">
                <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Discover pre-verified talent</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Build custom evaluation pipelines</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="text-[var(--success)] mt-0.5 flex-shrink-0" /> Compare candidates side-by-side</li>
              </ul>
              <Button onClick={() => nav('/auth/signup/recruiter')} className="w-full">Get Started as Recruiter</Button>
            </Card>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="max-w-[1280px] mx-auto px-8 py-6 flex flex-wrap justify-center gap-12">
            {stats.map(s => (
              <div key={s.label} className="flex items-center gap-3 text-[var(--text-secondary)]">
                <span className="text-[var(--accent)]">{s.icon}</span>
                <span className="text-sm font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-[1280px] mx-auto px-8 py-20">
          <h3 className="text-2xl font-bold text-center mb-12 text-[var(--text-primary)]">How SkillCred Works</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(f => (
              <Card key={f.title} className="p-6" hover>
                <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h4 className="text-[15px] font-semibold mb-2">{f.title}</h4>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="max-w-[1280px] mx-auto px-8 py-8 flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--accent)]">SkillCred</span>
            <div className="flex gap-6 text-[13px] text-[var(--text-tertiary)]">
              <span>About</span>
              <span>Privacy</span>
              <span>Terms</span>
              <span>Contact</span>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
