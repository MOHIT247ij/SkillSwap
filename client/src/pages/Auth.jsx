import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import GoogleButton from '../components/GoogleButton';

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="max-w-5xl mx-auto md:mt-4 grid md:grid-cols-2 card overflow-hidden shadow-xl">
      <div className="relative hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 text-white overflow-hidden">
        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-white/10 blur-2xl animate-blob" />
        <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full bg-white/10 blur-2xl animate-blob [animation-delay:4s]" />
        <div className="relative flex items-center gap-2 font-extrabold text-lg">
          <span className="w-9 h-9 rounded-xl bg-white/20 grid place-items-center">⇄</span> SkillSwap
        </div>
        <div className="relative">
          <h2 className="text-3xl font-extrabold leading-tight">Teach what you know.<br />Learn what you don't.</h2>
          <ul className="mt-6 space-y-3 text-sm opacity-95">
            <li>🎯 Smart two-way skill matching</li>
            <li>⚡ Real-time chat with your swap partner</li>
            <li>📅 Schedule sessions with Meet links</li>
            <li>⭐ Build reputation with reviews</li>
          </ul>
        </div>
        <div className="relative text-xs opacity-75">100% free · No money, just skills</div>
      </div>
      <div className="p-8 md:p-10">
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password);
      nav('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  const demo = (email, password) => setForm({ email, password });

  return (
    <AuthShell title="Welcome back 👋" subtitle="Login to continue swapping skills">
      <GoogleButton text="continue_with" />
      <div className="relative my-5 text-center text-xs text-slate-400"><span className="relative z-10 px-2 bg-white dark:bg-slate-900">or login with email</span><div className="absolute inset-x-0 top-1/2 border-t border-slate-200" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label">Password</label><input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg p-2">{error}</div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
      </form>
      <div className="relative my-5 text-center text-xs text-slate-400"><span className="relative z-10 px-2 bg-white dark:bg-slate-900">or try a demo account</span><div className="absolute inset-x-0 top-1/2 border-t border-slate-200" /></div>
      <div className="flex gap-2">
        <button className="btn-outline flex-1 text-xs" onClick={() => demo('mohit@demo.com', 'demo123')}>👤 Demo user</button>
        <button className="btn-outline flex-1 text-xs" onClick={() => demo('admin@skillswap.com', 'admin123')}>🛡️ Admin</button>
      </div>
      <p className="text-sm text-center mt-5 text-slate-500">New here? <Link to="/register" className="text-brand-600 font-semibold">Create account</Link></p>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      nav('/profile?new=1');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Join SkillSwap 🚀" subtitle="Create your free account in 30 seconds">
      <GoogleButton text="signup_with" />
      <div className="relative my-5 text-center text-xs text-slate-400"><span className="relative z-10 px-2 bg-white dark:bg-slate-900">or sign up with email</span><div className="absolute inset-x-0 top-1/2 border-t border-slate-200" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Full name</label><input className="input" required value={form.name} onChange={set('name')} /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={set('email')} /></div>
        <div><label className="label">College (optional)</label><input className="input" value={form.college} onChange={set('college')} placeholder="MIT-WPU" /></div>
        <div><label className="label">Password</label><input className="input" type="password" minLength={6} required value={form.password} onChange={set('password')} /></div>
        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-lg p-2">{error}</div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create Account'}</button>
      </form>
      <p className="text-sm text-center mt-5 text-slate-500">Already have an account? <Link to="/login" className="text-brand-600 font-semibold">Login</Link></p>
    </AuthShell>
  );
}
