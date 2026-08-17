import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import { Alert, Tabs } from '../../components/ui/Misc.jsx';
import { Loading, ErrorState } from '../../components/ui/States.jsx';
import { FieldRenderer } from '../components/FormFields.jsx';
import { getPath, setPath, pruneUndefined } from '../utils/objectPath.js';

const GROUPS = [
  {
    value: 'brand',
    label: 'Brand',
    fields: [
      { name: 'brandName', label: 'Brand name' },
      { name: 'legalName', label: 'Registered company name' },
      { name: 'tagline', label: 'Tagline' },
      { name: 'logo', label: 'Logo (dark backgrounds excluded)', type: 'image', folder: 'general' },
      { name: 'logoLight', label: 'Logo for dark backgrounds', type: 'image', folder: 'general' },
      { name: 'favicon', label: 'Favicon', type: 'image', folder: 'general' },
      { name: 'company.registrationNumber', label: 'Company registration number' },
      { name: 'company.vatNumber', label: 'VAT number' },
      { name: 'company.licenceNumber', label: 'Operator licence number' },
      { name: 'company.foundedYear', label: 'Founded' },
    ],
  },
  {
    value: 'contact',
    label: 'Contact',
    fields: [
      { name: 'contact.phone', label: 'Phone number' },
      { name: 'contact.whatsapp', label: 'WhatsApp number' },
      { name: 'contact.email', label: 'General email' },
      { name: 'contact.bookingEmail', label: 'Bookings email', hint: 'Journey enquiries are sent here.' },
      { name: 'contact.supportEmail', label: 'Support email' },
      { name: 'contact.addressLine1', label: 'Address line 1' },
      { name: 'contact.addressLine2', label: 'Address line 2' },
      { name: 'contact.city', label: 'Town / city' },
      { name: 'contact.region', label: 'County / region' },
      { name: 'contact.postcode', label: 'Postcode' },
      { name: 'contact.country', label: 'Country' },
      { name: 'contact.openingHours', label: 'Opening hours', placeholder: '24 hours a day, 7 days a week' },
      { name: 'contact.mapEmbedUrl', label: 'Map embed URL' },
    ],
  },
  {
    value: 'social',
    label: 'Social',
    fields: [
      { name: 'social.facebook', label: 'Facebook' },
      { name: 'social.instagram', label: 'Instagram' },
      { name: 'social.linkedin', label: 'LinkedIn' },
      { name: 'social.x', label: 'X (Twitter)' },
      { name: 'social.youtube', label: 'YouTube' },
      { name: 'social.tiktok', label: 'TikTok' },
    ],
  },
  {
    value: 'seo',
    label: 'SEO',
    fields: [
      {
        name: 'seo.siteUrl',
        label: 'Canonical site URL',
        hint: 'Used for canonical tags, Open Graph URLs and the sitemap. Include https:// and no trailing slash.',
      },
      { name: 'seo.defaultTitle', label: 'Default page title' },
      {
        name: 'seo.titleTemplate',
        label: 'Title template',
        hint: 'Use %s for the page title and %brand% for the brand name.',
      },
      { name: 'seo.defaultDescription', label: 'Default meta description', type: 'textarea', rows: 3 },
      { name: 'seo.defaultKeywords', label: 'Default keywords', type: 'stringList' },
      { name: 'defaultOgImage', label: 'Default social share image', type: 'image', folder: 'seo' },
      {
        name: 'seo.robotsTxtExtra',
        label: 'Extra robots.txt rules',
        type: 'textarea',
        rows: 5,
        hint: 'Appended to the generated robots.txt.',
      },
      { name: 'seo.organisationSchemaEnabled', label: 'Output Organisation schema', type: 'boolean' },
      { name: 'seo.localBusinessSchemaEnabled', label: 'Output LocalBusiness schema', type: 'boolean' },
    ],
  },
  {
    value: 'analytics',
    label: 'Analytics',
    fields: [
      { name: 'analytics.ga4MeasurementId', label: 'Google Analytics 4 measurement ID', placeholder: 'G-XXXXXXX' },
      { name: 'analytics.gtmContainerId', label: 'Google Tag Manager container ID', placeholder: 'GTM-XXXXXX' },
      { name: 'analytics.googleSiteVerification', label: 'Google Search Console verification code' },
      { name: 'analytics.bingSiteVerification', label: 'Bing verification code' },
      { name: 'analytics.facebookPixelId', label: 'Facebook pixel ID' },
      { name: 'analytics.enabled', label: 'Enable tracking scripts', type: 'boolean' },
      {
        name: 'analytics.cookieConsentRequired',
        label: 'Only load tracking after cookie consent',
        type: 'boolean',
      },
    ],
  },
  {
    value: 'features',
    label: 'Features',
    fields: [
      { name: 'features.blogEnabled', label: 'Show the blog' },
      { name: 'features.newsletterEnabled', label: 'Show newsletter sign-up' },
      { name: 'features.testimonialsEnabled', label: 'Show testimonials' },
      { name: 'features.bookingWidgetEnabled', label: 'Show the booking widget' },
      {
        name: 'features.liveBookingEnabled',
        label: 'Live booking engine connected (Phase 2)',
        hint: 'Switches enquiry wording to instant booking once the booking engine is live.',
      },
      { name: 'features.maintenanceMode', label: 'Maintenance mode' },
      { name: 'features.maintenanceMessage', label: 'Maintenance message', type: 'textarea', rows: 2 },
    ].map((field) => (field.type ? field : { ...field, type: 'boolean' })),
  },
  {
    value: 'booking',
    label: 'Enquiries',
    fields: [
      { name: 'booking.currency', label: 'Currency code' },
      { name: 'booking.currencySymbol', label: 'Currency symbol' },
      { name: 'booking.minLeadTimeHours', label: 'Minimum lead time (hours)', type: 'number', min: 0, max: 168 },
      { name: 'booking.maxPassengers', label: 'Maximum passengers', type: 'number', min: 1, max: 50 },
      { name: 'booking.maxLuggage', label: 'Maximum suitcases', type: 'number', min: 0, max: 50 },
      { name: 'booking.hourlyMinHours', label: 'Minimum hourly booking', type: 'number', min: 1, max: 24 },
      { name: 'booking.hourlyMaxHours', label: 'Maximum hourly booking', type: 'number', min: 1, max: 24 },
      { name: 'booking.enquiryThankYouPath', label: 'Thank you page path', placeholder: '/thank-you' },
    ],
  },
  {
    value: 'footer',
    label: 'Footer & banner',
    fields: [
      { name: 'footer.about', label: 'About text', type: 'textarea', rows: 4 },
      { name: 'footer.copyright', label: 'Copyright line' },
      { name: 'footer.paymentNote', label: 'Payment note' },
      { name: 'announcement.enabled', label: 'Show announcement bar', type: 'boolean' },
      { name: 'announcement.message', label: 'Announcement message' },
      { name: 'announcement.link', label: 'Announcement link', type: 'cta' },
    ],
  },
];

const SettingsPage = () => {
  const toast = useToast();
  const state = useApi('/admin/site-settings', { auth: true });
  const [values, setValues] = useState(null);
  const [tab, setTab] = useState('brand');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state.data) {
      setValues(state.data);
      setDirty(false);
    }
  }, [state.data]);

  if (state.loading || !values) return <Loading label="Loading site settings…" />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.refetch} />;

  const set = (path, value) => {
    setValues((current) => setPath(current, path, value));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = pruneUndefined({ ...values });
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdBy;
      delete payload.updatedBy;
      await api.put('/admin/site-settings', payload, { auth: true });
      toast.success('Settings saved. The public site updates within a minute.');
      setDirty(false);
      state.refetch();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const group = GROUPS.find((entry) => entry.value === tab);

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>Site settings</h1>
          <p>Company details, tracking IDs, SEO defaults and feature switches for the whole website.</p>
        </div>
      </div>

      <Alert variant="info">
        Analytics and Tag Manager IDs are stored here rather than in code, so marketing can change them without a
        deployment.
      </Alert>

      <Tabs tabs={GROUPS.map(({ value, label }) => ({ value, label }))} active={tab} onChange={setTab} />

      <div className="panel">
        <div className="panel__body stack">
          {group.fields.map((field) => (
            <FieldRenderer
              key={field.name}
              field={field}
              value={getPath(values, field.name)}
              values={values}
              onChange={(next) => set(field.name, next)}
            />
          ))}
        </div>
      </div>

      <div className="form-sticky-bar">
        <span className="form-sticky-bar__status">{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        <Button onClick={save} loading={saving} icon="check">
          Save settings
        </Button>
      </div>
    </>
  );
};

export default SettingsPage;
