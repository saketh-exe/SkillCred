import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/ui';
import { LayoutDashboard, Briefcase, Users, GitBranch, Scale, MessageSquare, Building2 } from 'lucide-react';
import DashboardNav from '../../components/DashboardNav';

const navItems = [
  { label: 'Dashboard', to: '/recruiter/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Job Postings', to: '/recruiter/jobs', icon: <Briefcase size={18} /> },
  { label: 'Candidates', to: '/recruiter/candidates', icon: <Users size={18} /> },
  { label: 'Pipeline', to: '/recruiter/pipeline', icon: <GitBranch size={18} /> },
  { label: 'Comparisons', to: '/recruiter/compare', icon: <Scale size={18} /> },
  { label: 'Feedback', to: '/recruiter/feedback', icon: <MessageSquare size={18} /> },
  { label: 'Organization', to: '/recruiter/organization', icon: <Building2 size={18} /> },
];

export default function RecruiterLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNav />
      <div className="flex flex-1">
        <Sidebar items={navItems} />
        <main className="flex-1 p-8 overflow-y-auto page-bg">
          <div className="max-w-[1060px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
