/**
 * Seeds Firestore with the complete Phase 1 website content.
 *
 *   npm run seed              -> creates anything that does not exist yet
 *   npm run seed -- --force   -> also overwrites existing documents
 *   npm run seed -- --only=pages,vehicles
 *
 * The script is idempotent: running it twice without --force changes nothing.
 */
import { getDb, FieldValue, isFirebaseReady, getInitError } from '../config/firebase.js';
import env from '../config/env.js';
import { COLLECTIONS, SITE_SETTINGS_DOC } from '../constants/collections.js';
import { DEFAULT_SITE_SETTINGS } from '../constants/siteDefaults.js';
import { navigationSeed } from '../seed/data/navigation.js';
import { servicesSeed } from '../seed/data/services.js';
import { vehiclesSeed } from '../seed/data/vehicles.js';
import { faqsSeed } from '../seed/data/faqs.js';
import { testimonialsSeed } from '../seed/data/testimonials.js';
import { pagesSeed } from '../seed/data/pages.js';
import { seoTemplatesSeed } from '../seed/data/seoTemplates.js';
import { seoPagesSeed } from '../seed/data/seoPages.js';
import { blogPostsSeed } from '../seed/data/blog.js';
import { buildSeoPath } from '../routes/seo.routes.js';

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyArg = args.find((arg) => arg.startsWith('--only='));
const only = onlyArg ? onlyArg.split('=')[1].split(',').map((part) => part.trim()) : null;

const shouldRun = (name) => !only || only.includes(name);

const colours = { green: '\x1b[32m', yellow: '\x1b[33m', grey: '\x1b[90m', red: '\x1b[31m', reset: '\x1b[0m' };
const log = {
  created: (msg) => console.log(`${colours.green}  + ${msg}${colours.reset}`),
  updated: (msg) => console.log(`${colours.yellow}  ~ ${msg}${colours.reset}`),
  skipped: (msg) => console.log(`${colours.grey}  · ${msg} (exists)${colours.reset}`),
  section: (msg) => console.log(`\n${msg}`),
  error: (msg) => console.error(`${colours.red}  ! ${msg}${colours.reset}`),
};

const stats = { created: 0, updated: 0, skipped: 0 };

const seedCollection = async (collectionName, documents, label = collectionName) => {
  if (!shouldRun(label)) return;
  log.section(`${label}  (${documents.length} documents)`);
  const db = getDb();

  for (const document of documents) {
    const { id, ...data } = document;
    const ref = db.collection(collectionName).doc(id);
    // eslint-disable-next-line no-await-in-loop
    const snapshot = await ref.get();

    if (snapshot.exists && !force) {
      stats.skipped += 1;
      log.skipped(id);
      continue;
    }

    const payload = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
      ...(snapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    // eslint-disable-next-line no-await-in-loop
    await ref.set(payload, { merge: snapshot.exists });

    if (snapshot.exists) {
      stats.updated += 1;
      log.updated(id);
    } else {
      stats.created += 1;
      log.created(id);
    }
  }
};

const run = async () => {
  console.log('\n=== Seeding Firestore ===');

  if (!isFirebaseReady()) {
    log.error(getInitError()?.message || 'Firebase Admin is not configured.');
    log.error('Copy server/.env.example to server/.env and add your service-account credentials.');
    process.exit(1);
  }

  console.log(force ? 'Mode: FORCE (existing documents will be overwritten)' : 'Mode: create-missing-only');
  if (only) console.log(`Only: ${only.join(', ')}`);

  await seedCollection(COLLECTIONS.SITE_SETTINGS, [{ id: SITE_SETTINGS_DOC, ...DEFAULT_SITE_SETTINGS }], 'siteSettings');
  await seedCollection(COLLECTIONS.NAVIGATION, navigationSeed, 'navigation');
  await seedCollection(COLLECTIONS.SERVICES, servicesSeed, 'services');
  await seedCollection(COLLECTIONS.VEHICLES, vehiclesSeed, 'vehicles');
  await seedCollection(COLLECTIONS.FAQS, faqsSeed, 'faqs');
  await seedCollection(COLLECTIONS.TESTIMONIALS, testimonialsSeed, 'testimonials');
  await seedCollection(COLLECTIONS.PAGES, pagesSeed, 'pages');
  await seedCollection(COLLECTIONS.BLOG_POSTS, blogPostsSeed, 'blog');
  await seedCollection(COLLECTIONS.SEO_TEMPLATES, seoTemplatesSeed, 'seoTemplates');
  await seedCollection(
    COLLECTIONS.SEO_PAGES,
    seoPagesSeed.map((page) => ({ ...page, path: buildSeoPath(page.type, page.slug) })),
    'seoPages',
  );

  // A worked example so the admin can see how redirect management behaves.
  await seedCollection(
    COLLECTIONS.REDIRECTS,
    [
      {
        id: 'legacy-airport-transfers',
        from: '/airport-transfers',
        to: '/airport-transfer',
        statusCode: 301,
        note: 'Legacy plural URL consolidated into the single service page.',
        isActive: true,
      },
      {
        id: 'legacy-terms',
        from: '/terms',
        to: '/terms-and-conditions',
        statusCode: 301,
        note: 'Short legacy URL.',
        isActive: true,
      },
    ],
    'redirects',
  );

  console.log('\n=== Summary ===');
  console.log(`  Created : ${stats.created}`);
  console.log(`  Updated : ${stats.updated}`);
  console.log(`  Skipped : ${stats.skipped}`);
  console.log('\nNext steps:');
  console.log('  1. Register an account on the website (or run: npm run set-admin -- you@example.com)');
  console.log('  2. Sign in and open /admin');
  console.log('  3. Upload fleet photography in Admin -> Media, then attach it to each vehicle\n');

  process.exit(0);
};

const explainSeedError = (error) => {
  const code = error?.code;
  const message = error?.message || String(error);

  if (code === 5 || /NOT_FOUND/i.test(message)) {
    return [
      'Firestore database not found on this Firebase project.',
      '',
      'Your service-account credentials are working (Admin SDK connected), but Cloud Firestore',
      'has not been created yet. A first document read/write then returns gRPC 5 NOT_FOUND.',
      '',
      'Fix:',
      `  1. Open https://console.firebase.google.com/project/${env.firebase.projectId || 'YOUR_PROJECT'}/firestore`,
      '     (or Firebase Console → your project → Build → Firestore Database)',
      '  2. Click Create database',
      '  3. Choose production mode (rules in this repo already deny client access)',
      '  4. Pick a location and wait until the database is ready',
      '  5. Also enable Authentication → Email/Password and Storage if you have not already',
      '  6. Run npm run seed again',
    ].join('\n');
  }

  if (code === 7 || /PERMISSION_DENIED/i.test(message)) {
    return [
      'The service account cannot write to Firestore (PERMISSION_DENIED).',
      'In Google Cloud IAM, grant it the "Cloud Datastore User" or "Firebase Admin" role.',
    ].join('\n');
  }

  return message;
};

run().catch((error) => {
  log.error(explainSeedError(error));
  if (error?.code !== 5) console.error(error);
  process.exit(1);
});
