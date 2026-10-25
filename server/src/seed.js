// Run: npm run seed  -> wipes the database and inserts fresh demo data
import 'dotenv/config';
import { connectDB, closeDB } from './db.js';
import { seedDatabase } from './seedData.js';

await connectDB();
await seedDatabase({ force: true });
await closeDB();
process.exit(0);
