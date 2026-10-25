import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { Avatar, Empty, Modal, timeAgo } from '../components/UI';

export default function Chat() {
  const { swapId } = useParams();
  const { user, socket, online, showToast } = useAuth();
  const { startCall } = useCall();
  const nav = useNavigate();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const [sched, setSched] = useState({ date: '', meetLink: '', duration: 60 });
  const bottom = useRef(null);
  const typingTimer = useRef(null);

  const loadChats = () => api.get('/chats').then(({ data }) => {
    setChats(data);
    if (!swapId && data.length && window.innerWidth >= 768) nav(`/chat/${data[0].swapId}`, { replace: true });
  });
  useEffect(() => { loadChats(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!swapId) return;
    setMessages([]);
    api.get(`/chats/${swapId}/messages`).then(({ data }) => setMessages(data)).catch(() => showToast('Chat not available', 'error'));
  }, [swapId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time listeners
  useEffect(() => {
    if (!socket) return;
    const onMsg = (m) => {
      if (String(m.swap) === String(swapId)) setMessages((prev) => (prev.some((p) => p._id === m._id) ? prev : [...prev, m]));
      setChats((prev) => prev.map((c) => (String(c.swapId) === String(m.swap) ? { ...c, lastMessage: m } : c)));
    };
    const onTyping = ({ swapId: sid }) => {
      if (String(sid) !== String(swapId)) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 1500);
    };
    socket.on('chat:message', onMsg);
    socket.on('chat:typing', onTyping);
    return () => { socket.off('chat:message', onMsg); socket.off('chat:typing', onTyping); };
  }, [socket, swapId]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    if (socket?.connected) socket.emit('chat:send', { swapId, text: t });
    else {
      const { data } = await api.post(`/chats/${swapId}/messages`, { text: t });
      setMessages((prev) => [...prev, data]);
    }
  };

  const schedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sessions', { swapId, date: new Date(sched.date).toISOString(), meetLink: sched.meetLink, duration: Number(sched.duration) });
      showToast('Session scheduled 📅', 'success');
      setSchedOpen(false);
      setSched({ date: '', meetLink: '', duration: 60 });
    } catch (err) {
      showToast(errMsg(err), 'error');
    }
  };

  const active = chats.find((c) => String(c.swapId) === String(swapId));

  if (!chats.length) return <Empty icon="💬" title="No chats yet">Chats open when a swap request is accepted. <Link to="/requests" className="text-brand-600">See requests →</Link></Empty>;

  return (
    <div className="card overflow-hidden grid md:grid-cols-[300px_1fr] h-[calc(100vh-190px)] md:h-[calc(100vh-140px)] min-h-[460px] shadow-lg">
      <aside className={`border-r border-slate-200 overflow-auto ${swapId ? 'hidden md:block' : ''}`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between"><span className="font-bold text-slate-900">💬 Messages</span><span className="chip-neutral">{chats.length}</span></div>
        {chats.map((c) => (
          <Link key={c.swapId} to={`/chat/${c.swapId}`} className={`flex gap-3 p-3 mx-2 my-1 rounded-xl transition hover:bg-slate-50 ${String(c.swapId) === String(swapId) ? 'bg-brand-50 ring-1 ring-brand-200' : ''}`}>
            <Avatar name={c.partner.name} size={40} online={online.includes(String(c.partner._id))} />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2"><span className="font-semibold text-sm text-slate-800 truncate">{c.partner.name}</span>{c.lastMessage && <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(c.lastMessage.createdAt)}</span>}</div>
              <div className="text-xs text-slate-500 truncate">{c.lastMessage?.text || `${c.offeredSkill} ⇄ ${c.wantedSkill}`}</div>
            </div>
          </Link>
        ))}
      </aside>

      <section className={`flex flex-col min-h-0 ${!swapId ? 'hidden md:flex' : ''}`}>
        {!active ? <div className="m-auto text-slate-400 text-sm">Select a chat</div> : (
          <>
            <div className="p-3 border-b border-slate-100 flex items-center gap-3">
              <Link to="/chat" className="md:hidden text-xl px-2">←</Link>
              <Avatar name={active.partner.name} size={38} online={online.includes(String(active.partner._id))} />
              <div className="flex-1">
                <Link to={`/users/${active.partner._id}`} className="font-semibold text-sm hover:text-brand-600">{active.partner.name}</Link>
                <div className="text-xs text-slate-500">{online.includes(String(active.partner._id)) && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 align-middle" />}{online.includes(String(active.partner._id)) ? 'Online' : 'Offline'} · {active.offeredSkill} ⇄ {active.wantedSkill}</div>
              </div>
              <button className="btn-outline px-3" title={online.includes(String(active.partner._id)) ? 'Video call' : 'Partner offline hai'} disabled={!online.includes(String(active.partner._id))} onClick={() => startCall(active.swapId, active.partner)}>📹<span className="hidden sm:inline">Call</span></button>
              <button className="btn-primary" onClick={() => setSchedOpen(true)}>📅<span className="hidden sm:inline">Schedule</span></button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2 bg-slate-50 bg-[radial-gradient(circle_at_1px_1px,rgb(148_163_184/0.18)_1px,transparent_0)] [background-size:20px_20px]">
              {messages.length === 0 && <div className="text-center mt-16"><div className="text-5xl animate-float">👋</div><div className="text-sm text-slate-500 mt-2">Say hi and plan your first session!</div></div>}
              {messages.map((m) => {
                const mine = String(m.sender) === String(user._id);
                return (
                  <div key={m._id} className={`flex animate-fade-up ${mine ? 'justify-end' : 'justify-start'}`} style={{ animationDuration: '.25s' }}>
                    <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm break-words ${mine ? 'bg-gradient-to-br from-brand-600 to-violet-600 text-white rounded-br-md shadow-md shadow-brand-500/20' : 'bg-white dark:bg-slate-700 text-slate-800 border border-slate-200 rounded-bl-md shadow-sm'}`}>
                      {m.text}
                      <div className={`text-[10px] mt-0.5 ${mine ? 'text-brand-100' : 'text-slate-400'}`}>{timeAgo(m.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div className="flex items-center gap-1 bg-white dark:bg-slate-700 border border-slate-200 w-fit px-3 py-2.5 rounded-2xl rounded-bl-md animate-fade-in">
                  {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              )}
              <div ref={bottom} />
            </div>
            <form onSubmit={send} className="p-3 border-t border-slate-100 flex gap-2">
              <input className="input" placeholder="Type a message…" value={text}
                onChange={(e) => { setText(e.target.value); socket?.emit('chat:typing', { swapId }); }} />
              <button className="btn-primary px-5" disabled={!text.trim()}>Send ➤</button>
            </form>
          </>
        )}
      </section>

      <Modal open={schedOpen} onClose={() => setSchedOpen(false)} title="Schedule a session">
        <form onSubmit={schedule} className="space-y-4">
          <div><label className="label">Date & time</label><input type="datetime-local" className="input" required value={sched.date} onChange={(e) => setSched({ ...sched, date: e.target.value })} /></div>
          <div>
            <label className="label">Duration</label>
            <select className="input" value={sched.duration} onChange={(e) => setSched({ ...sched, duration: e.target.value })}>
              {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} hour${m > 60 ? 's' : ''}`}</option>)}
            </select>
          </div>
          <div><label className="label">Meet link (optional)</label><input className="input" placeholder="https://meet.google.com/..." value={sched.meetLink} onChange={(e) => setSched({ ...sched, meetLink: e.target.value })} /></div>
          <button className="btn-primary w-full">Schedule</button>
        </form>
      </Modal>
    </div>
  );
}
