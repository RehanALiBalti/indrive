import { useLocation } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useSite } from '../context/SiteContext.jsx';
import Seo, { breadcrumbSchema, faqSchema, serviceSchema } from '../components/seo/Seo.jsx';
import SectionRenderer from '../components/sections/SectionRenderer.jsx';
import BookingWidget from '../components/forms/BookingWidget.jsx';
import RichText from '../components/ui/RichText.jsx';
import Icon, { hasIcon } from '../components/ui/Icon.jsx';
import Image from '../components/ui/Image.jsx';
import Accordion from '../components/ui/Accordion.jsx';
import Button from '../components/ui/Button.jsx';
import { Breadcrumbs, Badge } from '../components/ui/Misc.jsx';
import { AsyncContent, SkeletonGrid } from '../components/ui/States.jsx';
import { VehicleCard } from '../components/cards/Cards.jsx';
import { buildBreadcrumbs } from '../lib/breadcrumbs.js';
import { env } from '../config/env.js';

const FORM_TAB = { airport: 'airport', 'city-to-city': 'city-to-city', hourly: 'hourly' };

/**
 * Landing page for one of the three Phase 1 services. Everything on the page —
 * copy, features, benefits, extra sections and SEO — comes from the CMS record.
 */
const ServiceView = ({ service }) => {
  const location = useLocation();
  const { settings } = useSite();
  const vehicles = useApi('/vehicles', { params: { limit: 4 } });
  const faqs = useApi('/faqs', { params: { category: service.slug, limit: 8 } });

  const base = (settings.seo?.siteUrl || env.siteUrl || '').replace(/\/+$/, '');
  const crumbs = buildBreadcrumbs(location.pathname, service.seo?.breadcrumbLabel || service.name);
  const tab = FORM_TAB[service.formType] || 'airport';

  const faqItems = (faqs.data || []).map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
  }));

  return (
    <>
      <Seo
        title={service.seo?.title || service.name}
        description={service.seo?.description || service.shortDescription}
        canonical={service.seo?.canonical || undefined}
        image={service.seo?.ogImage?.url || service.heroImage?.url || service.image?.url}
        imageAlt={service.seo?.ogImage?.alt || service.name}
        noindex={service.seo?.noindex}
        keywords={service.seo?.keywords}
        jsonLd={[
          breadcrumbSchema(base, crumbs),
          serviceSchema({
            name: service.name,
            description: service.shortDescription,
            brandName: settings.brandName,
            url: `${base}${location.pathname}`,
          }),
          faqSchema(faqItems),
        ]}
      />

      {/* Hero with the enquiry form: the primary conversion point of the page. */}
      <section className="hero">
        {service.heroImage?.url ? (
          <div className="hero__bg">
            <Image src={service.heroImage.url} alt={service.heroImage.alt || ''} priority />
          </div>
        ) : null}
        <div className="container">
          <div className="hero__inner">
            <div className="hero__content">
              <Breadcrumbs items={crumbs} dark />
              {hasIcon(service.icon) ? (
                <span className="hero__eyebrow">
                  <Icon name={service.icon} size={16} />
                  {service.startingPriceLabel || service.name}
                </span>
              ) : null}
              <h1 className="hero__title">{service.name}</h1>
              {service.shortDescription ? <p className="hero__subtitle">{service.shortDescription}</p> : null}

              {service.features?.length ? (
                <ul className="hero__trust">
                  {service.features.slice(0, 4).map((feature) => (
                    <li className="hero__trust-item" key={feature}>
                      <Icon name="check" size={18} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="hero__aside">
              <BookingWidget
                defaultTab={tab}
                lockTab={service.formType !== 'none'}
                title={service.cta?.label || `Get a ${service.name.toLowerCase()} quote`}
              />
            </div>
          </div>
        </div>
      </section>

      {service.benefits?.length ? (
        <section className="section">
          <div className="container">
            <header className="section__head section__head--center">
              <span className="section__eyebrow">Why book with us</span>
              <h2 className="section__title">What you get with every {service.name.toLowerCase()}</h2>
            </header>
            <div className="grid grid--3">
              {service.benefits.map((benefit) => (
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

      {service.description ? (
        <section className="section section--muted">
          <div className="container">
            <div className="with-aside">
              <RichText html={service.description} />
              <aside className="with-aside__aside">
                <div className="card">
                  <div className="card__body stack">
                    <h2 className="card__title">Included as standard</h2>
                    <ul className="tick-list">
                      {(service.features || []).map((feature) => (
                        <li key={feature}>
                          <Icon name="check" size={17} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {service.startingPriceLabel ? <Badge variant="accent">{service.startingPriceLabel}</Badge> : null}
                    <Button to="#enquiry" variant="primary" block>
                      {service.cta?.label || 'Get a quote'}
                    </Button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <header className="section__head section__head--center">
            <span className="section__eyebrow">The fleet</span>
            <h2 className="section__title">Vehicles available for this service</h2>
          </header>
          <AsyncContent
            state={vehicles}
            skeleton={<SkeletonGrid count={4} columns={4} />}
            emptyTitle="Fleet being updated"
            emptyText="Contact us and we will confirm the right vehicle for your journey."
          >
            {(items) => (
              <div className="grid grid--4">
                {items.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}
          </AsyncContent>
          <div className="section__actions">
            <Button to="/fleet" variant="outline" iconRight="arrowRight">
              Compare the full fleet
            </Button>
          </div>
        </div>
      </section>

      {faqItems.length ? (
        <section className="section section--muted">
          <div className="container">
            <header className="section__head section__head--center">
              <span className="section__eyebrow">Questions</span>
              <h2 className="section__title">{service.name} FAQs</h2>
            </header>
            <Accordion items={faqItems} />
          </div>
        </section>
      ) : null}

      <SectionRenderer
        sections={service.sections || []}
        context={{ defaultServiceTab: tab, prefill: {} }}
      />

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2 className="cta-band__title">Ready to book your {service.name.toLowerCase()}?</h2>
              <p className="cta-band__text">
                Send us the journey details and we will confirm availability and a fixed, all-inclusive price.
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

export default ServiceView;
