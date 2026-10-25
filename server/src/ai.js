// SkillBot: AI learning assistant
// GEMINI_API_KEY ho toh Google Gemini se real AI jawab aata hai.
// Key nahi hai toh "offline mode": built-in roadmaps se jawab deta hai (app phir bhi chalta hai).
import { User } from './models.js';
import { countSkills } from './logic.js';

const ROADMAPS = {
  python: ['Basics: variables, loops, functions (Week 1)', 'Data structures: list, dict, set, tuple (Week 2)', 'OOP + file handling + error handling (Week 3)', 'Libraries: Pandas & NumPy for data (Week 4–5)', 'Mini project: data cleaning script or automation tool (Week 6)'],
  sql: ['SELECT, WHERE, ORDER BY, LIMIT (Week 1)', 'GROUP BY, HAVING, aggregate functions (Week 2)', 'JOINs: INNER, LEFT, RIGHT, SELF (Week 3)', 'Subqueries, CTEs, window functions (Week 4)', 'Practice: 50 LeetCode/HackerRank SQL problems + a sales analysis project (Week 5)'],
  'power bi': ['Power Query: import & clean data (Week 1)', 'Data modelling: star schema, relationships (Week 2)', 'DAX basics: CALCULATE, SUM, measures vs columns (Week 3)', 'Visuals, slicers, drill-through, bookmarks (Week 4)', 'Project: end-to-end sales dashboard + publish (Week 5)'],
  excel: ['Formulas: SUM, IF, COUNTIF, TEXT functions (Week 1)', 'XLOOKUP/VLOOKUP, INDEX-MATCH (Week 2)', 'Pivot tables + charts (Week 3)', 'Power Query + data cleaning (Week 4)', 'Project: interactive dashboard with slicers (Week 5)'],
  react: ['JavaScript ES6 refresh: arrow fns, destructuring, map/filter (Week 1)', 'Components, props, state, events (Week 2)', 'useEffect, API calls with fetch/axios (Week 3)', 'React Router + Context API (Week 4)', 'Project: full CRUD app with a backend (Week 5–6)'],
  javascript: ['Basics: variables, types, functions, loops (Week 1)', 'DOM manipulation + events (Week 2)', 'ES6+: arrow fns, destructuring, modules (Week 3)', 'Async: promises, async/await, fetch (Week 4)', 'Project: weather app or to-do app (Week 5)'],
  'node.js': ['Node basics + npm + modules (Week 1)', 'Express: routes, middleware, REST APIs (Week 2)', 'MongoDB + Mongoose CRUD (Week 3)', 'Auth with JWT + bcrypt (Week 4)', 'Project: REST API + deploy on Render (Week 5)'],
  java: ['Syntax, OOP: class, object, inheritance (Week 1–2)', 'Collections: ArrayList, HashMap (Week 3)', 'Exceptions, file I/O, multithreading basics (Week 4)', 'JDBC + SQL (Week 5)', 'Spring Boot REST API project (Week 6–7)'],
  'machine learning': ['Python + Pandas + NumPy (Week 1–2)', 'Statistics: mean, variance, distributions, correlation (Week 3)', 'Supervised ML: regression, classification with scikit-learn (Week 4–5)', 'Model evaluation: train/test split, accuracy, F1, cross-validation (Week 6)', 'Project: Kaggle dataset end-to-end (Week 7–8)'],
  dsa: ['Arrays, strings, two pointers (Week 1–2)', 'Hashing, stacks, queues (Week 3)', 'Recursion, sorting, binary search (Week 4)', 'Trees, graphs, BFS/DFS (Week 5–6)', 'Dynamic programming + 100 LeetCode problems (Week 7–10)'],
  figma: ['Frames, shapes, text, auto-layout (Week 1)', 'Components & variants (Week 2)', 'Design systems: colors, typography, spacing (Week 3)', 'Prototyping & interactions (Week 4)', 'Project: redesign an app you use daily (Week 5)'],
  'public speaking': ['Record yourself speaking 2 min daily (Week 1)', 'Structure: hook → 3 points → conclusion (Week 2)', 'Body language, eye contact, pauses (Week 3)', 'Practice in front of friends / SkillSwap partner (Week 4)', 'Give a 5-min talk on a topic you know (Week 5)'],
  'data analyst': ['Excel + SQL fundamentals (Month 1)', 'Python: Pandas, NumPy, Matplotlib (Month 2)', 'Power BI / Tableau dashboards (Month 3)', 'Statistics + business case studies (Month 4)', '3 portfolio projects on GitHub + resume (Month 5)'],
};
const ALIASES = { node: 'node.js', nodejs: 'node.js', js: 'javascript', ml: 'machine learning', powerbi: 'power bi', 'data analytics': 'data analyst', 'data analysis': 'data analyst' };

function findTopic(text) {
  const t = ` ${text.toLowerCase()} `;
  for (const [alias, key] of Object.entries(ALIASES)) if (t.includes(` ${alias} `) || t.includes(` ${alias}?`)) return key;
  return Object.keys(ROADMAPS).find((k) => t.includes(k)) || null;
}

function offlineReply(user, text, offeredOnPlatform) {
  const topic = findTopic(text);
  const teachers = (skill) => offeredOnPlatform.find((o) => o.skill.toLowerCase() === skill)?.count || 0;
  if (topic) {
    const steps = ROADMAPS[topic].map((s, i) => `${i + 1}. ${s}`).join('\n');
    const n = teachers(topic);
    const swapTip = n
      ? `\n\n**SkillSwap tip:** ${n} member${n > 1 ? 's' : ''} here teach **${topic}**. Explore page pe search karke swap request bhejo!`
      : `\n\n**SkillSwap tip:** Abhi koi ${topic} nahi sikhata. Apni profile ke "want to learn" mein add karo, jaise hi koi join karega match dikhega.`;
    return `**${topic.replace(/\b\w/g, (c) => c.toUpperCase())} Roadmap 🗺️**\n${steps}${swapTip}`;
  }
  const wants = user.skillsWanted.length ? user.skillsWanted.join(', ') : 'abhi kuch add nahi kiya';
  return `Main **SkillBot** hoon 🤖 (offline mode).\n\nTum mujhse kisi skill ka roadmap pooch sakte ho, jaise:\n- "Python kaise seekhun?"\n- "SQL roadmap do"\n- "Data analyst banne ke liye kya seekhun?"\n\nTumhari learning list: **${wants}**`;
}

// Simple per-user rate limit: 20 messages / 10 minutes
const hits = new Map();
function rateLimited(userId) {
  const now = Date.now();
  const list = (hits.get(userId) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(userId, list);
  return list.length > 20;
}

export const aiMode = () => (process.env.GEMINI_API_KEY ? 'ai' : 'offline');

export async function aiReply(user, messages) {
  if (rateLimited(String(user._id))) {
    const err = new Error('Thoda ruko! 10 minute mein max 20 messages bhej sakte ho.');
    err.status = 429;
    throw err;
  }
  const clean = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && ['user', 'assistant'].includes(m.role) && String(m.content || '').trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
  const last = clean.filter((m) => m.role === 'user').pop();
  if (!last) {
    const err = new Error('Empty message');
    err.status = 400;
    throw err;
  }

  const all = await User.find({ role: 'user', isBanned: false }).select('skillsOffered skillsWanted');
  const offered = countSkills(all, 'skillsOffered');

  if (!process.env.GEMINI_API_KEY) return { reply: offlineReply(user, last.content, offered), mode: 'offline' };

  const system = [
    'You are SkillBot, a friendly learning assistant inside SkillSwap, a platform where students exchange skills (teach one, learn one, no money).',
    `Current user: ${user.name}. Teaches: ${user.skillsOffered.join(', ') || 'none yet'}. Wants to learn: ${user.skillsWanted.join(', ') || 'none yet'}.`,
    `Skills taught by members on SkillSwap (skill: number of teachers): ${offered.slice(0, 30).map((o) => `${o.skill}: ${o.count}`).join(', ')}.`,
    'Help with: learning roadmaps (week by week), which skill to learn next, how to prepare for a swap session, career advice for students.',
    'When a skill is taught on SkillSwap, tell the user they can find a teacher on the Explore page.',
    'Reply in the same language the user writes in (Hinglish is fine). Keep answers short and practical: max ~180 words, use short bullet or numbered lists and **bold** for key terms. No tables, no code blocks unless asked.',
  ].join('\n');

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: clean.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Gemini error:', data?.error?.message || res.status);
    const err = new Error(`AI service error: ${data?.error?.message || res.status}. GEMINI_API_KEY / GEMINI_MODEL check karo.`);
    err.status = 502;
    throw err;
  }
  const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
  return { reply: reply || 'Sorry, abhi jawab nahi bana paaya. Dobara try karo.', mode: 'ai' };
}
