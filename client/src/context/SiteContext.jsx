import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const SiteContext = createContext(null);

/**
 * Minimal branding used only while the real settings are loading, or if the API
 * is unreachable. Everything here is overwritten by CMS values on first paint.
 */
const FALLBACK = {
  brandName: 'Chauffeur Service',
  legalName: '',
  tagline: '',
  logo: { url: '', alt: '' },
  contact: {},
  social: {},
  seo: {},
  analytics: {},
  features: { blogEnabled: true, newsletterEnabled: true, testimonialsEnabled: true, bookingWidgetEnabled: true },
  booking: { currencySymbol: '£', maxPassengers: 8, maxLuggage: 10, hourlyMinHours: 3, hourlyMaxHours: 12 },
  footer: {},
  announcement: { enabled: false },
};

export const SiteProvider = ({ children }) => {
  const [settings, setSettings] = useState(FALLBACK);
  const [navigation, setNavigation] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [siteSettings, menus] = await Promise.all([
          api.get('/site-settings'),
          api.get('/navigation'),
        ]);
        if (cancelled) return;
        setSettings({ ...FALLBACK, ...siteSettings });
        setNavigation(menus || {});
        setError(null);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      settings,
      navigation,
      loading,
      error,
      menu: (key) => navigation?.[key]?.items || [],
      feature: (key) => settings.features?.[key] !== false,
    }),
    [error, loading, navigation, settings],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) throw new Error('useSite must be used inside <SiteProvider>.');
  return context;
};

export default SiteContext;
