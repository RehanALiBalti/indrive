import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { env } from '../../config/env.js';

const applyTemplate = (title, settings) => {
  const brand = settings.brandName || '';
  if (!title) return settings.seo?.defaultTitle ? `${settings.seo.defaultTitle} | ${brand}` : brand;
  if (brand && title.toLowerCase().includes(brand.toLowerCase())) return title;
  const template = settings.seo?.titleTemplate || '%s | %brand%';
  return template.replace('%s', title).replace('%brand%', brand);
};

/**
 * Keeps the document <head> correct during client-side navigation.
 *
 * The very first HTML response already contains fully-resolved meta tags,
 * injected by the Node API from the same CMS data (see server middleware
 * `htmlSeo.js`). This component mirrors that for subsequent SPA navigations so
 * the two never disagree.
 */
const Seo = ({
  title,
  description,
  canonical,
  image,
  imageAlt,
  type = 'website',
  noindex = false,
  nofollow = false,
  keywords = [],
  publishedTime,
  modifiedTime,
  author,
  jsonLd = [],
  children,
}) => {
  const { settings } = useSite();
  const location = useLocation();

  const base = (settings.seo?.siteUrl || env.siteUrl || '').replace(/\/+$/, '');
  const url = canonical || `${base}${location.pathname}`;
  const resolvedTitle = applyTemplate(title, settings);
  const resolvedDescription = description || settings.seo?.defaultDescription || '';
  const resolvedImage = image || settings.defaultOgImage?.url || '';
  const resolvedKeywords = keywords.length ? keywords : settings.seo?.defaultKeywords || [];

  const robots = [noindex ? 'noindex' : 'index', nofollow ? 'nofollow' : 'follow'];
  if (!noindex) robots.push('max-image-preview:large', 'max-snippet:-1');

  const schemas = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : [jsonLd].filter(Boolean);

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en-GB" />
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="robots" content={robots.join(', ')} />
      {resolvedKeywords.length ? <meta name="keywords" content={resolvedKeywords.join(', ')} /> : null}
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={settings.brandName} />
      <meta property="og:locale" content="en_GB" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={url} />
      {resolvedImage ? <meta property="og:image" content={resolvedImage} /> : null}
      {resolvedImage ? <meta property="og:image:alt" content={imageAlt || settings.brandName} /> : null}

      <meta name="twitter:card" content={resolvedImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      {resolvedImage ? <meta name="twitter:image" content={resolvedImage} /> : null}

      {publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
      {modifiedTime ? <meta property="article:modified_time" content={modifiedTime} /> : null}
      {author ? <meta property="article:author" content={author} /> : null}

      {settings.analytics?.googleSiteVerification ? (
        <meta name="google-site-verification" content={settings.analytics.googleSiteVerification} />
      ) : null}
      {settings.analytics?.bingSiteVerification ? (
        <meta name="msvalidate.01" content={settings.analytics.bingSiteVerification} />
      ) : null}

      {schemas.map((schema, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema).replace(/</g, '\\u003c')}
        </script>
      ))}

      {children}
    </Helmet>
  );
};

/* ------------------------- Structured data builders ----------------------- */

export const breadcrumbSchema = (base, items = []) => {
  if (items.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${base}${item.href}`,
    })),
  };
};

export const faqSchema = (faqs = []) => {
  const valid = faqs.filter((faq) => faq?.question && faq?.answer);
  if (!valid.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.slice(0, 20).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: String(faq.answer).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000),
      },
    })),
  };
};

export const serviceSchema = ({ name, description, areaServed, brandName, url }) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name,
  serviceType: name,
  description,
  url: url || undefined,
  areaServed: areaServed || undefined,
  provider: { '@type': 'Organization', name: brandName },
});

export const organisationSchema = (settings, base) => {
  if (settings.seo?.organisationSchemaEnabled === false) return null;
  return {
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
  };
};

export default Seo;
