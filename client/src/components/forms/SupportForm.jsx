import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useForm, validators } from '../../hooks/useForm.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../ui/Button.jsx';
import { Input, Textarea, Select, Checkbox, RadioGroup, Honeypot } from '../ui/Field.jsx';
import { Alert } from '../ui/Misc.jsx';

const CATEGORIES = [
  { value: 'existing-booking', label: 'An existing booking' },
  { value: 'amend-cancel', label: 'Amend or cancel a journey' },
  { value: 'billing', label: 'Billing or receipts' },
  { value: 'lost-property', label: 'Lost property' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'technical', label: 'Website or account problem' },
  { value: 'other', label: 'Something else' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Travelling today' },
];

const SupportForm = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      category: 'existing-booking',
      bookingReference: '',
      priority: 'normal',
      subject: '',
      message: '',
      consent: false,
    },
    rules: {
      name: [validators.required('Enter your name.'), validators.minLength(2)],
      email: [validators.required('Enter your email address.'), validators.email()],
      phone: [validators.phone()],
      subject: [validators.required('Add a short subject.'), validators.minLength(3)],
      message: [
        validators.required('Describe the issue so we can help.'),
        validators.minLength(10, 'Please give us a little more detail.'),
      ],
      consent: [validators.required('Please accept the privacy policy to continue.')],
    },
    onSubmit: async (values) => {
      const result = await api.post('/support', { ...values, sourcePath: window.location.pathname });
      toast.success(`Support request ${result.reference} logged.`);
      navigate(result.thankYouPath || '/thank-you?type=support');
    },
  });

  return (
    <form className="card" onSubmit={form.handleSubmit} noValidate>
      <div className="card__body stack">
        <Honeypot value={form.values._hp || ''} onChange={form.handleChange} />

        <div className="field-row">
          <Input {...form.fieldProps('name')} label="Your name" autoComplete="name" required />
          <Input {...form.fieldProps('email')} type="email" label="Email address" autoComplete="email" required />
        </div>

        <div className="field-row">
          <Input {...form.fieldProps('phone')} type="tel" label="Phone number" autoComplete="tel" optional />
          <Input
            {...form.fieldProps('bookingReference')}
            label="Booking reference"
            placeholder="e.g. ENQ-250817-A1B2"
            optional
          />
        </div>

        <Select {...form.fieldProps('category')} label="What do you need help with?" options={CATEGORIES} />

        <RadioGroup
          label="How urgent is this?"
          name="priority"
          value={form.values.priority}
          options={PRIORITIES}
          onChange={form.handleChange}
        />

        <Input {...form.fieldProps('subject')} label="Subject" required />

        <Textarea
          {...form.fieldProps('message')}
          label="How can we help?"
          rows={6}
          placeholder="Include dates, times and any reference numbers so we can find your journey quickly."
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
              and to being contacted about this request.
            </>
          }
        />

        {form.submitError ? (
          <Alert variant="error" title="We could not send your request">
            {form.submitError}
          </Alert>
        ) : null}

        <Button type="submit" variant="primary" size="lg" loading={form.submitting}>
          {form.submitting ? 'Sending…' : 'Submit support request'}
        </Button>
      </div>
    </form>
  );
};

export default SupportForm;
