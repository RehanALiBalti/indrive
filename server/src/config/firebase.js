import fs from 'node:fs';
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import env from './env.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

let app = null;
let db = null;
let auth = null;
let bucket = null;
let bucketVerified = false;
let initError = null;

const resolveCredential = () => {
  if (env.firebase.credentialsFile && fs.existsSync(env.firebase.credentialsFile)) {
    const serviceAccount = JSON.parse(fs.readFileSync(env.firebase.credentialsFile, 'utf8'));
    return { credential: cert(serviceAccount), projectId: serviceAccount.project_id };
  }

  if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    return {
      credential: cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey,
      }),
      projectId: env.firebase.projectId,
    };
  }

  // Cloud Run / Cloud Functions / GCE metadata server, or emulator suite.
  return { credential: applicationDefault(), projectId: env.firebase.projectId || undefined };
};

const init = () => {
  if (app || initError) return;

  if (!env.firebase.configured) {
    initError = new Error(
      'Firebase Admin credentials are not configured. Copy server/.env.example to server/.env ' +
        'and set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
    );
    logger.warn(`Firebase Admin not initialised: ${initError.message}`);
    return;
  }

  try {
    const { credential, projectId } = resolveCredential();
    const storageBucket =
      env.firebase.storageBucket || (projectId ? `${projectId}.firebasestorage.app` : undefined);

    app = getApps().length
      ? getApps()[0]
      : initializeApp({ credential, projectId, storageBucket });

    db = getFirestore(app, env.firebase.databaseId || 'default');
    db.settings({ ignoreUndefinedProperties: true });
    auth = getAuth(app);
    bucket = storageBucket ? getStorage(app).bucket(storageBucket) : null;

    logger.info('Firebase Admin initialised', {
      projectId: projectId || '(default)',
      databaseId: env.firebase.databaseId || 'default',
      storageBucket: storageBucket || '(none)',
      emulator: env.firebase.useEmulator,
    });
  } catch (error) {
    initError = error;
    logger.error('Firebase Admin initialisation failed', error);
  }
};

init();

export const isFirebaseReady = () => Boolean(db);

const unavailable = () =>
  ApiError.serviceUnavailable(
    'The database is not available because Firebase Admin credentials are missing or invalid. ' +
      'See server/.env.example for setup instructions.',
  );

export const getDb = () => {
  if (!db) throw unavailable();
  return db;
};

export const getAuthAdmin = () => {
  if (!auth) throw unavailable();
  return auth;
};

export const getBucket = () => {
  if (!bucket) {
    throw ApiError.serviceUnavailable(
      'Firebase Storage is not configured. Enable Storage in the Firebase Console, set FIREBASE_STORAGE_BUCKET ' +
        'in server/.env to the bucket name shown there, then restart the API.',
    );
  }
  return bucket;
};

export const hasStorage = () => Boolean(bucket);

/**
 * Confirms the configured bucket actually exists in Google Cloud Storage.
 * Storage is optional at boot, but uploads fail with a cryptic GCS error when
 * the bucket was never created (Firebase Storage not enabled in the console).
 */
export const verifyStorageBucket = async () => {
  if (!bucket || bucketVerified) return Boolean(bucket);
  bucketVerified = true;

  const name = bucket.name;
  try {
    const [exists] = await bucket.exists();
    if (exists) {
      logger.info(`Firebase Storage bucket verified: ${name}`);
      return true;
    }

    logger.error(
      `Firebase Storage bucket "${name}" does not exist. Open Firebase Console → Storage → Get started, ` +
        'then set FIREBASE_STORAGE_BUCKET (and VITE_FIREBASE_STORAGE_BUCKET) to the bucket name shown there.',
    );
    bucket = null;
    return false;
  } catch (error) {
    logger.error(`Could not verify Firebase Storage bucket "${name}"`, error?.message);
    if (/does not exist|not found|404/i.test(error?.message || '')) bucket = null;
    return false;
  }
};
export const getInitError = () => initError;

export { FieldValue, Timestamp };
