import jwt from 'jsonwebtoken';
import { User } from './models.js';

export const JWT_SECRET = () => process.env.JWT_SECRET || 'skillswap_dev_secret';

export const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET(), { expiresIn: '7d' });

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not logged in' });
    const payload = jwt.verify(token, JWT_SECRET());
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isBanned) return res.status(403).json({ message: 'Your account has been banned' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
  next();
}

// Wrap async route handlers so errors go to the error middleware
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
