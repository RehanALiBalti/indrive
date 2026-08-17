import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const configured = process.env.FIREBASE_STORAGE_BUCKET;

if (!projectId || !privateKey || !clientEmail) {
  console.error('Missing Firebase credentials in server/.env');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

const candidates = [...new Set([configured, `${projectId}.firebasestorage.app`, `${projectId}.appspot.com`].filter(Boolean))];

for (const name of candidates) {
  try {
    const bucket = getStorage().bucket(name);
    const [exists] = await bucket.exists();
    console.log(`${name}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  } catch (error) {
    console.log(`${name}: ERROR - ${error.message}`);
  }
}
