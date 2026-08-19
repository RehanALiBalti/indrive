import { Link, useNavigate } from 'react-router-dom';
import { useAuth, describeAuthError } from '../../context/AuthContext.jsx';
import { useForm, validators } from '../../hooks/useForm.js';
import { useToast } from '../../context/ToastContext.jsx';
import Seo from '../../components/seo/Seo.jsx';
import AuthLayout from './AuthLayout.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, PasswordInput, Checkbox, Honeypot } from '../../components/ui/Field.jsx';
import { Alert } from '../../components/ui/Misc.jsx';

const SignUpPage = () => {
  const { register, authAvailable } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      consent: false,
      marketingOptIn: false,
    },
    rules: {
      firstName: [validators.required('Enter your first name.'), validators.minLength(2)],
      lastName: [validators.required('Enter your last name.')],
      email: [validators.required('Enter your email address.'), validators.email()],
      phone: [validators.phone()],
      password: [validators.required('Choose a password.'), validators.strongPassword()],
      confirmPassword: [
        validators.required('Confirm your password.'),
        validators.matches((values) => values.password, 'Both passwords must match.'),
      ],
      consent: [validators.required('Please accept the terms and privacy policy.')],
    },
    onSubmit: async (values) => {
      const { confirmPassword, ...payload } = values;
      try {
        await register(payload);
        toast.success('Account created successfully. Welcome!');
        navigate('/account', { replace: true });
      } catch (error) {
        // Field-level errors from the API are re-thrown so useForm can map them.
        if (error?.fieldErrors && Object.keys(error.fieldErrors).length) throw error;
        throw new Error(describeAuthError(error));
      }
    },
  });

  return (
    <>
      <Seo title="Create an account" description="Create an account to manage your journeys." noindex />

      <AuthLayout
        title="Create your account"
        lead="It takes about a minute and makes future enquiries much faster."
        footer={
          <>
            Already have an account? <Link to="/login">Sign in</Link>
          </>
        }
      >
        {!authAvailable ? (
          <Alert variant="warning" title="Sign-up is not configured">
            Firebase authentication keys are missing from this environment.
          </Alert>
        ) : null}

        <form className="auth__form" onSubmit={form.handleSubmit} noValidate>
          <Honeypot value={form.values._hp || ''} onChange={form.handleChange} />

          <div className="field-row">
            <Input {...form.fieldProps('firstName')} label="First name" autoComplete="given-name" required />
            <Input {...form.fieldProps('lastName')} label="Last name" autoComplete="family-name" required />
          </div>

          <Input {...form.fieldProps('email')} type="email" label="Email address" autoComplete="email" required />
          <Input {...form.fieldProps('phone')} type="tel" label="Mobile number" autoComplete="tel" optional />

          <PasswordInput
            {...form.fieldProps('password')}
            label="Password"
            autoComplete="new-password"
            hint="At least 8 characters, with an uppercase letter and a number."
            required
          />
          <PasswordInput
            {...form.fieldProps('confirmPassword')}
            label="Confirm password"
            autoComplete="new-password"
            required
          />

          <Checkbox
            {...form.checkboxProps('consent')}
            label={
              <>
                I agree to the <Link to="/terms-and-conditions">terms and conditions</Link> and{' '}
                <Link to="/privacy-policy">privacy policy</Link>.
              </>
            }
          />
          <Checkbox
            {...form.checkboxProps('marketingOptIn')}
            label="Send me occasional travel guides and offers by email."
          />

          {form.submitError ? <Alert variant="error">{form.submitError}</Alert> : null}

          <Button type="submit" variant="primary" size="lg" loading={form.submitting} block>
            {form.submitting ? 'Creating your account…' : 'Create account'}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
};

export default SignUpPage;
