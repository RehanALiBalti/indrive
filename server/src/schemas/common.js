import { z } from 'zod';
import { CONTENT_STATUS } from '../constants/collections.js';
import { slugify, sanitizeRichText, stripHtml, normalisePath } from '../utils/helpers.js';

/** Trimmed, HTML-free string. Used for every plain-text field. */
export const plainText = (max = 500) =>
  z
    .string()
    .transform((value) => stripHtml(value))
    .pipe(z.string().max(max, `Must be ${max} characters or fewer.`));

export const requiredText = (label, { min = 1, max = 500 } = {}) =>
  z
    .string({ required_error: `${label} is required.`, invalid_type_error: `${label} is required.` })
    .transform((value) => stripHtml(value))
    .pipe(
      z
        .string()
        .min(min, `${label} must be at least ${min} characters.`)
        .max(max, `${label} must be ${max} characters or fewer.`),
    );

export const optionalText = (max = 500) => plainText(max).optional().default('');

/** Admin-authored HTML, sanitised against an allowlist. */
export const richText = (max = 200000) =>
  z
    .string()
    .max(max)
    .transform((value) => sanitizeRichText(value))
    .optional()
    .default('');

export const email = z
  .string({ required_error: 'Email address is required.' })
  .trim()
  .toLowerCase()
  .min(5, 'Email address is required.')
  .max(254)
  .email('Please enter a valid email address.');

export const optionalEmail = z
  .union([z.literal(''), email])
  .optional()
  .transform((value) => value || '');

export const phone = z
  .string()
  .trim()
  .min(6, 'Please enter a valid phone number.')
  .max(32, 'Please enter a valid phone number.')
  .regex(/^[+()\-\s\d.]+$/, 'Phone numbers may only contain digits, spaces and + ( ) - characters.');

export const optionalPhone = z
  .union([z.literal(''), phone])
  .optional()
  .transform((value) => value || '');

export const url = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      value === '' ||
      /^https?:\/\//i.test(value) ||
      value.startsWith('/') ||
      value.startsWith('#') ||
      /^(mailto|tel):/i.test(value),
    'Enter a full URL, a path starting with /, or a mailto:/tel: link.',
  );

export const optionalUrl = url.optional().default('');

export const slug = z
  .string()
  .trim()
  .min(1, 'A slug is required.')
  .max(120)
  .transform((value) => slugify(value))
  .refine((value) => value.length > 0, 'That slug is not valid. Use letters, numbers and hyphens.');

export const pathSchema = z
  .string()
  .trim()
  .min(1, 'A path is required.')
  .max(300)
  .transform((value) => normalisePath(value));

export const boolish = z.preprocess((value) => {
  if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  return value;
}, z.boolean());

export const imageSchema = z
  .object({
    url: optionalUrl,
    alt: optionalText(200),
    path: optionalText(400),
    width: z.coerce.number().int().min(0).max(20000).optional(),
    height: z.coerce.number().int().min(0).max(20000).optional(),
  })
  .partial()
  .transform((value) => ({
    url: value.url || '',
    alt: value.alt || '',
    path: value.path || '',
    width: value.width,
    height: value.height,
  }));

export const optionalImage = imageSchema.optional().default({ url: '', alt: '', path: '' });

export const ctaSchema = z
  .object({
    label: optionalText(80),
    href: optionalUrl,
    variant: z.enum(['primary', 'secondary', 'ghost', 'outline']).optional().default('primary'),
    enabled: boolish.optional().default(true),
  })
  .partial()
  .transform((value) => ({
    label: value.label || '',
    href: value.href || '',
    variant: value.variant || 'primary',
    enabled: value.enabled !== false,
  }));

export const linkSchema = z.object({
  label: requiredText('Link label', { max: 80 }),
  href: url,
  external: boolish.optional().default(false),
  children: z.array(z.lazy(() => z.object({ label: plainText(80), href: url }))).optional(),
});

/** SEO metadata attached to every routable content document. */
export const seoSchema = z
  .object({
    title: optionalText(120),
    description: optionalText(320),
    canonical: optionalUrl,
    keywords: z.array(plainText(60)).max(30).optional().default([]),
    ogTitle: optionalText(120),
    ogDescription: optionalText(320),
    ogImage: optionalImage,
    ogType: z.enum(['website', 'article', 'product', 'profile']).optional().default('website'),
    twitterCard: z.enum(['summary', 'summary_large_image']).optional().default('summary_large_image'),
    noindex: boolish.optional().default(false),
    nofollow: boolish.optional().default(false),
    schemaType: z
      .enum(['WebPage', 'Service', 'Article', 'FAQPage', 'LocalBusiness', 'Product', 'None'])
      .optional()
      .default('WebPage'),
    breadcrumbLabel: optionalText(80),
    structuredData: optionalText(20000),
  })
  .partial()
  .transform((value) => ({
    title: value.title || '',
    description: value.description || '',
    canonical: value.canonical || '',
    keywords: value.keywords || [],
    ogTitle: value.ogTitle || '',
    ogDescription: value.ogDescription || '',
    ogImage: value.ogImage || { url: '', alt: '', path: '' },
    ogType: value.ogType || 'website',
    twitterCard: value.twitterCard || 'summary_large_image',
    noindex: value.noindex === true,
    nofollow: value.nofollow === true,
    schemaType: value.schemaType || 'WebPage',
    breadcrumbLabel: value.breadcrumbLabel || '',
    structuredData: value.structuredData || '',
  }));

export const optionalSeo = seoSchema.optional().default({});

/** Every layout block the public site knows how to render. */
export const SECTION_TYPES = [
  'hero',
  'bookingWidget',
  'richText',
  'features',
  'steps',
  'stats',
  'imageText',
  'services',
  'vehicles',
  'testimonials',
  'faq',
  'cta',
  'gallery',
  'logoStrip',
  'contactInfo',
  'contactForm',
  'relatedLinks',
  'blogList',
  'coverage',
];

export const sectionItemSchema = z
  .object({
    id: optionalText(64),
    title: optionalText(200),
    subtitle: optionalText(300),
    description: optionalText(2000),
    body: richText(20000),
    icon: optionalText(40),
    value: optionalText(80),
    image: optionalImage,
    link: ctaSchema.optional(),
  })
  .partial();

export const sectionSchema = z.object({
  id: z.string().trim().max(64).optional(),
  type: z.enum(SECTION_TYPES),
  enabled: boolish.optional().default(true),
  eyebrow: optionalText(120),
  title: optionalText(200),
  subtitle: optionalText(400),
  body: richText(200000),
  image: optionalImage,
  items: z.array(sectionItemSchema).max(60).optional().default([]),
  cta: ctaSchema.optional(),
  secondaryCta: ctaSchema.optional(),
  settings: z
    .object({
      background: z.enum(['default', 'muted', 'dark', 'accent']).optional().default('default'),
      align: z.enum(['left', 'center']).optional().default('left'),
      columns: z.coerce.number().int().min(1).max(4).optional().default(3),
      limit: z.coerce.number().int().min(1).max(48).optional(),
      category: optionalText(80),
      serviceType: optionalText(80),
      layout: optionalText(40),
      imagePosition: z.enum(['left', 'right']).optional().default('right'),
      anchorId: optionalText(60),
    })
    .partial()
    .optional()
    .default({}),
});

export const sectionsSchema = z.array(sectionSchema).max(40).optional().default([]);

export const statusSchema = z
  .enum([CONTENT_STATUS.DRAFT, CONTENT_STATUS.PUBLISHED])
  .optional()
  .default(CONTENT_STATUS.DRAFT);

export const sortOrder = z.coerce.number().int().min(0).max(9999).optional().default(0);

export const idParam = z.object({ id: z.string().trim().min(1).max(200) });
export const slugParam = z.object({ slug: z.string().trim().min(1).max(200) });

export const listQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().max(120).optional().default(''),
  status: z.string().trim().max(40).optional().default(''),
  sortBy: z.string().trim().max(60).optional().default(''),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  category: z.string().trim().max(80).optional().default(''),
  type: z.string().trim().max(80).optional().default(''),
  tag: z.string().trim().max(80).optional().default(''),
});

/** Honeypot + timing fields accepted (and stripped) on every public form. */
export const spamFields = {
  _hp: z.string().max(200).optional(),
  _ts: z.union([z.string(), z.number()]).optional(),
};

/**
 * Consent must be explicitly true. An unchecked box arrives as `false` and a
 * missing one as `undefined`; both get the same human-readable message rather
 * than Zod's default "Required".
 */
export const consentField = (message = 'You must accept the privacy policy to continue.') =>
  z.preprocess(
    (value) => (typeof value === 'string' ? ['true', '1', 'yes', 'on'].includes(value.toLowerCase()) : value),
    z.literal(true, { errorMap: () => ({ message }) }),
  );

export const consentSchema = consentField();
