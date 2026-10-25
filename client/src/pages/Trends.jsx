import { useEffect, useState } from 'react';
import api from '../api';
import { GapBar, HBar, WeeklyLine } from '../components/Charts';
import { SkeletonRows, StatCard } from '../components/UI';

// Public skill-demand dashboard (Data Analyst angle)
export default function Trends() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/trends').then(({ data: d }) => setData(d)); }, []);
  if (!data) return <SkeletonRows count={4} />;
  const top = data.gap[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">📈 Skill Demand Trends</h1>
        <p className="text-sm text-slate-500">Live insights from SkillSwap community data</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Learners" value={data.totals.users} />
        <StatCard icon="🧠" label="Unique skills" value={data.totals.skills} tone="amber" />
        <StatCard icon="⇄" label="Swap requests" value={data.totals.swaps} tone="rose" />
        <StatCard icon="✅" label="Sessions completed" value={data.totals.sessions} tone="green" />
      </div>

      {top && top.gap > 0 && (
        <div className="rounded-2xl p-5 bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-brand-500/20">
          💡 <b>Insight:</b> <b>{top.skill}</b> is the most under-supplied skill: {top.wanted} people want it but only {top.offered} teach it. Teach {top.skill} to get the most swap requests!
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5"><h2 className="font-bold mb-3">🔥 Most wanted skills</h2><HBar data={data.topWanted} color="#f59e0b" /></div>
        <div className="card p-5"><h2 className="font-bold mb-3">🎓 Most offered skills</h2><HBar data={data.topOffered} color="#10b981" /></div>
        <div className="card p-5"><h2 className="font-bold mb-1">⚖️ Demand vs Supply gap</h2><p className="text-xs text-slate-500 mb-3">Skills where learners outnumber teachers</p><GapBar data={data.gap} /></div>
        <div className="card p-5"><h2 className="font-bold mb-3">📊 Swap activity (last 8 weeks)</h2><WeeklyLine data={data.weekly} /></div>
      </div>
    </div>
  );
}
