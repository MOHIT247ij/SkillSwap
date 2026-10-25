// Matching + AI-style skill suggestion logic

const norm = (s) => String(s || '').trim().toLowerCase();
const toSet = (arr) => new Set((arr || []).map(norm));

/**
 * Two-way match score:
 *  - theyTeach: skills they offer that I want
 *  - iTeach:    skills I offer that they want
 * Perfect swap = both > 0 (bonus).
 */
export function matchScore(me, other) {
  const myWanted = toSet(me.skillsWanted);
  const myOffered = toSet(me.skillsOffered);
  const theyTeach = (other.skillsOffered || []).filter((s) => myWanted.has(norm(s)));
  const iTeach = (other.skillsWanted || []).filter((s) => myOffered.has(norm(s)));
  let score = theyTeach.length * 2 + iTeach.length * 2;
  if (theyTeach.length && iTeach.length) score += 5; // mutual swap bonus
  score += (other.rating || 0) * 0.5; // rating tie-breaker
  return { score: Math.round(score * 10) / 10, theyTeach, iTeach, mutual: theyTeach.length > 0 && iTeach.length > 0 };
}

// Curated "learning path" knowledge
const RELATED = {
  python: ['SQL', 'Pandas', 'Machine Learning', 'Django'],
  sql: ['Power BI', 'Excel', 'Python', 'Tableau'],
  excel: ['Power BI', 'SQL', 'Tableau'],
  'power bi': ['DAX', 'SQL', 'Excel'],
  pandas: ['NumPy', 'Data Visualization', 'Machine Learning'],
  'machine learning': ['Deep Learning', 'Statistics', 'Python'],
  'deep learning': ['PyTorch', 'TensorFlow', 'Computer Vision'],
  javascript: ['React', 'Node.js', 'TypeScript'],
  react: ['Node.js', 'TypeScript', 'Tailwind CSS', 'Next.js'],
  'node.js': ['MongoDB', 'Express', 'React'],
  html: ['CSS', 'JavaScript'],
  css: ['Tailwind CSS', 'JavaScript', 'UI Design'],
  java: ['Spring Boot', 'DSA', 'SQL'],
  'spring boot': ['Microservices', 'Docker', 'SQL'],
  dsa: ['Competitive Programming', 'System Design'],
  'ui design': ['Figma', 'UX Research'],
  figma: ['UI Design', 'Prototyping'],
  guitar: ['Music Theory', 'Singing'],
  singing: ['Music Theory', 'Guitar'],
  photography: ['Video Editing', 'Photoshop'],
  'video editing': ['Motion Graphics', 'Photography'],
  'public speaking': ['Communication', 'Interview Prep'],
  english: ['Public Speaking', 'Communication'],
  docker: ['Kubernetes', 'AWS'],
  aws: ['Docker', 'DevOps'],
};

/**
 * Suggestions = curated related skills + co-occurrence from real platform data
 * ("people who want X also want Y").
 */
export function suggestSkills(me, allUsers) {
  const have = new Set([...toSet(me.skillsWanted), ...toSet(me.skillsOffered)]);
  const scores = new Map(); // key -> {skill, score, reasons:Set}
  const add = (skill, pts, reason) => {
    const k = norm(skill);
    if (!k || have.has(k)) return;
    const cur = scores.get(k) || { skill, score: 0, reasons: new Set() };
    cur.score += pts;
    cur.reasons.add(reason);
    scores.set(k, cur);
  };

  for (const s of [...(me.skillsWanted || []), ...(me.skillsOffered || [])]) {
    for (const r of RELATED[norm(s)] || []) add(r, 3, `Pairs well with ${s}`);
  }

  const myWanted = toSet(me.skillsWanted);
  for (const u of allUsers) {
    if (String(u._id) === String(me._id)) continue;
    const overlap = (u.skillsWanted || []).filter((s) => myWanted.has(norm(s)));
    if (!overlap.length) continue;
    for (const s of u.skillsWanted || []) {
      if (!myWanted.has(norm(s))) add(s, 1, `Learners of ${overlap[0]} also want this`);
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => ({ skill: x.skill, score: x.score, reason: [...x.reasons][0] }));
}

// Counts skills across users -> [{skill, count}]
export function countSkills(users, field) {
  const map = new Map();
  for (const u of users) {
    for (const s of u[field] || []) {
      const k = norm(s);
      const cur = map.get(k) || { skill: s, count: 0 };
      cur.count += 1;
      map.set(k, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
