import repository from './repository.js';
import { COLLECTIONS, CONTENT_STATUS, SEO_PAGE_TYPES } from '../constants/collections.js';
import { withCache } from '../utils/cache.js';
import { normalisePath, excerptFromHtml } from '../utils/helpers.js';
import { loadSettings } from '../routes/siteSettings.routes.js';
import { isFirebaseReady } from '../config/firebase.js';
import { EXCLUDED_PATHS } from './sitemap.service.js';
import env from '../config/env.js';

const repos = {
  pages: repository(COLLECTIONS.PAGES),
  services: repository(COLLECTIONS.SERVICES),
  vehicles: repository(COLLECTIONS.VEHICLES),
  blog: repository(COLLECTIONS.BLOG_POSTS),
  seoPages: repository(COLLECTIONS.SEO_PAGES),
  faqs: repository(COLLECTIONS.FAQS),
};

const TTL = 120;

const applyTitleTemplate = (title, settings) => {
  const brand = settings.brandName || '';
  if (!title) return `${settings.seo?.defaultTitle || brand}${brand ? ` | ${brand}` : ''}`;
  if (brand && title.toLowerCase().includes(brand.toLowerCase())) return title;
  const template = settings.seo?.titleTemplate || '%s | %brand%';
  return template.replace('%s', title).replace('%brand%', brand);
};

const buildOrganisationSchema = (settings, base) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: settings.brandName,
  legalName: settings.legalName || settings.brandName,
  url: base,
  logo: settings.logo?.url || undefined,
  telephone: settings.contact?.phone || undefined,
  email: settings.contact?.email || undefined,
  address: settings.contact?.addressLine1
    ? {
        '@type': 'PostalAddress',
        streetAddress: [settings.contact.addressLine1, settings.contact.addressLine2]
          .filter(Boolean)
          .join(', '),
        addressLocality: settings.contact.city || undefined,
        addressRegion: settings.contact.region || undefined,
        postalCode: settings.contact.postcode || undefined,
        addressCountry: settings.contact.country || undefined,
      }
    : undefined,
  sameAs: Object.values(settings.social || {}).filter(Boolean),
});

const buildBreadcrumbSchema = (base, crumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.label,
    item: `${base}${normalisePath(crumb.href)}`,
  })),
});

const buildFaqSchema = (faqs = []) => {
  const valid = faqs.filter((faq) => faq?.question && faq?.answer);
  if (!valid.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.slice(0, 20).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: excerptFromHtml(faq.answer, 900) },
    })),
  };
};

const fromSeoObject = (seo = {}, fallback = {}) => ({
  title: seo.title || fallback.title || '',
  description: seo.description || fallback.description || '',
  canonicalOverride: seo.canonical || '',
  ogTitle: seo.ogTitle || seo.title || fallback.title || '',
  ogDescription: seo.ogDescription || seo.description || fallback.description || '',
  ogImage: seo.ogImage?.url || fallback.image || '',
  ogImageAlt: seo.ogImage?.alt || fallback.imageAlt || '',
  ogType: seo.ogType || fallback.ogType || 'website',
  twitterCard: seo.twitterCard || 'summary_large_image',
  noindex: seo.noindex === true,
  nofollow: seo.nofollow === true,
  keywords: seo.keywords || [],
  structuredData: seo.structuredData || '',
});

/**
 * Resolves the full <head> metadata for a public URL directly from CMS content.
 * Used by the SSR meta-injection middleware so crawlers and social scrapers see
 * correct tags in the initial HTML response, and by the /api/seo/meta endpoint.
 */
export const resolveSeoForPath = async (rawPath) => {
  const path = normalisePath((rawPath || '/').split('?')[0]);
  return withCache(`seo:meta:${path}`, TTL, async () => {
    const settings = await loadSettings();
    const base = (settings.seo?.siteUrl || env.siteUrl).replace(/\/+$/, '');

    const result = {
      path,
      title: '',
      description: settings.seo?.defaultDescription || '',
      canonical: `${base}${path}`,
      robots: 'index, follow',
      og: {
        title: '',
        description: '',
        image: settings.defaultOgImage?.url || '',
        imageAlt: settings.defaultOgImage?.alt || settings.brandName,
        type: 'website',
        url: `${base}${path}`,
        siteName: settings.brandName,
      },
      twitterCard: 'summary_large_image',
      keywords: settings.seo?.defaultKeywords || [],
      jsonLd: [],
      brandName: settings.brandName,
      locale: 'en_GB',
      analytics: settings.analytics || {},
    };

    const applyMeta = (meta, crumbs = []) => {
      result.title = applyTitleTemplate(meta.title, settings);
      result.description = meta.description || result.description;
      result.canonical = meta.canonicalOverride
        ? meta.canonicalOverride
        : `${base}${path}`;
      const directives = [
        meta.noindex ? 'noindex' : 'index',
        meta.nofollow ? 'nofollow' : 'follow',
      ];
      if (!meta.noindex) directives.push('max-image-preview:large', 'max-snippet:-1');
      result.robots = directives.join(', ');
      result.og.title = applyTitleTemplate(meta.ogTitle || meta.title, settings);
      result.og.description = meta.ogDescription || meta.description || result.description;
      if (meta.ogImage) {
        result.og.image = meta.ogImage;
        result.og.imageAlt = meta.ogImageAlt || result.og.imageAlt;
      }
      result.og.type = meta.ogType;
      result.twitterCard = meta.twitterCard;
      if (meta.keywords?.length) result.keywords = meta.keywords;

      if (settings.seo?.organisationSchemaEnabled !== false) {
        result.jsonLd.push(buildOrganisationSchema(settings, base));
      }
      if (crumbs.length > 1) result.jsonLd.push(buildBreadcrumbSchema(base, crumbs));
      if (meta.structuredData) {
        try {
          result.jsonLd.push(JSON.parse(meta.structuredData));
        } catch {
          /* invalid custom JSON-LD is ignored rather than breaking the page */
        }
      }
    };

    // Private/auth routes are never indexable.
    if (EXCLUDED_PATHS.has(path) || path.startsWith('/admin') || path.startsWith('/account')) {
      applyMeta({
        ...fromSeoObject({}, { title: settings.brandName }),
        noindex: true,
        nofollow: true,
      });
      result.robots = 'noindex, nofollow';
      return result;
    }

    if (!isFirebaseReady()) {
      applyMeta(fromSeoObject({}, { title: settings.seo?.defaultTitle }));
      return result;
    }

    const home = [{ label: 'Home', href: '/' }];

    /* --------------------------- vehicle detail --------------------------- */
    if (path.startsWith('/fleet/')) {
      const slug = path.split('/')[2];
      const vehicle = await repos.vehicles.getBySlug(slug);
      if (vehicle && vehicle.isActive !== false) {
        applyMeta(
          fromSeoObject(vehicle.seo, {
            title: `${vehicle.name} — ${vehicle.category}`,
            description:
              vehicle.shortDescription || excerptFromHtml(vehicle.description, 160),
            image: vehicle.images?.[0]?.url,
            imageAlt: vehicle.images?.[0]?.alt,
            ogType: 'product',
          }),
          [...home, { label: 'Fleet', href: '/fleet' }, { label: vehicle.name, href: path }],
        );
        result.jsonLd.push({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: vehicle.name,
          category: vehicle.category,
          description: vehicle.shortDescription || excerptFromHtml(vehicle.description, 300),
          image: (vehicle.images || []).map((image) => image.url).filter(Boolean),
          brand: { '@type': 'Brand', name: settings.brandName },
        });
        return result;
      }
    }

    /* ------------------------------- article ------------------------------ */
    if (path.startsWith('/blog/')) {
      const slug = path.split('/')[2];
      const post = await repos.blog.getBySlug(slug);
      if (post && post.status === CONTENT_STATUS.PUBLISHED) {
        applyMeta(
          fromSeoObject(post.seo, {
            title: post.title,
            description: post.excerpt || excerptFromHtml(post.content, 160),
            image: post.featuredImage?.url,
            imageAlt: post.featuredImage?.alt,
            ogType: 'article',
          }),
          [...home, { label: 'Blog', href: '/blog' }, { label: post.title, href: path }],
        );
        result.jsonLd.push({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt,
          image: post.featuredImage?.url ? [post.featuredImage.url] : undefined,
          datePublished: post.publishedAt || post.createdAt,
          dateModified: post.updatedAt || post.publishedAt,
          author: { '@type': 'Person', name: post.author?.name || settings.brandName },
          publisher: {
            '@type': 'Organization',
            name: settings.brandName,
            logo: settings.logo?.url ? { '@type': 'ImageObject', url: settings.logo.url } : undefined,
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `${base}${path}` },
        });
        const faqSchema = buildFaqSchema(post.faqs);
        if (faqSchema) result.jsonLd.push(faqSchema);
        return result;
      }
    }

    /* -------------------------- SEO landing pages ------------------------- */
    const SEO_PREFIX_TO_TYPE = {
      '/airport-transfers': SEO_PAGE_TYPES.AIRPORT,
      '/chauffeur-service': SEO_PAGE_TYPES.CITY,
      '/city-to-city': SEO_PAGE_TYPES.ROUTE,
    };
    const prefix = Object.keys(SEO_PREFIX_TO_TYPE).find((key) => path.startsWith(`${key}/`));
    if (prefix) {
      const type = SEO_PREFIX_TO_TYPE[prefix];
      const slug = path.slice(prefix.length + 1).split('/')[0];
      const all = await repos.seoPages.fetchAll();
      const page = all.find((item) => item.type === type && item.slug === slug);
      if (page && page.status === CONTENT_STATUS.PUBLISHED) {
        applyMeta(
          fromSeoObject(page.seo, {
            title: page.title,
            description: page.intro?.slice(0, 160),
            image: page.heroImage?.url,
            imageAlt: page.heroImage?.alt,
          }),
          [
            ...home,
            { label: page.seo?.breadcrumbLabel || 'Locations', href: prefix },
            { label: page.h1 || page.title, href: path },
          ],
        );
        result.jsonLd.push({
          '@context': 'https://schema.org',
          '@type': 'Service',
          serviceType:
            type === SEO_PAGE_TYPES.AIRPORT
              ? 'Airport transfer'
              : type === SEO_PAGE_TYPES.ROUTE
                ? 'City to city transfer'
                : 'Chauffeur service',
          name: page.h1 || page.title,
          description: page.intro || '',
          areaServed:
            page.location?.cityName ||
            page.location?.airportName ||
            [page.location?.originCity, page.location?.destinationCity].filter(Boolean).join(' to ') ||
            undefined,
          provider: {
            '@type': 'LocalBusiness',
            name: settings.brandName,
            telephone: settings.contact?.phone || undefined,
            url: base,
          },
        });
        const faqSchema = buildFaqSchema(page.faqs);
        if (faqSchema) result.jsonLd.push(faqSchema);
        return result;
      }
    }

    /* ----------------------------- service page --------------------------- */
    const service = (await repos.services.fetchAll()).find(
      (item) => normalisePath(item.landingPath || `/${item.slug}`) === path && item.isActive !== false,
    );
    if (service) {
      applyMeta(
        fromSeoObject(service.seo, {
          title: service.name,
          description: service.shortDescription || excerptFromHtml(service.description, 160),
          image: service.heroImage?.url || service.image?.url,
          imageAlt: service.heroImage?.alt || service.image?.alt,
        }),
        [...home, { label: service.name, href: path }],
      );
      result.jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: service.name,
        serviceType: service.name,
        description: service.shortDescription || '',
        provider: { '@type': 'Organization', name: settings.brandName, url: base },
      });
      return result;
    }

    /* -------------------------------- pages ------------------------------- */
    const pages = await repos.pages.fetchAll();
    const page = pages.find(
      (item) => normalisePath(item.path || `/${item.slug}`) === path && item.status === CONTENT_STATUS.PUBLISHED,
    );
    if (page) {
      applyMeta(
        fromSeoObject(page.seo, {
          title: page.title,
          description: page.subtitle,
          image: page.heroImage?.url,
          imageAlt: page.heroImage?.alt,
        }),
        path === '/' ? home : [...home, { label: page.seo?.breadcrumbLabel || page.title, href: path }],
      );

      if (path === '/' && settings.seo?.localBusinessSchemaEnabled !== false) {
        result.jsonLd.push({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': `${base}/#business`,
          name: settings.brandName,
          image: settings.logo?.url || undefined,
          url: base,
          telephone: settings.contact?.phone || undefined,
          email: settings.contact?.email || undefined,
          priceRange: '££',
          address: {
            '@type': 'PostalAddress',
            streetAddress: settings.contact?.addressLine1 || undefined,
            addressLocality: settings.contact?.city || undefined,
            postalCode: settings.contact?.postcode || undefined,
            addressCountry: settings.contact?.country || undefined,
          },
          openingHours: 'Mo-Su 00:00-23:59',
        });
        result.jsonLd.push({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          url: base,
          name: settings.brandName,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${base}/blog?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        });
      }

      if (page.slug === 'faq' || page.seo?.schemaType === 'FAQPage') {
        const faqs = (await repos.faqs.fetchAll()).filter((faq) => faq.isActive !== false);
        const faqSchema = buildFaqSchema(faqs);
        if (faqSchema) result.jsonLd.push(faqSchema);
      }
      return result;
    }

    /* ------------------------------ index pages --------------------------- */
    const INDEX_TITLES = {
      '/fleet': ['Our Fleet', 'Browse our fleet of executive saloons, luxury MPVs and first-class vehicles.'],
      '/blog': ['Travel Guides & News', 'Chauffeur travel guides, airport advice and company news.'],
      '/airport-transfers': ['Airport Transfers', 'Chauffeur-driven airport transfers with flight monitoring and meet-and-greet.'],
      '/chauffeur-service': ['Chauffeur Service by City', 'Professional chauffeur services across our covered cities.'],
      '/city-to-city': ['City to City Transfers', 'Fixed-price long-distance chauffeur transfers between cities.'],
    };
    if (INDEX_TITLES[path]) {
      const [title, description] = INDEX_TITLES[path];
      applyMeta(fromSeoObject({}, { title, description }), [...home, { label: title, href: path }]);
      return result;
    }

    /* -------------------------------- 404 --------------------------------- */
    applyMeta({
      ...fromSeoObject({}, { title: 'Page not found', description: 'The page you requested could not be found.' }),
      noindex: true,
    });
    result.robots = 'noindex, follow';
    result.isNotFound = true;
    return result;
  });
};

export default resolveSeoForPath;
