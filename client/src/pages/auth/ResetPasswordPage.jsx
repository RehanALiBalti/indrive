import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, describeAuthError } from '../../context/AuthContext.jsx';
import { useForm, validators } from '../../hooks/useForm.js';
import { useToast } from '../../context/ToastContext.jsx';
import Seo from '../../components/seo/Seo.jsx';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { PasswordInput } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Misc.jsx';
import { Loading } from '../../components/ui/States.jsx';

/**
 * Completes a Firebase password reset. The one-time `oobCode` arrives in the
 * emailed link; it is verified before the form is shown so an expired link
 * fails immediately rather than after the user has typed a new password.
 */
const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const { verifyResetCode, completePasswordReset } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const oobCode = params.get('oobCode') || '';
  const [status, setStatus] = useState(oobCode ? 'checking' : 'missing');
  const [email, setEmail] = useState('');
  const [codeError, setCodeError] = useState(null);

  useEffect(() => {
    if (!oobCode) return;
    let cancelled = false;
    verifyResetCode(oobCode)
      .then((address) => {
        if (cancelled) return;
        setEmail(address);
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        setCodeError(describeAuthError(error));
        setStatus('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [oobCode, verifyResetCode]);

  const form = useForm({
    initialValues: { password: '', confirmPassword: '' },
    rules: {
      password: [validators.required('Choose a new password.'), validators.strongPassword()],
      confirmPassword: [
        validators.required('Confirm your new password.'),
        validators.matches((values) => values.password, 'Both passwords must match.'),
      ],
    },
    onSubmit: async (values) => {
      try {
        await completePasswordReset(oobCode, values.password);
        toast.success('Your password has been changed. Please sign in.');
        navigate('/login', { replace: true });
      } catch (error) {
        throw new Error(describeAuthError(error));
      }
    },
  });

  return (
    <>
      <Seo title="Choose a new password" noindex />

      <AuthLayout
        title="Choose a new password"
        lead={email ? `Setting a new password for ${email}.` : 'Enter a new password for your account.'}
        footer={
          <>
            <Link to="/login">Back to sign in</Link>
          </>
        }
      >
        {status === 'checking' ? <Loading label="Checking your link…" /> : null}

        {status === 'missing' ? (
          <div className="stack" style={{ marginTop: 'var(--space-6)' }}>
            <Alert variant="warning" title="No reset link found">
              Open the link from your password reset email, or request a new one.
            </Alert>
            <Button to="/forgot-password" variant="primary" block>
              Request a reset link
            </Button>
          </div>
        ) : null}

        {status === 'invalid' ? (
          <div className="stack" style={{ marginTop: 'var(--space-6)' }}>
            <Alert variant="error" title="That link is no longer valid">
              {codeError || 'Reset links expire after one hour and can only be used once.'}
            </Alert>
            <Button to="/forgot-password" variant="primary" block>
              Request a new link
            </Button>
          </div>
        ) : null}

        {status === 'ready' ? (
          <form className="auth__form" onSubmit={form.handleSubmit} noValidate>
            <PasswordInput
              {...form.fieldProps('password')}
              label="New password"
              autoComplete="new-password"
              hint="At least 8 characters, with an uppercase letter and a number."
              autoFocus
              required
            />
            <PasswordInput
              {...form.fieldProps('confirmPassword')}
              label="Confirm new password"
              autoComplete="new-password"
              required
            />

            {form.submitError ? <Alert variant="error">{form.submitError}</Alert> : null}

            <Button type="submit" variant="primary" size="lg" loading={form.submitting} block>
              {form.submitting ? 'Saving…' : 'Save new password'}
            </Button>
          </form>
        ) : null}
      </AuthLayout>
    </>
  );
};

export default ResetPasswordPage;
