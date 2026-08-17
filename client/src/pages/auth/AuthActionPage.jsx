import { useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth, describeAuthError } from '../../context/AuthContext.jsx';
import Seo from '../../components/seo/Seo.jsx';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Misc.jsx';
import { Loading } from '../../components/ui/States.jsx';

/**
 * Single landing point for Firebase email action links.
 *
 * Handles both:
 *  - Firebase Console "Action URL" → /auth-action?mode=verifyEmail&oobCode=…
 *  - Branded API emails           → /verify-email?oobCode=…
 */
const AuthActionPage = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const { confirmEmailVerification } = useAuth();

  const oobCode = params.get('oobCode') || '';
  const brandedVerify = location.pathname === '/verify-email';
  const mode = params.get('mode') || (brandedVerify ? 'verifyEmail' : null);
  const [status, setStatus] = useState(oobCode ? 'working' : 'missing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (mode !== 'verifyEmail' || !oobCode) return undefined;
    let cancelled = false;
    confirmEmailVerification(oobCode)
      .then(() => !cancelled && setStatus('verified'))
      .catch((error) => {
        if (cancelled) return;
        setMessage(describeAuthError(error));
        setStatus('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [confirmEmailVerification, mode, oobCode]);

  if (mode === 'resetPassword') {
    return <Navigate to={`/reset-password?oobCode=${encodeURIComponent(oobCode)}`} replace />;
  }

  if (mode !== 'verifyEmail') {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Seo title="Verify your email address" noindex />

      <AuthLayout title="Email verification" lead="Confirming your email address.">
        <div className="stack" style={{ marginTop: 'var(--space-6)' }}>
          {status === 'working' ? <Loading label="Verifying…" /> : null}

          {status === 'missing' ? (
            <>
              <Alert variant="warning" title="No verification link found">
                Open the link from your confirmation email, or sign in and request a new one.
              </Alert>
              <Button to="/login" variant="primary" block>
                Sign in
              </Button>
            </>
          ) : null}

          {status === 'verified' ? (
            <>
              <Alert variant="success" title="Email verified">
                Thank you — your email address is confirmed. You can now use every feature of your account.
              </Alert>
              <Button to="/account" variant="primary" block>
                Go to my account
              </Button>
            </>
          ) : null}

          {status === 'failed' ? (
            <>
              <Alert variant="error" title="We could not verify that link">
                {message || 'Verification links expire after a short time. Sign in and request a new one.'}
              </Alert>
              <Button to="/login" variant="primary" block>
                Sign in
              </Button>
            </>
          ) : null}
        </div>
      </AuthLayout>
    </>
  );
};

export default AuthActionPage;
