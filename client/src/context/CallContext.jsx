import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { Avatar } from '../components/UI';

/*
  WebRTC video call (peer-to-peer)
  1. Caller "call:invite" bhejta hai → partner ke paas ring hota hai
  2. Partner accept karta hai → caller WebRTC "offer" banata hai
  3. Partner "answer" bhejta hai, dono ICE candidates exchange karte hain
  4. Connection ban gaya → video/audio seedha browser se browser jaata hai
  Socket.io sirf signaling (in messages ko pahunchane) ke liye use hota hai.
*/
const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };
const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { socket, showToast, user } = useAuth();
  const [call, setCall] = useState(null); // { status: outgoing|incoming|connecting|active, swapId, partner, peer, startedAt }
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [now, setNow] = useState(Date.now());
  const callRef = useRef(null);
  const pcRef = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const pending = useRef([]);
  const ringTimer = useRef(null);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  useEffect(() => { callRef.current = call; }, [call]);

  const cleanup = useCallback(() => {
    clearTimeout(ringTimer.current);
    pcRef.current?.close();
    pcRef.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    remoteStream.current = null;
    pending.current = [];
    setCall(null);
    setMuted(false);
    setCamOff(false);
  }, []);

  const getMedia = async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Is browser mein camera support nahi hai');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.current = stream;
    return stream;
  };

  const createPC = useCallback((swapId, peer) => {
    const pc = new RTCPeerConnection(ICE);
    localStream.current?.getTracks().forEach((t) => pc.addTrack(t, localStream.current));
    pc.onicecandidate = (e) => {
      if (e.candidate) socket?.emit('webrtc:signal', { swapId, to: peer, data: { candidate: e.candidate } });
    };
    pc.ontrack = (e) => {
      remoteStream.current = e.streams[0];
      if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
      setCall((c) => (c ? { ...c, status: 'active', startedAt: c.startedAt || Date.now() } : c));
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        showToast('Connection failed. Network check karo.', 'error');
        cleanup();
      }
    };
    pcRef.current = pc;
    return pc;
  }, [socket, showToast, cleanup]);

  const flushCandidates = async () => {
    const pc = pcRef.current;
    for (const c of pending.current) await pc.addIceCandidate(c).catch(() => {});
    pending.current = [];
  };

  // ---------- Socket listeners ----------
  useEffect(() => {
    if (!socket) return undefined;
    const busy = () => !!callRef.current;

    const onIncoming = ({ swapId, socketId, from }) => {
      if (busy()) return socket.emit('call:decline', { swapId, to: socketId });
      setCall({ status: 'incoming', swapId, peer: socketId, partner: { _id: from.id, name: from.name, avatar: from.avatar } });
    };
    const onUnavailable = () => { showToast('Partner abhi online nahi hai 😕', 'error'); cleanup(); };
    const onCancelled = ({ swapId }) => {
      const c = callRef.current;
      if (c && String(c.swapId) === String(swapId) && c.status === 'incoming') { showToast(`📞 Missed call from ${c.partner.name}`); cleanup(); }
    };
    const onAccepted = async ({ swapId, socketId }) => {
      const c = callRef.current;
      if (!c || c.status !== 'outgoing' || String(c.swapId) !== String(swapId)) return;
      clearTimeout(ringTimer.current);
      setCall({ ...c, status: 'connecting', peer: socketId });
      const pc = createPC(swapId, socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc:signal', { swapId, to: socketId, data: { sdp: pc.localDescription } });
    };
    const onDeclined = () => { showToast('Call declined', 'error'); cleanup(); };
    const onEnded = () => { showToast('Call ended 👋'); cleanup(); };
    const onSignal = async ({ swapId, from, data }) => {
      const c = callRef.current;
      if (!c || String(c.swapId) !== String(swapId)) return;
      try {
        if (data.sdp?.type === 'offer') {
          const pc = pcRef.current || createPC(swapId, from);
          await pc.setRemoteDescription(data.sdp);
          await flushCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc:signal', { swapId, to: from, data: { sdp: pc.localDescription } });
        } else if (data.sdp?.type === 'answer') {
          await pcRef.current?.setRemoteDescription(data.sdp);
          await flushCandidates();
        } else if (data.candidate) {
          const pc = pcRef.current;
          if (pc && pc.remoteDescription) await pc.addIceCandidate(data.candidate);
          else pending.current.push(data.candidate); // offer/answer se pehle aaya toh queue
        }
      } catch (err) {
        console.error('WebRTC signal error', err);
      }
    };

    socket.on('call:incoming', onIncoming);
    socket.on('call:unavailable', onUnavailable);
    socket.on('call:cancelled', onCancelled);
    socket.on('call:accepted', onAccepted);
    socket.on('call:declined', onDeclined);
    socket.on('call:ended', onEnded);
    socket.on('webrtc:signal', onSignal);
    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:unavailable', onUnavailable);
      socket.off('call:cancelled', onCancelled);
      socket.off('call:accepted', onAccepted);
      socket.off('call:declined', onDeclined);
      socket.off('call:ended', onEnded);
      socket.off('webrtc:signal', onSignal);
    };
  }, [socket, createPC, cleanup, showToast]);

  // Logout / socket gone → end call
  useEffect(() => { if (!user) cleanup(); }, [user, cleanup]);

  // Attach streams to <video> elements whenever the overlay re-renders
  useEffect(() => {
    if (localVideo.current && localStream.current && localVideo.current.srcObject !== localStream.current) localVideo.current.srcObject = localStream.current;
    if (remoteVideo.current && remoteStream.current && remoteVideo.current.srcObject !== remoteStream.current) remoteVideo.current.srcObject = remoteStream.current;
  });

  // Timer tick during active call
  useEffect(() => {
    if (call?.status !== 'active') return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [call?.status]);

  // ---------- Actions ----------
  const startCall = async (swapId, partner) => {
    if (callRef.current) return;
    if (!socket?.connected) return showToast('Server se connection nahi hai', 'error');
    try {
      await getMedia();
    } catch {
      return showToast('Camera/mic ki permission chahiye 🎥', 'error');
    }
    setCall({ status: 'outgoing', swapId, partner });
    socket.emit('call:invite', { swapId });
    ringTimer.current = setTimeout(() => {
      if (callRef.current?.status === 'outgoing') {
        socket.emit('call:cancel', { swapId });
        showToast('No answer 📵');
        cleanup();
      }
    }, 30000);
  };

  const accept = async () => {
    const c = callRef.current;
    if (!c) return;
    try {
      await getMedia();
    } catch {
      showToast('Camera/mic ki permission chahiye 🎥', 'error');
      socket.emit('call:decline', { swapId: c.swapId, to: c.peer });
      return cleanup();
    }
    setCall({ ...c, status: 'connecting' });
    socket.emit('call:accept', { swapId: c.swapId, to: c.peer });
  };

  const decline = () => {
    const c = callRef.current;
    if (c) socket?.emit('call:decline', { swapId: c.swapId, to: c.peer });
    cleanup();
  };

  const hangup = () => {
    const c = callRef.current;
    if (c?.status === 'outgoing') socket?.emit('call:cancel', { swapId: c.swapId });
    else if (c?.peer) socket?.emit('call:end', { swapId: c.swapId, to: c.peer });
    cleanup();
  };

  const toggleMic = () => {
    localStream.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMuted((m) => !m);
  };
  const toggleCam = () => {
    localStream.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOff((v) => !v);
  };

  const secs = call?.startedAt ? Math.max(0, Math.floor((now - call.startedAt) / 1000)) : 0;
  const timer = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <CallContext.Provider value={{ startCall, inCall: !!call }}>
      {children}

      {call && (
        <div className="fixed inset-0 z-[60] bg-slate-950 text-white flex flex-col animate-fade-in">
          {/* Incoming call */}
          {call.status === 'incoming' && (
            <div className="m-auto text-center p-6">
              <div className="relative w-fit mx-auto">
                <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                <div className="relative rounded-full ring-4 ring-emerald-500"><Avatar name={call.partner.name} size={120} src={call.partner.avatar} /></div>
              </div>
              <h2 className="text-2xl font-extrabold mt-6">{call.partner.name}</h2>
              <p className="text-slate-400 mt-1">📹 Incoming video call…</p>
              <div className="flex gap-10 justify-center mt-10">
                <button onClick={decline} className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-2xl shadow-lg shadow-rose-600/40" title="Decline">✖</button>
                <button onClick={accept} className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-2xl shadow-lg shadow-emerald-500/40 animate-bounce" title="Accept">📞</button>
              </div>
            </div>
          )}

          {/* Outgoing / connecting / active */}
          {call.status !== 'incoming' && (
            <>
              <div className="relative flex-1 bg-black overflow-hidden">
                <video ref={remoteVideo} autoPlay playsInline className={`w-full h-full object-cover ${call.status === 'active' ? '' : 'hidden'}`} />
                {call.status !== 'active' && (
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <div className="relative w-fit mx-auto">
                        <span className="absolute inset-0 rounded-full bg-brand-500/40 animate-ping" />
                        <div className="relative"><Avatar name={call.partner.name} size={110} src={call.partner.avatar} /></div>
                      </div>
                      <h2 className="text-2xl font-extrabold mt-6">{call.partner.name}</h2>
                      <p className="text-slate-400 mt-1">{call.status === 'outgoing' ? 'Calling… 📞' : 'Connecting… 🔄'}</p>
                    </div>
                  </div>
                )}
                {/* Top bar */}
                <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-center gap-3">
                  <span className="font-semibold">{call.partner.name}</span>
                  {call.status === 'active' && <span className="chip bg-rose-600 text-white"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {timer}</span>}
                  <span className="ml-auto text-xs text-slate-300">🔒 Peer-to-peer · SkillSwap</span>
                </div>
                {/* Local preview (picture-in-picture) */}
                <div className="absolute bottom-4 right-4 w-32 sm:w-48 aspect-video rounded-2xl overflow-hidden ring-2 ring-white/20 shadow-2xl bg-slate-800">
                  <video ref={localVideo} autoPlay playsInline muted className={`w-full h-full object-cover -scale-x-100 ${camOff ? 'hidden' : ''}`} />
                  {camOff && <div className="w-full h-full grid place-items-center text-xs text-slate-400">📷 Camera off</div>}
                </div>
              </div>
              {/* Controls */}
              <div className="flex justify-center gap-4 p-5 bg-slate-900">
                <button onClick={toggleMic} className={`w-14 h-14 rounded-full text-xl transition ${muted ? 'bg-white text-slate-900' : 'bg-slate-700 hover:bg-slate-600'}`} title={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🎤'}</button>
                <button onClick={toggleCam} className={`w-14 h-14 rounded-full text-xl transition ${camOff ? 'bg-white text-slate-900' : 'bg-slate-700 hover:bg-slate-600'}`} title={camOff ? 'Camera on' : 'Camera off'}>{camOff ? '🚫' : '📷'}</button>
                <button onClick={hangup} className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-xl shadow-lg shadow-rose-600/40" title="End call">📵</button>
              </div>
            </>
          )}
        </div>
      )}
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
