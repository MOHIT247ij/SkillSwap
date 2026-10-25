import { useEffect, useRef, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import Markdown from '../components/Markdown';


export default function SkillBot() {
  const { user } = useAuth();
  const STORAGE_KEY = `ss_skillbot_${user._id}`;
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null);
  const bottom = useRef(null);

  useEffect(() => { api.get('/ai/status').then(({ data }) => setMode(data.mode)).catch(() => {}); }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); } catch { /* ignore */ }
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  const want = user.skillsWanted[0];
  const prompts = [
    want ? `${want} seekhne ka roadmap do` : 'Python seekhne ka roadmap do',
    'Data Analyst banne ke liye kya seekhun?',
    'Mujhe agla kaunsa skill seekhna chahiye?',
    'Pehle swap session ki taiyaari kaise karun?',
  ];

  const send = async (content) => {
    const q = content.trim();
    if (!q || busy) return;
    const next = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setText('');
    setBusy(true);
    try {
      const { data } = await api.post('/ai/chat', { messages: next.filter((m) => !m.error) });
      setMode(data.mode);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${errMsg(err)}`, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto card overflow-hidden flex flex-col h-[calc(100vh-190px)] md:h-[calc(100vh-140px)] min-h-[480px] shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 text-white">
        <div className="w-11 h-11 rounded-2xl bg-white/20 grid place-items-center text-2xl">🤖</div>
        <div className="flex-1">
          <div className="font-extrabold">SkillBot</div>
          <div className="text-xs opacity-90 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${mode === 'ai' ? 'bg-emerald-300' : 'bg-amber-300'}`} />
            {mode === 'ai' ? 'AI powered · Gemini' : mode === 'offline' ? 'Offline mode · built-in roadmaps' : 'Connecting…'}
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="btn bg-white/15 hover:bg-white/25 text-white text-xs">🗑️ Clear</button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-8 animate-fade-up">
            <div className="text-6xl animate-float">🤖</div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-3">Hi {user.name.split(' ')[0]}! Main SkillBot hoon</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">Learning roadmap, agla skill kya seekhein, ya swap session ki taiyaari: kuch bhi poochho.</p>
            <div className="grid sm:grid-cols-2 gap-2 mt-6 max-w-xl mx-auto">
              {prompts.map((p) => (
                <button key={p} onClick={() => send(p)} className="card card-hover p-3 text-sm text-left text-slate-700">💡 {p}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 animate-fade-up ${m.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animationDuration: '.25s' }}>
            {m.role === 'assistant' && <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center text-sm">🤖</div>}
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user'
              ? 'bg-gradient-to-br from-brand-600 to-violet-600 text-white rounded-br-md'
              : m.error ? 'bg-rose-50 text-rose-700 border border-rose-200 rounded-bl-md'
              : 'bg-white dark:bg-slate-700 text-slate-800 border border-slate-200 rounded-bl-md shadow-sm'}`}>
              {m.role === 'user' ? m.content : <Markdown text={m.content} />}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center text-sm">🤖</div>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md">
              {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="p-3 border-t border-slate-100 flex gap-2">
        <input className="input" placeholder="Poochho: 'SQL kaise seekhun?'" value={text} onChange={(e) => setText(e.target.value)} disabled={busy} maxLength={1000} />
        <button className="btn-primary px-5" disabled={!text.trim() || busy}>Send ➤</button>
      </form>
    </div>
  );
}
