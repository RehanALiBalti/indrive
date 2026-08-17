import repository from './repository.js';
import { COLLECTIONS } from '../constants/collections.js';
import { withCache, invalidate } from '../utils/cache.js';
import { normalisePath } from '../utils/helpers.js';
import { isFirebaseReady } from '../config/firebase.js';
import logger from '../utils/logger.js';

const repo = repository(COLLECTIONS.REDIRECTS);
const CACHE_KEY = 'redirects:active';
const CACHE_TTL = 120;

export const loadRedirectMap = async () =>
  withCache(CACHE_KEY, CACHE_TTL, async () => {
    if (!isFirebaseReady()) return {};
    try {
      const all = await repo.fetchAll();
      const map = {};
      for (const item of all) {
        if (item.isActive === false || !item.from || !item.to) continue;
        map[normalisePath(item.from).toLowerCase()] = {
          to: item.to,
          statusCode: item.statusCode || 301,
        };
      }
      return map;
    } catch (error) {
      logger.warn('Could not load redirects', error?.message);
      return {};
    }
  });

export const invalidateRedirects = () => invalidate('redirects');

/**
 * Applies CMS-managed 301/302 redirects and normalises trailing slashes so a
 * page is only ever reachable at one canonical URL.
 */
export const redirectMiddleware = async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/assets')) return next();

  // Collapse trailing slashes to the canonical, slash-free form.
  if (req.path.length > 1 && req.path.endsWith('/')) {
    const target = req.originalUrl.replace(/\/(\?|$)/, '$1');
    return res.redirect(301, target || '/');
  }

  try {
    const map = await loadRedirectMap();
    const rule = map[req.path.toLowerCase()];
    if (rule) {
      const query = req.originalUrl.includes('?')
        ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
        : '';
      const destination = /^https?:\/\//i.test(rule.to) ? rule.to : `${rule.to}${query}`;
      return res.redirect(rule.statusCode, destination);
    }
  } catch (error) {
    logger.warn('Redirect lookup failed', error?.message);
  }

  return next();
};

export default { loadRedirectMap, redirectMiddleware, invalidateRedirects };
