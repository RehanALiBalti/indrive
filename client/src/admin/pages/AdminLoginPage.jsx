import { Link, useNavigate } from 'react-router-dom';
import { useAuth, describeAuthError } from '../../context/AuthContext.jsx';
import { useForm, validators } from '../../hooks/useForm.js';
import { useToast } from '../../context/ToastContext.jsx';
import Seo from '../../components/seo/Seo.jsx';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Input, PasswordInput } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Misc.jsx';
import { useSite } from '../../context/SiteContext.jsx';

const AdminLoginPage = () => {
  const { signIn, authAvailable, isAuthenticated, hasRole } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();
  const toast = useToast();

  if (isAuthenticated && hasRole('editor')) {
    navigate('/admin', { replace: true });
    return null;
  }

  const form = useForm({
    initialValues: { email: '', password: '' },
    rules: {
      email: [validators.required('Enter your email address.'), validators.email()],
      password: [validators.required('Enter your password.')],
    },
    onSubmit: async (values) => {
      try {
        const profile = await signIn(values.email, values.password);
        const isStaff = profile?.role === 'admin' || profile?.role === 'editor';
        if (!isStaff) {
          throw new Error('Your account does not have admin access. Please contact an administrator.');
        }
        toast.success(`Welcome back${profile?.firstName ? `, ${profile.firstName}` : ''}.`);
        navigate('/admin', { replace: true });
      } catch (error) {
        if (error.message?.includes('admin access')) throw error;
        throw new Error(describeAuthError(error));
      }
    },
  });

  return (
    <>
      <Seo title="Admin sign in" noindex />

      <div className="admin-login">
        <div className="admin-login__card">
          <div className="admin-login__header">
            <span className="admin-login__icon">
              <Icon name="lock" size={24} />
            </span>
            <h1 className="admin-login__title">Admin portal</h1>
            <p className="admin-login__lead">{settings.brandName} content management</p>
          </div>

          {!authAvailable ? (
            <Alert variant="warning" title="Sign-in is not configured">
              Firebase authentication keys are missing. Add the <code>VITE_FIREBASE_*</code> values to{' '}
              <code>client/.env</code> and reload.
            </Alert>
          ) : null}

          <form className="admin-login__form" onSubmit={form.handleSubmit} noValidate>
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

            {form.submitError ? <Alert variant="error">{form.submitError}</Alert> : null}

            <Button type="submit" variant="primary" size="lg" loading={form.submitting} block>
              {form.submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="admin-login__footer">
            <Link to="/forgot-password">Forgotten your password?</Link>
            <span className="admin-login__sep">·</span>
            <Link to="/">Back to the website</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLoginPage;
