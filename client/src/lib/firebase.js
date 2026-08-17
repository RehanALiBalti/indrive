import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { env, isFirebaseConfigured } from '../config/env.js';

/**
 * The browser uses Firebase for Authentication ONLY. There is no client-side
 * Firestore or Storage access anywhere in this application — every read and
 * write goes through the Node.js API, which holds the Admin credentials.
 */
let app = null;
let auth = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(env.firebase);
  auth = getAuth(app);
  auth.useDeviceLanguage();

  if (env.useAuthEmulator) {
    connectAuthEmulator(auth, env.authEmulatorUrl, { disableWarnings: true });
  }

  setPersistence(auth, browserLocalPersistence).catch(() => {
    /* Private browsing can block persistence; the session still works in-memory. */
  });
} else if (env.isDevelopment) {
  // eslint-disable-next-line no-console
  console.warn(
    '[auth] Firebase Web SDK is not configured. Copy client/.env.example to client/.env ' +
      'and add your Firebase web credentials to enable sign-in.',
  );
}

export const getFirebaseAuth = () => auth;
export const firebaseReady = isFirebaseConfigured;
export default app;
