import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Empty, Modal, SkeletonRows } from '../components/UI';

const badge = { scheduled: 'bg-brand-50 text-brand-700', completed: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-rose-50 text-rose-700' };

export default function Sessions() {
  const { user, showToast } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewFor, setReviewFor] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: '' });

  const load = () => api.get('/sessions').then(({ data }) => setSessions(data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const update = async (id, status) => {
    try {
      await api.patch(`/sessions/${id}`, { status });
      showToast(`Session ${status}`, 'success');
      load();
    } catch (err) { showToast(errMsg(err), 'error'); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { sessionId: reviewFor._id, ...review });
      showToast('Thanks for the review ⭐', 'success');
      setReviewFor(null);
      setReview({ rating: 5, comment: '' });
      load();
    } catch (err) { showToast(errMsg(err), 'error'); }
  };

  const partnerOf = (s) => s.participants.find((p) => String(p._id) !== String(user._id));
  const upcoming = sessions.filter((s) => s.status === 'scheduled');
  const past = sessions.filter((s) => s.status !== 'scheduled').reverse();

  const Row = ({ s }) => {
    const partner = partnerOf(s);
    return (
      <div className="card card-hover p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 text-center shrink-0 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white py-2 shadow-md shadow-brand-500/30">
          <div className="text-[11px] uppercase font-bold opacity-90">{new Date(s.date).toLocaleDateString('en-IN', { month: 'short' })}</div>
          <div className="text-2xl font-extrabold leading-tight">{new Date(s.date).getDate()}</div>
        </div>
        <div className="flex-1">
          <div className="font-semibold">{s.title} <span className={`chip ${badge[s.status]} ml-1`}>{s.status}</span></div>
          <div className="text-sm text-slate-500">
            with <Link to={`/users/${partner?._id}`} className="text-brand-600">{partner?.name}</Link> · {new Date(s.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · ⏱️ {s.duration || 60} min
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.status === 'scheduled' && (
            <>
              {s.meetLink && <a href={s.meetLink} target="_blank" rel="noreferrer" className="btn-outline">🎥 Join</a>}
              <button className="btn-success" onClick={() => update(s._id, 'completed')}>Mark done</button>
              <button className="btn-outline" onClick={() => update(s._id, 'cancelled')}>Cancel</button>
            </>
          )}
          {s.status === 'completed' && !s.reviewedByMe && <button className="btn-primary" onClick={() => setReviewFor(s)}>⭐ Rate</button>}
          {s.status === 'completed' && s.reviewedByMe && <span className="text-xs text-slate-400">Reviewed ✓</span>}
        </div>
      </div>
    );
  };

  if (loading) return <div className="max-w-3xl mx-auto"><SkeletonRows count={4} /></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="page-title">Sessions</h1>
      <section className="space-y-3">
        <h2 className="font-bold text-slate-700">Upcoming</h2>
        {upcoming.length === 0 ? <Empty icon="📅" title="No upcoming sessions">Open a chat and click “Schedule”.</Empty> : upcoming.map((s) => <Row key={s._id} s={s} />)}
      </section>
      <section className="space-y-3">
        <h2 className="font-bold text-slate-700">History</h2>
        {past.length === 0 ? <div className="text-sm text-slate-500">Nothing here yet.</div> : past.map((s) => <Row key={s._id} s={s} />)}
      </section>

      <Modal open={!!reviewFor} onClose={() => setReviewFor(null)} title="Rate your session">
        <form onSubmit={submitReview} className="space-y-4">
          <div className="flex justify-center gap-1 text-4xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setReview({ ...review, rating: n })} className={`transition hover:scale-125 ${n <= review.rating ? 'text-amber-400' : 'text-slate-300'}`}>★</button>
            ))}
          </div>
          <textarea className="input" rows={3} placeholder="How was the session?" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
          <button className="btn-primary w-full">Submit review</button>
        </form>
      </Modal>
    </div>
  );
}
