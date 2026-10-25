import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Avatar, SkeletonRows } from '../components/UI';

const LEVELS = [['Beginner', 0], ['Learner', 100], ['Explorer', 250], ['Mentor', 500], ['Expert', 900], ['Master', 1400], ['Legend', 2000]];
const podiumStyle = [
  { order: 'order-2', h: 'h-32', medal: '🥇', ring: 'ring-amber-400', grad: 'from-amber-400 to-yellow-500' },
  { order: 'order-1', h: 'h-24', medal: '🥈', ring: 'ring-slate-300', grad: 'from-slate-300 to-slate-400' },
  { order: 'order-3', h: 'h-20', medal: '🥉', ring: 'ring-orange-400', grad: 'from-orange-400 to-amber-600' },
];

export default function Leaderboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/leaderboard').then(({ data: d }) => setData(d)); }, []);
  if (!data) return <SkeletonRows count={5} />;
  const { top, me, total } = data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="page-title">🏆 Leaderboard</h1>
        <p className="text-sm text-slate-500">Sessions complete karo, reviews do, aur points kamao</p>
      </div>

      {/* My rank */}
      {me && (
        <div className="rounded-2xl p-5 bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-brand-500/20 flex flex-wrap items-center gap-4">
          <div className="text-4xl font-extrabold">#{me.rank}</div>
          <div className="flex-1 min-w-[150px]">
            <div className="font-bold">Your rank out of {total}</div>
            <div className="text-sm opacity-90">Level {me.level.n} · {me.level.name} · {me.points} pts</div>
          </div>
          <Link to="/stats" className="btn bg-white/15 hover:bg-white/25 text-white">📊 My Stats →</Link>
        </div>
      )}

      {/* Podium */}
      {top.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end pt-4">
          {top.slice(0, 3).map((u, i) => {
            const st = podiumStyle[i];
            return (
              <div key={u._id} className={`${st.order} flex flex-col items-center animate-fade-up`} style={{ animationDelay: `${i * 120}ms` }}>
                <div className="text-3xl mb-1">{st.medal}</div>
                <div className={`rounded-full ring-4 ${st.ring}`}><Avatar name={u.name} size={i === 0 ? 72 : 56} src={u.avatar} /></div>
                <Link to={`/users/${u._id}`} className="font-bold text-sm mt-2 text-slate-900 hover:text-brand-600 text-center truncate max-w-full">{u.name}</Link>
                <div className="text-xs text-slate-500">{u.points} pts</div>
                <div className={`w-full ${st.h} mt-2 rounded-t-2xl bg-gradient-to-b ${st.grad} grid place-items-center text-white text-2xl font-extrabold shadow-lg`}>{i + 1}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {top.map((u, i) => {
          const isMe = me && String(me._id) === String(u._id);
          return (
            <div key={u._id} className={`flex items-center gap-3 px-4 py-3 border-t first:border-0 border-slate-100 transition hover:bg-slate-50 ${isMe ? 'bg-brand-50' : ''}`}>
              <div className={`w-8 text-center font-extrabold ${i < 3 ? 'text-amber-500' : 'text-slate-400'}`}>{i + 1}</div>
              <Avatar name={u.name} size={40} src={u.avatar} />
              <div className="flex-1 min-w-0">
                <Link to={`/users/${u._id}`} className="font-semibold text-sm text-slate-900 hover:text-brand-600">{u.name} {isMe && <span className="chip bg-brand-600 text-white ml-1">You</span>}</Link>
                <div className="text-xs text-slate-500 truncate">Lv {u.level.n} {u.level.name} · {u.sessions} sessions · {u.rating ? `${u.rating}★` : 'New'}</div>
              </div>
              <div className="hidden sm:block text-lg tracking-tight" title="Badges">{u.badges.slice(0, 5).join('')}</div>
              <div className="text-right">
                <div className="font-extrabold text-slate-900">{u.points}</div>
                <div className="text-[10px] text-slate-400 uppercase">points</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* How points work */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-3">⚡ Points kaise milte hain</h2>
          <ul className="text-sm space-y-1.5 text-slate-600">
            <li>✅ Session complete: <b>+50</b></li>
            <li>🤝 Swap accept hua: <b>+20</b></li>
            <li>📝 Review likha: <b>+10</b></li>
            <li>⭐ Rating mili: <b>+5 × stars</b></li>
            <li>🎓 Skill offer kiya: <b>+5</b> (max 5)</li>
            <li>💬 Message bheja: <b>+1</b> (max 50)</li>
            <li>✔ Skill verified (quiz): <b>+30</b> (max 5)</li>
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-3">📶 Levels</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {LEVELS.map(([name, min], i) => (
              <div key={name} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white text-xs font-bold grid place-items-center">{i + 1}</span>
                <span className="font-medium text-slate-700">{name}</span>
                <span className="ml-auto text-xs text-slate-400">{min}+</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
