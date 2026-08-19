import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useSite } from '../context/SiteContext.jsx';
import Seo, { breadcrumbSchema } from '../components/seo/Seo.jsx';
import BookingWidget from '../components/forms/BookingWidget.jsx';
import RichText from '../components/ui/RichText.jsx';
import Image from '../components/ui/Image.jsx';
import Icon from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import { Breadcrumbs, Badge } from '../components/ui/Misc.jsx';
import { RouteLoading, ErrorState } from '../components/ui/States.jsx';
import { VehicleCard, vehicleCtaLabel, vehicleQuoteHref } from '../components/cards/Cards.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { buildBreadcrumbs } from '../lib/breadcrumbs.js';
import { env } from '../config/env.js';

const Gallery = ({ images, name }) => {
  const [active, setActive] = useState(0);
  const list = images?.length ? images : [{ url: '', alt: name }];

  return (
    <div className="gallery-main">
      <Image
        src={list[active]?.url}
        alt={list[active]?.alt || name}
        priority
        ratio="16/10"
        placeholderLabel="Vehicle photography coming soon"
      />
      {list.length > 1 ? (
        <div className="gallery-thumbs" role="tablist" aria-label={`${name} photographs`}>
          {list.map((image, index) => (
            <button
              key={image.url || index}
              type="button"
              role="tab"
              aria-current={index === active}
              aria-label={`Show photograph ${index + 1}`}
              onClick={() => setActive(index)}
            >
              <Image src={image.url} alt={image.alt || `${name} photograph ${index + 1}`} ratio="4/3" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const VehiclePage = () => {
  const { slug } = useParams();
  const { settings } = useSite();
  const state = useApi(`/vehicles/${slug}`);
  const others = useApi('/vehicles', { params: { limit: 12 } });

  if (state.error) {
    if (state.error.isNotFound) return <NotFoundPage />;
    return (
      <div className="container section">
        <ErrorState error={state.error} onRetry={state.refetch} />
      </div>
    );
  }

  const vehicle = state.data;
  if (!vehicle) {
    return state.loading ? <RouteLoading /> : <NotFoundPage />;
  }

  const base = (settings.seo?.siteUrl || env.siteUrl || '').replace(/\/+$/, '');
  const crumbs = buildBreadcrumbs(`/fleet/${vehicle.slug}`, vehicle.seo?.breadcrumbLabel || vehicle.name);
  const related = (others.data || []).filter((item) => item.id !== vehicle.id).slice(0, 3);
  const phone = settings.contact?.phone;
  const ctaLabel = vehicleCtaLabel(vehicle) || 'Request this vehicle';
  const ctaHref = vehicleQuoteHref(vehicle, { onDetailPage: true });

  const specs = [
    {
      label: 'Passengers',
      value: vehicle.passengers != null && vehicle.passengers !== '' ? `Up to ${vehicle.passengers}` : null,
      icon: 'users',
    },
    {
      label: 'Luggage',
      value: vehicle.luggage != null && vehicle.luggage !== '' ? `${vehicle.luggage} large bags` : null,
      icon: 'luggage',
    },
    {
      label: 'Hand luggage',
      value: vehicle.handLuggage != null && vehicle.handLuggage !== '' ? `${vehicle.handLuggage} cabin bags` : null,
      icon: 'briefcase',
    },
    { label: 'Class', value: vehicle.category, icon: 'badge' },
  ].filter((spec) => spec.value);

  return (
    <>
      <Seo
        title={vehicle.seo?.title || `${vehicle.name} — Chauffeur Hire`}
        description={vehicle.seo?.description || vehicle.shortDescription}
        canonical={vehicle.seo?.canonical || undefined}
        image={vehicle.seo?.ogImage?.url || vehicle.images?.[0]?.url}
        imageAlt={vehicle.images?.[0]?.alt || vehicle.name}
        noindex={vehicle.seo?.noindex}
        keywords={vehicle.seo?.keywords}
        type="product"
        jsonLd={[
          breadcrumbSchema(base, crumbs),
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: vehicle.name,
            category: vehicle.category,
            description: vehicle.shortDescription || '',
            image: (vehicle.images || []).map((image) => image.url).filter(Boolean),
            brand: { '@type': 'Brand', name: settings.brandName },
          },
        ]}
      />

      <section className="section section--tight">
        <div className="container">
          <Breadcrumbs items={crumbs} />
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="with-aside">
            <div>
              <div className="vehicle-detail">
                {vehicle.category ? <span className="section__eyebrow">{vehicle.category}</span> : null}
                <h1 className="section__title">{vehicle.name}</h1>
                {vehicle.tagline ? <p className="section__subtitle">{vehicle.tagline}</p> : null}

                {vehicle.startingPriceLabel ? (
                  <p style={{ marginTop: 'var(--space-4)' }}>
                    <Badge variant="accent">{vehicle.startingPriceLabel}</Badge>
                  </p>
                ) : null}

                {vehicle.exampleModels?.length ? (
                  <p className="card__text" style={{ marginTop: 'var(--space-4)' }}>
                    Typical models: {vehicle.exampleModels.join(', ')} or similar.
                  </p>
                ) : null}

                {specs.length ? (
                  <div className="spec-list">
                    {specs.map((spec) => (
                      <div className="spec" key={spec.label}>
                        <div className="spec__label">{spec.label}</div>
                        <div className="spec__value">
                          <Icon name={spec.icon} size={18} />
                          {spec.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="vehicle-actions">
                  <Button to={ctaHref} variant={vehicle.cta?.variant || 'primary'} size="lg">
                    {ctaLabel}
                  </Button>
                  {phone ? (
                    <Button href={`tel:${phone.replace(/\s/g, '')}`} variant="outline" size="lg" icon="phone">
                      Call {phone}
                    </Button>
                  ) : null}
                </div>

                <div style={{ marginTop: 'var(--space-8)' }}>
                  <Gallery images={vehicle.images} name={vehicle.name} />
                </div>

                {vehicle.features?.length ? (
                  <div className="vehicle-features">
                    <h2 className="feature__title">Key features</h2>
                    <ul className="tick-list tick-list--2" style={{ marginTop: 'var(--space-4)' }}>
                      {vehicle.features.map((feature) => (
                        <li key={feature}>
                          <Icon name="check" size={17} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {vehicle.description ? (
                  <div style={{ marginTop: 'var(--space-8)' }}>
                    <h2 className="feature__title">About this vehicle</h2>
                    <RichText html={vehicle.description} />
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="with-aside__aside">
              <BookingWidget
                title={`Enquire about the ${vehicle.name}`}
                subtitle="Tell us about your journey and we will confirm this vehicle and a fixed price."
                prefill={{
                  vehicleSlug: vehicle.slug,
                  passengers: vehicle.passengers,
                  luggage: vehicle.luggage,
                }}
              />
            </aside>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2 className="cta-band__title">Ready to travel in the {vehicle.name}?</h2>
              <p className="cta-band__text">
                Send the journey details and we will confirm availability and a fixed, all-inclusive price
                {vehicle.startingPriceLabel ? ` — ${vehicle.startingPriceLabel.toLowerCase()}` : ''}.
              </p>
            </div>
            <div className="cta-band__actions">
              <Button to={ctaHref} variant="accent" size="lg">
                {ctaLabel}
              </Button>
              <Button to="/contact" variant="outline" size="lg">
                Talk to our team
              </Button>
            </div>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="section section--muted">
          <div className="container">
            <header className="section__head section__head--center">
              <h2 className="section__title">Other vehicles in our fleet</h2>
            </header>
            <div className="grid grid--3">
              {related.map((item) => (
                <VehicleCard key={item.id} vehicle={item} />
              ))}
            </div>
            <div className="section__actions section__head--center">
              <Button to="/fleet" variant="outline" iconRight="arrowRight">
                Back to the fleet
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
};

export default VehiclePage;
