import 'dotenv/config';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { connectDB } from './db.js';
import routes, { setIO, assertParticipant, saveMessage } from './routes.js';
import { User } from './models.js';
import { JWT_SECRET } from './auth.js';
import { seedDatabase } from './seedData.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'SkillSwap API' }));
app.use('/api', routes);

// Production: serve built React app (npm run build in client)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api|socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });
setIO(io);

// Socket auth: client sends JWT in handshake
io.use(async (socket, next) => {
  try {
    const { id } = jwt.verify(socket.handshake.auth?.token, JWT_SECRET());
    const user = await User.findById(id);
    if (!user || user.isBanned) return next(new Error('unauthorized'));
    socket.user = user;
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});

const online = new Map(); // userId -> socket count
io.on('connection', (socket) => {
  const uid = String(socket.user._id);
  socket.join(`user:${uid}`);
  online.set(uid, (online.get(uid) || 0) + 1);
  io.emit('presence', [...online.keys()]);

  socket.on('chat:send', async ({ swapId, text }, ack) => {
    try {
      const swap = await assertParticipant(swapId, uid);
      if (!swap || !String(text || '').trim()) return ack?.({ ok: false });
      const msg = await saveMessage(swap, socket.user, text);
      ack?.({ ok: true, msg });
    } catch {
      ack?.({ ok: false });
    }
  });

  socket.on('chat:typing', async ({ swapId }) => {
    const swap = await assertParticipant(swapId, uid).catch(() => null);
    if (!swap) return;
    const partner = String(swap.sender) === uid ? swap.receiver : swap.sender;
    io.to(`user:${partner}`).emit('chat:typing', { swapId, userId: uid });
  });

  /* ---------- VIDEO CALL (WebRTC signaling) ----------
     Server sirf messages relay karta hai (offer/answer/ICE). Video/audio seedha
     dono browsers ke beech peer-to-peer jaata hai, server se nahi. */
  const partnerCache = new Map(); // swapId -> partner userId (fast relay of many ICE messages)
  const partnerOf = async (swapId) => {
    const key = String(swapId);
    if (partnerCache.has(key)) return partnerCache.get(key);
    const swap = await assertParticipant(swapId, uid).catch(() => null);
    if (!swap) return null;
    const partner = String(swap.sender) === uid ? String(swap.receiver) : String(swap.sender);
    partnerCache.set(key, partner);
    return partner;
  };
  // `to` socket really belongs to the partner? (security check)
  const isPartnerSocket = (to, partner) => String(io.sockets.sockets.get(to)?.user?._id || '') === partner;

  socket.on('call:invite', async ({ swapId }) => {
    const partner = await partnerOf(swapId);
    if (!partner) return;
    if (!online.has(partner)) return socket.emit('call:unavailable', { swapId });
    io.to(`user:${partner}`).emit('call:incoming', { swapId, socketId: socket.id, from: { id: uid, name: socket.user.name, avatar: socket.user.avatar || '' } });
  });
  socket.on('call:cancel', async ({ swapId }) => {
    const partner = await partnerOf(swapId);
    if (partner) io.to(`user:${partner}`).emit('call:cancelled', { swapId });
  });
  socket.on('call:accept', async ({ swapId, to }) => {
    const partner = await partnerOf(swapId);
    if (!partner || !isPartnerSocket(to, partner)) return;
    io.to(to).emit('call:accepted', { swapId, socketId: socket.id });
    socket.to(`user:${uid}`).emit('call:cancelled', { swapId }); // stop ringing in my other tabs
  });
  socket.on('call:decline', async ({ swapId, to }) => {
    const partner = await partnerOf(swapId);
    if (partner && isPartnerSocket(to, partner)) io.to(to).emit('call:declined', { swapId });
  });
  socket.on('call:end', async ({ swapId, to }) => {
    const partner = await partnerOf(swapId);
    if (partner && isPartnerSocket(to, partner)) io.to(to).emit('call:ended', { swapId });
  });
  socket.on('webrtc:signal', async ({ swapId, to, data }) => {
    const partner = await partnerOf(swapId);
    if (partner && isPartnerSocket(to, partner)) io.to(to).emit('webrtc:signal', { swapId, from: socket.id, data });
  });

  socket.on('disconnect', () => {
    const n = (online.get(uid) || 1) - 1;
    if (n <= 0) online.delete(uid);
    else online.set(uid, n);
    io.emit('presence', [...online.keys()]);
  });
});

(async () => {
  const { inMemory } = await connectDB();
  if (inMemory || process.env.AUTO_SEED !== 'false') await seedDatabase();
  server.listen(PORT, () => {
    console.log(`🚀 SkillSwap API running on http://localhost:${PORT}`);
    console.log(`🌐 Frontend: ${CLIENT_URL}`);
    console.log('👤 Demo login: mohit@demo.com / demo123   |   Admin: admin@skillswap.com / admin123');
  });
})();
