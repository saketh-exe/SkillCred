import { useEffect, useState } from 'react';
import { Building2, Users, Globe, Pencil } from 'lucide-react';
import { Card, Badge, Avatar, Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import PageTransition from '../../components/PageTransition';
import { recruiterService } from '../../services/recruiterService';
import type { Organization as OrgType } from '../../types';

export default function Organization() {
  const { addToast } = useToast();
  const [org, setOrg] = useState<OrgType | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [website, setWebsite] = useState('');
  const [about, setAbout] = useState('');

  useEffect(() => {
    recruiterService.getOrganization().then(data => {
      setOrg(data);
      setName(data.name);
      setIndustry(data.industry);
      setSize(data.size);
      setWebsite(data.website);
      setAbout(data.about);
    });
  }, []);

  const handleSave = () => {
    if (org) setOrg({ ...org, name, industry, size, website, about });
    setEditing(false);
    addToast('Organization updated successfully!', 'success');
  };

  const inputClass = 'w-full h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)]';

  if (!org) return <div className="p-8 text-center text-[var(--text-tertiary)]">Loading...</div>;

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold">Organization</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage your company profile and team.</p>
        </div>
        {!editing && <Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={14} /> Edit</Button>}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Company info */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-[var(--radius-md)] bg-[var(--accent-subtle)] flex items-center justify-center">
                <Building2 size={28} className="text-[var(--accent)]" />
              </div>
              {editing ? (
                <div className="flex-1 space-y-2">
                  <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Company name" />
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold">{org.name}</h2>
                  <p className="text-[13px] text-[var(--text-secondary)]">{org.industry} · {org.size}</p>
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Industry</label>
                    <input value={industry} onChange={e => setIndustry(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Size</label>
                    <select value={size} onChange={e => setSize(e.target.value)} className={inputClass}>
                      <option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Website</label>
                  <input value={website} onChange={e => setWebsite(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">About</label>
                  <textarea value={about} onChange={e => setAbout(e.target.value)} rows={4} className="w-full px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] resize-none" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>Save</Button>
                  <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
                  <Globe size={14} /> <a href={website} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">{org.website}</a>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{org.about}</p>
                <div className="mt-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Hiring Domains</span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {org.hiringDomains.map(d => <Badge key={d} variant="accent">{d}</Badge>)}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Team members */}
        <div>
          <Card className="p-6">
            <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2"><Users size={16} /> Team Members</h3>
            <div className="space-y-3">
              {org.teamMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] rounded-[var(--radius-sm)]">
                  <Avatar name={m.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{m.name}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">{m.role}</p>
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)]">{m.email}</p>
                </div>
              ))}
            </div>
            <Button variant="secondary" className="w-full mt-4 text-xs h-8">+ Invite Member</Button>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
