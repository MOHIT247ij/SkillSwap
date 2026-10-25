import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Modal } from './UI';

// Send swap request: "I teach X, you teach me Y"
export default function SwapModal({ target, open, onClose, onSent }) {
  const { user, showToast } = useAuth();
  const myOffered = user?.skillsOffered || [];
  const theirOffered = target?.skillsOffered || [];
  const [offeredSkill, setOffered] = useState('');
  const [wantedSkill, setWanted] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !target) return;
    const wantedByThem = new Set((target.skillsWanted || []).map((s) => s.toLowerCase()));
    const iWant = new Set((user.skillsWanted || []).map((s) => s.toLowerCase()));
    setOffered(myOffered.find((s) => wantedByThem.has(s.toLowerCase())) || myOffered[0] || '');
    setWanted(theirOffered.find((s) => iWant.has(s.toLowerCase())) || theirOffered[0] || '');
    setMessage('');
  }, [open, target?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/swaps', { receiver: target._id, offeredSkill, wantedSkill, message });
      showToast(`Swap request sent to ${target.name} 🚀`, 'success');
      onSent?.();
      onClose();
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Swap with ${target?.name || ''}`}>
      {!myOffered.length ? (
        <p className="text-sm text-slate-600">Pehle apni profile mein kam se kam ek <b>skill you can teach</b> add karo.</p>
      ) : (
        <form onSubmit={send} className="space-y-4">
          <div>
            <label className="label">I will teach</label>
            <select className="input" value={offeredSkill} onChange={(e) => setOffered(e.target.value)} required>
              {myOffered.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">I want to learn</label>
            <select className="input" value={wantedSkill} onChange={(e) => setWanted(e.target.value)} required>
              {theirOffered.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Message (optional)</label>
            <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi! Weekend pe 1 hour ka session karein?" />
          </div>
          <button className="btn-primary w-full" disabled={busy || !wantedSkill}>{busy ? 'Sending…' : 'Send Request'}</button>
        </form>
      )}
    </Modal>
  );
}
