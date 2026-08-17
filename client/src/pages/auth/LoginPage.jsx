import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, describeAuthError } from '../../context/AuthContext.jsx';
import { useForm, validators } from '../../hooks/useForm.js';
import { useToast } from '../../context/ToastContext.jsx';
import Seo from '../../components/seo/Seo.jsx';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, PasswordInput } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Misc.jsx';

const LoginPage = () => {
  const { signIn, authAvailable } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const redirectTo = location.state?.from || '/account';

  const form = useForm({
    initialValues: { email: '', password: '' },
    rules: {
      email: [validators.required('Enter your email address.'), validators.email()],
      password: [validators.required('Enter your password.')],
    },
    onSubmit: async (values) => {
      try {
        const profile = await signIn(values.email, values.password);
        toast.success(`Welcome back${profile?.firstName ? `, ${profile.firstName}` : ''}.`);
        const isStaff = profile?.role === 'admin' || profile?.role === 'editor';
        navigate(redirectTo === '/account' && isStaff ? '/admin' : redirectTo, { replace: true });
      } catch (error) {
        throw new Error(describeAuthError(error));
      }
    },
  });

  return (
    <>
      <Seo title="Sign in" description="Sign in to your account to manage enquiries and bookings." noindex />

      <AuthLayout
        title="Sign in"
        lead="Access your enquiries, saved details and journey history."
        footer={
          <>
            Do not have an account? <Link to="/sign-up">Create one</Link>
          </>
        }
      >
        {!authAvailable ? (
          <Alert variant="warning" title="Sign-in is not configured">
            Firebase authentication keys are missing from this environment. Add the <code>VITE_FIREBASE_*</code>{' '}
            values to <code>client/.env</code> and reload.
          </Alert>
        ) : null}

        <form className="auth__form" onSubmit={form.handleSubmit} noValidate>
          <Input
            {...form.fieldProps('email')}
            type="email"
            label="Email address"
            autoComplete="email"
            autoFocus
            required
          />
          <PasswordInput
            {...form.fieldProps('password')}
            label="Password"
            autoComplete="current-password"
            required
          />

          <div className="auth__meta">
            <Link to="/forgot-password">Forgotten your password?</Link>
          </div>

          {form.submitError ? <Alert variant="error">{form.submitError}</Alert> : null}

          <Button type="submit" variant="primary" size="lg" loading={form.submitting} block>
            {form.submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
};

export default LoginPage;
