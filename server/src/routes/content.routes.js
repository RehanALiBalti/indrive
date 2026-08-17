import createContentRouters from '../controllers/contentFactory.js';
import { COLLECTIONS, CONTENT_STATUS } from '../constants/collections.js';
import {
  pageSchema,
  pageUpdateSchema,
  serviceSchema,
  serviceUpdateSchema,
  vehicleSchema,
  vehicleUpdateSchema,
  faqSchema,
  faqUpdateSchema,
  testimonialSchema,
  testimonialUpdateSchema,
  blogPostSchema,
  blogPostUpdateSchema,
} from '../schemas/content.js';
import { normalisePath, excerptFromHtml, stripHtml } from '../utils/helpers.js';

const isPublished = (item) => item.status === CONTENT_STATUS.PUBLISHED;
const isActive = (item) => item.isActive !== false;

/* ------------------------------- Pages ---------------------------------- */
export const pages = createContentRouters({
  collection: COLLECTIONS.PAGES,
  createSchema: pageSchema,
  updateSchema: pageUpdateSchema,
  searchFields: ['title', 'slug', 'h1', 'seo.title'],
  defaultSort: { by: 'title', dir: 'asc' },
  publicFilter: isPublished,
  beforeWrite: async (data) => {
    if (data.slug && !data.path) data.path = normalisePath(`/${data.slug}`);
    if (data.path) data.path = normalisePath(data.path);
    if (data.title && !data.h1) data.h1 = data.title;
    return data;
  },
});

/* ------------------------------ Services -------------------------------- */
export const services = createContentRouters({
  collection: COLLECTIONS.SERVICES,
  createSchema: serviceSchema,
  updateSchema: serviceUpdateSchema,
  searchFields: ['name', 'slug', 'shortDescription', 'serviceType'],
  defaultSort: { by: 'sortOrder', dir: 'asc' },
  publicFilter: isActive,
  publicFilterFields: ['serviceType'],
  supportsReorder: true,
  beforeWrite: async (data) => {
    if (data.slug && !data.landingPath) data.landingPath = normalisePath(`/${data.slug}`);
    return data;
  },
});

/* ------------------------------ Vehicles -------------------------------- */
export const vehicles = createContentRouters({
  collection: COLLECTIONS.VEHICLES,
  createSchema: vehicleSchema,
  updateSchema: vehicleUpdateSchema,
  searchFields: ['name', 'slug', 'category', 'tagline', 'exampleModels'],
  defaultSort: { by: 'sortOrder', dir: 'asc' },
  publicFilter: isActive,
  publicFilterFields: ['category'],
  supportsReorder: true,
  beforeWrite: async (data) => {
    if (Array.isArray(data.images)) {
      data.images = data.images.filter((image) => image && image.url);
    }
    if (!data.shortDescription && data.description) {
      data.shortDescription = excerptFromHtml(data.description, 180);
    }
    return data;
  },
});

/* -------------------------------- FAQs ---------------------------------- */
export const faqs = createContentRouters({
  collection: COLLECTIONS.FAQS,
  createSchema: faqSchema,
  updateSchema: faqUpdateSchema,
  searchFields: ['question', 'answer', 'category'],
  defaultSort: { by: 'sortOrder', dir: 'asc' },
  publicFilter: isActive,
  publicFilterFields: ['category'],
  supportsSlug: false,
  supportsReorder: true,
});

/* ---------------------------- Testimonials ------------------------------ */
export const testimonials = createContentRouters({
  collection: COLLECTIONS.TESTIMONIALS,
  createSchema: testimonialSchema,
  updateSchema: testimonialUpdateSchema,
  searchFields: ['name', 'quote', 'company', 'location'],
  defaultSort: { by: 'sortOrder', dir: 'asc' },
  publicFilter: isActive,
  supportsSlug: false,
  supportsReorder: true,
});

/* -------------------------------- Blog ---------------------------------- */
const estimateReadingMinutes = (html) => {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

export const blog = createContentRouters({
  collection: COLLECTIONS.BLOG_POSTS,
  createSchema: blogPostSchema,
  updateSchema: blogPostUpdateSchema,
  searchFields: ['title', 'slug', 'excerpt', 'tags', 'category'],
  defaultSort: { by: 'publishedAt', dir: 'desc' },
  publicFilterFields: ['category', 'tag'],
  publicFilter: (item) =>
    item.status === CONTENT_STATUS.PUBLISHED &&
    (!item.publishedAt || new Date(item.publishedAt).getTime() <= Date.now()),
  beforeWrite: async (data) => {
    if (data.content) {
      if (!data.excerpt) data.excerpt = excerptFromHtml(data.content, 180);
      data.readingMinutes = data.readingMinutes || estimateReadingMinutes(data.content);
    }
    if (data.status === CONTENT_STATUS.PUBLISHED && !data.publishedAt) {
      data.publishedAt = new Date().toISOString();
    }
    if (data.status === CONTENT_STATUS.DRAFT && data.publishedAt === '') {
      data.publishedAt = null;
    }
    return data;
  },
});
