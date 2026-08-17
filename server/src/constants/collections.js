/**
 * Single source of truth for Firestore collection names.
 * Phase 2+ collections (bookings, payments, drivers, ...) are listed as
 * reserved names so the data model stays coherent as the platform grows.
 */
export const COLLECTIONS = {
  USERS: 'users',
  PAGES: 'pages',
  SERVICES: 'services',
  VEHICLES: 'vehicles',
  FAQS: 'faqs',
  TESTIMONIALS: 'testimonials',
  BLOG_POSTS: 'blogPosts',
  SEO_PAGES: 'seoPages',
  SEO_TEMPLATES: 'seoTemplates',
  NAVIGATION: 'navigation',
  SITE_SETTINGS: 'siteSettings',
  CONTACT_SUBMISSIONS: 'contactSubmissions',
  BOOKING_ENQUIRIES: 'bookingEnquiries',
  CORPORATE_ENQUIRIES: 'corporateEnquiries',
  SUPPORT_REQUESTS: 'supportRequests',
  NEWSLETTER_SUBSCRIBERS: 'newsletterSubscribers',
  REDIRECTS: 'redirects',
  MEDIA: 'media',
};

/** Reserved for later phases — documented here so names are not reused. */
export const FUTURE_COLLECTIONS = Object.freeze([
  'bookings',
  'quotes',
  'pricingRules',
  'payments',
  'invoices',
  'drivers',
  'dispatchJobs',
  'corporateAccounts',
  'affiliates',
  'notifications',
  'auditLogs',
]);

export const SITE_SETTINGS_DOC = 'general';

export const ROLES = {
  USER: 'user',
  EDITOR: 'editor',
  ADMIN: 'admin',
};

/**
 * Role hierarchy. Higher number = more privilege. Adding a role later (driver,
 * dispatcher, corporate-manager, affiliate) is a one-line change here.
 */
export const ROLE_LEVELS = {
  [ROLES.USER]: 10,
  [ROLES.EDITOR]: 50,
  [ROLES.ADMIN]: 100,
};

export const ALL_ROLES = Object.values(ROLES);

export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

export const SUBMISSION_STATUS = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  ARCHIVED: 'archived',
  SPAM: 'spam',
};

export const SERVICE_TYPES = {
  AIRPORT: 'airport-transfer',
  CITY_TO_CITY: 'city-to-city',
  HOURLY: 'hourly-chauffeur',
};

export const SEO_PAGE_TYPES = {
  AIRPORT: 'airport',
  CITY: 'city',
  ROUTE: 'city-to-city',
};

/** URL prefix owned by each SEO landing-page template. */
export const SEO_PAGE_PREFIX = {
  [SEO_PAGE_TYPES.AIRPORT]: '/airport-transfers',
  [SEO_PAGE_TYPES.CITY]: '/chauffeur-service',
  [SEO_PAGE_TYPES.ROUTE]: '/city-to-city',
};
