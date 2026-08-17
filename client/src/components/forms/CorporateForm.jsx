import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useForm, validators } from '../../hooks/useForm.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../ui/Button.jsx';
import { Input, Textarea, Select, Checkbox, Honeypot } from '../ui/Field.jsx';
import { Alert } from '../ui/Misc.jsx';

const EMPLOYEES = [
  { value: '', label: 'Prefer not to say' },
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '500+', label: '500+ employees' },
];

const JOURNEYS = [
  { value: '', label: 'Not sure yet' },
  { value: '1-10', label: '1–10 journeys' },
  { value: '11-30', label: '11–30 journeys' },
  { value: '31-100', label: '31–100 journeys' },
  { value: '100+', label: '100+ journeys' },
];

const SERVICES = [
  'Airport transfers',
  'City-to-city travel',
  'Hourly chauffeur hire',
  'Roadshows',
  'Event transport',
  'VIP and executive travel',
];

const CorporateForm = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      companyName: '',
      contactName: '',
      jobTitle: '',
      email: '',
      phone: '',
      website: '',
      industry: '',
      employees: '',
      estimatedMonthlyJourneys: '',
      servicesRequired: [],
      message: '',
      consent: false,
    },
    rules: {
      companyName: [validators.required('Enter your company name.'), validators.minLength(2)],
      contactName: [validators.required('Enter a contact name.'), validators.minLength(2)],
      email: [validators.required('Enter a work email address.'), validators.email()],
      phone: [validators.required('Enter a contact number.'), validators.phone()],
      message: [
        validators.required('Tell us what your business needs.'),
        validators.minLength(10, 'Please give us a little more detail.'),
      ],
      consent: [validators.required('Please accept the privacy policy to continue.')],
    },
    onSubmit: async (values) => {
      const result = await api.post('/corporate-enquiries', {
        ...values,
        sourcePath: window.location.pathname,
      });
      toast.success(`Enquiry ${result.reference} received. Our corporate team will be in touch.`);
      navigate(result.thankYouPath || '/thank-you?type=corporate');
    },
  });

  const toggleService = (service) => {
    const current = form.values.servicesRequired;
    form.setValue(
      'servicesRequired',
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service],
    );
  };

  return (
    <form className="card" onSubmit={form.handleSubmit} noValidate>
      <div className="card__body stack">
        <Honeypot value={form.values._hp || ''} onChange={form.handleChange} />

        <div className="field-row">
          <Input {...form.fieldProps('companyName')} label="Company name" autoComplete="organization" required />
          <Input {...form.fieldProps('industry')} label="Industry" optional />
        </div>

        <div className="field-row">
          <Input {...form.fieldProps('contactName')} label="Your name" autoComplete="name" required />
          <Input {...form.fieldProps('jobTitle')} label="Job title" autoComplete="organization-title" optional />
        </div>

        <div className="field-row">
          <Input {...form.fieldProps('email')} type="email" label="Work email" autoComplete="email" required />
          <Input {...form.fieldProps('phone')} type="tel" label="Phone number" autoComplete="tel" required />
        </div>

        <div className="field-row">
          <Select {...form.fieldProps('employees')} label="Company size" options={EMPLOYEES} optional />
          <Select
            {...form.fieldProps('estimatedMonthlyJourneys')}
            label="Estimated journeys per month"
            options={JOURNEYS}
            optional
          />
        </div>

        <Input {...form.fieldProps('website')} label="Website" placeholder="https://" optional />

        <fieldset style={{ border: 0, padding: 0 }} className="field">
          <legend className="field__label">Which services are you interested in?</legend>
          <div className="chip-row">
            {SERVICES.map((service) => (
              <label className="check" key={service}>
                <input
                  type="checkbox"
                  checked={form.values.servicesRequired.includes(service)}
                  onChange={() => toggleService(service)}
                />
                <span>{service}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Textarea
          {...form.fieldProps('message')}
          label="Tell us about your requirements"
          placeholder="Travel policies, invoicing, cost centres, typical routes, expected volumes…"
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
          <Alert variant="error" title="We could not send your enquiry">
            {form.submitError}
          </Alert>
        ) : null}

        <Button type="submit" variant="primary" size="lg" loading={form.submitting}>
          {form.submitting ? 'Sending…' : 'Request a corporate account'}
        </Button>
      </div>
    </form>
  );
};

export default CorporateForm;
