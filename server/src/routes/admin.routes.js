import { Router } from 'express';
import { z } from 'zod';
import { getAuthAdmin } from '../config/firebase.js';
import repository from '../services/repository.js';
import validate from '../middleware/validate.js';
import { adminOnly, editorOrAbove } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import { uploadImage } from '../middleware/upload.js';
import { sendSuccess, asyncHandler } from '../utils/http.js';
import ApiError from '../utils/ApiError.js';
import { invalidate, cacheStats } from '../utils/cache.js';
import { listQuery, idParam } from '../schemas/common.js';
import {
  redirectSchema,
  redirectUpdateSchema,
  mediaUpdateSchema,
  userRoleSchema,
  userStatusSchema,
} from '../schemas/content.js';
import { submissionUpdateSchema, collectionParamSchema } from '../schemas/forms.js';
import { COLLECTIONS, CONTENT_STATUS, SUBMISSION_STATUS, ROLES } from '../constants/collections.js';
import { uploadFile, deleteFile, allowedFolders, isStorageEnabled } from '../services/storage.service.js';
import { invalidateRedirects } from '../services/redirects.service.js';
import logger from '../utils/logger.js';

const router = Router();

const repos = {
  users: repository(COLLECTIONS.USERS),
  media: repository(COLLECTIONS.MEDIA),
  redirects: repository(COLLECTIONS.REDIRECTS),
  pages: repository(COLLECTIONS.PAGES),
  services: repository(COLLECTIONS.SERVICES),
  vehicles: repository(COLLECTIONS.VEHICLES),
  faqs: repository(COLLECTIONS.FAQS),
  testimonials: repository(COLLECTIONS.TESTIMONIALS),
  blog: repository(COLLECTIONS.BLOG_POSTS),
  seoPages: repository(COLLECTIONS.SEO_PAGES),
  contact: repository(COLLECTIONS.CONTACT_SUBMISSIONS),
  booking: repository(COLLECTIONS.BOOKING_ENQUIRIES),
  corporate: repository(COLLECTIONS.CORPORATE_ENQUIRIES),
  support: repository(COLLECTIONS.SUPPORT_REQUESTS),
  newsletter: repository(COLLECTIONS.NEWSLETTER_SUBSCRIBERS),
};

const SUBMISSION_REPOS = {
  contact: repos.contact,
  booking: repos.booking,
  corporate: repos.corporate,
  support: repos.support,
  newsletter: repos.newsletter,
};

const SUBMISSION_SEARCH_FIELDS = {
  contact: ['reference', 'firstName', 'lastName', 'email', 'subject', 'message'],
  booking: ['reference', 'firstName', 'lastName', 'email', 'pickup', 'destination', 'airport'],
  corporate: ['reference', 'companyName', 'contactName', 'email', 'message'],
  support: ['reference', 'name', 'email', 'subject', 'message', 'bookingReference'],
  newsletter: ['email', 'firstName'],
};

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

const countNew = (items) => items.filter((item) => item.status === SUBMISSION_STATUS.NEW).length;

router.get(
  '/stats',
  editorOrAbove,
  asyncHandler(async (_req, res) => {
    const [
      pages, services, vehicles, faqs, testimonials, blog, seoPages,
      contact, booking, corporate, support, newsletter, media,
    ] = await Promise.all([
      repos.pages.fetchAll(),
      repos.services.fetchAll(),
      repos.vehicles.fetchAll(),
      repos.faqs.fetchAll(),
      repos.testimonials.fetchAll(),
      repos.blog.fetchAll(),
      repos.seoPages.fetchAll(),
      repos.contact.fetchAll(),
      repos.booking.fetchAll(),
      repos.corporate.fetchAll(),
      repos.support.fetchAll(),
      repos.newsletter.fetchAll(),
      repos.media.fetchAll(),
    ]);

    const published = (items) => items.filter((item) => item.status === CONTENT_STATUS.PUBLISHED).length;
    const active = (items) => items.filter((item) => item.isActive !== false).length;

    const recentEnquiries = [...booking]
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        reference: item.reference,
        serviceType: item.serviceType,
        name: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
        email: item.email,
        pickup: item.pickup,
        destination: item.destination,
        date: item.date,
        status: item.status,
        createdAt: item.createdAt,
      }));

    return sendSuccess(res, {
      content: {
        pages: { total: pages.length, published: published(pages) },
        services: { total: services.length, active: active(services) },
        vehicles: { total: vehicles.length, active: active(vehicles) },
        faqs: { total: faqs.length, active: active(faqs) },
        testimonials: { total: testimonials.length, active: active(testimonials) },
        blogPosts: { total: blog.length, published: published(blog) },
        seoPages: {
          total: seoPages.length,
          published: published(seoPages),
          byType: seoPages.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
          }, {}),
        },
        media: { total: media.length },
      },
      submissions: {
        contact: { total: contact.length, new: countNew(contact) },
        booking: { total: booking.length, new: countNew(booking) },
        corporate: { total: corporate.length, new: countNew(corporate) },
        support: { total: support.length, new: countNew(support) },
        newsletter: { total: newsletter.length, new: 0 },
      },
      recentEnquiries,
      system: {
        storageEnabled: isStorageEnabled(),
        cache: cacheStats(),
      },
    });
  }),
);

router.post(
  '/cache/flush',
  adminOnly,
  asyncHandler(async (_req, res) => {
    invalidate();
    return sendSuccess(res, { flushed: true });
  }),
);

/* -------------------------------------------------------------------------- */
/* Submissions                                                                 */
/* -------------------------------------------------------------------------- */

router.get(
  '/submissions/:collection',
  editorOrAbove,
  validate({ params: collectionParamSchema, query: listQuery }),
  asyncHandler(async (req, res) => {
    const repo = SUBMISSION_REPOS[req.params.collection];
    const { page, limit, search, status, sortBy, sortDir } = req.query;
    const { items, meta } = await repo.list({
      filters: { status },
      search,
      searchFields: SUBMISSION_SEARCH_FIELDS[req.params.collection],
      sortBy: sortBy || 'createdAt',
      sortDir: sortDir || 'desc',
      page,
      limit,
    });
    return sendSuccess(res, items, { meta });
  }),
);

router.get(
  '/submissions/:collection/:id',
  editorOrAbove,
  validate({ params: collectionParamSchema.merge(idParam) }),
  asyncHandler(async (req, res) => {
    const repo = SUBMISSION_REPOS[req.params.collection];
    return sendSuccess(res, await repo.getByIdOrFail(req.params.id));
  }),
);

router.patch(
  '/submissions/:collection/:id',
  editorOrAbove,
  validate({ params: collectionParamSchema.merge(idParam), body: submissionUpdateSchema }),
  asyncHandler(async (req, res) => {
    const repo = SUBMISSION_REPOS[req.params.collection];
    const updated = await repo.update(req.params.id, req.body, { actor: req.user });
    return sendSuccess(res, updated);
  }),
);

router.delete(
  '/submissions/:collection/:id',
  adminOnly,
  validate({ params: collectionParamSchema.merge(idParam) }),
  asyncHandler(async (req, res) => {
    const repo = SUBMISSION_REPOS[req.params.collection];
    await repo.remove(req.params.id);
    return sendSuccess(res, { id: req.params.id, deleted: true });
  }),
);

/** CSV export for the sales/ops team. */
router.get(
  '/submissions/:collection/export/csv',
  adminOnly,
  validate({ params: collectionParamSchema }),
  asyncHandler(async (req, res) => {
    const repo = SUBMISSION_REPOS[req.params.collection];
    const items = await repo.fetchAll();
    if (!items.length) {
      res.type('text/csv').send('');
      return undefined;
    }
    const columns = [...new Set(items.flatMap((item) => Object.keys(item)))].filter(
      (key) => key !== 'meta',
    );
    const escape = (value) => {
      if (value === null || value === undefined) return '';
      const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [
      columns.join(','),
      ...items.map((item) => columns.map((column) => escape(item[column])).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${req.params.collection}-export-${Date.now()}.csv"`,
    );
    return res.send(csv);
  }),
);

/* -------------------------------------------------------------------------- */
/* Media library                                                               */
/* -------------------------------------------------------------------------- */

router.get(
  '/media',
  editorOrAbove,
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { page, limit, search, category } = req.query;
    const { items, meta } = await repos.media.list({
      filters: category ? { folder: category } : {},
      search,
      searchFields: ['originalName', 'alt', 'title', 'folder', 'tags'],
      sortBy: 'createdAt',
      sortDir: 'desc',
      page,
      limit,
    });
    return sendSuccess(res, items, { meta: { ...meta, folders: allowedFolders } });
  }),
);

router.post(
  '/media',
  editorOrAbove,
  uploadLimiter,
  uploadImage.array('files', 10),
  asyncHandler(async (req, res) => {
    const files = req.files || [];
    if (!files.length) throw ApiError.badRequest('Select at least one file to upload.');

    const folder = String(req.body.folder || 'general');
    const alt = String(req.body.alt || '');
    const uploaded = [];

    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const stored = await uploadFile(file, { folder, alt, actor: req.user });
      // eslint-disable-next-line no-await-in-loop
      const record = await repos.media.create(
        { ...stored, title: stored.originalName, tags: [] },
        { actor: req.user },
      );
      uploaded.push(record);
    }

    logger.info('Media uploaded', { count: uploaded.length, by: req.user.email });
    return sendSuccess(res, uploaded, { status: 201 });
  }),
);

router.patch(
  '/media/:id',
  editorOrAbove,
  validate({ params: idParam, body: mediaUpdateSchema }),
  asyncHandler(async (req, res) =>
    sendSuccess(res, await repos.media.update(req.params.id, req.body, { actor: req.user })),
  ),
);

router.delete(
  '/media/:id',
  editorOrAbove,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const record = await repos.media.getByIdOrFail(req.params.id);
    await deleteFile(record.path);
    await repos.media.remove(req.params.id);
    return sendSuccess(res, { id: req.params.id, deleted: true });
  }),
);

/* -------------------------------------------------------------------------- */
/* Redirects                                                                   */
/* -------------------------------------------------------------------------- */

router.get(
  '/redirects',
  adminOnly,
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortDir } = req.query;
    const { items, meta } = await repos.redirects.list({
      search,
      searchFields: ['from', 'to', 'note'],
      sortBy: sortBy || 'from',
      sortDir: sortDir || 'asc',
      page,
      limit,
    });
    return sendSuccess(res, items, { meta });
  }),
);

router.post(
  '/redirects',
  adminOnly,
  validate({ body: redirectSchema }),
  asyncHandler(async (req, res) => {
    const clash = await repos.redirects.findOne('from', req.body.from);
    if (clash) throw ApiError.conflict(`A redirect from "${req.body.from}" already exists.`);
    if (req.body.from === req.body.to) {
      throw ApiError.validation('A redirect cannot point at itself.', [
        { field: 'to', message: 'Choose a different destination.' },
      ]);
    }
    const created = await repos.redirects.create(req.body, { actor: req.user });
    invalidateRedirects();
    return sendSuccess(res, created, { status: 201 });
  }),
);

router.put(
  '/redirects/:id',
  adminOnly,
  validate({ params: idParam, body: redirectUpdateSchema }),
  asyncHandler(async (req, res) => {
    const updated = await repos.redirects.update(req.params.id, req.body, { actor: req.user });
    invalidateRedirects();
    return sendSuccess(res, updated);
  }),
);

router.delete(
  '/redirects/:id',
  adminOnly,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await repos.redirects.remove(req.params.id);
    invalidateRedirects();
    return sendSuccess(res, { id: req.params.id, deleted: true });
  }),
);

/* -------------------------------------------------------------------------- */
/* Users                                                                       */
/* -------------------------------------------------------------------------- */

router.get(
  '/users',
  adminOnly,
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy, sortDir, type } = req.query;
    const { items, meta } = await repos.users.list({
      filters: type ? { role: type } : {},
      search,
      searchFields: ['email', 'displayName', 'firstName', 'lastName', 'phone'],
      sortBy: sortBy || 'createdAt',
      sortDir: sortDir || 'desc',
      page,
      limit,
    });
    const safe = items.map(({ meta: _meta, ...user }) => user);
    return sendSuccess(res, safe, { meta });
  }),
);

router.patch(
  '/users/:id/role',
  adminOnly,
  validate({ params: idParam, body: userRoleSchema }),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.uid && req.body.role !== ROLES.ADMIN) {
      throw ApiError.badRequest('You cannot remove your own admin role.');
    }
    await getAuthAdmin().setCustomUserClaims(req.params.id, { role: req.body.role });
    // Force a token refresh so the new role takes effect immediately.
    await getAuthAdmin().revokeRefreshTokens(req.params.id);
    const updated = await repos.users.update(req.params.id, { role: req.body.role }, { actor: req.user });
    logger.warn('User role changed', { uid: req.params.id, role: req.body.role, by: req.user.email });
    return sendSuccess(res, updated);
  }),
);

router.patch(
  '/users/:id/status',
  adminOnly,
  validate({ params: idParam, body: userStatusSchema }),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.uid) {
      throw ApiError.badRequest('You cannot change your own account status.');
    }
    const disabled = req.body.status === 'disabled';
    await getAuthAdmin().updateUser(req.params.id, { disabled });
    if (disabled) await getAuthAdmin().revokeRefreshTokens(req.params.id);
    const updated = await repos.users.update(req.params.id, { status: req.body.status }, { actor: req.user });
    return sendSuccess(res, updated);
  }),
);

router.delete(
  '/users/:id',
  adminOnly,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.uid) {
      throw ApiError.badRequest('You cannot delete your own account.');
    }
    await getAuthAdmin().deleteUser(req.params.id).catch(() => null);
    await repos.users.remove(req.params.id).catch(() => null);
    return sendSuccess(res, { id: req.params.id, deleted: true });
  }),
);

/** Sends a password-reset style invite by creating the account server-side. */
router.post(
  '/users',
  adminOnly,
  validate({
    body: z.object({
      email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
      displayName: z.string().trim().min(2).max(120),
      role: z.enum(['user', 'editor', 'admin']).default('editor'),
      password: z.string().min(8, 'Passwords must be at least 8 characters.').max(128),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { email, displayName, role, password } = req.body;
    const auth = getAuthAdmin();
    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) throw ApiError.conflict('An account with that email already exists.');

    const created = await auth.createUser({ email, password, displayName, emailVerified: true });
    await auth.setCustomUserClaims(created.uid, { role });
    const profile = await repos.users.create(
      {
        uid: created.uid,
        email,
        displayName,
        firstName: displayName.split(' ')[0] || '',
        lastName: displayName.split(' ').slice(1).join(' '),
        role,
        status: 'active',
        emailVerified: true,
        provider: 'password',
        createdByAdmin: true,
      },
      { id: created.uid, actor: req.user },
    );
    logger.warn('Admin created a user account', { uid: created.uid, role, by: req.user.email });
    return sendSuccess(res, profile, { status: 201 });
  }),
);

export default router;
