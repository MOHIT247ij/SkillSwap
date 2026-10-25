import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Avatar, CountUp } from '../components/UI';

const steps = [
  ['📝', 'Add your skills', 'List what you can teach and what you want to learn.'],
  ['🎯', 'Get smart matches', 'Two-way algorithm finds people who need what you teach.'],
  ['💬', 'Chat & schedule', 'Talk in real time and book a session with a Meet link.'],
  ['⭐', 'Learn & rate', 'Finish the session, leave a review, build your reputation.'],
];

const features = [
  ['🎯', 'Smart Matching', 'Mutual-swap scoring ranks the people who need your skills and teach what you want.', 'from-brand-500 to-violet-500'],
  ['🤖', 'AI Suggestions', 'Learning-path engine + community data suggests what to learn next.', 'from-fuchsia-500 to-pink-500'],
  ['⚡', 'Real-time Chat', 'Socket.io messaging with typing indicator and online presence.', 'from-amber-400 to-orange-500'],
  ['📅', 'Session Scheduling', 'Book sessions with date, time and a Google Meet link.', 'from-sky-500 to-blue-500'],
  ['⭐', 'Ratings & Reviews', 'Build trust with verified reviews after every session.', 'from-emerald-500 to-teal-500'],
  ['📈', 'Skill Trends', 'Live dashboard of demand vs supply across the community.', 'from-rose-500 to-red-500'],
];

const testimonials = [
  ['Priya Sharma', 'COEP', 'I taught React and learned SQL in 3 weekends. Zero cost, real friends made!'],
  ['Arjun Mehta', 'VIT Pune', 'The perfect-match feature is crazy accurate. Found a UI design mentor in a day.'],
  ['Sneha Kulkarni', 'PICT', 'Public speaking for Python, best trade I made this semester 😄'],
];

const floating = [
  ['Python', 'top-6 -left-4', 'chip-teach', '0s'],
  ['React', 'top-1/3 -right-6', 'chip-learn', '1s'],
  ['Power BI', 'bottom-10 -left-6', 'chip-learn', '2s'],
  ['Guitar', '-bottom-3 right-8', 'chip-teach', '1.5s'],
];

export default function Landing() {
  const [totals, setTotals] = useState(null);
  useEffect(() => { api.get('/trends').then(({ data }) => setTotals(data.totals)).catch(() => {}); }, []);

  return (
    <div className="space-y-24 pb-10">
      {/* HERO */}
      <section className="relative grid md:grid-cols-2 gap-12 items-center pt-6 md:pt-12">
        <div className="pointer-events-none absolute -z-10 inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-brand-400/30 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-20 right-0 w-72 h-72 bg-fuchsia-400/25 rounded-full blur-3xl animate-blob [animation-delay:3s]" />
          <div className="absolute -bottom-10 left-1/3 w-72 h-72 bg-sky-400/20 rounded-full blur-3xl animate-blob [animation-delay:6s]" />
        </div>

        <div className="animate-fade-up">
          <span className="chip bg-brand-50 text-brand-700 border border-brand-200 mb-5 py-1 px-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> No money. Just skills.
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-slate-900">
            Teach what you know.<br /><span className="gradient-text">Learn what you don't.</span>
          </h1>
          <p className="mt-5 text-slate-600 text-lg max-w-lg">
            SkillSwap connects students who want to exchange skills. You teach SQL, they teach React. Everyone grows, nobody pays.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">Start Swapping →</Link>
            <Link to="/trends" className="btn-outline px-6 py-3 text-base">📈 Skill Trends</Link>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {['Priya S', 'Rahul P', 'Ananya I', 'Karan D'].map((n) => <div key={n} className="ring-2 ring-white rounded-full"><Avatar name={n} size={32} /></div>)}
            </div>
            <div className="text-sm text-slate-500"><b className="text-slate-800">{totals ? totals.users : '14'}+ students</b> already swapping</div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Demo: mohit@demo.com / demo123 · Admin: admin@skillswap.com / admin123</p>
        </div>

        <div className="relative animate-fade-up [animation-delay:150ms]">
          {floating.map(([s, pos, cls, delay]) => (
            <span key={s} className={`${cls} absolute ${pos} z-10 shadow-lg py-1 px-3 text-sm animate-float hidden sm:inline-flex`} style={{ animationDelay: delay }}>{s}</span>
          ))}
          <div className="card p-6 bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 text-white border-0 shadow-2xl shadow-brand-500/30 rotate-1 hover:rotate-0 transition duration-500">
            <div className="flex items-center justify-between">
              <span className="text-sm opacity-90">🎉 Perfect match found</span>
              <span className="chip bg-white/20 text-white">Score 14.5</span>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="bg-white/15 backdrop-blur rounded-2xl p-4">
                <Avatar name="Mohit Hingase" size={40} />
                <div className="font-bold mt-2">Mohit</div>
                <div className="text-xs opacity-80">Teaches</div>
                <div className="font-semibold text-sm">SQL · Power BI</div>
              </div>
              <div className="w-11 h-11 rounded-full bg-white text-brand-600 grid place-items-center text-xl font-bold shadow-lg animate-pulse">⇄</div>
              <div className="bg-white/15 backdrop-blur rounded-2xl p-4">
                <Avatar name="Priya Sharma" size={40} />
                <div className="font-bold mt-2">Priya</div>
                <div className="text-xs opacity-80">Teaches</div>
                <div className="font-semibold text-sm">React · Figma</div>
              </div>
            </div>
            <div className="mt-4 bg-white/15 rounded-xl p-3 text-sm flex items-center justify-between">
              <span>📅 Sat, 11:00 AM · Google Meet</span>
              <span>⭐ 4.8</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="card p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          ['Active learners', totals?.users ?? 14],
          ['Skills shared', totals?.skills ?? 40],
          ['Swap requests', totals?.swaps ?? 14],
          ['Sessions done', totals?.sessions ?? 10],
        ].map(([label, v]) => (
          <div key={label}>
            <div className="text-3xl md:text-4xl font-extrabold gradient-text"><CountUp value={v} />+</div>
            <div className="text-sm text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section>
        <div className="text-center mb-10">
          <div className="text-sm font-bold text-brand-600 uppercase tracking-wider">How it works</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">From signup to first session in 4 steps</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {steps.map(([icon, title, text], i) => (
            <div key={title} className="card card-hover p-6 relative">
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-white text-sm font-bold grid place-items-center shadow-lg">{i + 1}</div>
              <div className="text-4xl">{icon}</div>
              <div className="font-bold mt-3 text-slate-900">{title}</div>
              <p className="text-sm text-slate-500 mt-1">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="text-center mb-10">
          <div className="text-sm font-bold text-brand-600 uppercase tracking-wider">Features</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Everything you need to swap skills</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(([icon, title, text, g]) => (
            <div key={title} className="card card-hover p-6 group">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${g} grid place-items-center text-2xl shadow-lg transition group-hover:scale-110 group-hover:-rotate-6`}>{icon}</div>
              <div className="font-bold mt-4 text-slate-900">{title}</div>
              <p className="text-sm text-slate-500 mt-1">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section>
        <div className="text-center mb-10">
          <div className="text-sm font-bold text-brand-600 uppercase tracking-wider">Loved by students</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">What swappers say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map(([name, college, quote]) => (
            <div key={name} className="card card-hover p-6">
              <div className="text-amber-400 text-lg">★★★★★</div>
              <p className="text-slate-700 mt-2">“{quote}”</p>
              <div className="flex items-center gap-3 mt-5">
                <Avatar name={name} size={40} />
                <div><div className="font-semibold text-sm text-slate-900">{name}</div><div className="text-xs text-slate-500">{college}</div></div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">* Sample testimonials from demo data</p>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-10 md:p-14 text-center text-white shadow-2xl shadow-brand-500/30">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <h2 className="relative text-3xl md:text-4xl font-extrabold">Ready to trade your first skill?</h2>
        <p className="relative mt-3 opacity-90">Join free. Your next mentor is one swap away.</p>
        <Link to="/register" className="relative btn mt-7 bg-white text-brand-700 px-7 py-3 text-base hover:bg-brand-50 shadow-xl">Create free account →</Link>
      </section>
    </div>
  );
}
