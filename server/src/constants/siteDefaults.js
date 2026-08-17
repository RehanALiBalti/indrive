import env from '../config/env.js';

/**
 * Fallback site settings. These are written to Firestore by the seed script and
 * are also returned by the API if the settings document does not exist yet, so
 * the website never renders with empty branding.
 */
export const DEFAULT_SITE_SETTINGS = {
  brandName: 'Indrive Chauffeur',
  legalName: 'Indrive Chauffeur Ltd',
  tagline: 'Premium chauffeur and private transfer services',
  logo: { url: '', alt: 'Indrive Chauffeur', path: '' },
  logoLight: { url: '', alt: 'Indrive Chauffeur', path: '' },
  favicon: { url: '', alt: '', path: '' },
  defaultOgImage: { url: '', alt: '', path: '' },

  contact: {
    email: 'hello@indrivechauffeur.com',
    bookingEmail: 'bookings@indrivechauffeur.com',
    supportEmail: 'support@indrivechauffeur.com',
    phone: '+44 20 3000 0000',
    whatsapp: '+44 20 3000 0000',
    addressLine1: '1 Berkeley Street',
    addressLine2: 'Mayfair',
    city: 'London',
    region: 'Greater London',
    postcode: 'W1J 8DJ',
    country: 'United Kingdom',
    openingHours: '24 hours a day, 7 days a week',
    mapEmbedUrl: '',
  },

  social: {
    facebook: '',
    instagram: '',
    linkedin: '',
    x: '',
    youtube: '',
    tiktok: '',
  },

  company: {
    registrationNumber: '',
    vatNumber: '',
    licenceNumber: '',
    foundedYear: '2014',
  },

  seo: {
    siteUrl: env.siteUrl,
    defaultTitle: 'Premium Chauffeur & Private Transfer Service',
    titleTemplate: '%s | %brand%',
    defaultDescription:
      'Professional chauffeur-driven airport transfers, city-to-city journeys and hourly hire. Fixed transparent pricing, executive vehicles and vetted drivers, available 24/7.',
    defaultKeywords: [
      'chauffeur service',
      'airport transfer',
      'private transfer',
      'executive car hire',
      'city to city transfer',
      'hourly chauffeur',
    ],
    robotsTxtExtra: '',
    organisationSchemaEnabled: true,
    localBusinessSchemaEnabled: true,
  },

  analytics: {
    ga4MeasurementId: '',
    gtmContainerId: '',
    googleSiteVerification: '',
    bingSiteVerification: '',
    facebookPixelId: '',
    enabled: true,
    cookieConsentRequired: true,
  },

  features: {
    blogEnabled: true,
    newsletterEnabled: true,
    testimonialsEnabled: true,
    bookingWidgetEnabled: true,
    maintenanceMode: false,
    maintenanceMessage: '',
    liveBookingEnabled: false,
  },

  booking: {
    currency: 'GBP',
    currencySymbol: '£',
    minLeadTimeHours: 3,
    maxPassengers: 8,
    maxLuggage: 10,
    hourlyMinHours: 3,
    hourlyMaxHours: 12,
    enquiryThankYouPath: '/thank-you',
  },

  footer: {
    about:
      'Indrive Chauffeur provides discreet, reliable chauffeur-driven travel for business and leisure. Every journey is handled by a vetted professional driver in a meticulously maintained executive vehicle.',
    copyright: '',
    paymentNote: 'Secure payments and corporate invoicing available.',
    badges: [],
  },

  announcement: {
    enabled: false,
    message: '',
    link: { label: '', href: '', variant: 'primary', enabled: true },
  },
};

export default DEFAULT_SITE_SETTINGS;
