import { getAuthAdmin, getDb, FieldValue, isFirebaseReady } from '../config/firebase.js';
import { COLLECTIONS, ROLES, ROLE_LEVELS } from '../constants/collections.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/http.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const readBearerToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (!/^Bearer$/i.test(scheme) || !token) return null;
  return token.trim();
};

/**
 * Loads (or lazily provisions) the Firestore profile for an authenticated user.
 * The role ALWAYS comes from the server side: a custom claim first, then the
 * Firestore document. A role sent by the client is never read anywhere.
 */
const loadProfile = async (decoded) => {
  const db = getDb();
  const ref = db.collection(COLLECTIONS.USERS).doc(decoded.uid);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    const isBootstrapAdmin =
      env.security.bootstrapAdminEmail &&
      decoded.email &&
      decoded.email.toLowerCase() === env.security.bootstrapAdminEmail;

    const profile = {
      uid: decoded.uid,
      email: decoded.email || null,
      displayName: decoded.name || decoded.email?.split('@')[0] || 'Guest',
      phone: decoded.phone_number || null,
      role: isBootstrapAdmin ? ROLES.ADMIN : ROLES.USER,
      status: 'active',
      emailVerified: Boolean(decoded.email_verified),
      provider: decoded.firebase?.sign_in_provider || 'password',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
    };
    await ref.set(profile, { merge: true });

    if (isBootstrapAdmin) {
      await getAuthAdmin().setCustomUserClaims(decoded.uid, { role: ROLES.ADMIN });
      logger.warn(`Bootstrap admin role granted to ${decoded.email}`);
    }

    return { ...profile, createdAt: null, updatedAt: null, lastLoginAt: null };
  }

  const data = snapshot.data();
  const claimRole = decoded.role;
  const resolvedRole = claimRole || data.role || ROLES.USER;

  // Keep the custom claim and the profile document in sync.
  if (claimRole && data.role && claimRole !== data.role) {
    await ref.set({ role: claimRole, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  if (data.emailVerified !== Boolean(decoded.email_verified)) {
    await ref.set(
      { emailVerified: Boolean(decoded.email_verified), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }

  return { ...data, uid: decoded.uid, role: resolvedRole };
};

const verify = async (req) => {
  const token = readBearerToken(req);
  if (!token) return null;

  const decoded = await getAuthAdmin().verifyIdToken(token, true);
  const profile = await loadProfile(decoded);

  if (profile.status === 'disabled') {
    throw ApiError.forbidden('This account has been disabled. Please contact support.');
  }

  return {
    uid: decoded.uid,
    email: decoded.email || profile.email || null,
    emailVerified: Boolean(decoded.email_verified),
    displayName: profile.displayName || decoded.name || null,
    role: profile.role || ROLES.USER,
    status: profile.status || 'active',
    profile,
  };
};

const translateFirebaseAuthError = (error) => {
  const code = error?.code || '';
  if (code === 'auth/id-token-expired') {
    return ApiError.unauthorized('Your session has expired. Please sign in again.');
  }
  if (code === 'auth/id-token-revoked' || code === 'auth/user-disabled') {
    return ApiError.unauthorized('Your session is no longer valid. Please sign in again.');
  }
  if (code.startsWith('auth/')) {
    return ApiError.unauthorized('Invalid authentication token.');
  }
  return error;
};

/** Attaches req.user when a valid token is present; never rejects. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  if (!isFirebaseReady() || !readBearerToken(req)) return next();
  try {
    req.user = await verify(req);
  } catch (error) {
    logger.debug('Optional auth token rejected', error?.message);
  }
  return next();
});

/** Requires a valid Firebase ID token. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  if (!readBearerToken(req)) {
    throw ApiError.unauthorized('You must be signed in to access this resource.');
  }
  try {
    req.user = await verify(req);
  } catch (error) {
    throw translateFirebaseAuthError(error);
  }
  if (!req.user) throw ApiError.unauthorized();
  return next();
});

/** Requires at least the given role, using the ROLE_LEVELS hierarchy. */
export const requireRole =
  (minimumRole = ROLES.ADMIN) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    const userLevel = ROLE_LEVELS[req.user.role] ?? 0;
    const requiredLevel = ROLE_LEVELS[minimumRole] ?? Number.MAX_SAFE_INTEGER;
    if (userLevel < requiredLevel) {
      return next(
        ApiError.forbidden(
          `This action requires the "${minimumRole}" role or higher. Your role is "${req.user.role}".`,
        ),
      );
    }
    return next();
  };

export const requireVerifiedEmail = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!req.user.emailVerified) {
    return next(
      new ApiError(
        403,
        'EMAIL_NOT_VERIFIED',
        'Please verify your email address before continuing.',
      ),
    );
  }
  return next();
};

/** Convenience stack for every admin endpoint. */
export const adminOnly = [requireAuth, requireRole(ROLES.ADMIN)];

/** Editors can manage content but not users, settings or redirects. */
export const editorOrAbove = [requireAuth, requireRole(ROLES.EDITOR)];
