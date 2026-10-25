import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { HBar, WeeklyLine } from '../components/Charts';
import { Avatar, SkeletonRows, StatCard, timeAgo } from '../components/UI';

export default function Admin() {
  const { showToast } = useAuth();
  const [tab, setTab] = useState('analytics');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [q, setQ] = useState('');
  const [exporting, setExporting] = useState('');

  // CSV download (auth header chahiye, isliye blob ke through)
  const exportCSV = async (type) => {
    setExporting(type);
    try {
      const res = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skillswap_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(`${type}.csv downloaded 📥`, 'success');
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setExporting('');
    }
  };

  const load = () => Promise.all([api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/reviews')]).then(([s, u, r]) => {
    setStats(s.data); setUsers(u.data); setReviews(r.data);
  });
  useEffect(() => { load(); }, []);

  const toggleBan = async (u) => {
    try {
      const { data } = await api.patch(`/admin/users/${u._id}/ban`);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isBanned: data.isBanned } : x)));
      showToast(`${u.name} ${data.isBanned ? 'banned' : 'unbanned'}`, 'success');
    } catch (err) { showToast(errMsg(err), 'error'); }
  };
  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      showToast('Review deleted', 'success');
    } catch (err) { showToast(errMsg(err), 'error'); }
  };

  if (!stats) return <SkeletonRows count={4} />;
  const t = stats.totals;
  const filtered = users.filter((u) => `${u.name} ${u.email} ${u.college}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">🛡️ Admin Dashboard</h1>
        <div className="flex flex-wrap items-center gap-1.5 order-last w-full sm:order-none sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">📥 Export CSV:</span>
          {['users', 'swaps', 'sessions', 'reviews'].map((t) => (
            <button key={t} onClick={() => exportCSV(t)} disabled={exporting === t} className="btn-outline text-xs px-3 py-1.5 capitalize">
              {exporting === t ? '…' : t}
            </button>
          ))}
        </div>
        <div className="inline-flex gap-1 p-1 rounded-2xl bg-slate-100">
          {['analytics', 'users', 'reviews'].map((x) => (
            <button key={x} onClick={() => setTab(x)} className={tab === x ? 'btn-primary capitalize' : 'btn-ghost capitalize'}>{x}</button>
          ))}
        </div>
      </div>

      {tab === 'analytics' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label={`Users (${t.banned} banned)`} value={t.users} />
            <StatCard icon="⇄" label={`Swaps (${t.pending} pending)`} value={t.swaps} tone="rose" />
            <StatCard icon="✅" label="Acceptance rate" value={`${t.acceptRate}%`} tone="green" />
            <StatCard icon="⭐" label={`Avg rating (${t.reviews} reviews)`} value={t.avgRating} tone="amber" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-5"><h2 className="font-bold mb-3">Swap activity (8 weeks)</h2><WeeklyLine data={stats.weekly} /></div>
            <div className="card p-5"><h2 className="font-bold mb-3">Users by college</h2><HBar data={stats.colleges} nameKey="college" height={280} /></div>
            <div className="card p-5"><h2 className="font-bold mb-3">Top demanded skills</h2><HBar data={stats.topWanted} color="#f59e0b" /></div>
            <div className="card p-5"><h2 className="font-bold mb-3">Top offered skills</h2><HBar data={stats.topOffered} color="#10b981" /></div>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100"><input className="input max-w-sm" placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr><th className="p-3">User</th><th className="p-3">College</th><th className="p-3">Skills</th><th className="p-3">Rating</th><th className="p-3">Joined</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} className={`border-t border-slate-100 ${u.isBanned ? 'bg-rose-50/50' : ''}`}>
                    <td className="p-3"><div className="flex items-center gap-2"><Avatar name={u.name} size={32} /><div><div className="font-medium">{u.name} {u.role === 'admin' && <span className="chip-neutral">admin</span>}</div><div className="text-xs text-slate-500">{u.email}</div></div></div></td>
                    <td className="p-3">{u.college}</td>
                    <td className="p-3 text-xs text-slate-500">{u.skillsOffered.length} teach · {u.skillsWanted.length} learn</td>
                    <td className="p-3">{u.rating || '—'}</td>
                    <td className="p-3 text-xs text-slate-500">{timeAgo(u.createdAt)}</td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && <button onClick={() => toggleBan(u)} className={u.isBanned ? 'btn-outline' : 'btn-danger'}>{u.isBanned ? 'Unban' : 'Ban'}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="card p-4 flex items-start gap-3">
              <div className="flex-1">
                <div className="text-sm"><b>{r.reviewer?.name}</b> → <Link to={`/users/${r.reviewee?._id}`} className="text-brand-600">{r.reviewee?.name}</Link> <span className="text-amber-500 ml-1">{'★'.repeat(r.rating)}</span></div>
                <div className="text-sm text-slate-600">{r.comment || <i className="text-slate-400">No comment</i>}</div>
                <div className="text-xs text-slate-400">{timeAgo(r.createdAt)}</div>
              </div>
              <button className="btn-outline text-rose-600" onClick={() => deleteReview(r._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
