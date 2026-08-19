import { useAuth, describeAuthError } from '../../context/AuthContext.jsx';
import { useForm, validators } from '../../hooks/useForm.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import Seo from '../../components/seo/Seo.jsx';
import PageHero from '../../components/sections/PageHero.jsx';
import Button from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Input, PasswordInput, Checkbox } from '../../components/ui/Field.jsx';
import { Alert, Badge } from '../../components/ui/Misc.jsx';

const STATUS_LABEL = {
  new: 'New',
  in_progress: 'In progress',
  resolved: 'Resolved',
  archived: 'Archived',
};

const STATUS_VARIANT = {
  new: 'info',
  in_progress: 'warning',
  resolved: 'success',
  archived: undefined,
};

const formatDate = (val) => {
  if (!val) return '';
  const d = val._seconds ? new Date(val._seconds * 1000) : new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const EnquiryRow = ({ item }) => (
  <div className="enquiry-row">
    <div className="enquiry-row__main">
      <span className="enquiry-row__ref">{item.reference}</span>
      <span className="enquiry-row__type">
        <Icon name={item._icon || 'calendar'} size={14} />
        {item._typeLabel}
      </span>
    </div>
    <div className="enquiry-row__detail">
      {item.pickup || item.subject || item.companyName || '—'}
      {item.destination ? ` → ${item.destination}` : ''}
    </div>
    <div className="enquiry-row__meta">
      <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status] || item.status}</Badge>
      <span className="enquiry-row__date">{formatDate(item.createdAt)}</span>
    </div>
  </div>
);

const MyEnquiries = () => {
  const enquiries = useApi('/auth/my-enquiries', { auth: true });

  if (enquiries.loading) {
    return (
      <div className="card">
        <div className="card__body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div className="btn__spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  const items = enquiries.data || [];

  if (!items.length) {
    return (
      <div className="card">
        <div className="card__body stack" style={{ textAlign: 'center' }}>
          <Icon name="calendar" size={32} style={{ opacity: 0.3, margin: '0 auto' }} />
          <p className="card__text">You have not submitted any enquiries yet.</p>
          <Button to="/#enquiry" variant="outline" size="sm">
            Request a quote
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card__body">
        <h2 className="card__title">My enquiries</h2>
        <div className="enquiry-list">
          {items.map((item) => (
            <EnquiryRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const AccountPage = () => {
  const { profile, user, updateProfile, changePassword, signOut } = useAuth();
  const toast = useToast();

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

          <div style={{ marginTop: 'var(--space-8)' }}>
            <MyEnquiries />
          </div>
        </div>
      </section>
    </>
  );
};

export default AccountPage;
