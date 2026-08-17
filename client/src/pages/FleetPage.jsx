import { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { useSite } from '../context/SiteContext.jsx';
import Seo, { breadcrumbSchema } from '../components/seo/Seo.jsx';
import PageHero from '../components/sections/PageHero.jsx';
import SectionRenderer from '../components/sections/SectionRenderer.jsx';
import { VehicleCard } from '../components/cards/Cards.jsx';
import { AsyncContent, SkeletonGrid } from '../components/ui/States.jsx';
import { Input, Select } from '../components/ui/Field.jsx';
import { buildBreadcrumbs } from '../lib/breadcrumbs.js';
import { env } from '../config/env.js';

const PASSENGER_OPTIONS = [
  { value: '', label: 'Any number of passengers' },
  { value: '2', label: '2 or more' },
  { value: '4', label: '4 or more' },
  { value: '6', label: '6 or more' },
  { value: '8', label: '8 or more' },
  { value: '16', label: '16 or more' },
];

const FleetPage = () => {
  const { settings } = useSite();
  const page = useApi('/pages/fleet');
  const vehicles = useApi('/vehicles', { params: { limit: 48 } });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPassengers, setMinPassengers] = useState('');

  const all = vehicles.data || [];

  const categories = useMemo(
    () => [
      { value: '', label: 'All vehicle classes' },
      ...Array.from(new Set(all.map((vehicle) => vehicle.category).filter(Boolean))).map((value) => ({
        value,
        label: value,
      })),
    ],
    [all],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((vehicle) => {
      if (category && vehicle.category !== category) return false;
      if (minPassengers && Number(vehicle.passengers) < Number(minPassengers)) return false;
      if (!term) return true;
      return [vehicle.name, vehicle.category, vehicle.tagline, ...(vehicle.exampleModels || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [all, category, minPassengers, search]);

  const cms = page.data;
  const base = (settings.seo?.siteUrl || env.siteUrl || '').replace(/\/+$/, '');
  const crumbs = buildBreadcrumbs('/fleet', cms?.seo?.breadcrumbLabel || 'Fleet');

  return (
    <>
      <Seo
        title={cms?.seo?.title || cms?.title || 'Our Fleet'}
        description={cms?.seo?.description}
        image={cms?.seo?.ogImage?.url || cms?.heroImage?.url}
        keywords={cms?.seo?.keywords}
        jsonLd={[
          breadcrumbSchema(base, crumbs),
          all.length
            ? {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                itemListElement: all.slice(0, 20).map((vehicle, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: vehicle.name,
                  url: `${base}/fleet/${vehicle.slug}`,
                })),
              }
            : null,
        ]}
      />

      <PageHero
        eyebrow="Our vehicles"
        title={cms?.h1 || 'Our fleet'}
        lead={cms?.subtitle}
        image={cms?.heroImage}
        breadcrumbs={crumbs}
      />

      <section className="section">
        <div className="container">
          <div className="field-row" role="search" aria-label="Filter the fleet">
            <Input
              label="Search vehicles"
              placeholder="Search by name, class or model"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              name="fleet-search"
            />
            <Select
              label="Vehicle class"
              options={categories}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              name="fleet-category"
            />
            <Select
              label="Passengers"
              options={PASSENGER_OPTIONS}
              value={minPassengers}
              onChange={(event) => setMinPassengers(event.target.value)}
              name="fleet-passengers"
            />
          </div>

          <AsyncContent
            state={vehicles}
            skeleton={<SkeletonGrid count={6} />}
            emptyTitle="No vehicles published yet"
            emptyText="Our fleet is being updated. Please contact us and we will confirm what is available."
            emptyAction={{ label: 'Contact us', to: '/contact' }}
          >
            {() =>
              filtered.length ? (
                <>
                  <p className="pagination__info" aria-live="polite" style={{ marginBottom: 'var(--space-5)' }}>
                    Showing {filtered.length} of {all.length} vehicles
                  </p>
                  <div className="grid grid--3">
                    {filtered.map((vehicle) => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="state-block">
                  <span className="state-block__title">No vehicles match those filters</span>
                  <span className="state-block__text">
                    Try widening your search, or contact us and we will recommend the right vehicle.
                  </span>
                </div>
              )
            }
          </AsyncContent>
        </div>
      </section>

      <SectionRenderer sections={cms?.sections || []} />
    </>
  );
};

export default FleetPage;
