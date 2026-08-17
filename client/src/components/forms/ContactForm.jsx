import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useForm, validators } from '../../hooks/useForm.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../ui/Button.jsx';
import { Input, Textarea, Select, Checkbox, Honeypot } from '../ui/Field.jsx';
import { Alert } from '../ui/Misc.jsx';

const SUBJECTS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'quote', label: 'Request a quote' },
  { value: 'existing-booking', label: 'An existing booking' },
  { value: 'corporate', label: 'Corporate accounts' },
  { value: 'feedback', label: 'Feedback or complaint' },
  { value: 'other', label: 'Something else' },
];

const ContactForm = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      subject: 'general',
      message: '',
      consent: false,
    },
    rules: {
      firstName: [validators.required('Enter your first name.'), validators.minLength(2)],
      lastName: [validators.required('Enter your last name.')],
      email: [validators.required('Enter your email address.'), validators.email()],
      phone: [validators.phone()],
      message: [
        validators.required('Please tell us how we can help.'),
        validators.minLength(10, 'Please give us a little more detail (at least 10 characters).'),
        validators.maxLength(5000),
      ],
      consent: [validators.required('Please accept the privacy policy to continue.')],
    },
    onSubmit: async (values) => {
      const result = await api.post('/contact', {
        ...values,
        // Send the human-readable label so notification emails read naturally.
        subject: SUBJECTS.find((item) => item.value === values.subject)?.label || values.subject,
        sourcePath: window.location.pathname,
      });
      toast.success(`Message ${result.reference} sent. We usually reply within a few hours.`);
      navigate(result.thankYouPath || '/thank-you?type=contact');
    },
  });

  return (
    <form className="card" onSubmit={form.handleSubmit} noValidate>
      <div className="card__body stack">
        <Honeypot value={form.values._hp || ''} onChange={form.handleChange} />

        <div className="field-row">
          <Input {...form.fieldProps('firstName')} label="First name" autoComplete="given-name" required />
          <Input {...form.fieldProps('lastName')} label="Last name" autoComplete="family-name" required />
        </div>

        <div className="field-row">
          <Input {...form.fieldProps('email')} type="email" label="Email address" autoComplete="email" required />
          <Input {...form.fieldProps('phone')} type="tel" label="Phone number" autoComplete="tel" optional />
        </div>

        <Select {...form.fieldProps('subject')} label="What is your enquiry about?" options={SUBJECTS} />

        <Textarea
          {...form.fieldProps('message')}
          label="Your message"
          placeholder="Tell us about your journey, dates and any special requirements."
          rows={6}
          required
        />

        <Checkbox
          {...form.checkboxProps('consent')}
          label={
            <>
              I agree to the{' '}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                privacy policy
              </a>{' '}
              and to being contacted about this enquiry.
            </>
          }
        />

        {form.submitError ? (
          <Alert variant="error" title="We could not send your message">
            {form.submitError}
          </Alert>
        ) : null}

        <Button type="submit" variant="primary" size="lg" loading={form.submitting}>
          {form.submitting ? 'Sending…' : 'Send message'}
        </Button>
      </div>
    </form>
  );
};

export default ContactForm;
