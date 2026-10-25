import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, SwapRequest, Session, Message, Review, Notification } from './models.js';
import { protect, adminOnly, signToken, ah } from './auth.js';
import { matchScore, suggestSkills, countSkills } from './logic.js';
import { leaderboard, personalStats } from './gamification.js';
import { aiReply, aiMode } from './ai.js';
import { QUIZZES, QUIZ_SIZE, PASS_SCORE, findQuizSkill, buildQuiz } from './quizzes.js';

const r = Router();
const PUBLIC_FIELDS = 'name bio college city avatar skillsOffered skillsWanted verifiedSkills rating ratingCount role createdAt';
const cleanSkills = (arr) =>
  [...new Set((Array.isArray(arr) ? arr : String(arr || '').split(',')).map((s) => String(s).trim()).filter(Boolean))].slice(0, 15);
const isId = (id) => mongoose.isValidObjectId(id);

// io instance is injected from index.js for real-time notifications
let io = null;
export const setIO = (instance) => (io = instance);
export async function notify(userId, text, link = '', type = 'info') {
  const n = await Notification.create({ user: userId, text, link, type });
  io?.to(`user:${userId}`).emit('notification', n);
  return n;
}

const userPayload = (u) => ({
  _id: u._id, name: u.name, email: u.email, avatar: u.avatar, bio: u.bio, college: u.college, city: u.city,
  skillsOffered: u.skillsOffered, skillsWanted: u.skillsWanted, verifiedSkills: u.verifiedSkills || [], rating: u.rating,
  ratingCount: u.ratingCount, role: u.role, createdAt: u.createdAt,
});

/* ---------------- AUTH ---------------- */
r.post('/auth/register', ah(async (req, res) => {
  const { name, email, password, college = '' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, college, password: await bcrypt.hash(password, 10) });
  await notify(user._id, `Welcome to SkillSwap, ${name}! Add your skills to get matches.`, '/profile', 'welcome');
  res.status(201).json({ token: signToken(user), user: userPayload(user) });
}));

r.post('/auth/login', ah(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
  if (user && !user.password) return res.status(400).json({ message: 'This account uses Google sign-in. Click "Continue with Google".' });
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(400).json({ message: 'Invalid email or password' });
  if (user.isBanned) return res.status(403).json({ message: 'Your account has been banned' });
  res.json({ token: signToken(user), user: userPayload(user) });
}));

/* ---------- GOOGLE SIGN-IN ----------
   Frontend Google button se ID token (credential) aata hai.
   Hum Google ke tokeninfo endpoint se verify karte hain, phir user find/create karke apna JWT dete hain. */
r.get('/config', (_req, res) => res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || '' }));

r.post('/auth/google', ah(async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ message: 'Google sign-in is not configured on the server' });
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Missing Google credential' });

  const gRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!gRes.ok) return res.status(401).json({ message: 'Invalid Google token' });
  const g = await gRes.json();
  if (g.aud !== clientId) return res.status(401).json({ message: 'Google token was issued for another app' });
  if (g.email_verified !== 'true' && g.email_verified !== true) return res.status(401).json({ message: 'Google email is not verified' });

  let user = await User.findOne({ $or: [{ googleId: g.sub }, { email: g.email.toLowerCase() }] });
  let isNew = false;
  if (!user) {
    user = await User.create({ name: g.name || g.email.split('@')[0], email: g.email, googleId: g.sub, avatar: g.picture || '' });
    isNew = true;
    await notify(user._id, `Welcome to SkillSwap, ${user.name}! Add your skills to get matches.`, '/profile', 'welcome');
  } else if (!user.googleId) {
    user.googleId = g.sub; // link Google to an existing email account
    if (!user.avatar && g.picture) user.avatar = g.picture;
    await user.save();
  }
  if (user.isBanned) return res.status(403).json({ message: 'Your account has been banned' });
  res.json({ token: signToken(user), user: userPayload(user), isNew });
}));

r.get('/auth/me', protect, (req, res) => res.json(userPayload(req.user)));

/* ---------------- USERS / PROFILE ---------------- */
r.put('/users/me', protect, ah(async (req, res) => {
  const { name, bio, college, city, skillsOffered, skillsWanted } = req.body;
  const u = req.user;
  if (name !== undefined) u.name = String(name).trim() || u.name;
  if (bio !== undefined) u.bio = String(bio).slice(0, 400);
  if (college !== undefined) u.college = college;
  if (city !== undefined) u.city = city;
  if (skillsOffered !== undefined) u.skillsOffered = cleanSkills(skillsOffered);
  if (skillsWanted !== undefined) u.skillsWanted = cleanSkills(skillsWanted);
  await u.save();
  res.json(userPayload(u));
}));

// Explore: search by name/skill
r.get('/users', protect, ah(async (req, res) => {
  const { q = '', skill = '' } = req.query;
  const filter = { _id: { $ne: req.user._id }, isBanned: false, role: 'user' };
  const and = [];
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    and.push({ $or: [{ name: rx }, { skillsOffered: rx }, { skillsWanted: rx }, { college: rx }] });
  }
  if (skill) and.push({ skillsOffered: new RegExp(`^${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (and.length) filter.$and = and;
  const users = await User.find(filter).select(PUBLIC_FIELDS).sort({ rating: -1 }).limit(60);
  res.json(users.map((u) => ({ ...u.toObject(), match: matchScore(req.user, u) })));
}));

r.get('/users/:id', protect, ah(async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'User not found' });
  const user = await User.findById(req.params.id).select(PUBLIC_FIELDS);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const reviews = await Review.find({ reviewee: user._id }).populate('reviewer', 'name').sort({ createdAt: -1 }).limit(20);
  const swapsDone = await Session.countDocuments({ participants: user._id, status: 'completed' });
  res.json({ user, reviews, swapsDone, match: matchScore(req.user, user) });
}));

/* ---------------- MATCHES + SUGGESTIONS ---------------- */
r.get('/matches', protect, ah(async (req, res) => {
  const others = await User.find({ _id: { $ne: req.user._id }, isBanned: false, role: 'user' }).select(PUBLIC_FIELDS);
  const list = others
    .map((u) => ({ user: u, ...matchScore(req.user, u) }))
    .filter((m) => m.theyTeach.length || m.iTeach.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  res.json(list);
}));

r.get('/suggestions', protect, ah(async (req, res) => {
  const all = await User.find({ isBanned: false }).select('skillsWanted skillsOffered');
  res.json(suggestSkills(req.user, all));
}));

r.get('/skills', ah(async (_req, res) => {
  const users = await User.find({ isBanned: false }).select('skillsWanted skillsOffered');
  const set = new Map();
  for (const u of users) for (const s of [...u.skillsOffered, ...u.skillsWanted]) set.set(s.toLowerCase(), s);
  res.json([...set.values()].sort((a, b) => a.localeCompare(b)));
}));

/* ---------------- PUBLIC TRENDS (data dashboard) ---------------- */
async function weeklySwaps(weeks = 8) {
  const since = new Date(Date.now() - weeks * 7 * 864e5);
  const swaps = await SwapRequest.find({ createdAt: { $gte: since } }).select('createdAt status');
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(Date.now() - (i + 1) * 7 * 864e5);
    const end = new Date(Date.now() - i * 7 * 864e5);
    const inWeek = swaps.filter((s) => s.createdAt >= start && s.createdAt < end);
    buckets.push({
      week: start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      requests: inWeek.length,
      accepted: inWeek.filter((s) => s.status === 'accepted').length,
    });
  }
  return buckets;
}

r.get('/trends', ah(async (_req, res) => {
  const users = await User.find({ isBanned: false, role: 'user' }).select('skillsWanted skillsOffered');
  const wanted = countSkills(users, 'skillsWanted');
  const offered = countSkills(users, 'skillsOffered');
  const offeredMap = new Map(offered.map((o) => [o.skill.toLowerCase(), o.count]));
  // Demand gap: skills many people want but few teach -> opportunity to teach
  const gap = wanted
    .map((w) => ({ skill: w.skill, wanted: w.count, offered: offeredMap.get(w.skill.toLowerCase()) || 0 }))
    .map((g) => ({ ...g, gap: g.wanted - g.offered }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 8);
  const [totalUsers, totalSwaps, completedSessions] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    SwapRequest.countDocuments(),
    Session.countDocuments({ status: 'completed' }),
  ]);
  res.json({
    totals: { users: totalUsers, swaps: totalSwaps, sessions: completedSessions, skills: new Set([...wanted, ...offered].map((s) => s.skill.toLowerCase())).size },
    topWanted: wanted.slice(0, 10),
    topOffered: offered.slice(0, 10),
    gap,
    weekly: await weeklySwaps(),
  });
}));

/* ---------------- SWAP REQUESTS ---------------- */
r.post('/swaps', protect, ah(async (req, res) => {
  const { receiver, offeredSkill, wantedSkill, message = '' } = req.body;
  if (!isId(receiver) || String(receiver) === String(req.user._id)) return res.status(400).json({ message: 'Invalid receiver' });
  if (!offeredSkill || !wantedSkill) return res.status(400).json({ message: 'Choose both skills' });
  const other = await User.findById(receiver);
  if (!other || other.isBanned) return res.status(404).json({ message: 'User not found' });
  const exists = await SwapRequest.findOne({
    status: 'pending',
    $or: [{ sender: req.user._id, receiver }, { sender: receiver, receiver: req.user._id }],
  });
  if (exists) return res.status(400).json({ message: 'A pending request already exists with this user' });
  const swap = await SwapRequest.create({ sender: req.user._id, receiver, offeredSkill, wantedSkill, message });
  await notify(receiver, `${req.user.name} wants to swap ${offeredSkill} for your ${wantedSkill}`, '/requests', 'request');
  res.status(201).json(swap);
}));

r.get('/swaps', protect, ah(async (req, res) => {
  const pop = (q) => q.populate('sender', 'name college rating').populate('receiver', 'name college rating').sort({ createdAt: -1 });
  const [received, sent] = await Promise.all([
    pop(SwapRequest.find({ receiver: req.user._id })),
    pop(SwapRequest.find({ sender: req.user._id })),
  ]);
  res.json({ received, sent });
}));

r.patch('/swaps/:id', protect, ah(async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const swap = await SwapRequest.findById(req.params.id);
  if (!swap) return res.status(404).json({ message: 'Request not found' });
  if (String(swap.receiver) !== String(req.user._id)) return res.status(403).json({ message: 'Only the receiver can respond' });
  if (swap.status !== 'pending') return res.status(400).json({ message: 'Request already handled' });
  swap.status = status;
  await swap.save();
  await notify(
    swap.sender,
    status === 'accepted' ? `${req.user.name} accepted your swap request! Start chatting.` : `${req.user.name} declined your swap request.`,
    status === 'accepted' ? `/chat/${swap._id}` : '/requests',
    status
  );
  res.json(swap);
}));

/* ---------------- CHAT ---------------- */
async function assertParticipant(swapId, userId) {
  if (!isId(swapId)) return null;
  const swap = await SwapRequest.findById(swapId);
  if (!swap || swap.status !== 'accepted') return null;
  const ok = [String(swap.sender), String(swap.receiver)].includes(String(userId));
  return ok ? swap : null;
}
export { assertParticipant };

r.get('/chats', protect, ah(async (req, res) => {
  const swaps = await SwapRequest.find({ status: 'accepted', $or: [{ sender: req.user._id }, { receiver: req.user._id }] })
    .populate('sender', 'name').populate('receiver', 'name').sort({ updatedAt: -1 });
  const chats = await Promise.all(swaps.map(async (s) => {
    const partner = String(s.sender._id) === String(req.user._id) ? s.receiver : s.sender;
    const last = await Message.findOne({ swap: s._id }).sort({ createdAt: -1 });
    return { swapId: s._id, partner, offeredSkill: s.offeredSkill, wantedSkill: s.wantedSkill, lastMessage: last, updatedAt: last?.createdAt || s.updatedAt };
  }));
  chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(chats);
}));

r.get('/chats/:swapId/messages', protect, ah(async (req, res) => {
  const swap = await assertParticipant(req.params.swapId, req.user._id);
  if (!swap) return res.status(403).json({ message: 'Not part of this chat' });
  const messages = await Message.find({ swap: swap._id }).sort({ createdAt: 1 }).limit(500);
  res.json(messages);
}));

export async function saveMessage(swap, sender, text) {
  const msg = await Message.create({ swap: swap._id, sender: sender._id, text: String(text).slice(0, 2000) });
  for (const uid of [swap.sender, swap.receiver]) io?.to(`user:${uid}`).emit('chat:message', msg);
  return msg;
}

r.post('/chats/:swapId/messages', protect, ah(async (req, res) => {
  const swap = await assertParticipant(req.params.swapId, req.user._id);
  if (!swap) return res.status(403).json({ message: 'Not part of this chat' });
  if (!String(req.body.text || '').trim()) return res.status(400).json({ message: 'Empty message' });
  res.status(201).json(await saveMessage(swap, req.user, req.body.text));
}));

/* ---------------- SESSIONS ---------------- */
r.post('/sessions', protect, ah(async (req, res) => {
  const { swapId, date, meetLink = '', title = '', duration = 60 } = req.body;
  const swap = await assertParticipant(swapId, req.user._id);
  if (!swap) return res.status(403).json({ message: 'You can schedule only for accepted swaps' });
  const when = new Date(date);
  if (isNaN(when)) return res.status(400).json({ message: 'Invalid date' });
  const session = await Session.create({
    swap: swap._id, participants: [swap.sender, swap.receiver], date: when, meetLink,
    duration: Math.min(240, Math.max(15, Number(duration) || 60)),
    title: title || `${swap.offeredSkill} ⇄ ${swap.wantedSkill}`, createdBy: req.user._id,
  });
  const partner = String(swap.sender) === String(req.user._id) ? swap.receiver : swap.sender;
  await notify(partner, `${req.user.name} scheduled a session on ${when.toLocaleString('en-IN')}`, '/sessions', 'session');
  res.status(201).json(session);
}));

r.get('/sessions', protect, ah(async (req, res) => {
  const sessions = await Session.find({ participants: req.user._id }).populate('participants', 'name').sort({ date: 1 });
  const myReviews = await Review.find({ reviewer: req.user._id }).select('session');
  const reviewed = new Set(myReviews.map((r2) => String(r2.session)));
  res.json(sessions.map((s) => ({ ...s.toObject(), reviewedByMe: reviewed.has(String(s._id)) })));
}));

r.patch('/sessions/:id', protect, ah(async (req, res) => {
  const { status } = req.body;
  if (!['completed', 'cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const s = await Session.findById(req.params.id);
  if (!s || !s.participants.map(String).includes(String(req.user._id))) return res.status(404).json({ message: 'Session not found' });
  s.status = status;
  await s.save();
  for (const p of s.participants) {
    if (String(p) !== String(req.user._id))
      await notify(p, `Session "${s.title}" was marked ${status} by ${req.user.name}`, '/sessions', 'session');
  }
  res.json(s);
}));

/* ---------------- REVIEWS ---------------- */
async function recalcRating(userId) {
  const agg = await Review.aggregate([{ $match: { reviewee: new mongoose.Types.ObjectId(String(userId)) } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
  const { avg = 0, n = 0 } = agg[0] || {};
  await User.findByIdAndUpdate(userId, { rating: Math.round(avg * 10) / 10, ratingCount: n });
}
export { recalcRating };

r.post('/reviews', protect, ah(async (req, res) => {
  const { sessionId, rating, comment = '' } = req.body;
  const s = isId(sessionId) && (await Session.findById(sessionId));
  if (!s || !s.participants.map(String).includes(String(req.user._id))) return res.status(404).json({ message: 'Session not found' });
  if (s.status !== 'completed') return res.status(400).json({ message: 'You can review only completed sessions' });
  const n = Number(rating);
  if (!(n >= 1 && n <= 5)) return res.status(400).json({ message: 'Rating must be 1-5' });
  const reviewee = s.participants.find((p) => String(p) !== String(req.user._id));
  if (await Review.findOne({ session: s._id, reviewer: req.user._id })) return res.status(400).json({ message: 'Already reviewed' });
  const review = await Review.create({ session: s._id, reviewer: req.user._id, reviewee, rating: n, comment });
  await recalcRating(reviewee);
  await notify(reviewee, `${req.user.name} rated you ${n}★`, `/users/${reviewee}`, 'review');
  res.status(201).json(review);
}));

/* ---------------- GAMIFICATION + ANALYTICS ---------------- */
r.get('/leaderboard', protect, ah(async (req, res) => res.json(await leaderboard(req.user._id))));
r.get('/me/stats', protect, ah(async (req, res) => res.json(await personalStats(req.user._id))));

/* ---------------- AI SKILLBOT ---------------- */
r.get('/ai/status', protect, (_req, res) => res.json({ mode: aiMode() }));
r.post('/ai/chat', protect, ah(async (req, res) => res.json(await aiReply(req.user, req.body.messages))));

/* ---------------- SKILL QUIZ (verification) ---------------- */
const attempts = new Map(); // attemptId -> { userId, skill, key, expires }
const lastFail = new Map(); // `${userId}:${skill}` -> timestamp
const COOLDOWN_MS = 2 * 60 * 1000;

r.get('/quiz', protect, (req, res) => {
  const verified = new Set((req.user.verifiedSkills || []).map((s) => s.toLowerCase()));
  const offered = new Set(req.user.skillsOffered.map((s) => s.toLowerCase()));
  res.json({
    passScore: PASS_SCORE,
    size: QUIZ_SIZE,
    skills: Object.keys(QUIZZES).map((skill) => ({ skill, verified: verified.has(skill.toLowerCase()), offered: offered.has(skill.toLowerCase()) })),
  });
});

r.post('/quiz/:skill/start', protect, (req, res) => {
  const skill = findQuizSkill(req.params.skill);
  if (!skill) return res.status(404).json({ message: 'No quiz for this skill yet' });
  const failedAt = lastFail.get(`${req.user._id}:${skill}`);
  if (failedAt && Date.now() - failedAt < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (Date.now() - failedAt)) / 1000);
    return res.status(429).json({ message: `Dobara try karne ke liye ${wait} second ruko` });
  }
  const quiz = buildQuiz(skill);
  const attemptId = `${req.user._id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  attempts.set(attemptId, { userId: String(req.user._id), skill, key: quiz.map((x) => x.a), expires: Date.now() + 15 * 60 * 1000 });
  res.json({ attemptId, skill, questions: quiz.map(({ q, o }) => ({ q, o })), timeLimit: 300 });
});

r.post('/quiz/submit', protect, ah(async (req, res) => {
  const { attemptId, answers = [] } = req.body;
  const att = attempts.get(attemptId);
  if (!att || att.userId !== String(req.user._id)) return res.status(400).json({ message: 'Quiz attempt not found. Dobara start karo.' });
  attempts.delete(attemptId);
  if (Date.now() > att.expires) return res.status(400).json({ message: 'Time over! Dobara try karo.' });

  const score = att.key.reduce((n, correct, i) => n + (Number(answers[i]) === correct ? 1 : 0), 0);
  const passed = score >= PASS_SCORE;
  if (passed) {
    const u = req.user;
    if (!u.verifiedSkills.some((s) => s.toLowerCase() === att.skill.toLowerCase())) u.verifiedSkills.push(att.skill);
    if (!u.skillsOffered.some((s) => s.toLowerCase() === att.skill.toLowerCase())) u.skillsOffered.push(att.skill);
    await u.save();
    await notify(u._id, `🎓 You're now a Verified ${att.skill} teacher! (${score}/${att.key.length})`, '/quiz', 'verified');
  } else {
    lastFail.set(`${req.user._id}:${att.skill}`, Date.now());
  }
  res.json({ skill: att.skill, score, total: att.key.length, passed, correct: att.key, user: passed ? userPayload(req.user) : undefined });
}));

/* ---------------- NOTIFICATIONS ---------------- */
r.get('/notifications', protect, ah(async (req, res) => {
  res.json(await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30));
}));
r.patch('/notifications/read', protect, ah(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ ok: true });
}));

/* ---------------- ADMIN ---------------- */
r.get('/admin/stats', protect, adminOnly, ah(async (_req, res) => {
  const [users, banned, swaps, accepted, pending, sessions, completed, reviews] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ isBanned: true }),
    SwapRequest.countDocuments(),
    SwapRequest.countDocuments({ status: 'accepted' }),
    SwapRequest.countDocuments({ status: 'pending' }),
    Session.countDocuments(),
    Session.countDocuments({ status: 'completed' }),
    Review.countDocuments(),
  ]);
  const all = await User.find({ role: 'user' }).select('skillsWanted skillsOffered college createdAt');
  const colleges = Object.entries(all.reduce((m, u) => ((m[u.college || 'Unknown'] = (m[u.college || 'Unknown'] || 0) + 1), m), {}))
    .map(([college, count]) => ({ college, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  const avg = await Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]);
  res.json({
    totals: { users, banned, swaps, accepted, pending, sessions, completed, reviews, acceptRate: swaps ? Math.round((accepted / swaps) * 100) : 0, avgRating: Math.round((avg[0]?.avg || 0) * 10) / 10 },
    topWanted: countSkills(all, 'skillsWanted').slice(0, 8),
    topOffered: countSkills(all, 'skillsOffered').slice(0, 8),
    colleges,
    weekly: await weeklySwaps(),
  });
}));

r.get('/admin/users', protect, adminOnly, ah(async (_req, res) => {
  res.json(await User.find().select('name email college role isBanned rating ratingCount skillsOffered skillsWanted createdAt').sort({ createdAt: -1 }));
}));

r.patch('/admin/users/:id/ban', protect, adminOnly, ah(async (req, res) => {
  const u = isId(req.params.id) && (await User.findById(req.params.id));
  if (!u) return res.status(404).json({ message: 'User not found' });
  if (u.role === 'admin') return res.status(400).json({ message: 'Cannot ban an admin' });
  u.isBanned = !u.isBanned;
  await u.save();
  res.json({ _id: u._id, isBanned: u.isBanned });
}));

// CSV export (Excel / Power BI mein analyse karne ke liye)
const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join('; ') : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCSV = (rows) => {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  return [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\r\n');
};

r.get('/admin/export/:type', protect, adminOnly, ah(async (req, res) => {
  const { type } = req.params;
  let rows;
  if (type === 'users') {
    const list = await User.find({ role: 'user' }).sort({ createdAt: 1 });
    rows = list.map((u) => ({
      user_id: u._id, name: u.name, email: u.email, college: u.college, city: u.city,
      skills_offered: u.skillsOffered, skills_wanted: u.skillsWanted, verified_skills: u.verifiedSkills,
      offered_count: u.skillsOffered.length, wanted_count: u.skillsWanted.length,
      rating: u.rating, rating_count: u.ratingCount, is_banned: u.isBanned, google_login: !!u.googleId, joined_at: u.createdAt,
    }));
  } else if (type === 'swaps') {
    const list = await SwapRequest.find().populate('sender', 'name college').populate('receiver', 'name college').sort({ createdAt: 1 });
    rows = list.map((s) => ({
      swap_id: s._id, sender: s.sender?.name, sender_college: s.sender?.college, receiver: s.receiver?.name, receiver_college: s.receiver?.college,
      offered_skill: s.offeredSkill, wanted_skill: s.wantedSkill, status: s.status, created_at: s.createdAt, updated_at: s.updatedAt,
    }));
  } else if (type === 'sessions') {
    const list = await Session.find().populate('participants', 'name').sort({ date: 1 });
    rows = list.map((s) => ({
      session_id: s._id, title: s.title, participant_1: s.participants[0]?.name, participant_2: s.participants[1]?.name,
      date: s.date, duration_min: s.duration || 60, status: s.status, created_at: s.createdAt,
    }));
  } else if (type === 'reviews') {
    const list = await Review.find().populate('reviewer', 'name').populate('reviewee', 'name').sort({ createdAt: 1 });
    rows = list.map((rv) => ({ review_id: rv._id, reviewer: rv.reviewer?.name, reviewee: rv.reviewee?.name, rating: rv.rating, comment: rv.comment, created_at: rv.createdAt }));
  } else {
    return res.status(400).json({ message: 'Unknown export type' });
  }
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="skillswap_${type}_${date}.csv"`);
  res.send('\uFEFF' + toCSV(rows)); // BOM so Excel opens UTF-8 correctly
}));

r.get('/admin/reviews', protect, adminOnly, ah(async (_req, res) => {
  res.json(await Review.find().populate('reviewer', 'name').populate('reviewee', 'name').sort({ createdAt: -1 }).limit(100));
}));

r.delete('/admin/reviews/:id', protect, adminOnly, ah(async (req, res) => {
  const rev = isId(req.params.id) && (await Review.findByIdAndDelete(req.params.id));
  if (!rev) return res.status(404).json({ message: 'Review not found' });
  await recalcRating(rev.reviewee);
  res.json({ ok: true });
}));

export default r;
