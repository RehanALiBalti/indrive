import { Router } from 'express';
import { z } from 'zod';
import repository from '../services/repository.js';
import validate from '../middleware/validate.js';
import { editorOrAbove } from '../middleware/auth.js';
import { sendSuccess, asyncHandler } from '../utils/http.js';
import ApiError from '../utils/ApiError.js';
import { invalidate, withCache } from '../utils/cache.js';
import { listQuery, idParam } from '../schemas/common.js';
import {
  seoPageSchema,
  seoPageUpdateSchema,
  seoTemplateSchema,
  seoTemplateUpdateSchema,
  seoPageFromTemplateSchema,
} from '../schemas/content.js';
import {
  COLLECTIONS,
  CONTENT_STATUS,
  SEO_PAGE_TYPES,
  SEO_PAGE_PREFIX,
} from '../constants/collections.js';
import { slugify, normalisePath } from '../utils/helpers.js';
import { loadSettings } from './siteSettings.routes.js';
import createContentRouters from '../controllers/contentFactory.js';
import env from '../config/env.js';

const pagesRepo = repository(COLLECTIONS.SEO_PAGES);
const templatesRepo = repository(COLLECTIONS.SEO_TEMPLATES);

const TYPES = Object.values(SEO_PAGE_TYPES);

export const buildSeoPath = (type, slug) => normalisePath(`${SEO_PAGE_PREFIX[type] || ''}/${slug}`);

const isPublished = (item) => item.status === CONTENT_STATUS.PUBLISHED;

/** Recursively replaces {{token}} placeholders in every string of a value. */
const applyTokens = (value, tokens) => {
  if (typeof value === 'string') {
    return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) =>
      tokens[key] !== undefined && tokens[key] !== null ? String(tokens[key]) : match,
    );
  }
  if (Array.isArray(value)) return value.map((item) => applyTokens(item, tokens));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) out[key] = applyTokens(nested, tokens);
    return out;
  }
  return value;
};

const withPath = (item) => ({ ...item, path: buildSeoPath(item.type, item.slug) });

/* -------------------------------------------------------------------------- */
/* Public                                                                      */
/* -------------------------------------------------------------------------- */

export const publicRouter = Router();

publicRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { page, limit, search, type } = req.query;
    const key = `public:seoPages:list:${JSON.stringify({ page, limit, search, type })}`;
    const result = await withCache(key, env.cache.publicTtlSeconds, async () => {
      const { items, meta } = await pagesRepo.list({
        filters: type ? { type } : {},
        search,
        searchFields: ['title', 'slug', 'h1', 'location.cityName', 'location.airportName'],
        sortBy: 'sortOrder',
        sortDir: 'asc',
        page,
        limit,
      });
      return { items: items.filter(isPublished).map(withPath), meta };
    });
    return sendSuccess(res, result.items, { meta: result.meta });
  }),
);

/** Lightweight index used for internal-linking widgets and sitemaps. */
publicRouter.get(
  '/index/all',
  asyncHandler(async (_req, res) => {
    const grouped = await withCache('public:seoPages:index', env.cache.publicTtlSeconds, async () => {
      const all = (await pagesRepo.fetchAll()).filter(isPublished);
      const map = Object.fromEntries(TYPES.map((type) => [type, []]));
      for (const item of all) {
        if (!map[item.type]) map[item.type] = [];
        map[item.type].push({
          id: item.id,
          slug: item.slug,
          type: item.type,
          title: item.title,
          h1: item.h1,
          path: buildSeoPath(item.type, item.slug),
          location: item.location || {},
          sortOrder: item.sortOrder ?? 0,
        });
      }
      for (const type of Object.keys(map)) {
        map[type].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title));
      }
      return map;
    });
    return sendSuccess(res, grouped);
  }),
);

publicRouter.get(
  '/:type/:slug',
  validate({
    params: z.object({
      type: z.enum([SEO_PAGE_TYPES.AIRPORT, SEO_PAGE_TYPES.CITY, SEO_PAGE_TYPES.ROUTE]),
      slug: z.string().trim().min(1).max(200),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { type, slug } = req.params;
    const key = `public:seoPages:detail:${type}:${slug}`;
    const item = await withCache(key, env.cache.publicTtlSeconds, async () => {
      const all = await pagesRepo.fetchAll();
      const found = all.find((doc) => doc.type === type && doc.slug === slug);
      if (!found || !isPublished(found)) return null;
      return withPath(found);
    });
    if (!item) throw ApiError.notFound('That landing page could not be found.');
    return sendSuccess(res, item);
  }),
);

/* -------------------------------------------------------------------------- */
/* Admin — landing pages                                                       */
/* -------------------------------------------------------------------------- */

export const adminRouter = Router();
adminRouter.use(editorOrAbove);

const dropCache = () => invalidate('public:seoPages', 'sitemap', 'seo:');

adminRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { page, limit, search, status, type, sortBy, sortDir } = req.query;
    const { items, meta } = await pagesRepo.list({
      filters: { status, type },
      search,
      searchFields: ['title', 'slug', 'h1', 'location.cityName', 'location.airportName'],
      sortBy: sortBy || 'updatedAt',
      sortDir: sortDir || 'desc',
      page,
      limit,
    });
    return sendSuccess(res, items.map(withPath), { meta });
  }),
);

adminRouter.get(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) =>
    sendSuccess(res, withPath(await pagesRepo.getByIdOrFail(req.params.id))),
  ),
);

/** Slugs must be unique per type so /airport-transfers/london and
 *  /chauffeur-service/london can coexist. */
const uniqueSlugForType = async (type, baseSlug, exceptId) => {
  const all = await pagesRepo.fetchAll();
  let candidate = slugify(baseSlug);
  let counter = 2;
  while (all.some((doc) => doc.type === type && doc.slug === candidate && doc.id !== exceptId)) {
    candidate = `${slugify(baseSlug)}-${counter}`;
    counter += 1;
    if (counter > 200) break;
  }
  return candidate;
};

adminRouter.post(
  '/',
  validate({ body: seoPageSchema }),
  asyncHandler(async (req, res) => {
    const data = { ...req.body };
    data.slug = await uniqueSlugForType(data.type, data.slug || data.title);
    data.path = buildSeoPath(data.type, data.slug);
    const created = await pagesRepo.create(data, { actor: req.user });
    dropCache();
    return sendSuccess(res, withPath(created), { status: 201 });
  }),
);

adminRouter.put(
  '/:id',
  validate({ params: idParam, body: seoPageUpdateSchema }),
  asyncHandler(async (req, res) => {
    const existing = await pagesRepo.getByIdOrFail(req.params.id);
    const data = { ...req.body };
    const type = data.type || existing.type;
    if (data.slug) data.slug = await uniqueSlugForType(type, data.slug, req.params.id);
    data.path = buildSeoPath(type, data.slug || existing.slug);
    const updated = await pagesRepo.update(req.params.id, data, { actor: req.user });
    dropCache();
    return sendSuccess(res, withPath(updated));
  }),
);

adminRouter.post(
  '/:id/duplicate',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const source = await pagesRepo.getByIdOrFail(req.params.id);
    const { id, createdAt, updatedAt, createdBy, updatedBy, ...rest } = source;
    const copy = {
      ...rest,
      title: `${source.title} (copy)`,
      status: CONTENT_STATUS.DRAFT,
      slug: await uniqueSlugForType(source.type, `${source.slug}-copy`),
    };
    copy.path = buildSeoPath(copy.type, copy.slug);
    const created = await pagesRepo.create(copy, { actor: req.user });
    dropCache();
    return sendSuccess(res, withPath(created), { status: 201 });
  }),
);

adminRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const removed = await pagesRepo.remove(req.params.id);
    dropCache();
    return sendSuccess(res, { id: removed.id, deleted: true });
  }),
);

/**
 * Generates a brand-new landing page from a template. This is what lets the SEO
 * team publish /airport-transfers/<new-airport>/ without a developer.
 */
adminRouter.post(
  '/generate',
  validate({ body: seoPageFromTemplateSchema }),
  asyncHandler(async (req, res) => {
    const { templateId, tokens, status } = req.body;
    const template = await templatesRepo.getById(templateId);
    if (!template) throw ApiError.notFound('That template no longer exists.');

    const settings = await loadSettings();
    const mergedTokens = {
      brandName: settings.brandName,
      phone: settings.contact?.phone || '',
      ...tokens,
    };

    const defaults = applyTokens(template.defaults || {}, mergedTokens);

    const derivedName =
      mergedTokens.airportName ||
      mergedTokens.cityName ||
      (mergedTokens.originCity && mergedTokens.destinationCity
        ? `${mergedTokens.originCity}-to-${mergedTokens.destinationCity}`
        : '') ||
      defaults.h1 ||
      template.name;

    const slug = await uniqueSlugForType(template.type, req.body.slug || slugify(derivedName));

    const location = {
      airportName: mergedTokens.airportName || '',
      airportCode: mergedTokens.airportCode || '',
      cityName: mergedTokens.cityName || '',
      originCity: mergedTokens.originCity || '',
      destinationCity: mergedTokens.destinationCity || '',
      region: mergedTokens.region || '',
      country: mergedTokens.country || '',
    };

    const bookingFormType =
      template.type === SEO_PAGE_TYPES.AIRPORT
        ? 'airport'
        : template.type === SEO_PAGE_TYPES.ROUTE
          ? 'city-to-city'
          : 'hourly';

    const payload = {
      type: template.type,
      slug,
      path: buildSeoPath(template.type, slug),
      title: defaults.title || derivedName,
      h1: defaults.h1 || derivedName,
      intro: defaults.intro || '',
      heroImage: { url: '', alt: '', path: '' },
      location,
      journey: {
        distance: mergedTokens.distance || '',
        duration: mergedTokens.duration || '',
        averagePriceLabel: mergedTokens.averagePriceLabel || '',
        meetAndGreet: '',
        waitingTime: '',
        notes: '',
      },
      sections: defaults.sections || [],
      benefits: defaults.benefits || [],
      faqs: defaults.faqs || [],
      relatedRoutes: [],
      relatedCities: [],
      relatedAirports: [],
      internalLinks: [],
      showFleetSection: true,
      showServicesSection: true,
      showTestimonialsSection: true,
      showFaqSection: true,
      showBookingWidget: true,
      bookingFormType,
      cta: { label: 'Get an instant quote', href: '#enquiry', variant: 'primary', enabled: true },
      seo: {
        title: defaults.seoTitle || defaults.title || derivedName,
        description: defaults.seoDescription || '',
        canonical: '',
        keywords: [],
        ogTitle: '',
        ogDescription: '',
        ogImage: { url: '', alt: '', path: '' },
        ogType: 'website',
        twitterCard: 'summary_large_image',
        noindex: false,
        nofollow: false,
        schemaType: 'Service',
        breadcrumbLabel: derivedName,
        structuredData: '',
      },
      status: status || CONTENT_STATUS.DRAFT,
      sortOrder: 0,
      sitemapPriority: 0.8,
      generatedFromTemplate: templateId,
    };

    const created = await pagesRepo.create(payload, { actor: req.user });
    dropCache();
    return sendSuccess(res, withPath(created), { status: 201 });
  }),
);

/** Bulk publish/unpublish/delete from the admin list view. */
adminRouter.post(
  '/bulk',
  validate({
    body: z.object({
      ids: z.array(z.string().min(1)).min(1).max(200),
      action: z.enum(['publish', 'unpublish', 'delete']),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { ids, action } = req.body;
    let affected = 0;
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      if (action === 'delete') await pagesRepo.remove(id).catch(() => null);
      else {
        // eslint-disable-next-line no-await-in-loop
        await pagesRepo
          .update(
            id,
            { status: action === 'publish' ? CONTENT_STATUS.PUBLISHED : CONTENT_STATUS.DRAFT },
            { actor: req.user },
          )
          .catch(() => null);
      }
      affected += 1;
    }
    dropCache();
    return sendSuccess(res, { affected, action });
  }),
);

/* -------------------------------------------------------------------------- */
/* SEO templates                                                               */
/* -------------------------------------------------------------------------- */

export const templates = createContentRouters({
  collection: COLLECTIONS.SEO_TEMPLATES,
  createSchema: seoTemplateSchema,
  updateSchema: seoTemplateUpdateSchema,
  searchFields: ['name', 'type', 'description'],
  defaultSort: { by: 'sortOrder', dir: 'asc' },
  publicFilter: (item) => item.isActive !== false,
  supportsSlug: false,
});

export default { publicRouter, adminRouter, templates };
