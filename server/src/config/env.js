import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../..');

// Load server/.env, then fall back to a repo-root .env if present.
dotenv.config({ path: path.join(serverRoot, '.env') });
dotenv.config({ path: path.resolve(serverRoot, '../.env') });

const bool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const int = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const list = (value, fallback = []) => {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const stripTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

/**
 * Private keys arrive in a few shapes depending on the host:
 *  - literal "\n" escapes inside a quoted single-line env value
 *  - real newlines (Render / Railway multiline secrets)
 *  - base64 encoded (some CI systems)
 */
const normalisePrivateKey = (raw) => {
  if (!raw) return '';
  let key = String(raw).trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  if (!key.includes('BEGIN') && /^[A-Za-z0-9+/=\s]+$/.test(key) && key.length > 100) {
    try {
      key = Buffer.from(key, 'base64').toString('utf8');
    } catch {
      /* not base64 -- keep as-is */
    }
  }
  return key.replace(/\\n/g, '\n');
};

const nodeEnv = process.env.NODE_ENV || 'development';
const siteUrl = stripTrailingSlash(process.env.SITE_URL || 'http://localhost:5173');

const clientDistPath = path.resolve(
  serverRoot,
  process.env.CLIENT_DIST_PATH || '../client/dist',
);

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: int(process.env.PORT, 5010),

  siteUrl,
  corsOrigins: list(process.env.CORS_ORIGINS, [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]),

  serveClient: bool(process.env.SERVE_CLIENT, false),
  clientDistPath,

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: normalisePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    credentialsFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
    useEmulator: bool(process.env.USE_FIREBASE_EMULATOR, false),
    // Google Cloud Console now creates a database named "default".
    // Classic Firebase Console databases are named "(default)".
    databaseId: (process.env.FIRESTORE_DATABASE_ID || 'default').trim(),
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: int(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'no-reply@localhost',
    notifyTo: list(process.env.EMAIL_NOTIFY_TO),
  },

  security: {
    rateLimitWindowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    rateLimitMax: int(process.env.RATE_LIMIT_MAX, 600),
    formRateLimitWindowMs: int(process.env.FORM_RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000),
    formRateLimitMax: int(process.env.FORM_RATE_LIMIT_MAX, 15),
    maxUploadBytes: int(process.env.MAX_UPLOAD_MB, 8) * 1024 * 1024,
    bootstrapAdminEmail: (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase(),
  },

  cache: {
    publicTtlSeconds: int(process.env.PUBLIC_CACHE_TTL, 60),
  },
};

env.firebase.configured = Boolean(
  (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) ||
    (env.firebase.credentialsFile && fs.existsSync(env.firebase.credentialsFile)) ||
    env.firebase.useEmulator ||
    process.env.FUNCTION_TARGET ||
    process.env.K_SERVICE,
);

env.mail.configured = Boolean(env.mail.host && env.mail.user && env.mail.password);

export default env;
