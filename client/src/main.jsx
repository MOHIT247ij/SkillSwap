import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import UserProfile from './pages/UserProfile';
import MyProfile from './pages/MyProfile';
import Requests from './pages/Requests';
import Chat from './pages/Chat';
import Sessions from './pages/Sessions';
import Trends from './pages/Trends';
import Admin from './pages/Admin';
import SkillBot from './pages/SkillBot';
import Leaderboard from './pages/Leaderboard';
import MyStats from './pages/MyStats';
import { QuizList, QuizTake } from './pages/Quiz';

function Protected({ children, admin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <Landing />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CallProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/explore" element={<Protected><Explore /></Protected>} />
            <Route path="/users/:id" element={<Protected><UserProfile /></Protected>} />
            <Route path="/profile" element={<Protected><MyProfile /></Protected>} />
            <Route path="/requests" element={<Protected><Requests /></Protected>} />
            <Route path="/chat" element={<Protected><Chat /></Protected>} />
            <Route path="/chat/:swapId" element={<Protected><Chat /></Protected>} />
            <Route path="/sessions" element={<Protected><Sessions /></Protected>} />
            <Route path="/ai" element={<Protected><SkillBot /></Protected>} />
            <Route path="/leaderboard" element={<Protected><Leaderboard /></Protected>} />
            <Route path="/stats" element={<Protected><MyStats /></Protected>} />
            <Route path="/quiz" element={<Protected><QuizList /></Protected>} />
            <Route path="/quiz/:skill" element={<Protected><QuizTake /></Protected>} />
            <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </CallProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
