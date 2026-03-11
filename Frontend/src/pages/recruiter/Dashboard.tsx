import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, GitBranch, UserCheck, ArrowRight } from 'lucide-react';
import { StatCard, Card, Badge, Button, Avatar, ProgressBar } from '../../components/ui';
import NotificationDropdown from '../../components/ui/NotificationDropdown';
import PageTransition from '../../components/PageTransition';
import { recruiterService } from '../../services/recruiterService';
import { useAuth } from '../../context/AuthContext';
import type { JobPosting, Candidate, Notification } from '../../types';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    recruiterService.getJobPostings().then(setJobs);
    recruiterService.getCandidates().then(setCandidates);
    recruiterService.getNotifications().then(setNotifications);
  }, []);

  const activeJobs = jobs.filter(j => j.status === 'Active');
  const totalApplicants = jobs.reduce((sum, j) => sum + j.applicantCount, 0);
  const totalPipeline = jobs.reduce((sum, j) => sum + j.inPipelineCount, 0);
  const topCandidates = [...candidates].sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 3);

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-[32px] tracking-tight">Welcome back, {user?.name?.split(' ')[0] ?? 'Recruiter'}</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <NotificationDropdown notifications={notifications} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Briefcase size={20} />} value={activeJobs.length} label="Active Job Postings" />
        <StatCard icon={<Users size={20} />} value={totalApplicants} label="Total Applicants" trend={{ delta: '+12 this week', up: true }} />
        <StatCard icon={<GitBranch size={20} />} value={totalPipeline} label="In Pipeline" />
        <StatCard icon={<UserCheck size={20} />} value={3} label="Hired This Month" trend={{ delta: '+1', up: true }} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {/* Active Job Postings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold">Active Job Postings</h2>
            <Link to="/recruiter/jobs" className="text-[13px] text-[var(--accent)] font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-elevated)]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Role</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Applicants</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Pipeline</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Top Match</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeJobs.map(job => (
                  <tr key={job.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] h-[52px]">
                    <td className="px-4 text-sm font-medium">{job.title}</td>
                    <td className="px-4 font-[var(--font-mono)] text-sm">{job.applicantCount}</td>
                    <td className="px-4 font-[var(--font-mono)] text-sm">{job.inPipelineCount}</td>
                    <td className="px-4"><Badge variant="accent">{job.topMatchPercent}%</Badge></td>
                    <td className="px-4"><Badge variant="success">{job.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-[15px] font-semibold mb-3">Recent Activity</h2>
          <Card className="p-4">
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="flex gap-3 pb-3 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    n.type === 'success' ? 'bg-[var(--success)]' : n.type === 'warning' ? 'bg-[var(--warning)]' : 'bg-[var(--accent)]'
                  }`} />
                  <div>
                    <p className="text-[13px] text-[var(--text-primary)]">{n.message}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {new Date(n.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Top Candidates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold">Top Candidates</h2>
          <Link to="/recruiter/candidates" className="text-[13px] text-[var(--accent)] font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {topCandidates.map(c => (
            <Card key={c.id} className="p-5" hover>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={c.name} size={40} />
                <div>
                  <p className="text-[15px] font-semibold">{c.name}</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">{c.targetRoles[0]}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--text-tertiary)]">Match</span>
                <Badge variant="accent">{c.matchPercent}%</Badge>
              </div>
              <ProgressBar value={c.readinessScore} className="mb-3" />
              <Link to={`/recruiter/candidates/${c.id}`}>
                <Button variant="secondary" className="w-full text-xs h-8">View Profile</Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
