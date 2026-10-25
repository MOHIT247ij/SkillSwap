import { useEffect, useState } from 'react';

const GRADIENTS = [
  'from-indigo-500 to-violet-500', 'from-emerald-500 to-teal-500', 'from-rose-500 to-pink-500', 'from-amber-500 to-orange-500',
  'from-sky-500 to-blue-500', 'from-violet-500 to-fuchsia-500', 'from-teal-500 to-cyan-500', 'from-pink-500 to-rose-400',
];

export function Avatar({ name = '?', size = 40, online = false, src = '' }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const g = GRADIENTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {src && !imgError ? (
        <img src={src} alt={name} referrerPolicy="no-referrer" onError={() => setImgError(true)} className="w-full h-full rounded-full object-cover shadow-sm" />
      ) : (
        <div className={`bg-gradient-to-br ${g} text-white font-bold rounded-full grid place-items-center w-full h-full shadow-sm`} style={{ fontSize: size * 0.38 }}>
          {initials}
        </div>
      )}
      {online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"><span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" /></span>}
    </div>
  );
}

export function Stars({ value = 0, count }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-amber-400 tracking-tight">{'★'.repeat(Math.round(value))}<span className="text-slate-300">{'★'.repeat(5 - Math.round(value))}</span></span>
      <span className="text-slate-500 text-xs font-medium">{value ? value.toFixed(1) : 'New'}{count !== undefined && count > 0 ? ` (${count})` : ''}</span>
    </span>
  );
}

export function SkillChips({ skills = [], type = 'teach', highlight = [], verified = [] }) {
  const hl = new Set(highlight.map((s) => s.toLowerCase()));
  const vf = new Set(verified.map((s) => s.toLowerCase()));
  const cls = type === 'teach' ? 'chip-teach' : type === 'learn' ? 'chip-learn' : 'chip-neutral';
  if (!skills.length) return <span className="text-xs text-slate-400">None added</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <span key={s} className={`${cls} ${hl.has(s.toLowerCase()) ? 'ring-2 ring-brand-400 ring-offset-1' : ''}`}>
          {hl.has(s.toLowerCase()) && '✨ '}{s}
          {vf.has(s.toLowerCase()) && <span title="Verified by quiz" className="ml-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[9px] grid place-items-center">✔</span>}
        </span>
      ))}
    </div>
  );
}

// Tag input: type + Enter / comma to add skills
export function SkillInput({ value = [], onChange, placeholder, suggestions = [] }) {
  const [text, setText] = useState('');
  const add = (raw) => {
    const s = raw.trim();
    if (!s || value.some((v) => v.toLowerCase() === s.toLowerCase())) return setText('');
    onChange([...value, s]);
    setText('');
  };
  const listId = `skills-${placeholder}`;
  return (
    <div className="input flex flex-wrap gap-1.5 items-center min-h-[46px]">
      {value.map((s) => (
        <span key={s} className="chip-neutral animate-scale-in">
          {s}
          <button type="button" className="ml-1 text-slate-400 hover:text-rose-500" onClick={() => onChange(value.filter((v) => v !== s))}>×</button>
        </span>
      ))}
      <input
        list={listId}
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); }
          if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => text && add(text)}
      />
      <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
    </div>
  );
}

// Number that counts up on mount
export function CountUp({ value, duration = 800 }) {
  const num = Number(value);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(num)) return;
    let raf;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setN(num * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [num, duration]);
  if (!Number.isFinite(num)) return value;
  return Number.isInteger(num) ? Math.round(n) : n.toFixed(1);
}

export function StatCard({ label, value, icon, tone = 'brand', suffix = '' }) {
  const tones = {
    brand: 'from-brand-500 to-violet-500 shadow-brand-500/30',
    green: 'from-emerald-500 to-teal-500 shadow-emerald-500/30',
    amber: 'from-amber-400 to-orange-500 shadow-amber-500/30',
    rose: 'from-rose-500 to-pink-500 shadow-rose-500/30',
  };
  return (
    <div className="card card-hover p-4 flex items-center gap-3">
      <div className={`w-12 h-12 rounded-2xl grid place-items-center text-xl bg-gradient-to-br text-white shadow-lg ${tones[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-slate-900"><CountUp value={value} />{suffix}</div>
        <div className="text-xs text-slate-500 truncate">{label}</div>
      </div>
    </div>
  );
}

export function Empty({ icon = '📭', title, children }) {
  return (
    <div className="card p-10 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 grid place-items-center text-3xl mb-3 animate-float">{icon}</div>
      <div className="font-bold text-slate-800">{title}</div>
      {children && <div className="text-sm text-slate-500 mt-1">{children}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xl grid place-items-center">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Loading placeholders
export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2"><div className="skeleton h-4 w-2/3" /><div className="skeleton h-3 w-1/2" /></div>
      </div>
      <div className="flex gap-2"><div className="skeleton h-5 w-16 rounded-full" /><div className="skeleton h-5 w-20 rounded-full" /><div className="skeleton h-5 w-14 rounded-full" /></div>
      <div className="flex gap-2"><div className="skeleton h-5 w-20 rounded-full" /><div className="skeleton h-5 w-16 rounded-full" /></div>
      <div className="flex gap-2"><div className="skeleton h-9 flex-1 rounded-xl" /><div className="skeleton h-9 flex-1 rounded-xl" /></div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, cols = 'sm:grid-cols-2 lg:grid-cols-3' }) {
  return <div className={`grid ${cols} gap-4`}>{Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}</div>;
}

export function SkeletonRows({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card p-5 flex items-center gap-4">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2"><div className="skeleton h-4 w-1/3" /><div className="skeleton h-3 w-2/3" /></div>
        </div>
      ))}
    </div>
  );
}

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
