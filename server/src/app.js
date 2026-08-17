import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import env from './config/env.js';
import logger from './utils/logger.js';
import apiRoutes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { redirectMiddleware } from './services/redirects.service.js';
import { htmlSeoMiddleware } from './middleware/htmlSeo.js';
import { asyncHandler } from './utils/http.js';
import {
  buildSitemapIndex,
  buildPagesSitemap,
  buildFleetSitemap,
  buildBlogSitemap,
  buildLocationsSitemap,
  buildRobotsTxt,
} from './services/sitemap.service.js';

const app = express();

/* --------------------------- platform basics ---------------------------- */

// Required for correct client IPs (rate limiting) behind Cloud Run / Nginx.
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* ------------------------------ security -------------------------------- */

app.use(
  helmet({
    contentSecurityPolicy: env.isProduction
      ? {
          useDefaults: true,
          directives: {
            'default-src': ["'self'"],
            // Firebase Auth, GA4 and GTM are loaded from Google origins.
            'script-src': [
              "'self'",
              "'unsafe-inline'",
              'https://www.googletagmanager.com',
              'https://www.google-analytics.com',
              'https://apis.google.com',
            ],
            'connect-src': [
              "'self'",
              'https://identitytoolkit.googleapis.com',
              'https://securetoken.googleapis.com',
              'https://firebasestorage.googleapis.com',
              'https://storage.googleapis.com',
              'https://www.google-analytics.com',
              'https://region1.google-analytics.com',
              'https://*.googleapis.com',
            ],
            'img-src': ["'self'", 'data:', 'blob:', 'https:'],
            'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
            'frame-src': ["'self'", 'https://www.google.com', 'https://*.firebaseapp.com'],
            'object-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"],
            'frame-ancestors': ["'none'"],
            'upgrade-insecure-requests': [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: env.isProduction
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  }),
);

const allowedOrigins = new Set(env.corsOrigins);

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin, curl and server-to-server requests have no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (!env.isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      return callback(new Error('CORS_NOT_ALLOWED'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
  }),
);

/* ------------------------------ pipeline -------------------------------- */

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: logger.stream,
    skip: (req) => req.path === '/api/health',
  }),
);

/* ------------------------ SEO: sitemaps & robots ------------------------ */

const xml = (res, body) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.send(body);
};

app.get('/sitemap.xml', asyncHandler(async (_req, res) => xml(res, await buildSitemapIndex())));
app.get('/sitemap-pages.xml', asyncHandler(async (_req, res) => xml(res, await buildPagesSitemap())));
app.get('/sitemap-fleet.xml', asyncHandler(async (_req, res) => xml(res, await buildFleetSitemap())));
app.get('/sitemap-blog.xml', asyncHandler(async (_req, res) => xml(res, await buildBlogSitemap())));
app.get(
  '/sitemap-locations.xml',
  asyncHandler(async (_req, res) => xml(res, await buildLocationsSitemap())),
);

app.get(
  '/robots.txt',
  asyncHandler(async (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(await buildRobotsTxt());
  }),
);

/* --------------------------------- API ---------------------------------- */

app.use('/api', apiLimiter, apiRoutes);

/* ---------------------------- static frontend --------------------------- */

const distExists = fs.existsSync(path.join(env.clientDistPath, 'index.html'));

if (env.serveClient && distExists) {
  logger.info(`Serving built client from ${env.clientDistPath}`);

  // CMS-managed 301s and trailing-slash normalisation run before anything else.
  app.use(asyncHandler(redirectMiddleware));

  // Fingerprinted assets can be cached aggressively.
  app.use(
    '/assets',
    express.static(path.join(env.clientDistPath, 'assets'), {
      immutable: true,
      maxAge: '1y',
      fallthrough: true,
    }),
  );

  app.use(
    express.static(env.clientDistPath, {
      index: false,
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );

  // Everything else is a React route: serve index.html with injected SEO head.
  app.get('*', htmlSeoMiddleware);
} else if (env.serveClient && !distExists) {
  logger.warn(
    `SERVE_CLIENT is true but no build was found at ${env.clientDistPath}. Run "npm run build" first.`,
  );
}

/* ------------------------------- errors --------------------------------- */

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
