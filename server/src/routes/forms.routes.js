import crypto from 'node:crypto';
import { Router } from 'express';
import repository from '../services/repository.js';
import validate from '../middleware/validate.js';
import spamGuard from '../middleware/spamGuard.js';
import { formLimiter } from '../middleware/rateLimit.js';
import { optionalAuth } from '../middleware/auth.js';
import { sendSuccess, asyncHandler } from '../utils/http.js';
import ApiError from '../utils/ApiError.js';
import { notifyTeam, sendAcknowledgement } from '../services/email.service.js';
import { loadSettings } from './siteSettings.routes.js';
import { COLLECTIONS, SUBMISSION_STATUS, SERVICE_TYPES } from '../constants/collections.js';
import {
  contactFormSchema,
  bookingEnquirySchema,
  corporateEnquirySchema,
  supportRequestSchema,
  newsletterSchema,
} from '../schemas/forms.js';
import logger from '../utils/logger.js';

const contactRepo = repository(COLLECTIONS.CONTACT_SUBMISSIONS);
const bookingRepo = repository(COLLECTIONS.BOOKING_ENQUIRIES);
const corporateRepo = repository(COLLECTIONS.CORPORATE_ENQUIRIES);
const supportRepo = repository(COLLECTIONS.SUPPORT_REQUESTS);
const newsletterRepo = repository(COLLECTIONS.NEWSLETTER_SUBSCRIBERS);

const reference = (prefix) => {
  const date = new Date();
  const stamp = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  return `${prefix}-${stamp}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
};

/** Request context stored with every submission for triage and abuse tracing. */
const meta = (req) => ({
  ipHash: crypto
    .createHash('sha256')
    .update(`${req.ip || ''}${process.env.FIREBASE_PROJECT_ID || ''}`)
    .digest('hex')
    .slice(0, 32),
  userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
  referer: String(req.headers.referer || '').slice(0, 300),
  submittedByUid: req.user?.uid || null,
});

const SERVICE_LABEL = {
  [SERVICE_TYPES.AIRPORT]: 'Airport transfer',
  [SERVICE_TYPES.CITY_TO_CITY]: 'City-to-city transfer',
  [SERVICE_TYPES.HOURLY]: 'Hourly chauffeur',
};

const publicForm = (schema, textFields) => [
  formLimiter,
  optionalAuth,
  spamGuard({ textFields }),
  validate({ body: schema }),
];

const router = Router();

/* -------------------------------------------------------------------------- */
/* Contact                                                                     */
/* -------------------------------------------------------------------------- */

router.post(
  '/contact',
  ...publicForm(contactFormSchema, ['message']),
  asyncHandler(async (req, res) => {
    const settings = await loadSettings();
    const payload = {
      ...req.body,
      reference: reference('CT'),
      status: SUBMISSION_STATUS.NEW,
      type: 'contact',
      meta: meta(req),
    };
    const saved = await contactRepo.create(payload);

    const fields = {
      Reference: saved.reference,
      Name: `${saved.firstName} ${saved.lastName}`.trim(),
      Email: saved.email,
      Phone: saved.phone,
      Subject: saved.subject,
      'Preferred contact': saved.preferredContact,
      Message: saved.message,
      Page: saved.sourcePath,
    };

    await notifyTeam({
      subject: `New contact enquiry — ${saved.subject} (${saved.reference})`,
      heading: 'New contact enquiry',
      fields,
      replyTo: saved.email,
    });
    await sendAcknowledgement({
      to: saved.email,
      name: saved.firstName,
      subject: `We have received your message (${saved.reference})`,
      heading: 'Thank you for contacting us',
      fields: { Reference: saved.reference, Subject: saved.subject, Message: saved.message },
      brand: settings.brandName,
    });

    return sendSuccess(
      res,
      { id: saved.id, reference: saved.reference, thankYouPath: '/thank-you?type=contact' },
      { status: 201 },
    );
  }),
);

/* -------------------------------------------------------------------------- */
/* Booking / journey enquiries                                                 */
/* -------------------------------------------------------------------------- */

router.post(
  '/booking-enquiries',
  ...publicForm(bookingEnquirySchema, ['notes']),
  asyncHandler(async (req, res) => {
    const settings = await loadSettings();
    const body = req.body;

    const payload = {
      ...body,
      reference: reference('ENQ'),
      status: SUBMISSION_STATUS.NEW,
      /**
       * Phase 2 will attach quote/pricing/payment data to this same record.
       * These placeholders keep the document shape stable.
       */
      quote: null,
      assignedVehicleId: null,
      bookingId: null,
      meta: meta(req),
    };

    const saved = await bookingRepo.create(payload);

    const fields = {
      Reference: saved.reference,
      Service: SERVICE_LABEL[saved.serviceType] || saved.serviceType,
      Name: `${saved.firstName} ${saved.lastName}`.trim(),
      Email: saved.email,
      Phone: saved.phone,
      Pickup: saved.pickup,
      Destination: saved.destination,
      Airport: saved.airport,
      Direction: saved.direction,
      Hours: saved.hours,
      Date: saved.date,
      Time: saved.time,
      'Return date': saved.returnDate,
      'Return time': saved.returnTime,
      Passengers: saved.passengers,
      Luggage: saved.luggage,
      'Flight number': saved.flightNumber,
      'Preferred vehicle': saved.vehicleSlug,
      Notes: saved.notes,
      Page: saved.sourcePath,
      'Landing page': saved.seoPageSlug,
    };

    await notifyTeam({
      subject: `New ${SERVICE_LABEL[saved.serviceType] || 'journey'} enquiry (${saved.reference})`,
      heading: 'New journey enquiry',
      intro: 'A new enquiry has been submitted through the website.',
      fields,
      replyTo: saved.email,
    });
    await sendAcknowledgement({
      to: saved.email,
      name: saved.firstName,
      subject: `Your enquiry ${saved.reference} — we will be in touch shortly`,
      heading: 'Thank you for your enquiry',
      intro: `Hi ${saved.firstName}, we have received your ${(
        SERVICE_LABEL[saved.serviceType] || 'journey'
      ).toLowerCase()} request and will confirm availability and a fixed price shortly.`,
      fields,
      brand: settings.brandName,
    });

    return sendSuccess(
      res,
      {
        id: saved.id,
        reference: saved.reference,
        thankYouPath: `${settings.booking?.enquiryThankYouPath || '/thank-you'}?type=enquiry&ref=${saved.reference}`,
      },
      { status: 201 },
    );
  }),
);

/* -------------------------------------------------------------------------- */
/* Corporate                                                                   */
/* -------------------------------------------------------------------------- */

router.post(
  '/corporate-enquiries',
  ...publicForm(corporateEnquirySchema, ['message']),
  asyncHandler(async (req, res) => {
    const settings = await loadSettings();
    const saved = await corporateRepo.create({
      ...req.body,
      reference: reference('CORP'),
      status: SUBMISSION_STATUS.NEW,
      accountId: null,
      meta: meta(req),
    });

    const fields = {
      Reference: saved.reference,
      Company: saved.companyName,
      Contact: saved.contactName,
      'Job title': saved.jobTitle,
      Email: saved.email,
      Phone: saved.phone,
      Website: saved.website,
      Industry: saved.industry,
      Employees: saved.employees,
      'Monthly journeys': saved.estimatedMonthlyJourneys,
      'Services required': (saved.servicesRequired || []).join(', '),
      Requirements: saved.message,
      Page: saved.sourcePath,
    };

    await notifyTeam({
      subject: `Corporate enquiry — ${saved.companyName} (${saved.reference})`,
      heading: 'New corporate enquiry',
      fields,
      replyTo: saved.email,
    });
    await sendAcknowledgement({
      to: saved.email,
      name: saved.contactName,
      subject: `Your corporate enquiry ${saved.reference}`,
      heading: 'Thank you for your interest in our corporate service',
      fields: { Reference: saved.reference, Company: saved.companyName, Requirements: saved.message },
      brand: settings.brandName,
    });

    return sendSuccess(
      res,
      { id: saved.id, reference: saved.reference, thankYouPath: '/thank-you?type=corporate' },
      { status: 201 },
    );
  }),
);

/* -------------------------------------------------------------------------- */
/* Support                                                                     */
/* -------------------------------------------------------------------------- */

router.post(
  '/support',
  ...publicForm(supportRequestSchema, ['message']),
  asyncHandler(async (req, res) => {
    const settings = await loadSettings();
    const saved = await supportRepo.create({
      ...req.body,
      reference: reference('SUP'),
      status: SUBMISSION_STATUS.NEW,
      meta: meta(req),
    });

    const fields = {
      Reference: saved.reference,
      Name: saved.name,
      Email: saved.email,
      Phone: saved.phone,
      Category: saved.category,
      Priority: saved.priority,
      'Booking reference': saved.bookingReference,
      Subject: saved.subject,
      Message: saved.message,
      Page: saved.sourcePath,
    };

    await notifyTeam({
      subject: `[${saved.priority.toUpperCase()}] Support request — ${saved.subject} (${saved.reference})`,
      heading: 'New support request',
      fields,
      replyTo: saved.email,
    });
    await sendAcknowledgement({
      to: saved.email,
      name: saved.name,
      subject: `Support request ${saved.reference} received`,
      heading: 'We have received your support request',
      fields: { Reference: saved.reference, Subject: saved.subject, Category: saved.category },
      brand: settings.brandName,
    });

    return sendSuccess(
      res,
      { id: saved.id, reference: saved.reference, thankYouPath: '/thank-you?type=support' },
      { status: 201 },
    );
  }),
);

/* -------------------------------------------------------------------------- */
/* Newsletter                                                                  */
/* -------------------------------------------------------------------------- */

router.post(
  '/newsletter',
  ...publicForm(newsletterSchema, []),
  asyncHandler(async (req, res) => {
    const settings = await loadSettings();
    if (settings.features?.newsletterEnabled === false) {
      throw ApiError.forbidden('Newsletter sign-ups are currently disabled.');
    }

    const existing = await newsletterRepo.findOne('email', req.body.email);
    if (existing) {
      if (existing.status === 'unsubscribed') {
        await newsletterRepo.update(existing.id, { status: 'subscribed' });
      }
      // Do not reveal subscription state; respond identically either way.
      return sendSuccess(res, { subscribed: true, alreadySubscribed: true }, { status: 200 });
    }

    const saved = await newsletterRepo.create({
      ...req.body,
      status: 'subscribed',
      source: req.body.sourcePath || 'website',
      meta: meta(req),
    });

    logger.info('Newsletter subscriber added', { id: saved.id });

    await notifyTeam({
      subject: 'New newsletter subscriber',
      heading: 'New newsletter subscriber',
      fields: { Email: saved.email, Name: saved.firstName, Page: saved.sourcePath },
    });

    return sendSuccess(res, { subscribed: true, alreadySubscribed: false }, { status: 201 });
  }),
);

export default router;
