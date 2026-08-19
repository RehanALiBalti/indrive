import { Router } from 'express';
import { getAuthAdmin, getDb, FieldValue } from '../config/firebase.js';
import repository from '../services/repository.js';
import validate from '../middleware/validate.js';
import spamGuard from '../middleware/spamGuard.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { sendSuccess, asyncHandler } from '../utils/http.js';
import ApiError from '../utils/ApiError.js';
import { COLLECTIONS, ROLES } from '../constants/collections.js';
import {
  registerSchema,
  profileUpdateSchema,
  emailOnlySchema,
} from '../schemas/forms.js';
import { sendMail, isMailConfigured } from '../services/email.service.js';
import { loadSettings } from './siteSettings.routes.js';
import { escapeHtml } from '../utils/helpers.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const usersRepo = repository(COLLECTIONS.USERS);
const router = Router();

/** Public-safe projection of a user profile. */
const toProfile = (user, extra = {}) => ({
  uid: user.uid,
  email: user.email,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  displayName: user.displayName || '',
  phone: user.phone || '',
  role: user.role || ROLES.USER,
  status: user.status || 'active',
  emailVerified: Boolean(user.emailVerified),
  marketingOptIn: Boolean(user.marketingOptIn),
  createdAt: user.createdAt || null,
  lastLoginAt: user.lastLoginAt || null,
  ...extra,
});

/**
 * Firebase action links point at the Firebase-hosted handler by default. We
 * extract the one-time `oobCode` and email a link to our own branded page,
 * which completes the action with the Firebase Web SDK.
 */
const toAppActionUrl = (firebaseLink, appPath) => {
  try {
    const parsed = new URL(firebaseLink);
    const oobCode = parsed.searchParams.get('oobCode');
    if (!oobCode) return firebaseLink;
    return `${env.siteUrl}${appPath}?oobCode=${encodeURIComponent(oobCode)}`;
  } catch {
    return firebaseLink;
  }
};

const actionEmail = ({ brand, heading, intro, buttonLabel, link, footer }) => `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <tr><td style="background:#0f172a;padding:20px 24px;color:#ffffff;font-size:16px;font-weight:600;">${escapeHtml(brand)}</td></tr>
    <tr><td style="padding:28px 24px;">
      <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(intro)}</p>
      <a href="${link}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">${escapeHtml(buttonLabel)}</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">If the button does not work, copy and paste this link into your browser:<br/><span style="word-break:break-all;color:#374151;">${link}</span></p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">${escapeHtml(footer)}</p>
    </td></tr>
  </table>
</body></html>`;

/* -------------------------------------------------------------------------- */
/* Registration                                                                */
/* -------------------------------------------------------------------------- */

router.post(
  '/register',
  authLimiter,
  spamGuard({ textFields: [] }),
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password, marketingOptIn } = req.body;
    const auth = getAuthAdmin();
    const settings = await loadSettings();
    const displayName = `${firstName} ${lastName}`.trim();

    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) {
      throw ApiError.conflict(
        'An account with that email address already exists. Try signing in instead.',
      );
    }

    const created = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
      disabled: false,
    });

    // The role is assigned server-side only. Anything sent by the client is ignored.
    await auth.setCustomUserClaims(created.uid, { role: ROLES.USER });

    await getDb()
      .collection(COLLECTIONS.USERS)
      .doc(created.uid)
      .set({
        uid: created.uid,
        email,
        firstName,
        lastName,
        displayName,
        phone: phone || '',
        role: ROLES.USER,
        status: 'active',
        emailVerified: true,
        marketingOptIn: Boolean(marketingOptIn),
        provider: 'password',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: null,
      });

    logger.info('User registered', { uid: created.uid, email });

    return sendSuccess(
      res,
      {
        uid: created.uid,
        email,
        displayName,
        verificationEmailSent: false,
        clientShouldSendVerification: false,
      },
      { status: 201 },
    );
  }),
);

/* -------------------------------------------------------------------------- */
/* Session / profile                                                           */
/* -------------------------------------------------------------------------- */

router.post(
  '/session',
  authLimiter,
  requireAuth,
  asyncHandler(async (req, res) => {
    await getDb()
      .collection(COLLECTIONS.USERS)
      .doc(req.user.uid)
      .set(
        { lastLoginAt: FieldValue.serverTimestamp(), emailVerified: req.user.emailVerified },
        { merge: true },
      );
    const profile = await usersRepo.getById(req.user.uid);
    return sendSuccess(res, toProfile({ ...profile, ...req.user }));
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await usersRepo.getById(req.user.uid);
    if (!profile) throw ApiError.notFound('Your profile could not be found.');
    return sendSuccess(res, toProfile({ ...profile, role: req.user.role }));
  }),
);

router.patch(
  '/me',
  requireAuth,
  validate({ body: profileUpdateSchema }),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, displayName, phone, marketingOptIn } = req.body;
    const patch = {};
    if (firstName !== undefined) patch.firstName = firstName;
    if (lastName !== undefined) patch.lastName = lastName;
    if (phone !== undefined) patch.phone = phone;
    if (marketingOptIn !== undefined) patch.marketingOptIn = marketingOptIn;

    const resolvedName =
      displayName || [patch.firstName, patch.lastName].filter(Boolean).join(' ').trim();
    if (resolvedName) patch.displayName = resolvedName;

    // Role, status and email can never be changed through this endpoint.
    const updated = await usersRepo.update(req.user.uid, patch, { actor: req.user });
    if (patch.displayName) {
      await getAuthAdmin().updateUser(req.user.uid, { displayName: patch.displayName });
    }
    return sendSuccess(res, toProfile({ ...updated, role: req.user.role }));
  }),
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    // Revoking refresh tokens invalidates the session everywhere.
    await getAuthAdmin().revokeRefreshTokens(req.user.uid);
    return sendSuccess(res, { loggedOut: true });
  }),
);

/* -------------------------------------------------------------------------- */
/* Password reset / verification                                               */
/* -------------------------------------------------------------------------- */

router.post(
  '/forgot-password',
  authLimiter,
  spamGuard({ textFields: [] }),
  validate({ body: emailOnlySchema }),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const settings = await loadSettings();
    let emailSent = false;

    if (isMailConfigured()) {
      try {
        const user = await getAuthAdmin().getUserByEmail(email);
        const link = await getAuthAdmin().generatePasswordResetLink(email, {
          url: `${env.siteUrl}/login`,
        });
        const result = await sendMail({
          to: email,
          subject: `Reset your password — ${settings.brandName}`,
          html: actionEmail({
            brand: settings.brandName,
            heading: 'Reset your password',
            intro: `Hi ${user.displayName || 'there'}, we received a request to reset the password for your account.`,
            buttonLabel: 'Choose a new password',
            link: toAppActionUrl(link, '/reset-password'),
            footer: 'This link expires in 1 hour. If you did not request a reset, no action is needed.',
          }),
        });
        emailSent = result.sent;
      } catch (error) {
        // Never reveal whether the address exists.
        logger.debug('Password reset request for unknown or failing address', error?.message);
      }
    }

    return sendSuccess(res, {
      // Always the same response shape, regardless of account existence.
      requested: true,
      emailSent,
      clientShouldSendReset: !emailSent,
    });
  }),
);

router.post(
  '/resend-verification',
  authLimiter,
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.emailVerified) {
      return sendSuccess(res, { alreadyVerified: true, emailSent: false });
    }
    const settings = await loadSettings();
    let emailSent = false;

    if (isMailConfigured()) {
      const link = await getAuthAdmin().generateEmailVerificationLink(req.user.email, {
        url: `${env.siteUrl}/login`,
      });
      const result = await sendMail({
        to: req.user.email,
        subject: `Confirm your email address — ${settings.brandName}`,
        html: actionEmail({
          brand: settings.brandName,
          heading: 'Confirm your email address',
          intro: 'Please confirm your email address to secure your account.',
          buttonLabel: 'Confirm email address',
          link: toAppActionUrl(link, '/verify-email'),
          footer: 'This link expires in 1 hour.',
        }),
      });
      emailSent = result.sent;
    }

    return sendSuccess(res, {
      alreadyVerified: false,
      emailSent,
      clientShouldSendVerification: !emailSent,
    });
  }),
);

/* -------------------------------------------------------------------------- */
/* My enquiries                                                               */
/* -------------------------------------------------------------------------- */

router.get(
  '/my-enquiries',
  requireAuth,
  asyncHandler(async (req, res) => {
    const uid = req.user.uid;
    const db = getDb();

    const collections = [
      { col: COLLECTIONS.BOOKING_ENQUIRIES, typeLabel: 'Booking enquiry', icon: 'calendar' },
      { col: COLLECTIONS.CONTACT_SUBMISSIONS, typeLabel: 'Contact', icon: 'mail' },
      { col: COLLECTIONS.CORPORATE_ENQUIRIES, typeLabel: 'Corporate enquiry', icon: 'briefcase' },
      { col: COLLECTIONS.SUPPORT_REQUESTS, typeLabel: 'Support request', icon: 'help-circle' },
    ];

    const results = await Promise.all(
      collections.map(async ({ col, typeLabel, icon }) => {
        // Primary match: submissions linked to the authenticated user.
        const byUidSnap = await db
          .collection(col)
          .where('meta.submittedByUid', '==', uid)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();

        const docsById = new Map();
        for (const doc of byUidSnap.docs) docsById.set(doc.id, doc.data());

        return Array.from(docsById.entries()).map(([id, data]) => ({
          id,
          ...data,
          _typeLabel: typeLabel,
          _icon: icon,
        }));
      }),
    );

    const all = results
      .flat()
      .sort((a, b) => {
        const ta = a.createdAt?._seconds || 0;
        const tb = b.createdAt?._seconds || 0;
        return tb - ta;
      });

    return sendSuccess(res, all);
  }),
);

/** Called by the client after applyActionCode so the profile stays in sync. */
router.post(
  '/verified',
  requireAuth,
  asyncHandler(async (req, res) => {
    await usersRepo.update(req.user.uid, { emailVerified: req.user.emailVerified });
    return sendSuccess(res, { emailVerified: req.user.emailVerified });
  }),
);

export default router;
