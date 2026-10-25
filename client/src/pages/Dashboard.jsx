import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import SwapModal from '../components/SwapModal';
import { Empty, SkeletonGrid, StatCard } from '../components/UI';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function Dashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [pending, setPending] = useState(0);
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/matches'), api.get('/suggestions'), api.get('/sessions'), api.get('/swaps')])
      .then(([m, s, se, sw]) => {
        setMatches(m.data);
        setSuggestions(s.data);
        setSessions(se.data);
        setPending(sw.data.received.filter((r) => r.status === 'pending').length);
      })
      .finally(() => setLoading(false));
    api.get('/me/stats').then(({ data }) => setGame(data)).catch(() => {});
  }, []);

  const upcoming = sessions.filter((s) => s.status === 'scheduled' && new Date(s.date) > Date.now());
  const completed = sessions.filter((s) => s.status === 'completed').length;

  // Profile completion %
  const checks = [
    ['Add a bio', !!user.bio],
    ['Add your college', !!user.college],
    ['Add skills you teach', user.skillsOffered.length > 0],
    ['Add skills to learn', user.skillsWanted.length > 0],
    ['Add your city', !!user.city],
  ];
  const pct = Math.round((checks.filter((c) => c[1]).length / checks.length) * 100);
  const nextStep = checks.find((c) => !c[1]);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-6 md:p-8 text-white shadow-xl shadow-brand-500/20">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-10 bottom-0 text-[110px] leading-none opacity-15 select-none hidden md:block">⇄</div>
        <div className="relative">
          <div className="text-sm opacity-90">{greeting()} 👋</div>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">{user.name}</h1>
          <p className="opacity-90 text-sm mt-1">
            {pending > 0 ? <>You have <b>{pending} pending request{pending > 1 ? 's' : ''}</b> waiting.</> : 'Ready to learn something new today?'}
          </p>
          <div className="mt-5 max-w-md">
            <div className="flex justify-between text-xs mb-1.5"><span>Profile strength</span><b>{pct}%</b></div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
            {nextStep && <Link to="/profile" className="inline-block text-xs mt-2 underline underline-offset-2 opacity-90 hover:opacity-100">Next: {nextStep[0]} →</Link>}
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            {pending > 0 && <Link to="/requests" className="btn bg-white text-brand-700 hover:bg-brand-50">📥 View requests</Link>}
            <Link to="/explore" className="btn bg-white/15 hover:bg-white/25 text-white backdrop-blur">🔍 Find people</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="⭐" label="Your rating" value={user.rating ? user.rating : 'New'} tone="amber" />
        <StatCard icon="✅" label="Sessions completed" value={completed} tone="green" />
        <StatCard icon="📥" label="Pending requests" value={pending} tone="rose" />
        <StatCard icon="📅" label="Upcoming sessions" value={upcoming.length} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900">🎯 Your best matches</h2>
            <Link to="/explore" className="text-sm text-brand-600 font-semibold hover:underline">Explore all →</Link>
          </div>
          {loading ? <SkeletonGrid count={4} cols="sm:grid-cols-2" /> : matches.length === 0 ? (
            <Empty icon="🔍" title="No matches yet">Add more skills to your <Link to="/profile" className="text-brand-600">profile</Link> to find people.</Empty>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {matches.slice(0, 6).map((m, i) => (
                <div key={m.user._id} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                  <UserCard user={m.user} match={m} onSwap={setTarget} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {game && (
            <Link to="/stats" className="card card-hover p-5 block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white grid place-items-center text-xl font-extrabold shadow-lg shadow-amber-500/30">{game.level.n}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900">{game.level.name}</div>
                  <div className="text-xs text-slate-500">{game.points} pts{game.rank ? ` · Rank #${game.rank}` : ''}</div>
                </div>
                <div className="text-lg">{game.badges.filter((b) => b.earned).map((b) => b.icon).slice(0, 4).join('')}</div>
              </div>
              {game.level.next && (
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000" style={{ width: `${game.level.progress}%` }} /></div>
                  <div className="text-[11px] text-slate-500 mt-1">{game.level.next - game.points} pts to Level {game.level.n + 1} · View stats →</div>
                </div>
              )}
            </Link>
          )}

          <Link to="/ai" className="block rounded-2xl p-5 bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white shadow-lg shadow-brand-500/20 hover:-translate-y-1 transition">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <div className="font-bold">Ask SkillBot</div>
                <div className="text-xs opacity-90">Roadmap chahiye? AI se poochho →</div>
              </div>
            </div>
          </Link>

          <div className="card p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-fuchsia-400/20 blur-2xl" />
            <h2 className="font-bold text-slate-900 flex items-center gap-2">🤖 AI Skill Suggestions</h2>
            <p className="text-xs text-slate-500 mb-4">Based on your skills + what similar learners want</p>
            {loading ? (
              <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-8" />)}</div>
            ) : suggestions.length === 0 ? <div className="text-sm text-slate-500">Add skills to get suggestions.</div> : (
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={s.skill} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold grid place-items-center">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-800">{s.skill}</div>
                      <div className="text-xs text-slate-500 truncate">{s.reason}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900">📅 Upcoming</h2>
              <Link to="/sessions" className="text-xs text-brand-600 font-semibold hover:underline">All →</Link>
            </div>
            {upcoming.length === 0 ? <div className="text-sm text-slate-500">No upcoming sessions.</div> : upcoming.slice(0, 4).map((s) => (
              <div key={s._id} className="flex gap-3 py-2.5 border-t first:border-0 border-slate-100">
                <div className="w-11 shrink-0 rounded-xl bg-brand-50 text-center py-1">
                  <div className="text-[10px] uppercase text-brand-600 font-bold">{new Date(s.date).toLocaleDateString('en-IN', { month: 'short' })}</div>
                  <div className="font-extrabold text-slate-900 leading-tight">{new Date(s.date).getDate()}</div>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate text-slate-800">{s.title}</div>
                  <div className="text-xs text-slate-500">{new Date(s.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SwapModal open={!!target} target={target} onClose={() => setTarget(null)} />
    </div>
  );
}
