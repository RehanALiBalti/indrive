const raw = import.meta.env;

const bool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes'].includes(String(value).toLowerCase());
};

const stripSlash = (value) => String(value || '').replace(/\/+$/, '');

export const env = {
  apiBaseUrl: stripSlash(raw.VITE_API_BASE_URL || '/api'),
  siteUrl: stripSlash(raw.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')),
  isProduction: raw.PROD,
  isDevelopment: raw.DEV,

  firebase: {
    apiKey: raw.VITE_FIREBASE_API_KEY || '',
    authDomain: raw.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: raw.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: raw.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: raw.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: raw.VITE_FIREBASE_APP_ID || '',
  },

  useAuthEmulator: bool(raw.VITE_USE_FIREBASE_EMULATOR, false),
  authEmulatorUrl: raw.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://localhost:9099',
};

/** Auth features are only offered when the Web SDK is actually configured. */
export const isFirebaseConfigured = Boolean(env.firebase.apiKey && env.firebase.projectId);

export default env;
