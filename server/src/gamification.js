// Gamification (points, levels, badges, leaderboard) + personal analytics
import { User, SwapRequest, Session, Message, Review } from './models.js';

export const LEVELS = [
  [0, 'Beginner'], [100, 'Learner'], [250, 'Explorer'], [500, 'Mentor'],
  [900, 'Expert'], [1400, 'Master'], [2000, 'Legend'],
];

export function levelFor(points) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1][0]) i++;
  const [min, name] = LEVELS[i];
  const next = LEVELS[i + 1]?.[0] ?? null;
  const progress = next ? Math.round(((points - min) / (next - min)) * 100) : 100;
  return { n: i + 1, name, min, next, progress };
}

// Badge rules: each returns [current, target]
const BADGES = [
  ['profile', '🌱', 'Ready to Swap', 'Add skills you teach and want to learn', (s) => [s.profileDone ? 1 : 0, 1]],
  ['first', '🤝', 'First Swap', 'Complete your first session', (s) => [s.sessions, 1]],
  ['streak', '🔥', 'On Fire', 'Complete 3 sessions', (s) => [s.sessions, 3]],
  ['legend', '🏆', 'Swap Legend', 'Complete 10 sessions', (s) => [s.sessions, 10]],
  ['star', '⭐', 'Top Rated', 'Keep a 4.5+ rating with 2+ reviews', (s) => [s.ratingCount >= 2 && s.rating >= 4.5 ? 1 : 0, 1]],
  ['multi', '🎓', 'Multi-Skilled', 'Offer 3 or more skills', (s) => [s.skillsOffered, 3]],
  ['chat', '💬', 'Conversationalist', 'Send 20 messages', (s) => [s.messages, 20]],
  ['reviewer', '📝', 'Helpful Reviewer', 'Write 3 reviews', (s) => [s.reviewsGiven, 3]],
  ['verified', '✅', 'Verified Teacher', 'Pass a skill quiz', (s) => [s.verified, 1]],
];

const countBy = (rows) => new Map(rows.map((r) => [String(r._id), r.n]));

// Loads everything once and computes stats for all users
async function loadAll() {
  const [users, sessions, reviewsGiven, messages, acceptedSent, acceptedRecv] = await Promise.all([
    User.find({ role: 'user', isBanned: false }).select('name college avatar skillsOffered skillsWanted verifiedSkills rating ratingCount'),
    Session.find({ status: 'completed' }).populate('swap', 'sender receiver offeredSkill wantedSkill').select('participants date duration swap'),
    Review.aggregate([{ $group: { _id: '$reviewer', n: { $sum: 1 } } }]),
    Message.aggregate([{ $group: { _id: '$sender', n: { $sum: 1 } } }]),
    SwapRequest.aggregate([{ $match: { status: 'accepted' } }, { $group: { _id: '$sender', n: { $sum: 1 } } }]),
    SwapRequest.aggregate([{ $match: { status: 'accepted' } }, { $group: { _id: '$receiver', n: { $sum: 1 } } }]),
  ]);
  const rev = countBy(reviewsGiven), msg = countBy(messages), as = countBy(acceptedSent), ar = countBy(acceptedRecv);
  const sessionCount = new Map();
  for (const s of sessions) for (const p of s.participants) sessionCount.set(String(p), (sessionCount.get(String(p)) || 0) + 1);

  const rows = users.map((u) => {
    const id = String(u._id);
    const s = {
      sessions: sessionCount.get(id) || 0,
      accepted: (as.get(id) || 0) + (ar.get(id) || 0),
      reviewsGiven: rev.get(id) || 0,
      messages: msg.get(id) || 0,
      rating: u.rating || 0,
      ratingCount: u.ratingCount || 0,
      skillsOffered: u.skillsOffered.length,
      verified: (u.verifiedSkills || []).length,
      profileDone: u.skillsOffered.length > 0 && u.skillsWanted.length > 0,
    };
    const breakdown = [
      ['Completed sessions', s.sessions * 50],
      ['Accepted swaps', s.accepted * 20],
      ['Reviews written', s.reviewsGiven * 10],
      ['Ratings received', Math.round(s.rating * s.ratingCount * 5)],
      ['Skills offered', Math.min(s.skillsOffered, 5) * 5],
      ['Messages (max 50)', Math.min(s.messages, 50)],
      ['Verified skills', Math.min(s.verified, 5) * 30],
    ].map(([label, points]) => ({ label, points }));
    const points = breakdown.reduce((a, b) => a + b.points, 0);
    const badges = BADGES.map(([key, icon, name, desc, rule]) => {
      const [cur, target] = rule(s);
      return { key, icon, name, desc, earned: cur >= target, progress: Math.min(100, Math.round((cur / target) * 100)) };
    });
    return { user: u, stats: s, points, breakdown, badges, level: levelFor(points) };
  });
  rows.sort((a, b) => b.points - a.points || b.stats.rating - a.stats.rating);
  rows.forEach((r, i) => (r.rank = i + 1));
  return { rows, sessions };
}

export async function leaderboard(meId) {
  const { rows } = await loadAll();
  const shape = (r) => ({
    _id: r.user._id, name: r.user.name, college: r.user.college, avatar: r.user.avatar,
    points: r.points, level: r.level, rank: r.rank, rating: r.stats.rating,
    sessions: r.stats.sessions, badges: r.badges.filter((b) => b.earned).map((b) => b.icon),
  });
  const me = rows.find((r) => String(r.user._id) === String(meId));
  return { top: rows.slice(0, 20).map(shape), me: me ? shape(me) : null, total: rows.length };
}

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export async function personalStats(meId) {
  const { rows, sessions } = await loadAll();
  const me = rows.find((r) => String(r.user._id) === String(meId));
  const id = String(meId);

  // Skills taught / learned from my completed sessions
  const taught = new Map(), learned = new Map();
  let minutes = 0;
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({ key: monthKey(d), month: d.toLocaleDateString('en-IN', { month: 'short' }), sessions: 0, hours: 0 });
  }
  for (const s of sessions) {
    if (!s.participants.map(String).includes(id) || !s.swap) continue;
    const iAmSender = String(s.swap.sender) === id;
    const teach = iAmSender ? s.swap.offeredSkill : s.swap.wantedSkill;
    const learn = iAmSender ? s.swap.wantedSkill : s.swap.offeredSkill;
    taught.set(teach, (taught.get(teach) || 0) + 1);
    learned.set(learn, (learned.get(learn) || 0) + 1);
    const dur = s.duration || 60;
    minutes += dur;
    const m = months.find((x) => x.key === monthKey(new Date(s.date)));
    if (m) { m.sessions += 1; m.hours = Math.round((m.hours + dur / 60) * 10) / 10; }
  }
  const toList = (map) => [...map.entries()].map(([skill, n]) => ({ skill, sessions: n })).sort((a, b) => b.sessions - a.sessions);

  const [sent, received, sentAccepted, receivedAccepted, ratingAgg] = await Promise.all([
    SwapRequest.countDocuments({ sender: meId }),
    SwapRequest.countDocuments({ receiver: meId }),
    SwapRequest.countDocuments({ sender: meId, status: 'accepted' }),
    SwapRequest.countDocuments({ receiver: meId, status: 'accepted' }),
    Review.aggregate([{ $match: { reviewee: me ? me.user._id : null } }, { $group: { _id: '$rating', n: { $sum: 1 } } }]),
  ]);
  const ratingDist = [5, 4, 3, 2, 1].map((stars) => ({ stars: `${stars}★`, count: ratingAgg.find((x) => x._id === stars)?.n || 0 }));

  const s = me?.stats || { sessions: 0, messages: 0, reviewsGiven: 0, rating: 0, ratingCount: 0 };
  return {
    points: me?.points || 0,
    level: me?.level || levelFor(0),
    rank: me?.rank || null,
    totalUsers: rows.length,
    breakdown: me?.breakdown || [],
    badges: me?.badges || BADGES.map(([key, icon, name, desc]) => ({ key, icon, name, desc, earned: false, progress: 0 })),
    totals: {
      sessions: s.sessions,
      hours: Math.round((minutes / 60) * 10) / 10,
      skillsTaught: taught.size,
      skillsLearned: learned.size,
      messages: s.messages,
      reviewsGiven: s.reviewsGiven,
      rating: s.rating,
      ratingCount: s.ratingCount,
    },
    requests: { sent, received, sentAccepted, receivedAccepted, acceptRate: sent ? Math.round((sentAccepted / sent) * 100) : 0 },
    taught: toList(taught),
    learned: toList(learned),
    monthly: months.map(({ key, ...rest }) => rest),
    ratingDist,
  };
}
