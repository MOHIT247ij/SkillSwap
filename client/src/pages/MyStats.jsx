import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { HBar } from '../components/Charts';
import { Avatar, SkeletonRows, StatCard } from '../components/UI';

const axis = { fontSize: 12, fill: '#64748b' };
const PIE_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];

// Circular progress ring for the level
function LevelRing({ progress, level }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="white" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * progress) / 100} style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[10px] uppercase opacity-80">Level</div>
          <div className="text-4xl font-extrabold leading-none">{level}</div>
        </div>
      </div>
    </div>
  );
}

export default function MyStats() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/me/stats').then(({ data }) => setD(data)); }, []);
  if (!d) return <SkeletonRows count={5} />;

  const earned = d.badges.filter((b) => b.earned).length;
  const t = d.totals;
  const funnel = [
    { label: 'Requests sent', count: d.requests.sent },
    { label: 'Sent → accepted', count: d.requests.sentAccepted },
    { label: 'Requests received', count: d.requests.received },
    { label: 'Received → accepted', count: d.requests.receivedAccepted },
  ];
  const pointsData = d.breakdown.filter((b) => b.points > 0);

  return (
    <div className="space-y-6">
      {/* Level header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-6 md:p-8 text-white shadow-xl shadow-brand-500/20">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          <LevelRing progress={d.level.progress} level={d.level.n} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Avatar name={user.name} size={32} src={user.avatar} />
              <span className="font-semibold">{user.name}</span>
            </div>
            <h1 className="text-3xl font-extrabold mt-2">{d.level.name}</h1>
            <div className="opacity-90 text-sm mt-1">
              <b>{d.points}</b> points{d.rank ? <> · Rank <b>#{d.rank}</b> of {d.totalUsers}</> : null} · {earned}/{d.badges.length} badges
            </div>
            {d.level.next ? (
              <div className="mt-4 max-w-sm mx-auto sm:mx-0">
                <div className="flex justify-between text-xs mb-1"><span>Next level</span><span>{d.points} / {d.level.next}</span></div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${d.level.progress}%` }} /></div>
                <div className="text-xs opacity-80 mt-1">Sirf {d.level.next - d.points} points aur!</div>
              </div>
            ) : <div className="mt-3 text-sm">🏆 Max level reached!</div>}
          </div>
          <Link to="/leaderboard" className="btn bg-white text-brand-700 hover:bg-brand-50">🏆 Leaderboard</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="✅" label="Sessions completed" value={t.sessions} tone="green" />
        <StatCard icon="⏱️" label="Learning hours" value={t.hours} />
        <StatCard icon="🎓" label="Skills taught / learned" value={`${t.skillsTaught} / ${t.skillsLearned}`} tone="amber" />
        <StatCard icon="🤝" label="Your request accept rate" value={d.requests.acceptRate} suffix="%" tone="rose" />
      </div>

      {/* Badges */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">🎖️ Badges</h2>
          <span className="chip-neutral">{earned} / {d.badges.length} earned</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {d.badges.map((b) => (
            <div key={b.key} className={`rounded-2xl p-4 text-center border transition ${b.earned ? 'border-amber-200 bg-amber-50 card-hover' : 'border-slate-200 bg-slate-50'}`}>
              <div className={`text-4xl ${b.earned ? '' : 'grayscale opacity-40'}`}>{b.icon}</div>
              <div className={`font-bold text-sm mt-2 ${b.earned ? 'text-slate-900' : 'text-slate-500'}`}>{b.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{b.desc}</div>
              {!b.earned && (
                <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${b.progress}%` }} /></div>
              )}
              {b.earned && <div className="text-[11px] font-semibold text-amber-600 mt-2">✓ Unlocked</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-3">📅 Monthly activity (6 months)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d.monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={axis} />
              <YAxis allowDecimals={false} tick={axis} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="sessions" name="Sessions" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="hours" name="Hours" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-3">⚡ Points breakdown</h2>
          {pointsData.length === 0 ? <div className="text-sm text-slate-500 py-16 text-center">Abhi koi points nahi. Pehla swap karo! 🚀</div> : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pointsData} dataKey="points" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {pointsData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ul className="text-sm space-y-1.5 w-full sm:w-56 shrink-0">
                {pointsData.map((p, i) => (
                  <li key={p.label} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-600 flex-1">{p.label}</span>
                    <b className="text-slate-900">{p.points}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-3">🎓 Skills you taught</h2>
          {d.taught.length ? <HBar data={d.taught} dataKey="sessions" color="#10b981" height={Math.max(160, d.taught.length * 40)} />
            : <div className="text-sm text-slate-500 py-10 text-center">Abhi tak koi session complete nahi hua.</div>}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-3">📚 Skills you learned</h2>
          {d.learned.length ? <HBar data={d.learned} dataKey="sessions" color="#f59e0b" height={Math.max(160, d.learned.length * 40)} />
            : <div className="text-sm text-slate-500 py-10 text-center">Abhi tak koi session complete nahi hua.</div>}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-3">🤝 Swap requests</h2>
          <HBar data={funnel} nameKey="label" color="#6366f1" height={200} />
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-1">⭐ Ratings received</h2>
          <p className="text-xs text-slate-500 mb-3">Average {t.rating || '—'} from {t.ratingCount} review{t.ratingCount === 1 ? '' : 's'}</p>
          <HBar data={d.ratingDist} nameKey="stars" color="#f59e0b" height={200} />
        </div>
      </div>
    </div>
  );
}
