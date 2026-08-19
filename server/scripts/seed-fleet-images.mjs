/**
 * Writes on-brand dummy fleet photos into client/public/fleet and stores
 * those URLs on the vehicle documents in Firestore.
 *
 *   node server/scripts/seed-fleet-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const publicDir = path.resolve(__dirname, '../../client/public/fleet');

const vehicles = [
  {
    id: 'executive-saloon',
    name: 'Executive Saloon',
    category: 'Business Class',
    accent: '#c9a44c',
  },
  {
    id: 'luxury-saloon',
    name: 'Luxury Saloon',
    category: 'First Class',
    accent: '#d9bc78',
  },
  {
    id: 'luxury-mpv',
    name: 'Luxury MPV',
    category: 'Business Van',
    accent: '#c9a44c',
  },
  {
    id: 'electric-executive',
    name: 'Electric Executive',
    category: 'Electric',
    accent: '#7dcea0',
  },
  {
    id: 'executive-minibus',
    name: 'Executive Minibus',
    category: 'Group Travel',
    accent: '#c9a44c',
  },
];

const silhouettes = {
  'executive-saloon':
    'M120 430h1360M220 430l70-150c12-28 38-46 68-46h520c30 0 56 18 68 46l70 150M280 430v70h-40v-70M1480 430v70h-40v-70M380 390a36 36 0 1 0 0.1 0M1360 390a36 36 0 1 0 0.1 0M360 300h880',
  'luxury-saloon':
    'M80 440h1440M180 440l90-170c14-30 42-50 74-50h760c32 0 60 20 74 50l90 170M240 440v80h-48v-80M1528 440v80h-48v-80M340 396a40 40 0 1 0 0.1 0M1380 396a40 40 0 1 0 0.1 0M330 290h940',
  'luxury-mpv':
    'M140 450h1320M220 450v-220c0-28 22-50 50-50h900c28 0 50 22 50 50v220M280 450v70h-44v-70M1470 450v70h-44v-70M360 410a34 34 0 1 0 0.1 0M1360 410a34 34 0 1 0 0.1 0M300 260h820',
  'electric-executive':
    'M120 430h1360M220 430l70-150c12-28 38-46 68-46h520c30 0 56 18 68 46l70 150M280 430v70h-40v-70M1480 430v70h-40v-70M380 390a36 36 0 1 0 0.1 0M1360 390a36 36 0 1 0 0.1 0M360 300h880M800 210l-40 70h50l-30 70 90-90h-50l40-50z',
  'executive-minibus':
    'M80 460h1440M160 460V210c0-28 22-50 50-50h1100c28 0 50 22 50 50v250M220 460v70h-48v-70M1540 460v70h-48v-70M320 420a36 36 0 1 0 0.1 0M1400 420a36 36 0 1 0 0.1 0M240 230h1120M240 300h1120M240 370h1120',
};

const svg = ({ name, category, accent, variant, silhouette }) => {
  const dark = variant === 1 ? '#0b1220' : '#121b2c';
  const mid = variant === 1 ? '#1c2740' : '#0b1220';
  const label = variant === 1 ? 'Sample exterior' : 'Sample interior';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${dark}"/>
      <stop offset="100%" stop-color="${mid}"/>
    </linearGradient>
    <radialGradient id="glow" cx="20%" cy="0%" r="80%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.28"/>
      <stop offset="55%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  <rect width="1600" height="1000" fill="url(#glow)"/>
  <text x="80" y="90" fill="${accent}" font-family="Georgia, serif" font-size="28" letter-spacing="6" text-transform="uppercase">${category}</text>
  <text x="80" y="170" fill="#f8fafc" font-family="Georgia, serif" font-size="64" font-weight="600">${name}</text>
  <text x="80" y="220" fill="rgba(248,250,252,0.55)" font-family="system-ui, sans-serif" font-size="22">${label} · replace in Admin → Fleet</text>
  <path d="${silhouette}" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
};

const photo = (id, n, alt) => ({
  url: `/fleet/${id}-${n}.svg`,
  alt,
  path: `fleet/${id}-${n}.svg`,
});

fs.mkdirSync(publicDir, { recursive: true });

for (const vehicle of vehicles) {
  const silhouette = silhouettes[vehicle.id];
  for (const variant of [1, 2]) {
    const file = path.join(publicDir, `${vehicle.id}-${variant}.svg`);
    fs.writeFileSync(
      file,
      svg({ ...vehicle, variant, silhouette }),
      'utf8',
    );
    console.log(`Wrote ${path.relative(process.cwd(), file)}`);
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const databaseId = process.env.FIRESTORE_DATABASE_ID || 'default';

if (!projectId || !privateKey || !clientEmail) {
  console.error('Missing Firebase credentials in server/.env — files were written, database was not updated.');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

const db = getFirestore(getApps()[0], databaseId);
const collection = process.env.FIRESTORE_VEHICLES_COLLECTION || 'vehicles';

for (const vehicle of vehicles) {
  const images = [
    photo(vehicle.id, 1, `${vehicle.name} exterior`),
    photo(vehicle.id, 2, `${vehicle.name} interior`),
  ];
  const ref = db.collection(collection).doc(vehicle.id);
  const snap = await ref.get();
  if (!snap.exists) {
    console.warn(`Skipped ${vehicle.id} — document does not exist. Run npm run seed first.`);
    continue;
  }
  await ref.update({ images, updatedAt: FieldValue.serverTimestamp() });
  console.log(`Updated Firestore ${collection}/${vehicle.id} (${images.length} images)`);
}

console.log('\nDone. Hard-refresh the fleet pages to see the dummy photos.');
process.exit(0);
