import fs from 'node:fs/promises';
import path from 'node:path';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { escapeHtml } from '../utils/helpers.js';
import { resolveSeoForPath } from '../services/seoMeta.service.js';

const MARKER = '<!--seo-head-->';
let template = null;

const loadTemplate = async () => {
  if (template && env.isProduction) return template;
  const file = path.join(env.clientDistPath, 'index.html');
  template = await fs.readFile(file, 'utf8');
  return template;
};

const metaTag = (attr, key, content) =>
  content ? `<meta ${attr}="${escapeHtml(key)}" content="${escapeHtml(content)}"/>` : '';

const buildHead = (seo) => {
  const tags = [
    `<title>${escapeHtml(seo.title)}</title>`,
    metaTag('name', 'description', seo.description),
    metaTag('name', 'robots', seo.robots),
    metaTag('name', 'keywords', (seo.keywords || []).join(', ')),
    `<link rel="canonical" href="${escapeHtml(seo.canonical)}"/>`,
    metaTag('property', 'og:site_name', seo.og.siteName),
    metaTag('property', 'og:locale', seo.locale),
    metaTag('property', 'og:type', seo.og.type),
    metaTag('property', 'og:title', seo.og.title),
    metaTag('property', 'og:description', seo.og.description),
    metaTag('property', 'og:url', seo.og.url),
    metaTag('property', 'og:image', seo.og.image),
    metaTag('property', 'og:image:alt', seo.og.image ? seo.og.imageAlt : ''),
    metaTag('name', 'twitter:card', seo.twitterCard),
    metaTag('name', 'twitter:title', seo.og.title),
    metaTag('name', 'twitter:description', seo.og.description),
    metaTag('name', 'twitter:image', seo.og.image),
  ];

  if (seo.analytics?.googleSiteVerification) {
    tags.push(metaTag('name', 'google-site-verification', seo.analytics.googleSiteVerification));
  }
  if (seo.analytics?.bingSiteVerification) {
    tags.push(metaTag('name', 'msvalidate.01', seo.analytics.bingSiteVerification));
  }

  for (const schema of seo.jsonLd || []) {
    // JSON-LD is escaped defensively so a stray "</script>" cannot break out.
    const json = JSON.stringify(schema).replace(/</g, '\\u003c');
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }

  return tags.filter(Boolean).join('\n    ');
};

/**
 * Serves the built React app with real <head> metadata rendered server-side.
 *
 * The SPA itself keeps its meta in sync on client-side navigation via
 * react-helmet-async; this middleware guarantees that the FIRST response —
 * the one crawlers, social scrapers and Lighthouse see — already contains the
 * correct title, description, canonical, Open Graph tags and JSON-LD.
 */
export const htmlSeoMiddleware = async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api')) return next();
  if (path.extname(req.path)) return next();

  try {
    const [html, seo] = await Promise.all([loadTemplate(), resolveSeoForPath(req.path)]);
    const head = buildHead(seo);
    const output = html.includes(MARKER)
      ? html.replace(MARKER, head)
      : html.replace('</head>', `    ${head}\n  </head>`);

    res.status(seo.isNotFound ? 404 : 200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.send(output);
  } catch (error) {
    // A metadata lookup failure must never take the website down: fall back to
    // the unmodified shell so React still renders and sets its own <head>.
    logger.error('SEO HTML injection failed; serving unmodified index.html', error?.message);
    try {
      const html = await loadTemplate();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.send(html);
    } catch (readError) {
      logger.error('Could not read the client build', readError?.message);
      return next();
    }
  }
};

export default htmlSeoMiddleware;
