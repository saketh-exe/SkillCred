import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/ui';
import { LayoutDashboard, Briefcase, Users, GitBranch, Scale, MessageSquare, Building2 } from 'lucide-react';

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
    <div className="flex min-h-[calc(100vh-56px)]">
      <Sidebar items={navItems} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-[1060px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
