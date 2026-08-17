import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useSite } from '../context/SiteContext.jsx';
import Seo, { breadcrumbSchema, faqSchema, serviceSchema } from '../components/seo/Seo.jsx';
import SectionRenderer from '../components/sections/SectionRenderer.jsx';
import BookingWidget from '../components/forms/BookingWidget.jsx';
import RichText from '../components/ui/RichText.jsx';
import Image from '../components/ui/Image.jsx';
import Icon, { hasIcon } from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import Accordion from '../components/ui/Accordion.jsx';
import { Breadcrumbs, Badge } from '../components/ui/Misc.jsx';
import { RouteLoading, ErrorState, AsyncContent, SkeletonGrid } from '../components/ui/States.jsx';
import { VehicleCard, ServiceCard, TestimonialCard } from '../components/cards/Cards.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { buildBreadcrumbs } from '../lib/breadcrumbs.js';
import { env } from '../config/env.js';

const PREFIX = {
  airport: '/airport-transfers',
  city: '/chauffeur-service',
  'city-to-city': '/city-to-city',
};

const LinkBlock = ({ heading, links }) => {
  if (!links?.length) return null;
  return (
    <div>
      <h3 className="feature__title" style={{ marginBottom: 'var(--space-4)' }}>
        {heading}
      </h3>
      <div className="link-grid">
        {links.map((link) => (
          <Link key={link.href || link.label} to={link.href || '#'}>
            <span>
              {link.label}
              {link.description ? <small style={{ display: 'block', fontWeight: 400 }}>{link.description}</small> : null}
            </span>
            <Icon name="arrowRight" size={16} />
          </Link>
        ))}
      </div>
    </div>
  );
};

/**
 * One React component renders every airport, city and route landing page.
 *
 * The SEO team creates or duplicates a page in the admin area — choosing which
 * sections appear, writing the copy and adding internal links — and it goes
 * live at its URL immediately. No new React code is written per location.
 */
const SeoLandingPage = ({ type }) => {
  const { slug } = useParams();
  const { settings, feature } = useSite();

  const state = useApi(`/seo-pages/${type}/${slug}`);
  const vehicles = useApi('/vehicles', { params: { limit: 4 } });
  const services = useApi('/services', { params: { limit: 3 } });
  const testimonials = useApi('/testimonials', { params: { limit: 3 } });

  if (state.loading) return <RouteLoading />;
  if (state.error) {
    if (state.error.isNotFound) return <NotFoundPage />;
    return (
      <div className="container section">
        <ErrorState error={state.error} onRetry={state.refetch} />
      </div>
    );
  }

  const page = state.data;
  if (!page) return <NotFoundPage />;

  const base = (settings.seo?.siteUrl || env.siteUrl || '').replace(/\/+$/, '');
  const path = page.path || `${PREFIX[type]}/${page.slug}`;
  const crumbs = buildBreadcrumbs(path, page.seo?.breadcrumbLabel || page.h1);
  const location = page.location || {};
  const journey = page.journey || {};

  const areaServed =
    location.cityName ||
    location.airportName ||
    [location.originCity, location.destinationCity].filter(Boolean).join(' to ') ||
    undefined;

  const journeyFacts = [
    journey.distance ? { label: 'Distance', value: journey.distance } : null,
    journey.duration ? { label: 'Typical journey time', value: journey.duration } : null,
    journey.averagePriceLabel ? { label: 'From', value: journey.averagePriceLabel } : null,
    journey.waitingTime ? { label: 'Waiting time', value: journey.waitingTime } : null,
  ].filter(Boolean);

  return (
    <>
      <Seo
        title={page.seo?.title || page.title}
        description={page.seo?.description}
        canonical={page.seo?.canonical || `${base}${path}`}
        image={page.seo?.ogImage?.url || page.heroImage?.url}
        imageAlt={page.heroImage?.alt || page.h1}
        noindex={page.seo?.noindex}
        nofollow={page.seo?.nofollow}
        keywords={page.seo?.keywords}
        jsonLd={[
          breadcrumbSchema(base, crumbs),
          serviceSchema({
            name: page.h1,
            description: page.seo?.description || page.intro,
            areaServed,
            brandName: settings.brandName,
            url: `${base}${path}`,
          }),
          faqSchema(page.faqs),
        ]}
      />

      {/* Hero + enquiry form */}
      <section className="hero">
        {page.heroImage?.url ? (
          <div className="hero__bg">
            <Image src={page.heroImage.url} alt={page.heroImage.alt || ''} priority />
          </div>
        ) : null}
        <div className="container">
          <div className="hero__inner">
            <div className="hero__content">
              <Breadcrumbs items={crumbs} dark />
              <h1 className="hero__title">{page.h1}</h1>
              {page.intro ? <p className="hero__subtitle">{page.intro}</p> : null}

              {location.terminals?.length ? (
                <div className="terminal-list">
                  {location.terminals.map((terminal) => (
                    <Badge key={terminal}>{terminal}</Badge>
                  ))}
                </div>
              ) : null}

              {page.cta?.href && !page.showBookingWidget ? (
                <div className="hero__actions">
                  <Button to={page.cta.href} variant="accent" size="lg">
                    {page.cta.label}
                  </Button>
                </div>
              ) : null}
            </div>

            {page.showBookingWidget !== false ? (
              <div className="hero__aside">
                <BookingWidget
                  defaultTab={page.bookingFormType || 'airport'}
                  lockTab
                  seoPageSlug={page.slug}
                  prefill={{
                    airport: location.airportName || '',
                    pickup: location.originCity || location.cityName || '',
                    destination: location.destinationCity || '',
                  }}
                  title={page.cta?.label || `Get a fixed price for ${page.h1}`}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {journeyFacts.length ? (
        <section className="section section--tight">
          <div className="container">
            <div className="journey-facts">
              {journeyFacts.map((fact) => (
                <div className="journey-fact" key={fact.label}>
                  <div className="journey-fact__label">{fact.label}</div>
                  <div className="journey-fact__value">{fact.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {page.benefits?.length ? (
        <section className="section">
          <div className="container">
            <header className="section__head section__head--center">
              <span className="section__eyebrow">Why book with us</span>
              <h2 className="section__title">What is included</h2>
            </header>
            <div className="grid grid--3">
              {page.benefits.map((benefit) => (
                <div className="feature" key={benefit.title}>
                  {hasIcon(benefit.icon) ? (
                    <span className="icon-circle">
                      <Icon name={benefit.icon} size={22} />
                    </span>
                  ) : null}
                  <h3 className="feature__title">{benefit.title}</h3>
                  <p className="feature__text">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {journey.notes || journey.meetAndGreet ? (
        <section className="section section--muted">
          <div className="container">
            <header className="section__head">
              <h2 className="section__title">About this journey</h2>
            </header>
            {journey.meetAndGreet ? <p className="section__subtitle">{journey.meetAndGreet}</p> : null}
            {journey.notes ? <RichText html={journey.notes} /> : null}
          </div>
        </section>
      ) : null}

      {/* Editor-controlled sections sit between the fixed template blocks. */}
      <SectionRenderer
        sections={page.sections || []}
        context={{
          defaultServiceTab: page.bookingFormType || 'airport',
          seoPageSlug: page.slug,
          prefill: {
            airport: location.airportName || '',
            pickup: location.originCity || location.cityName || '',
            destination: location.destinationCity || '',
          },
        }}
      />

      {page.showServicesSection !== false ? (
        <section className="section">
          <div className="container">
            <header className="section__head section__head--center">
              <span className="section__eyebrow">Our services</span>
              <h2 className="section__title">However you need to travel</h2>
            </header>
            <AsyncContent state={services} skeleton={<SkeletonGrid count={3} />} allowEmpty>
              {(items) => (
                <div className="grid grid--3">
                  {items.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </AsyncContent>
          </div>
        </section>
      ) : null}

      {page.showFleetSection !== false ? (
        <section className="section section--muted">
          <div className="container">
            <header className="section__head section__head--center">
              <span className="section__eyebrow">The fleet</span>
              <h2 className="section__title">Choose your vehicle</h2>
            </header>
            <AsyncContent state={vehicles} skeleton={<SkeletonGrid count={4} columns={4} />} allowEmpty>
              {(items) => (
                <div className="grid grid--4">
                  {items.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} showCta={false} />
                  ))}
                </div>
              )}
            </AsyncContent>
            <div className="section__actions section__head--center">
              <Button to="/fleet" variant="outline" iconRight="arrowRight">
                View the full fleet
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {page.showTestimonialsSection !== false && feature('testimonialsEnabled') ? (
        <section className="section">
          <div className="container">
            <header className="section__head section__head--center">
              <h2 className="section__title">What our passengers say</h2>
            </header>
            <AsyncContent state={testimonials} skeleton={<SkeletonGrid count={3} />} allowEmpty>
              {(items) => (
                <div className="grid grid--3">
                  {items.map((testimonial) => (
                    <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                  ))}
                </div>
              )}
            </AsyncContent>
          </div>
        </section>
      ) : null}

      {page.showFaqSection !== false && page.faqs?.length ? (
        <section className="section section--muted">
          <div className="container">
            <header className="section__head section__head--center">
              <h2 className="section__title">Frequently asked questions</h2>
            </header>
            <Accordion items={page.faqs} />
          </div>
        </section>
      ) : null}

      {page.relatedAirports?.length ||
      page.relatedCities?.length ||
      page.relatedRoutes?.length ||
      page.internalLinks?.length ? (
        <section className="section">
          <div className="container stack">
            <header className="section__head">
              <h2 className="section__title">Related destinations</h2>
            </header>
            <LinkBlock heading="Airports" links={page.relatedAirports} />
            <LinkBlock heading="Cities" links={page.relatedCities} />
            <LinkBlock heading="Popular routes" links={page.relatedRoutes} />
            <LinkBlock heading="You may also need" links={page.internalLinks} />
          </div>
        </section>
      ) : null}

      <section className="section section--tight">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2 className="cta-band__title">{page.cta?.label || `Book ${page.h1}`}</h2>
              <p className="cta-band__text">
                Fixed price agreed before you travel. Professional chauffeur, executive vehicle, 24/7 support.
              </p>
            </div>
            <div className="cta-band__actions">
              <Button to="#enquiry" variant="accent" size="lg">
                Get a quote
              </Button>
              <Button to="/contact" variant="outline" size="lg">
                Talk to our team
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SeoLandingPage;
