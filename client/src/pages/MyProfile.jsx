import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, SkillInput } from '../components/UI';

export default function MyProfile() {
  const { user, setUser, showToast } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: user.name, bio: user.bio, college: user.college, city: user.city, skillsOffered: user.skillsOffered, skillsWanted: user.skillsWanted });
  const [allSkills, setAllSkills] = useState([]);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { api.get('/skills').then(({ data }) => setAllSkills(data)); }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.put('/users/me', form);
      setUser(data);
      showToast('Profile saved ✅', 'success');
    } catch (err) {
      showToast(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {params.get('new') && (
        <div className="card p-4 bg-brand-50 border-brand-200 text-sm">🎉 Account created! Add your skills below so we can find your matches.</div>
      )}
      <div className="flex items-center gap-4">
        <Avatar name={form.name || user.name} size={64} src={user.avatar} />
        <div>
          <h1 className="page-title">My Profile</h1>
          <div className="flex flex-wrap gap-x-4 text-sm"><Link to={`/users/${user._id}`} className="text-brand-600">View public profile →</Link><Link to="/quiz" className="text-emerald-600 font-semibold">🎓 Verify your skills →</Link></div>
        </div>
      </div>
      <form onSubmit={save} className="card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={set('name')} required /></div>
          <div><label className="label">Email</label><input className="input bg-slate-50" value={user.email} disabled /></div>
          <div><label className="label">College</label><input className="input" value={form.college} onChange={set('college')} /></div>
          <div><label className="label">City</label><input className="input" value={form.city} onChange={set('city')} /></div>
        </div>
        <div><label className="label">Bio</label><textarea className="input" rows={3} maxLength={400} value={form.bio} onChange={set('bio')} placeholder="Tell people about yourself…" /></div>
        <div>
          <label className="label">✅ Skills I can teach <span className="text-slate-400 font-normal">(Enter to add)</span></label>
          <SkillInput value={form.skillsOffered} onChange={(v) => setForm({ ...form, skillsOffered: v })} placeholder="e.g. SQL" suggestions={allSkills} />
        </div>
        <div>
          <label className="label">📚 Skills I want to learn</label>
          <SkillInput value={form.skillsWanted} onChange={(v) => setForm({ ...form, skillsWanted: v })} placeholder="e.g. React" suggestions={allSkills} />
        </div>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Profile'}</button>
      </form>
    </div>
  );
}
