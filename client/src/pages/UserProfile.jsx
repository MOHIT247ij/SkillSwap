import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SwapModal from '../components/SwapModal';
import { Avatar, SkillChips, Stars, timeAgo } from '../components/UI';

export default function UserProfile() {
  const { id } = useParams();
  const { user: me, online } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setData(null);
    api.get(`/users/${id}`).then(({ data: d }) => setData(d)).catch(() => setError('User not found'));
  }, [id]);

  if (error) return <div className="text-slate-500">{error}</div>;
  if (!data) return <div className="grid lg:grid-cols-3 gap-6"><div className="card p-6 space-y-3"><div className="skeleton w-24 h-24 rounded-full mx-auto" /><div className="skeleton h-5 w-1/2 mx-auto" /><div className="skeleton h-4 w-2/3 mx-auto" /></div><div className="lg:col-span-2 space-y-3"><div className="skeleton h-32 rounded-2xl" /><div className="skeleton h-48 rounded-2xl" /></div></div>;
  const { user, reviews, swapsDone, match } = data;
  const isMe = String(user._id) === String(me._id);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="card p-0 h-fit text-center overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600" />
        <div className="px-6 pb-6 -mt-12">
        <div className="flex justify-center"><div className="rounded-full ring-4 ring-white dark:ring-slate-900"><Avatar name={user.name} size={96} src={user.avatar} online={online.includes(String(user._id))} /></div></div>
        <h1 className="text-xl font-bold mt-3">{user.name}</h1>
        <div className="text-sm text-slate-500">{user.college}{user.city ? ` · ${user.city}` : ''}</div>
        <div className="mt-2"><Stars value={user.rating} count={user.ratingCount} /></div>
        <p className="text-sm text-slate-600 mt-3">{user.bio || 'No bio yet.'}</p>
        <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
          <div className="bg-slate-50 rounded-xl p-3"><div className="font-bold text-lg">{swapsDone}</div><div className="text-xs text-slate-500">Sessions done</div></div>
          <div className="bg-slate-50 rounded-xl p-3"><div className="font-bold text-lg">{match.score}</div><div className="text-xs text-slate-500">Match score</div></div>
        </div>
        {!isMe && <button className="btn-primary w-full mt-4" onClick={() => setOpen(true)}>⇄ Request Swap</button>}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        {!isMe && match.mutual && (
          <div className="card p-4 bg-brand-50 border-brand-200 text-sm">
            🎉 <b>Perfect match!</b> They teach <b>{match.theyTeach.join(', ')}</b> and want to learn <b>{match.iTeach.join(', ')}</b>, which you teach.
          </div>
        )}
        <div className="card p-6 space-y-4">
          <div><h2 className="font-bold mb-2">Can teach</h2><SkillChips skills={user.skillsOffered} type="teach" highlight={match.theyTeach} verified={user.verifiedSkills || []} /></div>
          <div><h2 className="font-bold mb-2">Wants to learn</h2><SkillChips skills={user.skillsWanted} type="learn" highlight={match.iTeach} /></div>
        </div>
        <div className="card p-6">
          <h2 className="font-bold mb-3">Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? <div className="text-sm text-slate-500">No reviews yet.</div> : reviews.map((r) => (
            <div key={r._id} className="py-3 border-t first:border-0 border-slate-100 flex gap-3">
              <Avatar name={r.reviewer?.name || '?'} size={36} />
              <div>
                <div className="text-sm font-semibold">{r.reviewer?.name} <span className="text-amber-500 ml-1">{'★'.repeat(r.rating)}</span></div>
                <div className="text-sm text-slate-600">{r.comment}</div>
                <div className="text-xs text-slate-400">{timeAgo(r.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <SwapModal open={open} target={user} onClose={() => setOpen(false)} />
    </div>
  );
}
