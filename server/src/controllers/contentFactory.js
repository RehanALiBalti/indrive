import { Router } from 'express';
import repository from '../services/repository.js';
import validate from '../middleware/validate.js';
import { adminOnly, editorOrAbove } from '../middleware/auth.js';
import { sendSuccess, asyncHandler } from '../utils/http.js';
import ApiError from '../utils/ApiError.js';
import { invalidate, withCache } from '../utils/cache.js';
import { idParam, slugParam, listQuery } from '../schemas/common.js';
import { reorderSchema } from '../schemas/content.js';
import { slugify } from '../utils/helpers.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Builds a pair of routers for a CMS collection:
 *   - `publicRouter`: read-only, cached, published/active records only
 *   - `adminRouter` : full CRUD, authenticated + authorised, cache-invalidating
 *
 * Every content collection in the project uses this so behaviour (validation,
 * slug uniqueness, pagination, caching, error shape) is identical everywhere.
 */
export const createContentRouters = ({
  collection,
  createSchema,
  updateSchema,
  searchFields = ['title', 'name', 'slug'],
  defaultSort = { by: 'sortOrder', dir: 'asc' },
  adminSort = { by: 'updatedAt', dir: 'desc' },
  /** Firestore predicate marking a record as publicly visible. */
  publicWhere = [],
  /** Extra in-memory filter for public reads. */
  publicFilter = () => true,
  /** Shape a record before returning it to the public site. */
  publicProject = (item) => item,
  /** Fields the public list endpoint may filter on, e.g. ['category']. */
  publicFilterFields = [],
  supportsSlug = true,
  supportsReorder = false,
  minimumRole = 'editor',
  beforeWrite = async (data) => data,
  afterWrite = async () => {},
  cacheTtl = env.cache.publicTtlSeconds,
}) => {
  const repo = repository(collection);
  const cacheNamespace = `public:${collection}`;
  const guard = minimumRole === 'admin' ? adminOnly : editorOrAbove;

  const dropCache = () => invalidate(cacheNamespace, 'sitemap', 'seo:');

  /* ------------------------------- public ------------------------------- */
  const publicRouter = Router();

  publicRouter.get(
    '/',
    validate({ query: listQuery }),
    asyncHandler(async (req, res) => {
      const { page, limit, search, sortBy, sortDir } = req.query;
      const filters = {};
      for (const field of publicFilterFields) {
        if (req.query[field]) filters[field] = req.query[field];
      }

      const key = `${cacheNamespace}:list:${JSON.stringify({ page, limit, search, sortBy, sortDir, filters })}`;
      const result = await withCache(key, cacheTtl, async () => {
        const { items, meta } = await repo.list({
          where: publicWhere,
          filters,
          search,
          searchFields,
          sortBy: sortBy || defaultSort.by,
          sortDir: sortDir || defaultSort.dir,
          page,
          limit,
          predicate: publicFilter,
        });
        return { items: items.map(publicProject), meta };
      });

      return sendSuccess(res, result.items, { meta: result.meta });
    }),
  );

  if (supportsSlug) {
    publicRouter.get(
      '/:slug',
      validate({ params: slugParam }),
      asyncHandler(async (req, res) => {
        const key = `${cacheNamespace}:slug:${req.params.slug}`;
        const item = await withCache(key, cacheTtl, async () => {
          const found = await repo.getBySlug(req.params.slug);
          if (!found || !publicFilter(found)) return null;
          return publicProject(found);
        });
        if (!item) throw ApiError.notFound('That page could not be found.');
        return sendSuccess(res, item);
      }),
    );
  }

  /* -------------------------------- admin -------------------------------- */
  const adminRouter = Router();
  adminRouter.use(guard);

  adminRouter.get(
    '/',
    validate({ query: listQuery }),
    asyncHandler(async (req, res) => {
      const { page, limit, search, sortBy, sortDir, status, category, type } = req.query;
      const { items, meta } = await repo.list({
        filters: { status, category, type },
        search,
        searchFields,
        sortBy: sortBy || adminSort.by,
        sortDir: sortDir || adminSort.dir,
        page,
        limit,
      });
      return sendSuccess(res, items, { meta });
    }),
  );

  adminRouter.get(
    '/:id',
    validate({ params: idParam }),
    asyncHandler(async (req, res) => sendSuccess(res, await repo.getByIdOrFail(req.params.id))),
  );

  adminRouter.post(
    '/',
    validate({ body: createSchema }),
    asyncHandler(async (req, res) => {
      let data = { ...req.body };
      if (supportsSlug) {
        const base = slugify(data.slug || data.title || data.name || '');
        if (!base) throw ApiError.validation('A title or slug is required.');
        data.slug = await repo.uniqueSlug(base);
      }
      data = await beforeWrite(data, { req, mode: 'create' });
      const created = await repo.create(data, { actor: req.user });
      dropCache();
      await afterWrite(created, { req, mode: 'create' });
      logger.info(`[CMS] ${collection} created`, { id: created.id, by: req.user.email });
      return sendSuccess(res, created, { status: 201 });
    }),
  );

  adminRouter.put(
    '/:id',
    validate({ params: idParam, body: updateSchema }),
    asyncHandler(async (req, res) => {
      let data = { ...req.body };
      if (supportsSlug && data.slug) {
        data.slug = await repo.uniqueSlug(slugify(data.slug), req.params.id);
      }
      data = await beforeWrite(data, { req, mode: 'update', id: req.params.id });
      const updated = await repo.update(req.params.id, data, { actor: req.user });
      dropCache();
      await afterWrite(updated, { req, mode: 'update' });
      logger.info(`[CMS] ${collection} updated`, { id: updated.id, by: req.user.email });
      return sendSuccess(res, updated);
    }),
  );

  adminRouter.post(
    '/:id/duplicate',
    validate({ params: idParam }),
    asyncHandler(async (req, res) => {
      const source = await repo.getByIdOrFail(req.params.id);
      const {
        id, createdAt, updatedAt, createdBy, updatedBy, ...rest
      } = source;
      const copy = { ...rest, status: 'draft' };
      if (supportsSlug) copy.slug = await repo.uniqueSlug(`${source.slug || 'copy'}-copy`);
      if (copy.title) copy.title = `${copy.title} (copy)`;
      if (copy.name) copy.name = `${copy.name} (copy)`;
      const created = await repo.create(copy, { actor: req.user });
      dropCache();
      return sendSuccess(res, created, { status: 201 });
    }),
  );

  adminRouter.delete(
    '/:id',
    validate({ params: idParam }),
    asyncHandler(async (req, res) => {
      const removed = await repo.remove(req.params.id);
      dropCache();
      logger.info(`[CMS] ${collection} deleted`, { id: req.params.id, by: req.user.email });
      return sendSuccess(res, { id: removed.id, deleted: true });
    }),
  );

  if (supportsReorder) {
    adminRouter.post(
      '/reorder',
      validate({ body: reorderSchema }),
      asyncHandler(async (req, res) => {
        const count = await repo.reorder(req.body.ids, { actor: req.user });
        dropCache();
        return sendSuccess(res, { reordered: count });
      }),
    );
  }

  return { publicRouter, adminRouter, repo, dropCache };
};

export default createContentRouters;
