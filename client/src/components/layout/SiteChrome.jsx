import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import Icon from '../ui/Icon.jsx';
import Button from '../ui/Button.jsx';

const CONSENT_KEY = 'cookie-consent-v1';

/* ----------------------------- Announcement ------------------------------ */

export const AnnouncementBar = () => {
  const { settings } = useSite();
  const announcement = settings.announcement || {};
  if (!announcement.enabled || !announcement.message) return null;

  return (
    <div className="announcement" role="region" aria-label="Announcement">
      <span>{announcement.message}</span>
      {announcement.linkHref && announcement.linkLabel ? (
        <Link to={announcement.linkHref}>{announcement.linkLabel}</Link>
      ) : null}
    </div>
  );
};

/* ------------------------------ Scroll reset ----------------------------- */

/**
 * React Router keeps the scroll position between routes. Reset it on navigation,
 * but honour in-page anchors so "Get a quote" links land on the enquiry form.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      return undefined;
    }

    const id = hash.slice(1);
    let attempts = 0;
    const tryScroll = () => {
      const target = document.getElementById(id);
      if (!target) return false;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    };

    if (tryScroll()) return undefined;

    // CMS pages load after the first paint; retry until the anchor exists.
    const timer = window.setInterval(() => {
      attempts += 1;
      if (tryScroll() || attempts > 25) window.clearInterval(timer);
    }, 120);

    return () => window.clearInterval(timer);
  }, [pathname, hash]);

  return null;
};

const REVEAL_SELECTOR = [
  '.card',
  '.cta-band',
  '.feature',
  '.spec',
  '.booking',
  '.gallery-main',
  '.section__head',
  '.vehicle-detail',
  '.accordion',
  '.image-text',
  '.stat-grid',
  '.media-grid',
].join(', ');

/** Adds a short rise-in animation as public-site blocks enter the viewport. */
export const MotionReveal = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let observer;
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const nodes = [...document.querySelectorAll(REVEAL_SELECTOR)].filter(
        (node) => !node.closest('.admin-shell, .admin-app, [data-no-reveal]'),
      );
      nodes.forEach((node) => node.classList.add('js-reveal'));

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
      );

      nodes.forEach((node) => observer.observe(node));
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
};

/* ------------------------------ Back to top ------------------------------ */

export const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`back-to-top ${visible ? 'is-visible' : ''}`.trim()}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
    >
      <Icon name="arrowRight" size={20} />
    </button>
  );
};

/* --------------------------- Sticky mobile CTAs -------------------------- */

const SERVICE_PATH_RE = /^\/(airport-transfer|city-to-city-transfer|hourly-chauffeur|airport-transfers\/.+|chauffeur-service\/.+|city-to-city\/.+)$/;

export const MobileCtaBar = () => {
  const { settings } = useSite();
  const { pathname } = useLocation();
  const phone = settings.contact?.phone;
  const isServicePage = pathname === '/' || SERVICE_PATH_RE.test(pathname);

  return (
    <div className="mobile-cta-bar">
      {phone ? (
        <a href={`tel:${phone.replace(/\s/g, '')}`}>
          <Icon name="phone" size={16} />
          Call us
        </a>
      ) : (
        <Link to="/contact">
          <Icon name="mail" size={16} />
          Contact
        </Link>
      )}
      {isServicePage ? (
        <Link to="/#enquiry">
          <Icon name="calendar" size={16} />
          Get a quote
        </Link>
      ) : (
        <Link to="/contact">
          <Icon name="mail" size={16} />
          Contact us
        </Link>
      )}
    </div>
  );
};

/* ----------------------------- Cookie consent ---------------------------- */

export const readConsent = () => {
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const CookieConsent = () => {
  const { settings } = useSite();
  const [choice, setChoice] = useState(() => readConsent());
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const open = () => setForced(true);
    window.addEventListener('open-cookie-preferences', open);
    return () => window.removeEventListener('open-cookie-preferences', open);
  }, []);

  const decide = useCallback((analytics) => {
    const value = { analytics, decidedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
    } catch {
      /* Private browsing — the choice simply will not persist. */
    }
    setChoice(value);
    setForced(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: value }));
  }, []);

  if (choice && !forced) return null;
  if (settings.cookieBanner?.enabled === false) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie preferences">
      <p className="cookie-banner__text">
        {settings.cookieBanner?.message ||
          'We use essential cookies to run this website and optional analytics cookies to understand how it is used. You can change your choice at any time.'}
      </p>
      <div className="cookie-banner__actions">
        <Button variant="primary" size="sm" onClick={() => decide(true)}>
          Accept all
        </Button>
        <Button variant="outline" size="sm" onClick={() => decide(false)}>
          Essential only
        </Button>
        <Button variant="ghost" size="sm" to="/cookie-policy">
          Cookie policy
        </Button>
      </div>
    </div>
  );
};

/* -------------------------------- Analytics ------------------------------ */

const injectScript = (id, src, inline) => {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  if (src) script.src = src;
  if (inline) script.innerHTML = inline;
  document.head.appendChild(script);
};

/**
 * Loads GA4 / GTM only after the visitor has accepted analytics cookies, using
 * the measurement IDs held in CMS site settings. No tracking ID is hard-coded.
 */
export const Analytics = () => {
  const { settings } = useSite();
  const location = useLocation();
  const [granted, setGranted] = useState(() => readConsent()?.analytics === true);

  useEffect(() => {
    const onChange = (event) => setGranted(event.detail?.analytics === true);
    window.addEventListener('cookie-consent-changed', onChange);
    return () => window.removeEventListener('cookie-consent-changed', onChange);
  }, []);

  const ga4 = settings.analytics?.ga4MeasurementId;
  const gtm = settings.analytics?.gtmContainerId;

  useEffect(() => {
    if (!granted) return;

    if (ga4) {
      injectScript('ga4-src', `https://www.googletagmanager.com/gtag/js?id=${ga4}`);
      injectScript(
        'ga4-init',
        null,
        `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4}',{send_page_view:false});`,
      );
    }

    if (gtm) {
      injectScript(
        'gtm-init',
        null,
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`,
      );
    }
  }, [ga4, granted, gtm]);

  // Single-page navigations need an explicit page_view event.
  useEffect(() => {
    if (!granted || !ga4 || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [ga4, granted, location.pathname, location.search]);

  return null;
};

export default { AnnouncementBar, ScrollToTop, BackToTop, MobileCtaBar, CookieConsent, Analytics };
