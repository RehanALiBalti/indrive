import { z } from 'zod';
import {
  requiredText,
  optionalText,
  richText,
  slug,
  pathSchema,
  optionalUrl,
  optionalEmail,
  optionalPhone,
  boolish,
  optionalImage,
  imageSchema,
  ctaSchema,
  optionalSeo,
  sectionsSchema,
  statusSchema,
  sortOrder,
} from './common.js';
import { SEO_PAGE_TYPES, SERVICE_TYPES } from '../constants/collections.js';

/* -------------------------------------------------------------------------- */
/* Pages                                                                       */
/* -------------------------------------------------------------------------- */

export const pageSchema = z.object({
  slug,
  title: requiredText('Page title', { max: 160 }),
  path: pathSchema.optional(),
  h1: optionalText(200),
  subtitle: optionalText(400),
  heroImage: optionalImage,
  sections: sectionsSchema,
  seo: optionalSeo,
  status: statusSchema,
  showInSitemap: boolish.optional().default(true),
  sitemapPriority: z.coerce.number().min(0).max(1).optional().default(0.7),
  sitemapChangefreq: z
    .enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])
    .optional()
    .default('monthly'),
  isSystem: boolish.optional().default(false),
});

export const pageUpdateSchema = pageSchema.partial();

/* -------------------------------------------------------------------------- */
/* Services                                                                    */
/* -------------------------------------------------------------------------- */

export const serviceSchema = z.object({
  slug,
  name: requiredText('Service name', { max: 120 }),
  serviceType: z
    .enum([SERVICE_TYPES.AIRPORT, SERVICE_TYPES.CITY_TO_CITY, SERVICE_TYPES.HOURLY, 'other'])
    .default('other'),
  /** Which enquiry form the booking widget renders for this service. */
  formType: z.enum(['airport', 'city-to-city', 'hourly', 'none']).default('none'),
  shortDescription: optionalText(300),
  description: richText(40000),
  icon: optionalText(40),
  image: optionalImage,
  heroImage: optionalImage,
  features: z.array(optionalText(200)).max(24).optional().default([]),
  benefits: z
    .array(z.object({ title: optionalText(160), description: optionalText(600), icon: optionalText(40) }))
    .max(24)
    .optional()
    .default([]),
  startingPriceLabel: optionalText(80),
  cta: ctaSchema.optional(),
  landingPath: pathSchema.optional(),
  sections: sectionsSchema,
  seo: optionalSeo,
  isActive: boolish.optional().default(true),
  sortOrder,
});

export const serviceUpdateSchema = serviceSchema.partial();

/* -------------------------------------------------------------------------- */
/* Vehicles (fleet)                                                            */
/* -------------------------------------------------------------------------- */

export const vehicleSchema = z.object({
  slug,
  name: requiredText('Vehicle name', { max: 120 }),
  category: requiredText('Vehicle class', { max: 80 }),
  tagline: optionalText(200),
  description: richText(40000),
  shortDescription: optionalText(400),
  images: z.array(imageSchema).max(12).optional().default([]),
  passengers: z.coerce.number().int().min(1).max(100).default(1),
  luggage: z.coerce.number().int().min(0).max(100).default(0),
  handLuggage: z.coerce.number().int().min(0).max(100).optional().default(0),
  features: z.array(optionalText(120)).max(30).optional().default([]),
  exampleModels: z.array(optionalText(120)).max(20).optional().default([]),
  startingPriceLabel: optionalText(80),
  cta: ctaSchema.optional(),
  seo: optionalSeo,
  isActive: boolish.optional().default(true),
  sortOrder,
});

export const vehicleUpdateSchema = vehicleSchema.partial();

/* -------------------------------------------------------------------------- */
/* FAQs                                                                        */
/* -------------------------------------------------------------------------- */

export const faqSchema = z.object({
  question: requiredText('Question', { max: 300 }),
  answer: richText(20000).refine((value) => value.trim().length > 0, 'An answer is required.'),
  category: optionalText(80).default('general'),
  tags: z.array(optionalText(40)).max(20).optional().default([]),
  isActive: boolish.optional().default(true),
  sortOrder,
});

export const faqUpdateSchema = faqSchema.partial();

/* -------------------------------------------------------------------------- */
/* Testimonials                                                                */
/* -------------------------------------------------------------------------- */

export const testimonialSchema = z.object({
  name: requiredText('Customer name', { max: 120 }),
  role: optionalText(120),
  company: optionalText(120),
  location: optionalText(120),
  rating: z.coerce.number().min(1).max(5).optional().default(5),
  quote: requiredText('Testimonial', { max: 1200 }),
  avatar: optionalImage,
  serviceUsed: optionalText(120),
  isActive: boolish.optional().default(true),
  sortOrder,
});

export const testimonialUpdateSchema = testimonialSchema.partial();

/* -------------------------------------------------------------------------- */
/* Blog                                                                        */
/* -------------------------------------------------------------------------- */

export const blogPostSchema = z.object({
  slug,
  title: requiredText('Article title', { max: 200 }),
  excerpt: optionalText(400),
  featuredImage: optionalImage,
  content: richText(400000),
  tags: z.array(optionalText(40)).max(20).optional().default([]),
  category: optionalText(80).default('guides'),
  author: z
    .object({
      name: optionalText(120),
      role: optionalText(120),
      avatar: optionalImage,
      bio: optionalText(600),
    })
    .partial()
    .optional()
    .default({}),
  faqs: z
    .array(z.object({ question: optionalText(300), answer: richText(8000) }))
    .max(30)
    .optional()
    .default([]),
  relatedPostSlugs: z.array(optionalText(120)).max(8).optional().default([]),
  cta: ctaSchema.optional(),
  readingMinutes: z.coerce.number().int().min(0).max(240).optional(),
  publishedAt: z.union([z.string(), z.null()]).optional(),
  seo: optionalSeo,
  status: statusSchema,
});

export const blogPostUpdateSchema = blogPostSchema.partial();

/* -------------------------------------------------------------------------- */
/* SEO landing pages                                                           */
/* -------------------------------------------------------------------------- */

const seoRelatedLink = z.object({
  label: optionalText(120),
  href: optionalUrl,
  description: optionalText(300),
});

export const seoPageSchema = z.object({
  type: z.enum([SEO_PAGE_TYPES.AIRPORT, SEO_PAGE_TYPES.CITY, SEO_PAGE_TYPES.ROUTE]),
  slug,
  title: requiredText('Page title', { max: 200 }),
  h1: requiredText('H1 heading', { max: 200 }),
  intro: optionalText(2000),
  heroImage: optionalImage,

  /** Location metadata used by templates and structured data. */
  location: z
    .object({
      airportName: optionalText(160),
      airportCode: optionalText(8),
      cityName: optionalText(120),
      originCity: optionalText(120),
      destinationCity: optionalText(120),
      region: optionalText(120),
      country: optionalText(120).default(''),
      latitude: z.coerce.number().min(-90).max(90).optional(),
      longitude: z.coerce.number().min(-180).max(180).optional(),
      terminals: z.array(optionalText(80)).max(20).optional().default([]),
      postcode: optionalText(20),
    })
    .partial()
    .optional()
    .default({}),

  /** Journey facts rendered by the journey-information section. */
  journey: z
    .object({
      distance: optionalText(60),
      duration: optionalText(60),
      averagePriceLabel: optionalText(80),
      meetAndGreet: optionalText(400),
      waitingTime: optionalText(200),
      notes: richText(20000),
    })
    .partial()
    .optional()
    .default({}),

  /** Every section can be toggled and reordered without code changes. */
  sections: sectionsSchema,

  benefits: z
    .array(z.object({ title: optionalText(160), description: optionalText(600), icon: optionalText(40) }))
    .max(20)
    .optional()
    .default([]),
  faqs: z
    .array(z.object({ question: optionalText(300), answer: richText(8000) }))
    .max(30)
    .optional()
    .default([]),
  relatedRoutes: z.array(seoRelatedLink).max(24).optional().default([]),
  relatedCities: z.array(seoRelatedLink).max(24).optional().default([]),
  relatedAirports: z.array(seoRelatedLink).max(24).optional().default([]),
  internalLinks: z.array(seoRelatedLink).max(30).optional().default([]),

  showFleetSection: boolish.optional().default(true),
  showServicesSection: boolish.optional().default(true),
  showTestimonialsSection: boolish.optional().default(true),
  showFaqSection: boolish.optional().default(true),
  showBookingWidget: boolish.optional().default(true),
  bookingFormType: z.enum(['airport', 'city-to-city', 'hourly']).optional().default('airport'),

  cta: ctaSchema.optional(),
  seo: optionalSeo,
  status: statusSchema,
  sortOrder,
  sitemapPriority: z.coerce.number().min(0).max(1).optional().default(0.8),
});

export const seoPageUpdateSchema = seoPageSchema.partial();

/** A reusable starting point an SEO user can duplicate into a new landing page. */
export const seoTemplateSchema = z.object({
  name: requiredText('Template name', { max: 120 }),
  type: z.enum([SEO_PAGE_TYPES.AIRPORT, SEO_PAGE_TYPES.CITY, SEO_PAGE_TYPES.ROUTE]),
  description: optionalText(600),
  /**
   * Token-aware defaults. Tokens such as {{airportName}}, {{cityName}},
   * {{originCity}}, {{destinationCity}}, {{brandName}} are substituted when a
   * page is generated from the template.
   */
  defaults: z
    .object({
      title: optionalText(300),
      h1: optionalText(300),
      intro: optionalText(3000),
      seoTitle: optionalText(200),
      seoDescription: optionalText(400),
      benefits: z
        .array(z.object({ title: optionalText(160), description: optionalText(600), icon: optionalText(40) }))
        .max(20)
        .optional()
        .default([]),
      faqs: z
        .array(z.object({ question: optionalText(300), answer: richText(8000) }))
        .max(30)
        .optional()
        .default([]),
      sections: sectionsSchema,
    })
    .partial()
    .optional()
    .default({}),
  isActive: boolish.optional().default(true),
  sortOrder,
});

export const seoTemplateUpdateSchema = seoTemplateSchema.partial();

/** Payload for "create a landing page from a template". */
export const seoPageFromTemplateSchema = z.object({
  templateId: z.string().trim().min(1, 'Choose a template.'),
  slug: slug.optional(),
  tokens: z.record(z.string().max(300)).optional().default({}),
  status: statusSchema,
});

/* -------------------------------------------------------------------------- */
/* Navigation                                                                  */
/* -------------------------------------------------------------------------- */

const navItem = z.object({
  id: optionalText(64),
  label: requiredText('Menu label', { max: 80 }),
  href: optionalUrl,
  external: boolish.optional().default(false),
  highlight: boolish.optional().default(false),
  description: optionalText(200),
  children: z
    .array(
      z.object({
        id: optionalText(64),
        label: optionalText(80),
        href: optionalUrl,
        description: optionalText(200),
        external: boolish.optional().default(false),
      }),
    )
    .max(24)
    .optional()
    .default([]),
});

export const navigationSchema = z.object({
  label: optionalText(80),
  items: z.array(navItem).max(40).optional().default([]),
});

/* -------------------------------------------------------------------------- */
/* Site settings                                                               */
/* -------------------------------------------------------------------------- */

export const siteSettingsSchema = z
  .object({
    brandName: optionalText(120),
    legalName: optionalText(160),
    tagline: optionalText(200),
    logo: optionalImage,
    logoLight: optionalImage,
    favicon: optionalImage,
    defaultOgImage: optionalImage,

    contact: z
      .object({
        email: optionalEmail,
        bookingEmail: optionalEmail,
        supportEmail: optionalEmail,
        phone: optionalPhone,
        whatsapp: optionalPhone,
        addressLine1: optionalText(160),
        addressLine2: optionalText(160),
        city: optionalText(80),
        region: optionalText(80),
        postcode: optionalText(20),
        country: optionalText(80),
        openingHours: optionalText(200),
        mapEmbedUrl: optionalUrl,
      })
      .partial()
      .optional()
      .default({}),

    social: z
      .object({
        facebook: optionalUrl,
        instagram: optionalUrl,
        linkedin: optionalUrl,
        x: optionalUrl,
        youtube: optionalUrl,
        tiktok: optionalUrl,
      })
      .partial()
      .optional()
      .default({}),

    company: z
      .object({
        registrationNumber: optionalText(60),
        vatNumber: optionalText(60),
        licenceNumber: optionalText(80),
        foundedYear: optionalText(8),
      })
      .partial()
      .optional()
      .default({}),

    seo: z
      .object({
        siteUrl: optionalUrl,
        defaultTitle: optionalText(120),
        titleTemplate: optionalText(120).default('%s | %brand%'),
        defaultDescription: optionalText(320),
        defaultKeywords: z.array(optionalText(60)).max(30).optional().default([]),
        robotsTxtExtra: optionalText(4000),
        organisationSchemaEnabled: boolish.optional().default(true),
        localBusinessSchemaEnabled: boolish.optional().default(true),
      })
      .partial()
      .optional()
      .default({}),

    /** Tracking IDs live here so marketing can change them without a deploy. */
    analytics: z
      .object({
        ga4MeasurementId: optionalText(40),
        gtmContainerId: optionalText(40),
        googleSiteVerification: optionalText(120),
        bingSiteVerification: optionalText(120),
        facebookPixelId: optionalText(40),
        enabled: boolish.optional().default(true),
        cookieConsentRequired: boolish.optional().default(true),
      })
      .partial()
      .optional()
      .default({}),

    features: z
      .object({
        blogEnabled: boolish.optional().default(true),
        newsletterEnabled: boolish.optional().default(true),
        testimonialsEnabled: boolish.optional().default(true),
        bookingWidgetEnabled: boolish.optional().default(true),
        maintenanceMode: boolish.optional().default(false),
        maintenanceMessage: optionalText(400),
        /** Phase 2 switch: flips enquiry CTAs to the live booking engine. */
        liveBookingEnabled: boolish.optional().default(false),
      })
      .partial()
      .optional()
      .default({}),

    booking: z
      .object({
        currency: optionalText(8).default('GBP'),
        currencySymbol: optionalText(4).default('£'),
        minLeadTimeHours: z.coerce.number().min(0).max(168).optional().default(3),
        maxPassengers: z.coerce.number().int().min(1).max(50).optional().default(8),
        maxLuggage: z.coerce.number().int().min(0).max(50).optional().default(10),
        hourlyMinHours: z.coerce.number().int().min(1).max(24).optional().default(3),
        hourlyMaxHours: z.coerce.number().int().min(1).max(24).optional().default(12),
        enquiryThankYouPath: pathSchema.optional(),
      })
      .partial()
      .optional()
      .default({}),

    footer: z
      .object({
        about: optionalText(1000),
        copyright: optionalText(200),
        paymentNote: optionalText(200),
        badges: z.array(z.object({ label: optionalText(80), image: optionalImage })).max(10).optional().default([]),
      })
      .partial()
      .optional()
      .default({}),

    announcement: z
      .object({
        enabled: boolish.optional().default(false),
        message: optionalText(240),
        link: ctaSchema.optional(),
      })
      .partial()
      .optional()
      .default({}),
  })
  .partial();

/* -------------------------------------------------------------------------- */
/* Redirects                                                                   */
/* -------------------------------------------------------------------------- */

export const redirectSchema = z.object({
  from: pathSchema,
  to: z
    .string()
    .trim()
    .min(1, 'A destination is required.')
    .max(2048)
    .refine(
      (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
      'The destination must be a path starting with / or a full URL.',
    ),
  statusCode: z.coerce.number().int().refine((value) => [301, 302, 307, 308].includes(value), {
    message: 'Status code must be 301, 302, 307 or 308.',
  }).optional().default(301),
  note: optionalText(300),
  isActive: boolish.optional().default(true),
});

export const redirectUpdateSchema = redirectSchema.partial();

/* -------------------------------------------------------------------------- */
/* Media                                                                       */
/* -------------------------------------------------------------------------- */

export const mediaUpdateSchema = z.object({
  alt: optionalText(200),
  title: optionalText(160),
  folder: optionalText(40),
  tags: z.array(optionalText(40)).max(20).optional().default([]),
});

/* -------------------------------------------------------------------------- */
/* Users (admin management)                                                    */
/* -------------------------------------------------------------------------- */

export const userRoleSchema = z.object({
  role: z.enum(['user', 'editor', 'admin']),
});

export const userStatusSchema = z.object({
  status: z.enum(['active', 'disabled']),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, 'Provide at least one id.').max(500),
});
