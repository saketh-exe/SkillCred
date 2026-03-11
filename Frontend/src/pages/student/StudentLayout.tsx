import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/ui';
import { LayoutDashboard, BarChart3, Briefcase, FileText, MessageSquare, User, UserPlus } from 'lucide-react';
import DashboardNav from '../../components/DashboardNav';

const navItems = [
  { label: 'Dashboard', to: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Profile Builder', to: '/student/profile-builder', icon: <UserPlus size={18} /> },
  { label: 'Skill Gap Analysis', to: '/student/gap-analysis', icon: <BarChart3 size={18} /> },
  { label: 'Job Matches', to: '/student/jobs', icon: <Briefcase size={18} /> },
  { label: 'Applications', to: '/student/applications', icon: <FileText size={18} /> },
  { label: 'Feedback', to: '/student/feedback', icon: <MessageSquare size={18} /> },
  { label: 'Profile', to: '/student/profile', icon: <User size={18} /> },
];

export default function StudentLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNav />
      <div className="flex flex-1">
        <Sidebar items={navItems} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-[1060px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
