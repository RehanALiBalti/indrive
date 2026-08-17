import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  confirmPasswordReset,
  verifyPasswordResetCode,
  applyActionCode,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { getFirebaseAuth, firebaseReady } from '../lib/firebase.js';
import { api, ApiError } from '../lib/api.js';
import { env } from '../config/env.js';

const AuthContext = createContext(null);

const ROLE_LEVELS = { user: 10, editor: 50, admin: 100 };

/** Turns Firebase auth error codes into messages a person can act on. */
export const describeAuthError = (error) => {
  const code = error?.code || '';
  const map = {
    'auth/invalid-credential': 'That email address and password do not match an account.',
    'auth/invalid-login-credentials': 'That email address and password do not match an account.',
    'auth/wrong-password': 'That email address and password do not match an account.',
    'auth/user-not-found': 'That email address and password do not match an account.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/too-many-requests':
      'Too many failed attempts. Please wait a few minutes or reset your password.',
    'auth/network-request-failed': 'We could not reach the authentication service. Check your connection.',
    'auth/email-already-in-use': 'An account with that email address already exists.',
    'auth/weak-password': 'Please choose a stronger password of at least 8 characters.',
    'auth/requires-recent-login': 'Please sign in again before making this change.',
    'auth/expired-action-code': 'That link has expired. Please request a new one.',
    'auth/invalid-action-code': 'That link is no longer valid. Please request a new one.',
    'auth/missing-password': 'Please enter your password.',
  };
  if (map[code]) return map[code];
  if (error instanceof ApiError) return error.message;
  return error?.message || 'Something went wrong. Please try again.';
};

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initialising, setInitialising] = useState(firebaseReady);
  const [profileError, setProfileError] = useState(null);

  /* Keeps the app in sync with Firebase's session and token refreshes. */
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setInitialising(false);
      return undefined;
    }

    return onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setInitialising(false);
        return;
      }
      try {
        // The backend is the authority on role and status.
        const serverProfile = await api.post('/auth/session', {}, { auth: true });
        setProfile(serverProfile);
        setProfileError(null);
      } catch (error) {
        setProfileError(error);
        setProfile(null);
      } finally {
        setInitialising(false);
      }
    });
  }, []);

  const requireAuthAvailable = () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(
        'Sign-in is unavailable because Firebase is not configured. Add the VITE_FIREBASE_* values to client/.env.',
      );
    }
    return auth;
  };

  const signIn = useCallback(async (email, password) => {
    const auth = requireAuthAvailable();
    await signInWithEmailAndPassword(auth, email.trim(), password);
    const serverProfile = await api.post('/auth/session', {}, { auth: true });
    setProfile(serverProfile);
    return serverProfile;
  }, []);

  const register = useCallback(
    async (payload) => {
      // The account is created by the API with the Admin SDK so the client can
      // never influence the assigned role.
      const result = await api.post('/auth/register', payload);
      const signedIn = await signIn(payload.email, payload.password);

      if (result?.clientShouldSendVerification) {
        const auth = getFirebaseAuth();
        if (auth?.currentUser) {
          await sendEmailVerification(auth.currentUser, {
            url: `${env.siteUrl}/account`,
          }).catch(() => null);
        }
      }
      return signedIn;
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    await api.post('/auth/logout', {}, { auth: true }).catch(() => null);
    if (auth) await firebaseSignOut(auth);
    setProfile(null);
    setFirebaseUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    // The API sends a branded email when SMTP is configured; otherwise we fall
    // back to Firebase's own delivery so the feature always works.
    const result = await api.post('/auth/forgot-password', { email, _hp: '', _ts: Date.now() - 3000 });
    if (result?.clientShouldSendReset) {
      const auth = requireAuthAvailable();
      await sendPasswordResetEmail(auth, email.trim(), {
        url: `${env.siteUrl}/login`,
      }).catch((error) => {
        // Never disclose whether the address exists.
        if (error?.code !== 'auth/user-not-found') throw error;
      });
    }
    return true;
  }, []);

  const verifyResetCode = useCallback(async (oobCode) => {
    const auth = requireAuthAvailable();
    return verifyPasswordResetCode(auth, oobCode);
  }, []);

  const completePasswordReset = useCallback(async (oobCode, newPassword) => {
    const auth = requireAuthAvailable();
    await confirmPasswordReset(auth, oobCode, newPassword);
    return true;
  }, []);

  const confirmEmailVerification = useCallback(async (oobCode) => {
    const auth = requireAuthAvailable();
    await applyActionCode(auth, oobCode);
    if (auth.currentUser) {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      await api.post('/auth/verified', {}, { auth: true }).catch(() => null);
      const refreshed = await api.get('/auth/me', { auth: true }).catch(() => null);
      if (refreshed) setProfile(refreshed);
    }
    return true;
  }, []);

  const resendVerification = useCallback(async () => {
    const result = await api.post('/auth/resend-verification', {}, { auth: true });
    if (result?.clientShouldSendVerification) {
      const auth = requireAuthAvailable();
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, { url: `${env.siteUrl}/account` });
      }
    }
    return true;
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const updated = await api.patch('/auth/me', patch, { auth: true });
    setProfile(updated);
    return updated;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const auth = requireAuthAvailable();
    const user = auth.currentUser;
    if (!user?.email) throw new Error('You must be signed in to change your password.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    return true;
  }, []);

  const role = profile?.role || 'user';

  const value = useMemo(
    () => ({
      user: firebaseUser ? { ...profile, uid: firebaseUser.uid, email: firebaseUser.email } : null,
      profile,
      role,
      initialising,
      profileError,
      authAvailable: firebaseReady,
      isAuthenticated: Boolean(firebaseUser && profile),
      isEmailVerified: Boolean(firebaseUser?.emailVerified),
      hasRole: (minimum) => (ROLE_LEVELS[role] ?? 0) >= (ROLE_LEVELS[minimum] ?? Infinity),
      isAdmin: role === 'admin',
      isStaff: (ROLE_LEVELS[role] ?? 0) >= ROLE_LEVELS.editor,
      signIn,
      register,
      signOut,
      requestPasswordReset,
      verifyResetCode,
      completePasswordReset,
      confirmEmailVerification,
      resendVerification,
      updateProfile,
      changePassword,
    }),
    [
      changePassword,
      completePasswordReset,
      confirmEmailVerification,
      firebaseUser,
      initialising,
      profile,
      profileError,
      register,
      requestPasswordReset,
      resendVerification,
      role,
      signIn,
      signOut,
      updateProfile,
      verifyResetCode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
};

export default AuthContext;
