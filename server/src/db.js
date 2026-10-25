import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';

let memoryServer = null;
const GB = 1024 ** 3;
const NEEDED = 1.5 * GB; // MongoDB binary download + extract ke liye approx jagah

// Password chhupa ke URI print karo
const safeUri = (uri) => uri.replace(/\/\/([^:/]+):([^@]+)@/, '//$1:****@');

const freeBytes = (p) => {
  try {
    const s = fs.statfsSync(p);
    return s.bavail * s.bsize;
  } catch {
    return -1;
  }
};

// In-memory MongoDB ka binary kahan download ho?
// 1) MONGOMS_DOWNLOAD_DIR (.env) diya hai toh wahi
// 2) Windows pe: sabse zyada khaali space wali drive (C:, D:, E:, ...)
// 3) Baaki: home folder ka cache
function pickDownloadDir() {
  if (process.env.MONGOMS_DOWNLOAD_DIR) return process.env.MONGOMS_DOWNLOAD_DIR;
  if (process.platform === 'win32') {
    const drives = 'CDEFGHIJ'.split('')
      .map((l) => `${l}:\\`)
      .filter((d) => fs.existsSync(d))
      .map((d) => ({ d, free: freeBytes(d) }))
      .filter((x) => x.free > 0)
      .sort((a, b) => b.free - a.free);
    if (drives.length) {
      console.log(`💽 Free space: ${drives.map((x) => `${x.d} ${(x.free / GB).toFixed(1)} GB`).join(' | ')}`);
      if (drives[0].free < NEEDED) {
        console.error(`❌ Kisi bhi drive mein ${(NEEDED / GB).toFixed(1)} GB khaali nahi hai. Thodi jagah khaali karo, ya .env mein MONGO_URI (MongoDB Atlas) daalo.`);
      }
      return path.join(drives[0].d, 'mongodb-binaries');
    }
  }
  return path.join(os.homedir(), '.cache', 'mongodb-binaries');
}

// Connects to MONGO_URI. Agar fail ho jaye, toh in-memory MongoDB start karta hai
// taaki project bina kisi setup ke direct run ho jaye.
export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      console.log(`✅ MongoDB connected: ${safeUri(uri)}`);
      return { inMemory: false };
    } catch (err) {
      console.warn(`⚠️  Could not connect to ${safeUri(uri)} (${err.message}). Falling back to in-memory MongoDB...`);
    }
  }
  const downloadDir = pickDownloadDir();
  fs.mkdirSync(downloadDir, { recursive: true });
  console.log(`📦 In-memory MongoDB binary folder: ${downloadDir} (pehli baar ~600 MB download hoga, 1-3 min)`);
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  // Database files bhi usi drive pe (C: full ho toh temp folder fail hota hai)
  const dbPath = path.join(path.dirname(downloadDir), 'mongodb-skillswap-data');
  fs.rmSync(dbPath, { recursive: true, force: true });
  fs.mkdirSync(dbPath, { recursive: true });
  memoryServer = await MongoMemoryServer.create({ binary: { downloadDir }, instance: { dbPath } });
  await mongoose.connect(memoryServer.getUri('skillswap'));
  console.log('✅ In-memory MongoDB started (data resets on restart)');
  return { inMemory: true };
}

export async function closeDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
