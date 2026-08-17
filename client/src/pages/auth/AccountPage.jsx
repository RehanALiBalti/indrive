import { useState } from 'react';
import { useAuth, describeAuthError } from '../../context/AuthContext.jsx';
import { useForm, validators } from '../../hooks/useForm.js';
import { useToast } from '../../context/ToastContext.jsx';
import Seo from '../../components/seo/Seo.jsx';
import PageHero from '../../components/sections/PageHero.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, PasswordInput, Checkbox } from '../../components/ui/Field.jsx';
import { Alert, Badge } from '../../components/ui/Misc.jsx';

const AccountPage = () => {
  const { profile, user, isEmailVerified, updateProfile, changePassword, resendVerification, signOut } =
    useAuth();
  const toast = useToast();
  const [verificationSent, setVerificationSent] = useState(false);

  const details = useForm({
    initialValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
      marketingOptIn: Boolean(profile?.marketingOptIn),
    },
    rules: {
      firstName: [validators.required('Enter your first name.')],
      lastName: [validators.required('Enter your last name.')],
      phone: [validators.phone()],
    },
    onSubmit: async (values) => {
      await updateProfile(values);
      toast.success('Your details have been saved.');
    },
  });

  const password = useForm({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    rules: {
      currentPassword: [validators.required('Enter your current password.')],
      newPassword: [validators.required('Choose a new password.'), validators.strongPassword()],
      confirmPassword: [
        validators.required('Confirm your new password.'),
        validators.matches((values) => values.newPassword, 'Both passwords must match.'),
      ],
    },
    onSubmit: async (values, helpers) => {
      try {
        await changePassword(values.currentPassword, values.newPassword);
        toast.success('Your password has been changed.');
        helpers.reset();
      } catch (error) {
        throw new Error(describeAuthError(error));
      }
    },
  });

  return (
    <>
      <Seo title="My account" noindex />

      <PageHero
        eyebrow="Your account"
        title={profile?.firstName ? `Hello, ${profile.firstName}` : 'My account'}
        lead="Manage your contact details, password and email preferences."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'My account', href: '/account' },
        ]}
      />

      <section className="section">
        <div className="container">
          {!isEmailVerified ? (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <Alert variant="warning" title="Please verify your email address">
                We sent a verification link to {user?.email}. Verifying your address lets us send booking
                confirmations reliably.{' '}
                {verificationSent ? (
                  <strong>A new link has been sent.</strong>
                ) : (
                  <button
                    type="button"
                    className="btn btn--link"
                    onClick={async () => {
                      try {
                        await resendVerification();
                        setVerificationSent(true);
                        toast.success('Verification email sent.');
                      } catch (error) {
                        toast.error(describeAuthError(error));
                      }
                    }}
                  >
                    Send it again
                  </button>
                )}
              </Alert>
            </div>
          ) : null}

          <div className="grid grid--2">
            <form className="card" onSubmit={details.handleSubmit} noValidate>
              <div className="card__body stack">
                <h2 className="card__title">Your details</h2>

                <div className="field-row">
                  <Input {...details.fieldProps('firstName')} label="First name" autoComplete="given-name" required />
                  <Input {...details.fieldProps('lastName')} label="Last name" autoComplete="family-name" required />
                </div>

                <Input label="Email address" value={user?.email || ''} readOnly disabled name="email" />
                <Input {...details.fieldProps('phone')} type="tel" label="Mobile number" autoComplete="tel" optional />

                <Checkbox
                  {...details.checkboxProps('marketingOptIn')}
                  label="Send me occasional travel guides and offers by email."
                />

                {details.submitError ? <Alert variant="error">{details.submitError}</Alert> : null}

                <Button type="submit" variant="primary" loading={details.submitting}>
                  Save changes
                </Button>
              </div>
            </form>

            <div className="stack">
              <form className="card" onSubmit={password.handleSubmit} noValidate>
                <div className="card__body stack">
                  <h2 className="card__title">Change password</h2>
                  <PasswordInput
                    {...password.fieldProps('currentPassword')}
                    label="Current password"
                    autoComplete="current-password"
                    required
                  />
                  <PasswordInput
                    {...password.fieldProps('newPassword')}
                    label="New password"
                    autoComplete="new-password"
                    hint="At least 8 characters, with an uppercase letter and a number."
                    required
                  />
                  <PasswordInput
                    {...password.fieldProps('confirmPassword')}
                    label="Confirm new password"
                    autoComplete="new-password"
                    required
                  />

                  {password.submitError ? <Alert variant="error">{password.submitError}</Alert> : null}

                  <Button type="submit" variant="outline" loading={password.submitting}>
                    Update password
                  </Button>
                </div>
              </form>

              <div className="card">
                <div className="card__body stack">
                  <h2 className="card__title">Account</h2>
                  <p className="card__text">
                    Signed in as {user?.email} · <Badge>{profile?.role || 'user'}</Badge>
                  </p>
                  <Button variant="ghost" icon="logout" onClick={signOut}>
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AccountPage;
