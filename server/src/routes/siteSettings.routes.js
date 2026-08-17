import { Router } from 'express';
import repository from '../services/repository.js';
import validate from '../middleware/validate.js';
import { adminOnly } from '../middleware/auth.js';
import { sendSuccess, asyncHandler } from '../utils/http.js';
import { siteSettingsSchema } from '../schemas/content.js';
import { COLLECTIONS, SITE_SETTINGS_DOC } from '../constants/collections.js';
import { DEFAULT_SITE_SETTINGS } from '../constants/siteDefaults.js';
import { invalidate, withCache } from '../utils/cache.js';
import env from '../config/env.js';

const repo = repository(COLLECTIONS.SITE_SETTINGS);

/** Deep-merges stored settings over the defaults so new keys always resolve. */
const mergeDefaults = (stored = {}) => {
  const merge = (base, override) => {
    if (!override || typeof override !== 'object' || Array.isArray(override)) {
      return override === undefined ? base : override;
    }
    const out = { ...base };
    for (const [key, value] of Object.entries(override)) {
      out[key] = key in base ? merge(base[key], value) : value;
    }
    return out;
  };
  return merge(DEFAULT_SITE_SETTINGS, stored);
};

export const loadSettings = async () =>
  withCache('public:siteSettings', env.cache.publicTtlSeconds, async () => {
    const stored = await repo.getById(SITE_SETTINGS_DOC);
    const merged = mergeDefaults(stored || {});
    if (!merged.seo.siteUrl) merged.seo.siteUrl = env.siteUrl;
    if (!merged.footer.copyright) {
      merged.footer.copyright = `© ${new Date().getFullYear()} ${merged.legalName || merged.brandName}. All rights reserved.`;
    }
    return merged;
  });

export const publicRouter = Router();

publicRouter.get(
  '/',
  asyncHandler(async (_req, res) => sendSuccess(res, await loadSettings())),
);

export const adminRouter = Router();
adminRouter.use(adminOnly);

adminRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const stored = await repo.getById(SITE_SETTINGS_DOC);
    return sendSuccess(res, mergeDefaults(stored || {}));
  }),
);

adminRouter.put(
  '/',
  validate({ body: siteSettingsSchema }),
  asyncHandler(async (req, res) => {
    const saved = await repo.upsert(SITE_SETTINGS_DOC, req.body, { actor: req.user });
    invalidate('public:siteSettings', 'sitemap', 'seo:', 'robots');
    return sendSuccess(res, mergeDefaults(saved));
  }),
);

export default { publicRouter, adminRouter, loadSettings };
