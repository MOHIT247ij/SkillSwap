import bcrypt from 'bcryptjs';
import { User, SwapRequest, Session, Message, Review, Notification } from './models.js';
import { recalcRating } from './routes.js';

const PEOPLE = [
  ['Mohit Hingase', 'mohit@demo.com', 'MIT-WPU', 'Pune', 'MCA student who loves data. Happy to teach SQL & Power BI.', ['SQL', 'Power BI', 'Python'], ['React', 'Node.js', 'Public Speaking']],
  ['Priya Sharma', 'priya@demo.com', 'COEP', 'Pune', 'Frontend dev, design nerd.', ['React', 'Figma', 'CSS'], ['SQL', 'Python', 'Machine Learning']],
  ['Rahul Patil', 'rahul@demo.com', 'MIT-WPU', 'Pune', 'Backend + DevOps enthusiast.', ['Node.js', 'Docker', 'MongoDB'], ['Power BI', 'DSA', 'Guitar']],
  ['Sneha Kulkarni', 'sneha@demo.com', 'PICT', 'Pune', 'Debater and content writer.', ['Public Speaking', 'English', 'Content Writing'], ['Python', 'Video Editing', 'Excel']],
  ['Arjun Mehta', 'arjun@demo.com', 'VIT Pune', 'Pune', 'Competitive programmer, 5★ on CodeChef.', ['DSA', 'Java', 'C++'], ['React', 'UI Design', 'Machine Learning']],
  ['Ananya Iyer', 'ananya@demo.com', 'Symbiosis', 'Pune', 'Photographer & editor.', ['Photography', 'Video Editing', 'Photoshop'], ['Excel', 'Public Speaking', 'Python']],
  ['Karan Deshmukh', 'karan@demo.com', 'MIT-WPU', 'Pune', 'ML intern, Kaggle explorer.', ['Machine Learning', 'Python', 'Pandas'], ['Docker', 'React', 'Guitar']],
  ['Isha Joshi', 'isha@demo.com', 'Fergusson College', 'Pune', 'Musician by passion.', ['Guitar', 'Singing', 'Music Theory'], ['Photography', 'Figma', 'SQL']],
  ['Vikram Singh', 'vikram@demo.com', 'COEP', 'Pune', 'Java + Spring Boot developer.', ['Java', 'Spring Boot', 'SQL'], ['Docker', 'AWS', 'React']],
  ['Neha Gupta', 'neha@demo.com', 'PICT', 'Pune', 'Excel wizard, finance minor.', ['Excel', 'Tableau', 'Statistics'], ['Python', 'Power BI', 'Public Speaking']],
  ['Aditya Rao', 'aditya@demo.com', 'VIT Pune', 'Pune', 'Cloud & AWS certified.', ['AWS', 'Docker', 'Linux'], ['Machine Learning', 'DSA', 'Singing']],
  ['Pooja Nair', 'pooja@demo.com', 'Symbiosis', 'Pune', 'UI/UX designer.', ['UI Design', 'Figma', 'Prototyping'], ['React', 'Python', 'Photography']],
  ['Siddharth Jain', 'siddharth@demo.com', 'MIT-WPU', 'Pune', 'Full stack MERN dev.', ['React', 'Node.js', 'JavaScript'], ['SQL', 'Power BI', 'DSA']],
  ['Riya Bhosale', 'riya@demo.com', 'Fergusson College', 'Pune', 'Learning everything data.', ['English', 'Content Writing'], ['SQL', 'Excel', 'Python', 'Power BI']],
];

// Demo: kuch users ne quiz pass kiya hua hai
const VERIFIED = { 'mohit@demo.com': ['SQL'], 'priya@demo.com': ['React'], 'karan@demo.com': ['Python'], 'vikram@demo.com': ['Java'], 'arjun@demo.com': ['DSA'] };

const daysAgo = (d) => new Date(Date.now() - d * 864e5);
const setCreated = (Model, id, date) => Model.collection.updateOne({ _id: id }, { $set: { createdAt: date, updatedAt: date } });

export async function seedDatabase({ force = false } = {}) {
  if (!force && (await User.countDocuments()) > 0) return false;
  await Promise.all([User, SwapRequest, Session, Message, Review, Notification].map((M) => M.deleteMany({})));

  const demoPass = await bcrypt.hash('demo123', 10);
  await User.create({ name: 'Admin', email: 'admin@skillswap.com', password: await bcrypt.hash('admin123', 10), role: 'admin', college: 'SkillSwap HQ' });

  const users = [];
  for (const [i, [name, email, college, city, bio, offered, wanted]] of PEOPLE.entries()) {
    const u = await User.create({ name, email, college, city, bio, password: demoPass, skillsOffered: offered, skillsWanted: wanted, verifiedSkills: VERIFIED[email] || [] });
    await setCreated(User, u._id, daysAgo(60 - i * 3));
    users.push(u);
  }
  const by = (first) => users.find((u) => u.name.startsWith(first));

  // [sender, receiver, offered, wanted, status, daysAgo]
  const swapDefs = [
    ['Mohit', 'Priya', 'SQL', 'React', 'accepted', 40],
    ['Rahul', 'Mohit', 'Node.js', 'Power BI', 'accepted', 33],
    ['Sneha', 'Mohit', 'Public Speaking', 'Python', 'pending', 2],
    ['Siddharth', 'Mohit', 'React', 'SQL', 'pending', 1],
    ['Karan', 'Rahul', 'Python', 'Docker', 'accepted', 45],
    ['Arjun', 'Pooja', 'DSA', 'UI Design', 'accepted', 38],
    ['Isha', 'Ananya', 'Guitar', 'Photography', 'accepted', 26],
    ['Neha', 'Karan', 'Excel', 'Python', 'accepted', 20],
    ['Vikram', 'Aditya', 'SQL', 'AWS', 'rejected', 18],
    ['Ananya', 'Sneha', 'Video Editing', 'Public Speaking', 'accepted', 15],
    ['Pooja', 'Siddharth', 'Figma', 'React', 'accepted', 12],
    ['Riya', 'Neha', 'English', 'Excel', 'pending', 9],
    ['Aditya', 'Karan', 'Docker', 'Machine Learning', 'accepted', 6],
    ['Mohit', 'Vikram', 'Power BI', 'Java', 'rejected', 50],
  ];
  const swaps = [];
  for (const [s, rc, off, want, status, d] of swapDefs) {
    const swap = await SwapRequest.create({ sender: by(s)._id, receiver: by(rc)._id, offeredSkill: off, wantedSkill: want, status, message: `Hi! I can teach you ${off} in exchange for ${want}.` });
    await setCreated(SwapRequest, swap._id, daysAgo(d));
    swaps.push(swap);
  }

  // Chat messages for Mohit <-> Priya
  const mp = swaps[0];
  const chat = [
    [mp.sender, 'Hi Priya! Ready to start with SQL basics this weekend?'],
    [mp.receiver, 'Yes! And I will share a React starter repo with you 🙂'],
    [mp.sender, 'Perfect. Saturday 11 AM works?'],
    [mp.receiver, 'Works for me. I will schedule the session.'],
  ];
  for (const [i, [sender, text]] of chat.entries()) {
    const m = await Message.create({ swap: mp._id, sender, text });
    await setCreated(Message, m._id, new Date(daysAgo(39).getTime() + i * 6e5));
  }

  // Sessions + reviews for accepted swaps
  const accepted = swaps.filter((s) => s.status === 'accepted');
  const comments = ['Explained concepts very clearly!', 'Super patient and helpful.', 'Great session, learned a lot.', 'Good examples, would swap again.', 'Very well prepared.'];
  for (const [i, sw] of accepted.entries()) {
    const done = await Session.create({ swap: sw._id, participants: [sw.sender, sw.receiver], date: daysAgo(10 + i), status: 'completed', title: `${sw.offeredSkill} ⇄ ${sw.wantedSkill}`, meetLink: 'https://meet.google.com/abc-defg-hij', createdBy: sw.sender });
    await Review.create({ session: done._id, reviewer: sw.sender, reviewee: sw.receiver, rating: 4 + (i % 2), comment: comments[i % comments.length] });
    await Review.create({ session: done._id, reviewer: sw.receiver, reviewee: sw.sender, rating: 5 - (i % 3 === 0 ? 1 : 0), comment: comments[(i + 2) % comments.length] });
  }
  // Upcoming session for Mohit
  await Session.create({ swap: mp._id, participants: [mp.sender, mp.receiver], date: new Date(Date.now() + 2 * 864e5), title: 'SQL Joins ⇄ React Hooks', meetLink: 'https://meet.google.com/xyz-abcd-efg', createdBy: mp.receiver });
  for (const u of users) await recalcRating(u._id);

  const mohit = by('Mohit');
  await Notification.create([
    { user: mohit._id, text: 'Sneha wants to swap Public Speaking for your Python', link: '/requests', type: 'request' },
    { user: mohit._id, text: 'Siddharth wants to swap React for your SQL', link: '/requests', type: 'request' },
    { user: mohit._id, text: 'Priya scheduled a session: SQL Joins ⇄ React Hooks', link: '/sessions', type: 'session' },
  ]);
  console.log('🌱 Demo data seeded (14 users + admin, swaps, chats, sessions, reviews)');
  return true;
}
