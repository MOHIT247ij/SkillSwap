import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [online, setOnline] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((text, type = 'info') => {
    setToast({ text, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch { /* ignore */ }
  }, []);

  // Restore session on refresh
  useEffect(() => {
    const token = localStorage.getItem('ss_token');
    if (!token) return setLoading(false);
    api.get('/auth/me').then(({ data }) => setUser(data)).catch(() => localStorage.removeItem('ss_token')).finally(() => setLoading(false));
  }, []);

  // Socket connection when logged in
  useEffect(() => {
    if (!user) return;
    const s = io({ auth: { token: localStorage.getItem('ss_token') } });
    s.on('presence', setOnline);
    s.on('notification', (n) => {
      setNotifications((prev) => [n, ...prev]);
      showToast(n.text);
    });
    setSocket(s);
    loadNotifications();
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSession = (data) => {
    localStorage.setItem('ss_token', data.token);
    setUser(data.user);
  };
  const login = async (email, password) => saveSession((await api.post('/auth/login', { email, password })).data);
  const register = async (payload) => saveSession((await api.post('/auth/register', payload)).data);
  // Google button se mila credential backend ko bhejo; returns true if naya account bana
  const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    saveSession(data);
    return data.isNew;
  };
  const logout = () => {
    localStorage.removeItem('ss_token');
    setUser(null);
    setNotifications([]);
  };
  const markAllRead = async () => {
    await api.patch('/notifications/read');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, googleLogin, logout, socket, online, notifications, markAllRead, toast, showToast }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
