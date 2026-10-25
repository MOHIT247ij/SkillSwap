import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { SkeletonGrid } from '../components/UI';

const ICONS = { Python: '🐍', SQL: '🗄️', JavaScript: '🟨', React: '⚛️', Excel: '📗', 'Power BI': '📊', Java: '☕', DSA: '🧩' };

// List of quizzes
export function QuizList() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/quiz').then(({ data: d }) => setData(d)); }, []);
  if (!data) return <SkeletonGrid count={8} cols="sm:grid-cols-2 lg:grid-cols-4" />;
  const verifiedCount = data.skills.filter((s) => s.verified).length;
  const sorted = [...data.skills].sort((a, b) => Number(b.offered) - Number(a.offered));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 text-white shadow-xl shadow-emerald-500/20">
        <h1 className="text-2xl md:text-3xl font-extrabold">🎓 Skill Verification</h1>
        <p className="opacity-90 mt-1 max-w-xl text-sm">
          Quiz pass karo aur apni skill pe <b>✔ Verified</b> badge pao. Verified teachers pe log zyada bharosa karte hain, aur har verified skill pe <b>+30 points</b> milte hain!
        </p>
        <div className="flex flex-wrap gap-2 mt-4 text-xs">
          <span className="chip bg-white/20 text-white">📝 {data.size} questions</span>
          <span className="chip bg-white/20 text-white">⏱️ 5 minutes</span>
          <span className="chip bg-white/20 text-white">🎯 Pass: {data.passScore}/{data.size}</span>
          <span className="chip bg-white text-emerald-700">✔ {verifiedCount} verified</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sorted.map((s, i) => (
          <div key={s.skill} className={`card card-hover p-5 flex flex-col animate-fade-up ${s.verified ? 'border-emerald-300' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between">
              <span className="text-4xl">{ICONS[s.skill] || '🎯'}</span>
              {s.verified && <span className="chip bg-emerald-600 text-white">✔ Verified</span>}
              {!s.verified && s.offered && <span className="chip-learn">You teach this</span>}
            </div>
            <div className="font-bold text-lg text-slate-900 mt-3">{s.skill}</div>
            <div className="text-xs text-slate-500 mb-4">{s.verified ? 'Badge mil gaya! Chaaho toh dobara practice karo.' : 'Verify karke apni profile strong banao'}</div>
            <Link to={`/quiz/${encodeURIComponent(s.skill)}`} className={`${s.verified ? 'btn-outline' : 'btn-primary'} mt-auto`}>
              {s.verified ? '🔁 Retake' : '▶ Start Quiz'}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// Take a quiz
export function QuizTake() {
  const { skill } = useParams();
  const { setUser, showToast } = useAuth();
  const nav = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [left, setLeft] = useState(300);
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    api.post(`/quiz/${encodeURIComponent(skill)}/start`)
      .then(({ data }) => { setQuiz(data); setAnswers(Array(data.questions.length).fill(null)); setLeft(data.timeLimit); })
      .catch((err) => setError(errMsg(err)));
  }, [skill]);

  const submit = async (finalAnswers = answers) => {
    if (submitted.current || !quiz) return;
    submitted.current = true;
    setBusy(true);
    try {
      const { data } = await api.post('/quiz/submit', { attemptId: quiz.attemptId, answers: finalAnswers });
      setResult(data);
      if (data.user) setUser(data.user);
    } catch (err) {
      showToast(errMsg(err), 'error');
      submitted.current = false;
    } finally {
      setBusy(false);
    }
  };

  // Countdown timer → auto-submit at 0
  useEffect(() => {
    if (!quiz || result) return undefined;
    if (left <= 0) { submit(); return undefined; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, quiz, result]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto">
        <div className="text-4xl">⏳</div>
        <div className="font-bold text-slate-900 mt-2">{error}</div>
        <Link to="/quiz" className="btn-outline mt-4">← Back to quizzes</Link>
      </div>
    );
  }
  if (!quiz) return <div className="card p-10 max-w-2xl mx-auto"><div className="skeleton h-6 w-1/2" /><div className="skeleton h-40 mt-4" /></div>;

  // Result screen
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className={`rounded-3xl p-8 text-center text-white shadow-xl ${result.passed ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30' : 'bg-gradient-to-br from-rose-500 to-orange-500 shadow-rose-500/30'}`}>
          <div className="text-6xl animate-scale-in">{result.passed ? '🎉' : '😅'}</div>
          <h1 className="text-3xl font-extrabold mt-3">{result.score} / {result.total}</h1>
          <p className="mt-1 opacity-95">{result.passed ? `Congratulations! You're now a ✔ Verified ${result.skill} teacher (+30 pts)` : 'Pass hone ke liye 4 sahi chahiye the. 2 minute baad dobara try karo!'}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <Link to="/quiz" className="btn bg-white text-slate-800 hover:bg-slate-100">← All quizzes</Link>
            {result.passed && <Link to="/stats" className="btn bg-white/20 hover:bg-white/30 text-white">🎖️ View badges</Link>}
          </div>
        </div>
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-slate-900">📋 Review answers</h2>
          {quiz.questions.map((q, i) => {
            const ok = answers[i] === result.correct[i];
            return (
              <div key={i} className="border-t first:border-0 border-slate-100 pt-3 first:pt-0">
                <div className="text-sm font-semibold text-slate-800">{ok ? '✅' : '❌'} {i + 1}. {q.q}</div>
                <div className="text-sm mt-1 text-slate-600">
                  {!ok && <div>Your answer: <span className="text-rose-600">{answers[i] === null ? 'Not answered' : q.o[answers[i]]}</span></div>}
                  <div>Correct: <span className="text-emerald-600 font-medium">{q.o[result.correct[i]]}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = quiz.questions[idx];
  const isLast = idx === quiz.questions.length - 1;
  const answeredCount = answers.filter((a) => a !== null).length;
  const pick = (opt) => setAnswers((a) => a.map((v, i) => (i === idx ? opt : v)));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => nav('/quiz')} className="btn-ghost">← Exit</button>
        <div className="font-bold text-slate-900">{ICONS[quiz.skill] || '🎯'} {quiz.skill} Quiz</div>
        <div className={`chip text-sm px-3 py-1 ${left <= 30 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
          ⏱️ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {quiz.questions.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`h-2 flex-1 rounded-full transition ${i === idx ? 'bg-brand-600' : answers[i] !== null ? 'bg-brand-300' : 'bg-slate-200'}`} aria-label={`Question ${i + 1}`} />
        ))}
      </div>

      <div key={idx} className="card p-6 animate-fade-up" style={{ animationDuration: '.25s' }}>
        <div className="text-xs font-bold text-brand-600 uppercase">Question {idx + 1} of {quiz.questions.length}</div>
        <h2 className="text-lg font-bold text-slate-900 mt-1">{q.q}</h2>
        <div className="space-y-2.5 mt-5">
          {q.o.map((opt, i) => {
            const selected = answers[idx] === i;
            return (
              <button key={i} onClick={() => pick(i)}
                className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border-2 transition ${selected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`}>
                <span className={`w-7 h-7 shrink-0 rounded-lg grid place-items-center text-xs font-bold ${selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{'ABCD'[i]}</span>
                <span className="text-sm text-slate-800">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button className="btn-outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Previous</button>
        <span className="text-xs text-slate-500">{answeredCount}/{quiz.questions.length} answered</span>
        {isLast
          ? <button className="btn-success" disabled={busy || answeredCount === 0} onClick={() => submit()}>{busy ? 'Checking…' : '✔ Submit'}</button>
          : <button className="btn-primary" onClick={() => setIdx(idx + 1)}>Next →</button>}
      </div>
    </div>
  );
}
