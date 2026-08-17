import { Router } from 'express';
import { z } from 'zod';
import repository from '../services/repository.js';
import validate from '../middleware/validate.js';
import { editorOrAbove } from '../middleware/auth.js';
import { sendSuccess, asyncHandler } from '../utils/http.js';
import { navigationSchema } from '../schemas/content.js';
import { COLLECTIONS } from '../constants/collections.js';
import { invalidate, withCache } from '../utils/cache.js';
import env from '../config/env.js';

const repo = repository(COLLECTIONS.NAVIGATION);

/** Menus are singleton documents keyed by position. */
export const MENU_KEYS = ['header', 'footer-services', 'footer-company', 'footer-legal', 'mobile'];

const keyParam = z.object({ key: z.enum(MENU_KEYS) });

const withIds = (items = []) =>
  items.map((item, index) => ({
    ...item,
    id: item.id || `${index + 1}`,
    children: (item.children || []).map((child, childIndex) => ({
      ...child,
      id: child.id || `${index + 1}-${childIndex + 1}`,
    })),
  }));

export const publicRouter = Router();

publicRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const menus = await withCache('public:navigation:all', env.cache.publicTtlSeconds, async () => {
      const docs = await repo.fetchAll();
      const map = {};
      for (const key of MENU_KEYS) {
        const found = docs.find((doc) => doc.id === key);
        map[key] = { key, label: found?.label || key, items: found?.items || [] };
      }
      return map;
    });
    return sendSuccess(res, menus);
  }),
);

publicRouter.get(
  '/:key',
  validate({ params: keyParam }),
  asyncHandler(async (req, res) => {
    const menu = await withCache(
      `public:navigation:${req.params.key}`,
      env.cache.publicTtlSeconds,
      async () => {
        const found = await repo.getById(req.params.key);
        return { key: req.params.key, label: found?.label || req.params.key, items: found?.items || [] };
      },
    );
    return sendSuccess(res, menu);
  }),
);

export const adminRouter = Router();
adminRouter.use(editorOrAbove);

adminRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const docs = await repo.fetchAll();
    const menus = MENU_KEYS.map((key) => {
      const found = docs.find((doc) => doc.id === key);
      return { id: key, key, label: found?.label || key, items: found?.items || [] };
    });
    return sendSuccess(res, menus);
  }),
);

adminRouter.get(
  '/:key',
  validate({ params: keyParam }),
  asyncHandler(async (req, res) => {
    const found = await repo.getById(req.params.key);
    return sendSuccess(
      res,
      found || { id: req.params.key, key: req.params.key, label: req.params.key, items: [] },
    );
  }),
);

adminRouter.put(
  '/:key',
  validate({ params: keyParam, body: navigationSchema }),
  asyncHandler(async (req, res) => {
    const saved = await repo.upsert(
      req.params.key,
      { key: req.params.key, label: req.body.label || req.params.key, items: withIds(req.body.items) },
      { actor: req.user },
    );
    invalidate('public:navigation');
    return sendSuccess(res, saved);
  }),
);

export default { publicRouter, adminRouter };
