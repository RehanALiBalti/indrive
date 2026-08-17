import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useForm, validators } from '../../hooks/useForm.js';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { Input, Select, DateInput, TimeInput, Textarea, Checkbox, Honeypot } from '../ui/Field.jsx';
import { Alert } from '../ui/Misc.jsx';

const TABS = [
  { value: 'airport', label: 'Airport', icon: 'plane', serviceType: 'airport-transfer' },
  { value: 'city-to-city', label: 'City to city', icon: 'route', serviceType: 'city-to-city' },
  { value: 'hourly', label: 'By the hour', icon: 'clock', serviceType: 'hourly-chauffeur' },
];

const numberOptions = (from, to, suffix = '') =>
  Array.from({ length: to - from + 1 }, (_, index) => {
    const value = from + index;
    return { value: String(value), label: `${value}${suffix}` };
  });

const defaultDate = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

/**
 * The enquiry engine for all three Phase 1 services.
 *
 * Phase 2 note: the payload posted here already carries every field the pricing
 * and booking engines need. When `features.liveBookingEnabled` is switched on in
 * site settings, this same component can call a quote endpoint and render a
 * price before submission without any change to its markup or props.
 */
const BookingWidget = ({
  defaultTab = 'airport',
  lockTab = false,
  seoPageSlug = '',
  prefill = {},
  title = 'Get a fixed-price quote',
  subtitle = 'Tell us about your journey and we will confirm availability and an all-inclusive price.',
  variant = 'panel',
}) => {
  const { settings } = useSite();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState(defaultTab);
  const [step, setStep] = useState(1);

  const { data: vehicles } = useApi('/vehicles', { params: { limit: 20 } });

  const booking = settings.booking || {};
  const maxPassengers = booking.maxPassengers || 8;
  const maxLuggage = booking.maxLuggage || 10;

  const vehicleOptions = useMemo(
    () => [
      { value: '', label: 'Recommend the best option' },
      ...(vehicles || []).map((vehicle) => ({
        value: vehicle.slug,
        label: `${vehicle.name} — up to ${vehicle.passengers} passengers`,
      })),
    ],
    [vehicles],
  );

  const rules = useMemo(() => {
    const shared = {
      date: [validators.required('Choose a pickup date.'), validators.futureDate()],
      time: [validators.required('Choose a pickup time.')],
      passengers: [validators.required('How many passengers?')],
      firstName: [validators.required('Enter your first name.'), validators.minLength(2)],
      lastName: [validators.required('Enter your last name.')],
      email: [validators.required('Enter your email address.'), validators.email()],
      phone: [validators.required('Enter a contact number.'), validators.phone()],
      consent: [validators.required('Please accept the privacy policy to continue.')],
      pickup: [validators.required('Enter a pickup location.'), validators.minLength(3)],
    };

    if (tab === 'airport') {
      return {
        ...shared,
        airport: [validators.required('Which airport?')],
        destination: [validators.required('Where are you going?'), validators.minLength(3)],
        luggage: [validators.required('How many bags?')],
      };
    }
    if (tab === 'city-to-city') {
      return {
        ...shared,
        destination: [validators.required('Enter your destination.'), validators.minLength(3)],
      };
    }
    return { ...shared, hours: [validators.required('How many hours do you need?')] };
  }, [tab]);

  const form = useForm({
    initialValues: {
      direction: 'from-airport',
      pickup: prefill.pickup || '',
      destination: prefill.destination || '',
      airport: prefill.airport || '',
      date: defaultDate(),
      time: '09:00',
      passengers: '2',
      luggage: '2',
      hours: String(booking.hourlyMinHours || 3),
      vehicleSlug: '',
      flightNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
      consent: false,
    },
    rules,
    onSubmit: async (values) => {
      const serviceType = TABS.find((item) => item.value === tab).serviceType;

      const payload = {
        _hp: values._hp,
        _ts: values._ts,
        serviceType,
        pickup: values.pickup,
        date: values.date,
        time: values.time,
        passengers: Number(values.passengers),
        vehicleSlug: values.vehicleSlug,
        flightNumber: values.flightNumber,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        notes: values.notes,
        consent: values.consent,
        sourcePath: window.location.pathname,
        seoPageSlug,
      };

      if (tab === 'airport') {
        Object.assign(payload, {
          direction: values.direction,
          airport: values.airport,
          destination: values.destination,
          luggage: Number(values.luggage),
        });
      } else if (tab === 'city-to-city') {
        Object.assign(payload, {
          destination: values.destination,
          luggage: Number(values.luggage || 0),
        });
      } else {
        Object.assign(payload, {
          hours: Number(values.hours),
          destination: values.destination || '',
          luggage: Number(values.luggage || 0),
        });
      }

      const result = await api.post('/booking-enquiries', payload);
      toast.success(`Enquiry ${result.reference} received. We will be in touch shortly.`);
      navigate(result.thankYouPath || '/thank-you?type=enquiry');
    },
  });

  const journeyFields = ['pickup', 'destination', 'airport', 'date', 'time', 'passengers', 'luggage', 'hours'];

  const goToContactStep = () => {
    const stepErrors = {};
    for (const name of journeyFields) {
      const fieldRules = rules[name];
      if (!fieldRules) continue;
      for (const rule of fieldRules) {
        const message = rule(form.values[name], form.values);
        if (message) {
          stepErrors[name] = message;
          break;
        }
      }
    }
    if (Object.keys(stepErrors).length) {
      form.setErrors(stepErrors);
      const first = Object.keys(stepErrors)[0];
      document.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    form.setErrors({});
    setStep(2);
  };

  const switchTab = (value) => {
    setTab(value);
    setStep(1);
    form.setErrors({});
  };

  return (
    <section
      className={`booking booking--${variant}`}
      id="enquiry"
      aria-labelledby="booking-title"
    >
      <div className="booking__head">
        <h2 className="booking__title" id="booking-title">
          {title}
        </h2>
        {subtitle ? <p className="booking__subtitle">{subtitle}</p> : null}
      </div>

      {!lockTab ? (
        <div className="tabs booking__tabs" role="tablist" aria-label="Service type">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === item.value}
              onClick={() => switchTab(item.value)}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <form className="booking__form" onSubmit={form.handleSubmit} noValidate>
        <Honeypot value={form.values._hp || ''} onChange={form.handleChange} />

        <ol className="booking__steps" aria-label="Progress">
          <li aria-current={step === 1 ? 'step' : undefined} className={step === 1 ? 'is-active' : 'is-done'}>
            <span>1</span> Journey
          </li>
          <li aria-current={step === 2 ? 'step' : undefined} className={step === 2 ? 'is-active' : ''}>
            <span>2</span> Your details
          </li>
        </ol>

        {step === 1 ? (
          <div className="booking__grid">
            {tab === 'airport' ? (
              <div className="booking__field booking__field--full">
                <div className="segmented" role="radiogroup" aria-label="Journey direction">
                  {[
                    { value: 'from-airport', label: 'From the airport' },
                    { value: 'to-airport', label: 'To the airport' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={form.values.direction === option.value}
                      className={`segmented__btn ${
                        form.values.direction === option.value ? 'is-active' : ''
                      }`.trim()}
                      onClick={() => form.setValue('direction', option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {tab === 'airport' ? (
              <>
                <Input
                  {...form.fieldProps('airport')}
                  className="booking__field"
                  label="Airport"
                  placeholder="e.g. Heathrow Terminal 5"
                  autoComplete="off"
                  required
                />
                <Input
                  {...form.fieldProps(form.values.direction === 'from-airport' ? 'destination' : 'pickup')}
                  className="booking__field"
                  label={form.values.direction === 'from-airport' ? 'Drop-off address' : 'Pickup address'}
                  placeholder="Street, town or postcode"
                  autoComplete="off"
                  required
                />
                <Input
                  {...form.fieldProps(form.values.direction === 'from-airport' ? 'pickup' : 'destination')}
                  className="booking__field"
                  label={
                    form.values.direction === 'from-airport'
                      ? 'Pickup point (terminal)'
                      : 'Destination terminal'
                  }
                  placeholder="Terminal or arrivals hall"
                  autoComplete="off"
                  required
                />
                <Input
                  {...form.fieldProps('flightNumber')}
                  className="booking__field"
                  label="Flight number"
                  placeholder="e.g. BA286"
                  hint="Lets us track your flight and adjust for delays."
                  optional
                />
              </>
            ) : null}

            {tab === 'city-to-city' ? (
              <>
                <Input
                  {...form.fieldProps('pickup')}
                  className="booking__field"
                  label="Pickup location"
                  placeholder="Address, town or postcode"
                  required
                />
                <Input
                  {...form.fieldProps('destination')}
                  className="booking__field"
                  label="Destination"
                  placeholder="Address, town or postcode"
                  required
                />
              </>
            ) : null}

            {tab === 'hourly' ? (
              <>
                <Input
                  {...form.fieldProps('pickup')}
                  className="booking__field"
                  label="Pickup location"
                  placeholder="Address, town or postcode"
                  required
                />
                <Select
                  {...form.fieldProps('hours')}
                  className="booking__field"
                  label="Number of hours"
                  options={numberOptions(
                    booking.hourlyMinHours || 3,
                    booking.hourlyMaxHours || 12,
                    ' hours',
                  )}
                  required
                />
              </>
            ) : null}

            <DateInput {...form.fieldProps('date')} className="booking__field" label="Date" required />
            <TimeInput {...form.fieldProps('time')} className="booking__field" label="Pickup time" required />

            <Select
              {...form.fieldProps('passengers')}
              className="booking__field"
              label="Passengers"
              options={numberOptions(1, maxPassengers)}
              required
            />

            {tab !== 'hourly' ? (
              <Select
                {...form.fieldProps('luggage')}
                className="booking__field"
                label="Large bags"
                options={numberOptions(0, maxLuggage)}
                required={tab === 'airport'}
              />
            ) : null}

            <div className="booking__actions booking__field--full">
              <Button type="button" variant="primary" size="lg" onClick={goToContactStep} iconRight="arrowRight" block>
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="booking__grid">
            <Input
              {...form.fieldProps('firstName')}
              className="booking__field"
              label="First name"
              autoComplete="given-name"
              required
            />
            <Input
              {...form.fieldProps('lastName')}
              className="booking__field"
              label="Last name"
              autoComplete="family-name"
              required
            />
            <Input
              {...form.fieldProps('email')}
              className="booking__field"
              type="email"
              label="Email address"
              autoComplete="email"
              required
            />
            <Input
              {...form.fieldProps('phone')}
              className="booking__field"
              type="tel"
              label="Mobile number"
              autoComplete="tel"
              hint="So your chauffeur can reach you on the day."
              required
            />

            <Select
              {...form.fieldProps('vehicleSlug')}
              className="booking__field booking__field--full"
              label="Preferred vehicle"
              options={vehicleOptions}
              optional
            />

            <Textarea
              {...form.fieldProps('notes')}
              className="booking__field--full"
              label="Anything else we should know?"
              placeholder="Child seats, extra stops, accessibility requirements, meeting instructions…"
              rows={3}
              optional
            />

            <div className="booking__field--full">
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
            </div>

            {form.submitError ? (
              <div className="booking__field--full">
                <Alert variant="error" title="We could not send your enquiry">
                  {form.submitError}
                </Alert>
              </div>
            ) : null}

            <div className="booking__actions booking__field--full">
              <Button type="button" variant="outline" icon="arrowLeft" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" variant="primary" size="lg" loading={form.submitting}>
                {form.submitting ? 'Sending your enquiry…' : 'Request my fixed price'}
              </Button>
            </div>
          </div>
        )}

        <p className="booking__reassurance">
          <Icon name="shield" size={15} />
          No payment now. We confirm availability and an all-inclusive price before anything is booked.
        </p>
      </form>
    </section>
  );
};

export default BookingWidget;
