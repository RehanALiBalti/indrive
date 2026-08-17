import { z } from 'zod';
import {
  requiredText,
  optionalText,
  plainText,
  email,
  optionalEmail,
  phone,
  optionalPhone,
  boolish,
  consentField,
  spamFields,
} from './common.js';
import { SERVICE_TYPES } from '../constants/collections.js';

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a valid date.')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Please choose a valid date.');

const timeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Please choose a valid time (HH:MM).');

/** Rejects a pickup date/time in the past (5 minutes of clock tolerance). */
const notInThePast = (data, ctx) => {
  if (!data.date || !data.time) return;
  const when = new Date(`${data.date}T${data.time}:00`);
  if (Number.isNaN(when.getTime())) return;
  if (when.getTime() < Date.now() - 5 * 60 * 1000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['date'],
      message: 'Please choose a pickup date and time in the future.',
    });
  }
};

const contactBlock = {
  firstName: requiredText('First name', { min: 2, max: 60 }),
  lastName: requiredText('Last name', { min: 1, max: 60 }),
  email,
  phone,
};

/* -------------------------------------------------------------------------- */
/* Contact                                                                     */
/* -------------------------------------------------------------------------- */

export const contactFormSchema = z.object({
  ...spamFields,
  firstName: requiredText('First name', { min: 2, max: 60 }),
  lastName: optionalText(60),
  email,
  phone: optionalPhone,
  subject: requiredText('Subject', { min: 3, max: 160 }),
  message: requiredText('Message', { min: 10, max: 4000 }),
  preferredContact: z.enum(['email', 'phone', 'either']).optional().default('email'),
  consent: consentField('Please accept the privacy policy.'),
  sourcePath: optionalText(300),
});

/* -------------------------------------------------------------------------- */
/* Booking enquiries — one schema per service, discriminated by serviceType    */
/* -------------------------------------------------------------------------- */

const enquiryBase = {
  ...spamFields,
  ...contactBlock,
  date: dateString,
  time: timeString,
  passengers: z.coerce.number().int().min(1, 'At least one passenger is required.').max(50),
  vehicleSlug: optionalText(120),
  flightNumber: optionalText(20),
  notes: optionalText(2000),
  consent: consentField('Please accept the privacy policy.'),
  sourcePath: optionalText(300),
  seoPageSlug: optionalText(160),
};

// Kept as plain ZodObjects so they can take part in a discriminated union;
// the shared date/time refinement is applied to the union below.
export const airportEnquiryShape = z.object({
  ...enquiryBase,
  serviceType: z.literal(SERVICE_TYPES.AIRPORT),
  direction: z.enum(['to-airport', 'from-airport']).default('from-airport'),
  pickup: requiredText('Pickup location', { min: 3, max: 240 }),
  destination: requiredText('Destination', { min: 3, max: 240 }),
  airport: requiredText('Airport', { min: 2, max: 160 }),
  luggage: z.coerce.number().int().min(0, 'Luggage cannot be negative.').max(50),
  returnDate: z.union([z.literal(''), dateString]).optional().default(''),
  returnTime: z.union([z.literal(''), timeString]).optional().default(''),
});

export const cityToCityEnquiryShape = z.object({
  ...enquiryBase,
  serviceType: z.literal(SERVICE_TYPES.CITY_TO_CITY),
  pickup: requiredText('Pickup location', { min: 3, max: 240 }),
  destination: requiredText('Destination', { min: 3, max: 240 }),
  luggage: z.coerce.number().int().min(0).max(50).optional().default(0),
  returnDate: z.union([z.literal(''), dateString]).optional().default(''),
  returnTime: z.union([z.literal(''), timeString]).optional().default(''),
});

export const hourlyEnquiryShape = z.object({
  ...enquiryBase,
  serviceType: z.literal(SERVICE_TYPES.HOURLY),
  pickup: requiredText('Pickup location', { min: 3, max: 240 }),
  hours: z.coerce
    .number()
    .int()
    .min(1, 'Please choose at least 1 hour.')
    .max(24, 'For journeys over 24 hours, please contact us directly.'),
  destination: optionalText(240),
  luggage: z.coerce.number().int().min(0).max(50).optional().default(0),
});

export const airportEnquirySchema = airportEnquiryShape.superRefine(notInThePast);
export const cityToCityEnquirySchema = cityToCityEnquiryShape.superRefine(notInThePast);
export const hourlyEnquirySchema = hourlyEnquiryShape.superRefine(notInThePast);

export const bookingEnquirySchema = z
  .discriminatedUnion('serviceType', [
    airportEnquiryShape,
    cityToCityEnquiryShape,
    hourlyEnquiryShape,
  ])
  .superRefine(notInThePast);

/* -------------------------------------------------------------------------- */
/* Corporate                                                                   */
/* -------------------------------------------------------------------------- */

export const corporateEnquirySchema = z.object({
  ...spamFields,
  companyName: requiredText('Company name', { min: 2, max: 160 }),
  contactName: requiredText('Contact name', { min: 2, max: 120 }),
  jobTitle: optionalText(120),
  email,
  phone,
  website: optionalText(200),
  industry: optionalText(120),
  employees: z
    .enum(['1-10', '11-50', '51-200', '201-500', '500+', ''])
    .optional()
    .default(''),
  estimatedMonthlyJourneys: z
    .enum(['1-10', '11-30', '31-100', '100+', ''])
    .optional()
    .default(''),
  servicesRequired: z.array(optionalText(80)).max(12).optional().default([]),
  message: requiredText('Requirements', { min: 10, max: 4000 }),
  consent: consentField('Please accept the privacy policy.'),
  sourcePath: optionalText(300),
});

/* -------------------------------------------------------------------------- */
/* Support                                                                     */
/* -------------------------------------------------------------------------- */

export const supportRequestSchema = z.object({
  ...spamFields,
  name: requiredText('Your name', { min: 2, max: 120 }),
  email,
  phone: optionalPhone,
  category: z
    .enum(['existing-booking', 'amend-cancel', 'billing', 'lost-property', 'complaint', 'technical', 'other'])
    .default('other'),
  bookingReference: optionalText(60),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  subject: requiredText('Subject', { min: 3, max: 160 }),
  message: requiredText('How can we help?', { min: 10, max: 4000 }),
  consent: consentField('Please accept the privacy policy.'),
  sourcePath: optionalText(300),
});

/* -------------------------------------------------------------------------- */
/* Newsletter                                                                  */
/* -------------------------------------------------------------------------- */

export const newsletterSchema = z.object({
  ...spamFields,
  email,
  firstName: optionalText(60),
  consent: consentField('Please confirm you want to receive emails.'),
  sourcePath: optionalText(300),
});

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

const password = z
  .string({ required_error: 'A password is required.' })
  .min(8, 'Passwords must be at least 8 characters.')
  .max(128, 'Passwords must be 128 characters or fewer.')
  .refine((value) => /[a-z]/.test(value), 'Include at least one lowercase letter.')
  .refine((value) => /[A-Z]/.test(value), 'Include at least one uppercase letter.')
  .refine((value) => /\d/.test(value), 'Include at least one number.');

export const registerSchema = z.object({
  ...spamFields,
  firstName: requiredText('First name', { min: 2, max: 60 }),
  lastName: requiredText('Last name', { min: 1, max: 60 }),
  email,
  phone: optionalPhone,
  password,
  consent: consentField('Please accept the terms and privacy policy.'),
  marketingOptIn: boolish.optional().default(false),
});

export const profileUpdateSchema = z.object({
  firstName: optionalText(60),
  lastName: optionalText(60),
  displayName: optionalText(120),
  phone: optionalPhone,
  marketingOptIn: boolish.optional(),
});

export const emailOnlySchema = z.object({
  ...spamFields,
  email,
});

/* -------------------------------------------------------------------------- */
/* Submission management                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Partial update from the admin inbox. Every field is optional so changing a
 * status never overwrites the notes (and vice versa).
 */
export const submissionUpdateSchema = z
  .object({
    status: z.enum(['new', 'in_progress', 'resolved', 'archived', 'spam']).optional(),
    internalNotes: plainText(4000).optional(),
    assignedTo: plainText(120).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update.',
  });

export const collectionParamSchema = z.object({
  collection: z.enum(['contact', 'booking', 'corporate', 'support', 'newsletter']),
});
