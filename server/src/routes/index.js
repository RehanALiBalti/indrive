import { Router } from 'express';
import { z } from 'zod';
import env from '../config/env.js';
import { isFirebaseReady, getInitError } from '../config/firebase.js';
import { sendSuccess, asyncHandler } from '../utils/http.js';
import validate from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import { isStorageEnabled } from '../services/storage.service.js';
import { isMailConfigured } from '../services/email.service.js';
import { resolveSeoForPath } from '../services/seoMeta.service.js';

import authRoutes from './auth.routes.js';
import formRoutes from './forms.routes.js';
import adminRoutes from './admin.routes.js';
import resolveRoutes from './resolve.routes.js';
import { pages, services, vehicles, faqs, testimonials, blog } from './content.routes.js';
import * as navigation from './navigation.routes.js';
import * as siteSettings from './siteSettings.routes.js';
import * as seo from './seo.routes.js';

const router = Router();

/* ------------------------------- meta ---------------------------------- */

router.get(
  '/health',
  asyncHandler(async (_req, res) =>
    sendSuccess(res, {
      status: 'ok',
      environment: env.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
      firebase: isFirebaseReady() ? 'connected' : 'unavailable',
      firebaseError: isFirebaseReady() ? null : getInitError()?.message || null,
      storage: isStorageEnabled() ? 'enabled' : 'disabled',
      email: isMailConfigured() ? 'configured' : 'not-configured',
      timestamp: new Date().toISOString(),
    }),
  ),
);

/** Resolved <head> metadata for any public path (used for previews/debugging). */
router.get(
  '/seo/meta',
  validate({ query: z.object({ path: z.string().trim().max(300).default('/') }) }),
  asyncHandler(async (req, res) => sendSuccess(res, await resolveSeoForPath(req.query.path))),
);

/* ------------------------------ public --------------------------------- */

router.use('/auth', authRoutes);
router.use('/resolve', resolveRoutes);
router.use('/pages', pages.publicRouter);
router.use('/services', services.publicRouter);
router.use('/vehicles', vehicles.publicRouter);
router.use('/faqs', faqs.publicRouter);
router.use('/testimonials', testimonials.publicRouter);
router.use('/blog', blog.publicRouter);
router.use('/seo-pages', seo.publicRouter);
router.use('/seo-templates', seo.templates.publicRouter);
router.use('/navigation', navigation.publicRouter);
router.use('/site-settings', siteSettings.publicRouter);

// Public form submissions: /api/contact, /api/booking-enquiries, ...
router.use('/', formRoutes);

/* ------------------------------- admin --------------------------------- */
// Every route below requires a verified Firebase ID token plus a sufficient
// role; the guards live inside each router.

router.use('/admin', optionalAuth);
router.use('/admin/pages', pages.adminRouter);
router.use('/admin/services', services.adminRouter);
router.use('/admin/vehicles', vehicles.adminRouter);
router.use('/admin/faqs', faqs.adminRouter);
router.use('/admin/testimonials', testimonials.adminRouter);
router.use('/admin/blog', blog.adminRouter);
router.use('/admin/seo-pages', seo.adminRouter);
router.use('/admin/seo-templates', seo.templates.adminRouter);
router.use('/admin/navigation', navigation.adminRouter);
router.use('/admin/site-settings', siteSettings.adminRouter);
router.use('/admin', adminRoutes);

export default router;
