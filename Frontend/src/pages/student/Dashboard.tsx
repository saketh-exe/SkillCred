import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Briefcase, FileText, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { StatCard, Card, Badge, Button, ProgressBar } from '../../components/ui';
import NotificationDropdown from '../../components/ui/NotificationDropdown';
import PageTransition from '../../components/PageTransition';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import type { Skill, JobMatch, Notification } from '../../types';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    studentService.getSkills().then(setSkills);
    studentService.getJobs().then(setJobs);
    studentService.getNotifications().then(setNotifications);
  }, []);

  const verifiedCount = skills.filter(s => s.status === 'Verified').length;

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-[32px] tracking-tight">Welcome back, {user?.name?.split(' ')[0] ?? 'Student'}</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <NotificationDropdown notifications={notifications} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <StatCard icon={<BadgeCheck size={20} />} value={verifiedCount} label="Verified Skills" trend={{ delta: '+2 this month', up: true }} />
        <StatCard icon={<Briefcase size={20} />} value={jobs.length} label="Job Matches" trend={{ delta: '+3 new', up: true }} />
        <StatCard icon={<FileText size={20} />} value={3} label="Applications Sent" />
        <StatCard icon={<TrendingUp size={20} />} value="78%" label="Avg. Readiness Score" />
      </div>

      {/* Readiness ring + recommended jobs */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {/* Readiness Score */}
        <Card className="p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--green-bg)] to-transparent opacity-50" />
          <div className="relative">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
              <circle
                cx="70" cy="70" r="60" fill="none"
                stroke="var(--green)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 60 * 0.78} ${2 * Math.PI * 60 * 0.22}`}
                transform="rotate(-90 70 70)"
                className="transition-all duration-1000"
              />
              <text x="70" y="62" textAnchor="middle" className="fill-[var(--text-primary)]" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36 }}>78%</text>
              <text x="70" y="84" textAnchor="middle" className="fill-[var(--text-tertiary)]" style={{ fontSize: 11 }}>Readiness</text>
            </svg>
          </div>
          <p className="relative text-[13px] text-[var(--text-secondary)] mt-3 font-medium">Backend Developer Readiness</p>
        </Card>

        {/* Recommended Jobs */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--accent)]" />
              Recommended Jobs
            </h2>
            <Link to="/student/jobs" className="text-[13px] text-[var(--accent)] font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {jobs.slice(0, 3).map(job => (
              <Card key={job.jobId} className="p-4 min-w-[260px] flex-shrink-0 group" lift>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[15px] font-semibold">{job.title}</p>
                    <p className="text-[13px] text-[var(--text-secondary)]">{job.company}</p>
                  </div>
                  <Badge variant={job.matchPercent >= 80 ? 'success' : job.matchPercent >= 60 ? 'warning' : 'danger'}>
                    {job.matchPercent}%
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {job.requiredSkills.slice(0, 4).map(s => (
                    <Badge key={s.name} variant={s.verified ? 'success' : 'warning'}>{s.name}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 text-xs h-8">View</Button>
                  <Button className="flex-1 text-xs h-8">Apply</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Skill Badges + Skill Gap Summary */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Skill Badges */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold">Skill Badges</h2>
            <Link to="/student/profile" className="text-[13px] text-[var(--accent)] font-medium hover:underline">Manage</Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {skills.slice(0, 9).map(s => (
              <div
                key={s.id}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-[13px] transition-all duration-200 hover:shadow-sm ${
                  s.status === 'Verified'
                    ? 'bg-[var(--green-bg)] border-[var(--green)]/20 text-[var(--green)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-tertiary)]'
                }`}
              >
                <span>{s.icon}</span>
                <span className="truncate font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Skill Gap Summary */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold mb-4">Skill Gap Summary</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-1">Target Role: <span className="font-medium text-[var(--text-primary)]">Backend Developer</span></p>
          <ProgressBar value={68} className="mb-4" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Strengths</p>
              {['Python', 'REST APIs', 'SQL'].map(s => (
                <div key={s} className="flex items-center gap-2 mb-1.5 text-[var(--green)]">
                  <span className="text-xs">✓</span><span>{s}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Missing</p>
              {['Docker', 'Caching', 'CI/CD'].map(s => (
                <div key={s} className="flex items-center gap-2 mb-1.5 text-[var(--amber)]">
                  <span className="text-xs">!</span><span>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/student/gap-analysis" className="mt-4 inline-flex items-center gap-1 text-[13px] text-[var(--accent)] font-medium hover:underline">
            View Full Analysis <ArrowRight size={14} />
          </Link>
        </Card>
      </div>
    </PageTransition>
  );
}
