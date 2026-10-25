import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Empty, SkeletonRows, timeAgo } from '../components/UI';

const badge = { pending: 'bg-amber-50 text-amber-700', accepted: 'bg-emerald-50 text-emerald-700', rejected: 'bg-rose-50 text-rose-700' };

export default function Requests() {
  const { showToast } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('received');
  const [data, setData] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/swaps').then(({ data: d }) => setData(d)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const respond = async (id, status) => {
    try {
      await api.patch(`/swaps/${id}`, { status });
      showToast(status === 'accepted' ? 'Accepted! Chat is now open 💬' : 'Request declined', status === 'accepted' ? 'success' : 'info');
      if (status === 'accepted') nav(`/chat/${id}`);
      else load();
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  const list = data[tab];
  const pendingCount = data.received.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <h1 className="page-title">Swap Requests</h1>
      <div className="inline-flex gap-1 p-1 rounded-2xl bg-slate-100">
        {['received', 'sent'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? 'btn-primary' : 'btn-ghost'}>
            {t === 'received' ? `Received${pendingCount ? ` (${pendingCount})` : ''}` : 'Sent'}
          </button>
        ))}
      </div>
      {loading ? <SkeletonRows /> : list.length === 0 ? (
        <Empty icon="📭" title={`No ${tab} requests`}>{tab === 'sent' && <Link to="/explore" className="text-brand-600">Find someone to swap with →</Link>}</Empty>
      ) : list.map((r) => {
        const other = tab === 'received' ? r.sender : r.receiver;
        return (
          <div key={r._id} className="card card-hover p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
            <Avatar name={other?.name || '?'} size={48} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/users/${other?._id}`} className="font-bold hover:text-brand-600">{other?.name}</Link>
                <span className={`chip ${badge[r.status]}`}>{r.status}</span>
                <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
              </div>
              <div className="text-sm mt-1">
                {tab === 'received' ? 'Teaches you' : 'You teach'} <span className="chip-teach">{r.offeredSkill}</span>
                <span className="mx-2 text-slate-400">⇄</span>
                {tab === 'received' ? 'wants' : 'you learn'} <span className="chip-learn">{r.wantedSkill}</span>
              </div>
              {r.message && <div className="text-sm text-slate-500 mt-2 italic">“{r.message}”</div>}
            </div>
            <div className="flex gap-2">
              {tab === 'received' && r.status === 'pending' && (
                <>
                  <button className="btn-success" onClick={() => respond(r._id, 'accepted')}>Accept</button>
                  <button className="btn-outline" onClick={() => respond(r._id, 'rejected')}>Decline</button>
                </>
              )}
              {r.status === 'accepted' && <Link to={`/chat/${r._id}`} className="btn-primary">💬 Chat</Link>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
