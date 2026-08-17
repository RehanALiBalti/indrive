const LABELS = {
  'airport-transfers': 'Airport Transfers',
  'chauffeur-service': 'Chauffeur Service',
  'city-to-city': 'City to City',
  fleet: 'Fleet',
  blog: 'Travel Guides',
};

const titleise = (segment) =>
  segment
    .split('-')
    .map((word) => (word.length > 2 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');

/**
 * Derives a breadcrumb trail from a URL path.
 *
 * The final crumb uses the label supplied by the CMS (SEO breadcrumb label or
 * page title) so it always reads as an editor intended, while the intermediate
 * crumbs come from the URL structure itself.
 */
export const buildBreadcrumbs = (pathname, currentLabel) => {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Home', href: '/' }];

  segments.forEach((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    crumbs.push({
      label: isLast && currentLabel ? currentLabel : LABELS[segment] || titleise(segment),
      href,
    });
  });

  return crumbs;
};

export default buildBreadcrumbs;
