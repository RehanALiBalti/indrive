import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import Seo from '../components/seo/Seo.jsx';
import Button from '../components/ui/Button.jsx';
import SectionRenderer from '../components/sections/SectionRenderer.jsx';

/**
 * 404 page. The heading and helper links are CMS-managed via the system page
 * with slug "404", with a hard-coded fallback so this page can never itself
 * fail — including when the API is unreachable.
 */
const NotFoundPage = () => {
  const page = useApi('/pages/404');
  const cms = page.data;

  return (
    <>
      <Seo
        title={cms?.seo?.title || 'Page not found'}
        description={cms?.seo?.description || 'The page you were looking for could not be found.'}
        noindex
      />

      <div className="container notfound">
        <p className="notfound__code" aria-hidden="true">
          404
        </p>
        <h1 className="notfound__title">{cms?.h1 || 'We could not find that page'}</h1>
        <p className="notfound__text">
          {cms?.subtitle ||
            'The link may be out of date, or the page may have moved. Try one of the links below, or contact our team and we will point you in the right direction.'}
        </p>
        <div className="notfound__actions">
          <Button to="/" variant="primary" size="lg">
            Back to the homepage
          </Button>
          <Button to="/contact" variant="outline" size="lg">
            Contact us
          </Button>
        </div>
        <p style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
          Popular pages: <Link to="/airport-transfer">Airport transfers</Link> ·{' '}
          <Link to="/fleet">Our fleet</Link> · <Link to="/blog">Travel guides</Link> ·{' '}
          <Link to="/faq">FAQ</Link>
        </p>
      </div>

      <SectionRenderer sections={cms?.sections || []} />
    </>
  );
};

export default NotFoundPage;
