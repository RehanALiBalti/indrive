import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import Seo from '../components/seo/Seo.jsx';
import SectionRenderer from '../components/sections/SectionRenderer.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';

const COPY = {
  enquiry: {
    title: 'Thank you — we have your enquiry',
    lead: 'A member of our operations team will confirm availability and a fixed, all-inclusive price shortly. We normally reply within the hour, and always within four hours.',
  },
  contact: {
    title: 'Thank you — your message is with us',
    lead: 'A member of the team will get back to you, usually within a few hours during the working day, and always within one business day.',
  },
  corporate: {
    title: 'Thank you — we have your corporate enquiry',
    lead: 'A travel manager will review your requirements and be in touch to discuss rates, invoicing and account setup.',
  },
  support: {
    title: 'Thank you — your support request is logged',
    lead: 'Our support desk has your request. Urgent issues are picked up immediately; everything else is handled within a few hours.',
  },
  default: {
    title: 'Thank you — we have your request',
    lead: 'A member of our team will be in touch shortly.',
  },
};

/**
 * Confirmation page for every public form. The `type` and `ref` query params
 * come from the API response so the visitor sees a real reference number, not
 * a generic placeholder. Extra sections remain CMS-managed.
 */
const ThankYouPage = () => {
  const [params] = useSearchParams();
  const type = params.get('type') || '';
  const reference = params.get('ref') || '';
  const copy = COPY[type] || COPY.default;
  const cms = useApi('/pages/thank-you');

  return (
    <>
      <Seo
        title={cms.data?.seo?.title || 'Thank You'}
        description={cms.data?.seo?.description || copy.lead}
        noindex
      />

      <div className="container thankyou">
        <span className="thankyou__icon" aria-hidden="true">
          <Icon name="check" size={28} />
        </span>
        <h1 className="thankyou__title">{cms.data?.h1 && !type ? cms.data.h1 : copy.title}</h1>
        <p className="thankyou__text">{cms.data?.subtitle && !type ? cms.data.subtitle : copy.lead}</p>

        {reference ? (
          <p className="thankyou__ref">
            Your reference is <strong>{reference}</strong>
            <span>Please quote this if you need to follow up.</span>
          </p>
        ) : null}

        <div className="thankyou__actions">
          <Button to="/" variant="primary" size="lg">
            Back to the homepage
          </Button>
          <Button to="/fleet" variant="outline" size="lg">
            View the fleet
          </Button>
        </div>

        <p className="thankyou__links">
          Need something else? <Link to="/contact">Contact us</Link> · <Link to="/help">Support</Link> ·{' '}
          <Link to="/faq">FAQ</Link>
        </p>
      </div>

      <SectionRenderer sections={cms.data?.sections || []} />
    </>
  );
};

export default ThankYouPage;
