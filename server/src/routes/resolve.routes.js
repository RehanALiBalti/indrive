import { Router } from 'express';
import { z } from 'zod';
import repository from '../services/repository.js';
import validate from '../middleware/validate.js';
import { sendSuccess, asyncHandler } from '../utils/http.js';
import ApiError from '../utils/ApiError.js';
import { withCache } from '../utils/cache.js';
import { COLLECTIONS, CONTENT_STATUS } from '../constants/collections.js';
import { normalisePath } from '../utils/helpers.js';
import env from '../config/env.js';

const pagesRepo = repository(COLLECTIONS.PAGES);
const servicesRepo = repository(COLLECTIONS.SERVICES);

const router = Router();

/**
 * Resolves an arbitrary public path to the content that should render there.
 *
 * This is what allows an administrator to publish a brand-new page in the CMS
 * and have it live immediately at its URL, with no React route to add and no
 * deployment. The React app has a single catch-all route that calls this.
 */
router.get(
  '/',
  validate({ query: z.object({ path: z.string().trim().min(1).max(300) }) }),
  asyncHandler(async (req, res) => {
    const path = normalisePath(req.query.path);

    const resolved = await withCache(`public:resolve:${path}`, env.cache.publicTtlSeconds, async () => {
      const services = await servicesRepo.fetchAll();
      const service = services.find(
        (item) => normalisePath(item.landingPath || `/${item.slug}`) === path && item.isActive !== false,
      );
      if (service) return { kind: 'service', data: service };

      const pages = await pagesRepo.fetchAll();
      const page = pages.find(
        (item) =>
          normalisePath(item.path || `/${item.slug}`) === path &&
          item.status === CONTENT_STATUS.PUBLISHED,
      );
      if (page) return { kind: 'page', data: page };

      return null;
    });

    if (!resolved) throw ApiError.notFound('No published content exists at that address.');
    return sendSuccess(res, resolved);
  }),
);

export default router;
