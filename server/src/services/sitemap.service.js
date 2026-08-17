import repository from './repository.js';
import { COLLECTIONS, CONTENT_STATUS, SEO_PAGE_PREFIX } from '../constants/collections.js';
import { withCache } from '../utils/cache.js';
import { escapeXml, normalisePath } from '../utils/helpers.js';
import { loadSettings } from '../routes/siteSettings.routes.js';
import { isFirebaseReady } from '../config/firebase.js';
import { DEFAULT_SITE_SETTINGS } from '../constants/siteDefaults.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

const SITEMAP_TTL = 300;

const repos = {
  pages: repository(COLLECTIONS.PAGES),
  services: repository(COLLECTIONS.SERVICES),
  vehicles: repository(COLLECTIONS.VEHICLES),
  blog: repository(COLLECTIONS.BLOG_POSTS),
  seoPages: repository(COLLECTIONS.SEO_PAGES),
};

/**
 * Routes that always exist in the React app. Content-driven URLs are appended
 * from Firestore, so the SEO team never needs a developer to list a new page.
 */
const SYSTEM_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/fleet', priority: 0.9, changefreq: 'weekly' },
  { path: '/blog', priority: 0.7, changefreq: 'daily' },
];

/** Never indexable: private, transactional or duplicate-risk URLs. */
export const EXCLUDED_PATHS = new Set([
  '/login',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth-action',
  '/thank-you',
  '/account',
  '/404',
]);

/**
 * Settings lookup that never throws.
 *
 * robots.txt and the sitemaps must keep responding even if Firestore is
 * momentarily unavailable: a 5xx on robots.txt tells search engines to stop
 * crawling the entire site.
 */
const safeSettings = async () => {
  try {
    return await loadSettings();
  } catch (error) {
    logger.warn('Falling back to default settings while building SEO files', { error: error.message });
    return DEFAULT_SITE_SETTINGS;
  }
};

const siteBase = async () => {
  const settings = await safeSettings();
  return (settings.seo?.siteUrl || env.siteUrl).replace(/\/+$/, '');
};

const urlEntry = (base, { path, lastmod, changefreq = 'monthly', priority = 0.6, images = [] }) => {
  const loc = `${base}${normalisePath(path)}`;
  const imageXml = images
    .filter((image) => image?.url)
    .slice(0, 20)
    .map(
      (image) =>
        `\n    <image:image><image:loc>${escapeXml(image.url)}</image:loc>${
          image.alt ? `<image:title>${escapeXml(image.alt)}</image:title>` : ''
        }</image:image>`,
    )
    .join('');

  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${escapeXml(String(lastmod).slice(0, 10))}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>${imageXml}
  </url>`;
};

const urlSet = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
  `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join('\n')}\n</urlset>`;

const isPublished = (item) => item.status === CONTENT_STATUS.PUBLISHED;

/* -------------------------------------------------------------------------- */
/* Individual sitemaps                                                         */
/* -------------------------------------------------------------------------- */

export const buildPagesSitemap = async () =>
  withCache('sitemap:pages', SITEMAP_TTL, async () => {
    const base = await siteBase();
    if (!isFirebaseReady()) return urlSet(SYSTEM_ROUTES.map((route) => urlEntry(base, route)));

    const [pages, services] = await Promise.all([repos.pages.fetchAll(), repos.services.fetchAll()]);

    const entries = [...SYSTEM_ROUTES.map((route) => urlEntry(base, route))];
    const seen = new Set(SYSTEM_ROUTES.map((route) => route.path));

    for (const page of pages) {
      if (!isPublished(page)) continue;
      if (page.showInSitemap === false) continue;
      if (page.seo?.noindex) continue;
      const path = normalisePath(page.path || `/${page.slug}`);
      if (EXCLUDED_PATHS.has(path) || seen.has(path)) continue;
      seen.add(path);
      entries.push(
        urlEntry(base, {
          path,
          lastmod: page.updatedAt,
          changefreq: page.sitemapChangefreq || 'monthly',
          priority: page.sitemapPriority ?? 0.7,
        }),
      );
    }

    for (const service of services) {
      if (service.isActive === false || service.seo?.noindex) continue;
      const path = normalisePath(service.landingPath || `/${service.slug}`);
      if (seen.has(path)) continue;
      seen.add(path);
      entries.push(urlEntry(base, { path, lastmod: service.updatedAt, changefreq: 'weekly', priority: 0.9 }));
    }

    return urlSet(entries);
  });

export const buildFleetSitemap = async () =>
  withCache('sitemap:fleet', SITEMAP_TTL, async () => {
    const base = await siteBase();
    if (!isFirebaseReady()) return urlSet([]);
    const vehicles = await repos.vehicles.fetchAll();
    const entries = vehicles
      .filter((vehicle) => vehicle.isActive !== false && !vehicle.seo?.noindex)
      .map((vehicle) =>
        urlEntry(base, {
          path: `/fleet/${vehicle.slug}`,
          lastmod: vehicle.updatedAt,
          changefreq: 'monthly',
          priority: 0.7,
          images: vehicle.images || [],
        }),
      );
    return urlSet(entries);
  });

export const buildBlogSitemap = async () =>
  withCache('sitemap:blog', SITEMAP_TTL, async () => {
    const base = await siteBase();
    if (!isFirebaseReady()) return urlSet([]);
    const posts = await repos.blog.fetchAll();
    const entries = posts
      .filter(
        (post) =>
          isPublished(post) &&
          !post.seo?.noindex &&
          (!post.publishedAt || new Date(post.publishedAt).getTime() <= Date.now()),
      )
      .map((post) =>
        urlEntry(base, {
          path: `/blog/${post.slug}`,
          lastmod: post.updatedAt || post.publishedAt,
          changefreq: 'monthly',
          priority: 0.6,
          images: post.featuredImage?.url ? [post.featuredImage] : [],
        }),
      );
    return urlSet(entries);
  });

export const buildLocationsSitemap = async () =>
  withCache('sitemap:locations', SITEMAP_TTL, async () => {
    const base = await siteBase();
    if (!isFirebaseReady()) return urlSet([]);
    const pages = await repos.seoPages.fetchAll();
    const entries = pages
      .filter((page) => isPublished(page) && !page.seo?.noindex)
      .map((page) =>
        urlEntry(base, {
          path: `${SEO_PAGE_PREFIX[page.type] || ''}/${page.slug}`,
          lastmod: page.updatedAt,
          changefreq: 'weekly',
          priority: page.sitemapPriority ?? 0.8,
          images: page.heroImage?.url ? [page.heroImage] : [],
        }),
      );
    return urlSet(entries);
  });

/* -------------------------------------------------------------------------- */
/* Sitemap index                                                               */
/* -------------------------------------------------------------------------- */

export const SITEMAP_CHILDREN = [
  '/sitemap-pages.xml',
  '/sitemap-fleet.xml',
  '/sitemap-blog.xml',
  '/sitemap-locations.xml',
];

export const buildSitemapIndex = async () =>
  withCache('sitemap:index', SITEMAP_TTL, async () => {
    const base = await siteBase();
    const lastmod = new Date().toISOString();
    const entries = SITEMAP_CHILDREN.map(
      (child) =>
        `  <sitemap>\n    <loc>${escapeXml(`${base}${child}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
    );
    return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join(
      '\n',
    )}\n</sitemapindex>`;
  });

/* -------------------------------------------------------------------------- */
/* robots.txt                                                                  */
/* -------------------------------------------------------------------------- */

export const buildRobotsTxt = async () =>
  withCache('robots:txt', SITEMAP_TTL, async () => {
    const settings = await safeSettings();
    const base = (settings.seo?.siteUrl || env.siteUrl).replace(/\/+$/, '');

    // A non-production deployment must never be indexed.
    if (!env.isProduction) {
      return ['User-agent: *', 'Disallow: /', '', `Sitemap: ${base}/sitemap.xml`, ''].join('\n');
    }

    const lines = [
      'User-agent: *',
      'Allow: /',
      '',
      '# Private and non-indexable areas',
      'Disallow: /admin',
      'Disallow: /admin/',
      'Disallow: /api/',
      'Disallow: /account',
      'Disallow: /login',
      'Disallow: /sign-up',
      'Disallow: /forgot-password',
      'Disallow: /reset-password',
      'Disallow: /verify-email',
      'Disallow: /auth-action',
      'Disallow: /thank-you',
      'Disallow: /*?*ref=',
      '',
      '# Crawl budget',
      'User-agent: AhrefsBot',
      'Crawl-delay: 10',
      '',
      'User-agent: SemrushBot',
      'Crawl-delay: 10',
      '',
    ];

    if (settings.seo?.robotsTxtExtra) {
      lines.push(settings.seo.robotsTxtExtra.trim(), '');
    }

    lines.push(`Sitemap: ${base}/sitemap.xml`, '');
    return lines.join('\n');
  });

export default {
  buildSitemapIndex,
  buildPagesSitemap,
  buildFleetSitemap,
  buildBlogSitemap,
  buildLocationsSitemap,
  buildRobotsTxt,
};
