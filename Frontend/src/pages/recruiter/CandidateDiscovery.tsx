import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import { Card, Badge, Button, Avatar, ProgressBar } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import PageTransition from '../../components/PageTransition';
import { recruiterService } from '../../services/recruiterService';
import type { Candidate } from '../../types';

export default function CandidateDiscovery() {
  const nav = useNavigate();
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [search, setSearch] = useState('');
  const [minReadiness, setMinReadiness] = useState(0);
  const [hasGitHub, setHasGitHub] = useState(false);
  const [hasProjects, setHasProjects] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'readiness' | 'recent'>('match');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => { recruiterService.getCandidates().then(setCandidates); }, []);

  const filtered = candidates
    .filter(c => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.university.toLowerCase().includes(q)) return false;
      }
      if (c.readinessScore < minReadiness) return false;
      if (hasGitHub && !c.hasGitHub) return false;
      if (hasProjects && !c.hasProjects) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'match') return b.matchPercent - a.matchPercent;
      if (sortBy === 'readiness') return b.readinessScore - a.readinessScore;
      return 0;
    });

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-display text-[32px] tracking-tight">Candidates</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Discover and evaluate verified student talent.</p>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        <div className="w-[220px] flex-shrink-0 hidden lg:block">
          <Card className="p-5 sticky top-20">
            <h3 className="text-[13px] font-semibold mb-4 flex items-center gap-2"><Filter size={14} /> Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Min Readiness</label>
                <input type="range" min={0} max={100} value={minReadiness} onChange={e => setMinReadiness(Number(e.target.value))} className="w-full" />
                <span className="font-[var(--font-mono)] text-xs text-[var(--text-secondary)]">{minReadiness}%+</span>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                  <input type="checkbox" checked={hasGitHub} onChange={e => setHasGitHub(e.target.checked)} className="rounded" />
                  Has GitHub
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                  <input type="checkbox" checked={hasProjects} onChange={e => setHasProjects(e.target.checked)} className="rounded" />
                  Has Projects
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Main area */}
        <div className="flex-1">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search candidates..."
                className="w-full h-[38px] pl-9 pr-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)]"
              />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="h-[38px] px-3 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-[var(--radius-sm)] text-sm">
              <option value="match">Sort: Match %</option>
              <option value="readiness">Sort: Readiness</option>
              <option value="recent">Sort: Most Recent</option>
            </select>
            <div className="flex border border-[var(--border-default)] rounded-[var(--radius-sm)] overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}><List size={16} /></button>
            </div>
          </div>

          {filtered.length === 0 && (
            <Card className="p-10 text-center">
              <p className="text-[var(--text-tertiary)]">No candidates match your filters.</p>
            </Card>
          )}

          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-3'}>
            {filtered.map(c => (
              <Card key={c.id} className="p-5" hover onClick={() => nav(`/recruiter/candidates/${c.id}`)}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={c.name} size={40} />
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold">{c.name}</p>
                    <p className="text-[13px] text-[var(--text-secondary)]">{c.university}</p>
                  </div>
                  <Badge variant="accent">{c.matchPercent}%</Badge>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.verifiedSkills.slice(0, 4).map(s => <Badge key={s} variant="success">{s}</Badge>)}
                  {c.verifiedSkills.length > 4 && <Badge variant="neutral">+{c.verifiedSkills.length - 4}</Badge>}
                </div>
                <ProgressBar value={c.readinessScore} className="mb-3" />
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 text-xs h-8" onClick={e => { e.stopPropagation(); nav(`/recruiter/candidates/${c.id}`); }}>View Profile</Button>
                  <Button className="flex-1 text-xs h-8" onClick={e => { e.stopPropagation(); addToast(`${c.name} added to pipeline`, 'success'); }}>Add to Pipeline</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
