/**
 * Grants (or changes) a role for an existing account.
 *
 *   npm run set-admin -- you@example.com
 *   npm run set-admin -- editor@example.com editor
 *
 * The role is written both as a Firebase custom claim (used for fast, verified
 * authorisation on every request) and onto the Firestore user profile.
 */
import { getAuthAdmin, getDb, FieldValue, isFirebaseReady, getInitError } from '../config/firebase.js';
import { COLLECTIONS, ALL_ROLES, ROLES } from '../constants/collections.js';

const [emailArg, roleArg = ROLES.ADMIN] = process.argv.slice(2);

const fail = (message) => {
  console.error(`\n\x1b[31m${message}\x1b[0m\n`);
  process.exit(1);
};

const run = async () => {
  if (!isFirebaseReady()) {
    fail(getInitError()?.message || 'Firebase Admin is not configured. See server/.env.example.');
  }
  if (!emailArg) {
    fail('Usage: npm run set-admin -- <email> [role]\n\nExample: npm run set-admin -- owner@example.com admin');
  }
  if (!ALL_ROLES.includes(roleArg)) {
    fail(`Unknown role "${roleArg}". Valid roles: ${ALL_ROLES.join(', ')}`);
  }

  const email = emailArg.trim().toLowerCase();
  const auth = getAuthAdmin();

  const user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) {
    fail(
      `No account exists for ${email}.\nCreate the account first by signing up on the website, then run this command again.`,
    );
  }

  await auth.setCustomUserClaims(user.uid, { role: roleArg });
  // Force the next request to mint a token containing the new claim.
  await auth.revokeRefreshTokens(user.uid);

  await getDb()
    .collection(COLLECTIONS.USERS)
    .doc(user.uid)
    .set(
      {
        uid: user.uid,
        email,
        displayName: user.displayName || email.split('@')[0],
        role: roleArg,
        status: 'active',
        emailVerified: user.emailVerified,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  console.log(`\n\x1b[32m✓ ${email} now has the "${roleArg}" role.\x1b[0m`);
  console.log('  Sign out and sign back in for the change to take effect.\n');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
