import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  contactFormSchema,
  bookingEnquirySchema,
  corporateEnquirySchema,
  supportRequestSchema,
  newsletterSchema,
  registerSchema,
} from '../schemas/forms.js';

const tomorrow = () => {
  const date = new Date(Date.now() + 36 * 60 * 60 * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

describe('contact form', () => {
  it('accepts a valid payload', () => {
    const parsed = contactFormSchema.parse({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      subject: 'Airport quote',
      message: 'Please quote a transfer from Heathrow to Mayfair.',
      consent: true,
    });
    assert.equal(parsed.email, 'jane@example.com');
  });

  it('rejects HTML in the message and a missing consent', () => {
    assert.throws(() =>
      contactFormSchema.parse({
        firstName: 'Jane',
        email: 'not-an-email',
        subject: 'Hi',
        message: 'Too short',
        consent: false,
      }),
    );
  });
});

describe('booking enquiries', () => {
  it('requires airport fields for airport transfers', () => {
    const parsed = bookingEnquirySchema.parse({
      serviceType: 'airport-transfer',
      pickup: 'Mayfair, London',
      destination: 'Heathrow Terminal 5',
      airport: 'Heathrow Airport',
      direction: 'to-airport',
      date: tomorrow(),
      time: '09:30',
      passengers: 2,
      luggage: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '+44 7700 900123',
      consent: true,
    });
    assert.equal(parsed.serviceType, 'airport-transfer');
    assert.equal(parsed.luggage, 2);
  });

  it('requires destination for city-to-city and hours for hourly', () => {
    const city = bookingEnquirySchema.parse({
      serviceType: 'city-to-city',
      pickup: 'London',
      destination: 'Manchester',
      date: tomorrow(),
      time: '08:00',
      passengers: 1,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '07700900123',
      consent: true,
    });
    assert.equal(city.destination, 'Manchester');

    const hourly = bookingEnquirySchema.parse({
      serviceType: 'hourly-chauffeur',
      pickup: 'Canary Wharf',
      hours: 4,
      date: tomorrow(),
      time: '10:00',
      passengers: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '07700900123',
      consent: true,
    });
    assert.equal(hourly.hours, 4);

    assert.throws(() =>
      bookingEnquirySchema.parse({
        serviceType: 'hourly-chauffeur',
        pickup: 'Canary Wharf',
        date: tomorrow(),
        time: '10:00',
        passengers: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '07700900123',
        consent: true,
      }),
    );
  });
});

describe('other public forms', () => {
  it('validates corporate, support and newsletter payloads', () => {
    assert.equal(
      corporateEnquirySchema.parse({
        companyName: 'Acme Ltd',
        contactName: 'Alex Reed',
        email: 'alex@acme.test',
        phone: '020 3000 0000',
        message: 'We need airport transfers for visiting executives every week.',
        consent: true,
      }).companyName,
      'Acme Ltd',
    );

    assert.equal(
      supportRequestSchema.parse({
        name: 'Alex Reed',
        email: 'alex@acme.test',
        subject: 'Change of pickup time',
        message: 'Please move tomorrow’s booking from 09:00 to 10:30.',
        consent: true,
      }).category,
      'other',
    );

    assert.equal(
      newsletterSchema.parse({
        email: 'alex@acme.test',
        consent: true,
      }).email,
      'alex@acme.test',
    );
  });

  it('enforces a strong password on registration', () => {
    assert.throws(() =>
      registerSchema.parse({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password',
        consent: true,
      }),
    );

    const parsed = registerSchema.parse({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: 'SecurePass1',
      consent: true,
    });
    assert.equal(parsed.password, 'SecurePass1');
  });
});
