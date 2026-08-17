import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, describeAuthError } from '../../context/AuthContext.jsx';
import { useForm, validators } from '../../hooks/useForm.js';
import Seo from '../../components/seo/Seo.jsx';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Misc.jsx';

const ForgotPasswordPage = () => {
  const { requestPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);

  const form = useForm({
    initialValues: { email: '' },
    rules: { email: [validators.required('Enter your email address.'), validators.email()] },
    onSubmit: async (values) => {
      try {
        await requestPasswordReset(values.email);
        setSent(true);
      } catch (error) {
        throw new Error(describeAuthError(error));
      }
    },
  });

  return (
    <>
      <Seo title="Reset your password" noindex />

      <AuthLayout
        title="Reset your password"
        lead="Enter the email address you signed up with and we will send you a reset link."
        footer={
          <>
            Remembered it? <Link to="/login">Back to sign in</Link>
          </>
        }
      >
        {sent ? (
          <div className="stack" style={{ marginTop: 'var(--space-6)' }}>
            <Alert variant="success" title="Check your inbox">
              If an account exists for that address, a password reset link is on its way. The link expires in
              one hour.
            </Alert>
            <Button to="/login" variant="outline" block>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form className="auth__form" onSubmit={form.handleSubmit} noValidate>
            <Input
              {...form.fieldProps('email')}
              type="email"
              label="Email address"
              autoComplete="email"
              autoFocus
              required
            />

            {form.submitError ? <Alert variant="error">{form.submitError}</Alert> : null}

            <Button type="submit" variant="primary" size="lg" loading={form.submitting} block>
              {form.submitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}
      </AuthLayout>
    </>
  );
};

export default ForgotPasswordPage;
