import { useLocation } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useSite } from '../context/SiteContext.jsx';
import Seo, { breadcrumbSchema } from '../components/seo/Seo.jsx';
import SectionRenderer from '../components/sections/SectionRenderer.jsx';
import PageHero from '../components/sections/PageHero.jsx';
import { RouteLoading, ErrorState } from '../components/ui/States.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import ServiceView from './ServiceView.jsx';
import { buildBreadcrumbs } from '../lib/breadcrumbs.js';
import { env } from '../config/env.js';

/**
 * Renders whatever the CMS has published at the current URL.
 *
 * A single catch-all route is deliberate: an administrator can create a new
 * page in the admin area and it is live at its slug immediately, with no React
 * route to add and no deployment.
 */
const CmsPage = () => {
  const location = useLocation();
  const { settings } = useSite();
  const state = useApi('/resolve', { params: { path: location.pathname } });

  if (state.loading) return <RouteLoading />;

  if (state.error) {
    if (state.error.isNotFound) return <NotFoundPage />;
    return (
      <div className="container section">
        <ErrorState error={state.error} onRetry={state.refetch} />
      </div>
    );
  }

  const resolved = state.data;
  if (!resolved) return <NotFoundPage />;
  if (resolved.kind === 'service') return <ServiceView service={resolved.data} />;

  const page = resolved.data;
  const base = (settings.seo?.siteUrl || env.siteUrl || '').replace(/\/+$/, '');
  const crumbs = buildBreadcrumbs(location.pathname, page.seo?.breadcrumbLabel || page.title);
  const startsWithHero = page.sections?.[0]?.type === 'hero' && page.sections[0].enabled !== false;

  return (
    <>
      <Seo
        title={page.seo?.title || page.title}
        description={page.seo?.description}
        canonical={page.seo?.canonical || undefined}
        image={page.seo?.ogImage?.url || page.heroImage?.url}
        imageAlt={page.seo?.ogImage?.alt || page.heroImage?.alt}
        noindex={page.seo?.noindex}
        nofollow={page.seo?.nofollow}
        keywords={page.seo?.keywords}
        jsonLd={[breadcrumbSchema(base, crumbs)]}
      />

      {!startsWithHero ? (
        <PageHero
          title={page.h1 || page.title}
          lead={page.subtitle}
          image={page.heroImage}
          breadcrumbs={crumbs}
        />
      ) : null}

      <SectionRenderer sections={page.sections || []} context={{ breadcrumbs: crumbs }} />
    </>
  );
};

export default CmsPage;
