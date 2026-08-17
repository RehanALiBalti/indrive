import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { AnnouncementBar, BackToTop, MobileCtaBar, CookieConsent, Analytics, ScrollToTop } from './SiteChrome.jsx';
import { RouteLoading } from '../ui/States.jsx';
import { organisationSchema } from '../seo/Seo.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { env } from '../../config/env.js';

const SiteLayout = () => {
  const { settings } = useSite();
  const base = (settings.seo?.siteUrl || env.siteUrl || '').replace(/\/+$/, '');
  const org = organisationSchema(settings, base);

  return (
    <div className="app-shell">
      {org ? (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(org).replace(/</g, '\\u003c')}</script>
        </Helmet>
      ) : null}

      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <ScrollToTop />
      <Analytics />
      <AnnouncementBar />
      <Header />

      <main className="app-main" id="main-content">
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </main>

      <Footer />
      <MobileCtaBar />
      <BackToTop />
      <CookieConsent />
    </div>
  );
};

export default SiteLayout;
