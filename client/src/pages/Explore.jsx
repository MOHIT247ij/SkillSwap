import { useEffect, useState } from 'react';
import api from '../api';
import UserCard from '../components/UserCard';
import SwapModal from '../components/SwapModal';
import { Empty, SkeletonGrid } from '../components/UI';

const POPULAR = ['Python', 'React', 'SQL', 'Power BI', 'Figma', 'DSA', 'Guitar', 'Public Speaking'];

export default function Explore() {
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [skills, setSkills] = useState([]);
  const [users, setUsers] = useState([]);
  const [sort, setSort] = useState('match');
  const [perfectOnly, setPerfectOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);

  useEffect(() => { api.get('/skills').then(({ data }) => setSkills(data)); }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.get('/users', { params: { q, skill } }).then(({ data }) => setUsers(data)).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, skill]);

  const list = [...users]
    .filter((u) => !perfectOnly || u.match.mutual)
    .sort((a, b) => (sort === 'rating' ? b.rating - a.rating : b.match.score - a.match.score));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Explore people</h1>
        <p className="text-sm text-slate-500">Find your next skill-swap partner</p>
      </div>

      <div className="card p-4 space-y-3 shadow-md">
        <div className="grid sm:grid-cols-[1fr_200px_160px] gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input className="input pl-9" placeholder="Search e.g. React, Python, Priya…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input" value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="">Teaches any skill</option>
            {skills.map((s) => <option key={s} value={s}>Teaches {s}</option>)}
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="match">🎯 Best match</option>
            <option value="rating">⭐ Top rated</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Popular:</span>
          {POPULAR.map((s) => (
            <button key={s} onClick={() => setSkill(skill === s ? '' : s)}
              className={`chip transition border ${skill === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-slate-100 text-slate-600 border-transparent hover:border-brand-300'}`}>
              {s}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" className="accent-brand-600 w-4 h-4" checked={perfectOnly} onChange={(e) => setPerfectOnly(e.target.checked)} />
            🔥 Perfect matches only
          </label>
        </div>
      </div>

      {!loading && <div className="text-sm text-slate-500">{list.length} {list.length === 1 ? 'person' : 'people'} found</div>}

      {loading ? <SkeletonGrid /> : list.length === 0 ? (
        <Empty icon="🤷" title="No one found">Try another skill or clear filters.</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((u, i) => (
            <div key={u._id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <UserCard user={u} match={u.match} onSwap={setTarget} />
            </div>
          ))}
        </div>
      )}
      <SwapModal open={!!target} target={target} onClose={() => setTarget(null)} />
    </div>
  );
}
