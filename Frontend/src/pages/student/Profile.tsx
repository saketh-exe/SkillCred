import { useEffect, useState } from 'react';
import { Card, Badge, Avatar, Button } from '../../components/ui';
import PageTransition from '../../components/PageTransition';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { useToast } from '../../components/ui/Toast';
import type { Skill, Project, StudentUser } from '../../types';

export default function StudentProfile() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const student = user as StudentUser | null;
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    studentService.getSkills().then(setSkills);
    studentService.getProjects().then(setProjects);
  }, []);

  const verifiedSkills = skills.filter(s => s.status === 'Verified');

  if (!student) return null;

  return (
    <PageTransition>
      {/* Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-5">
          <Avatar name={student.name} size={64} />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{student.name}</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">{student.university} · {student.degree} · Class of {student.graduationYear}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {student.targetRoles.map(r => <Badge key={r} variant="accent">{r}</Badge>)}
            </div>
          </div>
          <Button variant="secondary">Edit Profile</Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Verified Skills */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold mb-4">Verified Skills</h2>
          {verifiedSkills.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No verified skills yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {verifiedSkills.map(s => (
                <Badge key={s.id} variant="success">{s.icon} {s.name}</Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Education */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold mb-4">Education</h2>
          <p className="text-sm font-medium">{student.university}</p>
          <p className="text-[13px] text-[var(--text-secondary)]">{student.degree}</p>
          <p className="text-[13px] text-[var(--text-tertiary)]">Expected {student.graduationYear}</p>
        </Card>

        {/* Projects */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-[15px] font-semibold mb-4">Projects</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No projects added yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map(p => (
                <div key={p.id} className="p-4 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
                  <p className="text-[15px] font-semibold mb-1">{p.title}</p>
                  <p className="text-[13px] text-[var(--text-secondary)] mb-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.techStack.map(t => <Badge key={t}>{t}</Badge>)}
                  </div>
                  {p.githubUrl && <a href={p.githubUrl} className="text-xs text-[var(--accent)] hover:underline" target="_blank" rel="noopener noreferrer">View on GitHub</a>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stats Summary */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold mb-4">Stats Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Total Verifications</span><span className="font-[var(--font-mono)] font-medium">{verifiedSkills.length}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Applications</span><span className="font-[var(--font-mono)] font-medium">3</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Avg Readiness</span><span className="font-[var(--font-mono)] font-medium text-[var(--success)]">78%</span></div>
          </div>
        </Card>

        {/* Profile Visibility */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold mb-4">Profile Visibility</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Make profile visible to recruiters</p>
            <button
              onClick={() => { setVisible(v => !v); addToast(visible ? 'Profile hidden from recruiters' : 'Profile visible to recruiters', 'info'); }}
              className={`w-11 h-6 rounded-full transition-colors ${visible ? 'bg-[var(--accent)]' : 'bg-[var(--border-default)]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${visible ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
