import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

// Google Identity Services script ek hi baar load karo
let scriptPromise = null;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => { scriptPromise = null; reject(new Error('Could not load Google script')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

// "Continue with Google" button
export default function GoogleButton({ text = 'continue_with' }) {
  const { googleLogin, showToast } = useAuth();
  const nav = useNavigate();
  const ref = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/config');
        if (!data.googleClientId) return !cancelled && setStatus('missing');
        await loadGoogleScript();
        if (cancelled || !ref.current) return;
        window.google.accounts.id.initialize({
          client_id: data.googleClientId,
          callback: async ({ credential }) => {
            setBusy(true);
            try {
              const isNew = await googleLogin(credential);
              showToast('Signed in with Google ✅', 'success');
              nav(isNew ? '/profile?new=1' : '/');
            } catch (err) {
              showToast(errMsg(err), 'error');
            } finally {
              setBusy(false);
            }
          },
        });
        const dark = document.documentElement.classList.contains('dark');
        window.google.accounts.id.renderButton(ref.current, {
          theme: dark ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text,
          width: Math.min(ref.current.offsetWidth || 320, 400),
          logo_alignment: 'center',
        });
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'missing' || status === 'error') {
    return (
      <button type="button" disabled title={status === 'missing' ? 'Add GOOGLE_CLIENT_ID in server/.env' : 'Google script failed to load'}
        className="btn-outline w-full py-2.5 opacity-60">
        <GoogleLogo /> Continue with Google
        <span className="text-[10px] font-normal text-slate-400">({status === 'missing' ? 'not configured' : 'offline'})</span>
      </button>
    );
  }

  return (
    <div className="relative w-full min-h-[44px] flex justify-center">
      {status === 'loading' && <div className="skeleton absolute inset-0 rounded-full" />}
      <div ref={ref} className={`w-full flex justify-center ${busy ? 'opacity-50 pointer-events-none' : ''}`} />
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
