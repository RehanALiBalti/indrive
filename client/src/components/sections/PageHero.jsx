import Image from '../ui/Image.jsx';
import Button from '../ui/Button.jsx';
import { Breadcrumbs } from '../ui/Misc.jsx';

/**
 * Compact hero used at the top of inner pages. Carries the single <h1> for the
 * page plus the breadcrumb trail, keeping heading order consistent everywhere.
 */
const PageHero = ({ eyebrow, title, lead, image, breadcrumbs = [], actions = [], children }) => (
  <section className="page-hero">
    {image?.url ? (
      <div className="page-hero__bg">
        <Image src={image.url} alt={image.alt || ''} priority />
      </div>
    ) : null}
    <div className="container">
      <div className="page-hero__inner">
        <Breadcrumbs items={breadcrumbs} dark />
        {eyebrow ? <span className="hero__eyebrow">{eyebrow}</span> : null}
        <h1 className="page-hero__title">{title}</h1>
        {lead ? <p className="page-hero__lead">{lead}</p> : null}

        {actions.length ? (
          <div className="page-hero__actions">
            {actions.map((action) => (
              <Button
                key={action.label}
                to={action.to}
                href={action.href}
                variant={action.variant || 'accent'}
                size="lg"
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </div>
  </section>
);

export default PageHero;
