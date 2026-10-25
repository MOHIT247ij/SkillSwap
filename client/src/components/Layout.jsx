import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme';
import { Avatar, timeAgo } from './UI';

const userLinks = [
  ['/dashboard', 'Dashboard', '🏠'], ['/explore', 'Explore', '🔍'], ['/requests', 'Requests', '📥'],
  ['/chat', 'Chat', '💬'], ['/ai', 'SkillBot', '🤖'], ['/sessions', 'Sessions', '📅'],
  ['/leaderboard', 'Leaderboard', '🏆'], ['/trends', 'Trends', '📈'],
];
const notifIcon = { request: '📥', accepted: '✅', rejected: '❌', session: '📅', review: '⭐', welcome: '🎉' };

// Closes a dropdown when clicking outside of it
function useOutside(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return ref;
}

export default function Layout() {
  const { user, logout, notifications, markAllRead, toast } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const [openBell, setOpenBell] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const nav = useNavigate();
  const location = useLocation();
  const bellRef = useOutside(() => setOpenBell(false));
  const menuRef = useOutside(() => setOpenMenu(false));
  const unread = notifications.filter((n) => !n.isRead).length;
  const links = user?.role === 'admin' ? [['/admin', 'Admin', '🛡️'], ['/trends', 'Trends', '📈']] : user ? userLinks : [['/trends', 'Trends', '📈']];

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkCls = ({ isActive }) =>
    `relative px-2.5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${isActive ? 'text-brand-600 bg-brand-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`sticky top-0 z-40 glass border-b transition-shadow ${scrolled ? 'border-slate-200 shadow-sm' : 'border-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg text-slate-900 group">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white grid place-items-center shadow-lg shadow-brand-500/30 transition group-hover:rotate-180 duration-500">⇄</span>
            <span>Skill<span className="gradient-text">Swap</span></span>
          </Link>
          <nav className="hidden lg:flex gap-0.5 ml-2">
            {links.map(([to, label]) => <NavLink key={to} to={to} className={linkCls}>{label}</NavLink>)}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full hover:bg-slate-100 grid place-items-center text-lg transition" aria-label="Toggle theme" title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user ? (
              <>
                <div className="relative" ref={bellRef}>
                  <button className="relative w-10 h-10 rounded-full hover:bg-slate-100 grid place-items-center text-lg" onClick={() => setOpenBell((v) => !v)} aria-label="Notifications">
                    🔔
                    {unread > 0 && <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center animate-scale-in">{unread}</span>}
                  </button>
                  {openBell && (
                    <div className="absolute right-0 mt-2 w-80 card p-2 max-h-[420px] overflow-auto shadow-xl animate-scale-in origin-top-right">
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="font-bold text-sm">Notifications</span>
                        {unread > 0 && <button className="text-xs text-brand-600 font-semibold" onClick={markAllRead}>Mark all read</button>}
                      </div>
                      {notifications.length === 0 && <div className="text-sm text-slate-500 p-6 text-center">🔕 No notifications yet</div>}
                      {notifications.map((n) => (
                        <button key={n._id} onClick={() => { setOpenBell(false); n.link && nav(n.link); }}
                          className={`w-full flex gap-2.5 text-left p-2.5 rounded-xl text-sm hover:bg-slate-50 transition ${n.isRead ? 'text-slate-500' : 'text-slate-800'}`}>
                          <span className="text-base">{notifIcon[n.type] || '🔔'}</span>
                          <span className="flex-1">
                            {n.text}
                            <span className="block text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                          </span>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setOpenMenu((v) => !v)} className="flex items-center gap-2 rounded-full hover:bg-slate-100 p-1 pr-3 transition">
                    <Avatar name={user.name} size={32} src={user.avatar} />
                    <span className="hidden sm:block text-sm font-semibold">{user.name.split(' ')[0]}</span>
                    <span className="text-xs text-slate-400">▾</span>
                  </button>
                  {openMenu && (
                    <div className="absolute right-0 mt-2 w-56 card p-1.5 shadow-xl animate-scale-in origin-top-right" onClick={() => setOpenMenu(false)}>
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <div className="font-semibold text-sm">{user.name}</div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      </div>
                      {user.role !== 'admin' && <Link to="/profile" className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50">👤 My Profile</Link>}
                      {user.role !== 'admin' && <Link to={`/users/${user._id}`} className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50">🌐 Public Profile</Link>}
                      {user.role !== 'admin' && <Link to="/stats" className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50">📊 My Stats</Link>}
                      {user.role !== 'admin' && <Link to="/quiz" className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50">🎓 Skill Quiz</Link>}
                      <div className="lg:hidden border-t border-slate-100 mt-1 pt-1">
                        {links.map(([to, label, icon]) => <Link key={to} to={to} className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-50">{icon} {label}</Link>)}
                      </div>
                      <button onClick={() => { logout(); nav('/'); }} className="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50">🚪 Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Login</Link>
                <Link to="/register" className="btn-primary">Join Free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main key={location.pathname.split('/')[1]} className={`flex-1 w-full max-w-6xl mx-auto px-4 py-6 animate-fade-up ${user ? 'pb-24 lg:pb-6' : ''}`}>
        <Outlet />
      </main>

      <footer className="hidden lg:block text-center text-xs text-slate-400 py-6">
        SkillSwap © {new Date().getFullYear()} · Built with ❤️ using MERN + Socket.io
      </footer>

      {/* Mobile bottom navigation */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-slate-200 flex justify-around py-1.5">
          {(user.role === 'admin' ? links : [links[0], links[1], links[3], links[4], links[6]]).map(([to, label, icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-medium ${isActive ? 'text-brand-600' : 'text-slate-500'}`}>
              <span className="text-lg leading-none">{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
      )}

      {toast && (
        <div className={`fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-sm text-white max-w-sm animate-slide-in
          ${toast.type === 'error' ? 'bg-rose-600' : toast.type === 'success' ? 'bg-emerald-600' : 'bg-slate-900 ring-1 ring-white/10'}`}>
          <span>{toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✅' : '🔔'}</span>
          {toast.text}
        </div>
      )}
    </div>
  );
}
