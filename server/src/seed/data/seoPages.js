/* eslint-disable max-len */
import { seoTemplatesSeed } from './seoTemplates.js';

const templateByType = Object.fromEntries(seoTemplatesSeed.map((item) => [item.type, item]));

const applyTokens = (value, tokens) => {
  if (typeof value === 'string') {
    return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) =>
      tokens[key] !== undefined && tokens[key] !== null ? String(tokens[key]) : match,
    );
  }
  if (Array.isArray(value)) return value.map((item) => applyTokens(item, tokens));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, applyTokens(nested, tokens)]));
  }
  return value;
};

/**
 * Builds a landing-page document from a template plus tokens — exactly the same
 * transformation the admin "generate from template" endpoint performs at runtime.
 */
const build = ({ type, slug, tokens, location, journey, bookingFormType, related = {}, sortOrder = 0 }) => {
  const template = templateByType[type];
  const defaults = applyTokens(template.defaults, tokens);

  return {
    id: `${type}-${slug}`,
    type,
    slug,
    title: defaults.title,
    h1: defaults.h1,
    intro: defaults.intro,
    heroImage: { url: '', alt: `${defaults.h1} chauffeur service`, path: '' },
    location,
    journey,
    sections: [],
    benefits: defaults.benefits,
    faqs: defaults.faqs,
    relatedRoutes: related.routes || [],
    relatedCities: related.cities || [],
    relatedAirports: related.airports || [],
    internalLinks: related.internal || [],
    showFleetSection: true,
    showServicesSection: true,
    showTestimonialsSection: true,
    showFaqSection: true,
    showBookingWidget: true,
    bookingFormType,
    cta: { label: 'Get a fixed-price quote', href: '#enquiry', variant: 'primary', enabled: true },
    seo: {
      title: defaults.seoTitle,
      description: defaults.seoDescription,
      canonical: '',
      keywords: [],
      ogTitle: '',
      ogDescription: '',
      ogImage: { url: '', alt: '', path: '' },
      ogType: 'website',
      twitterCard: 'summary_large_image',
      noindex: false,
      nofollow: false,
      schemaType: 'Service',
      breadcrumbLabel:
        type === 'airport' ? 'Airport Transfers' : type === 'city' ? 'Chauffeur Service' : 'City to City',
      structuredData: '',
    },
    status: 'published',
    sortOrder,
    sitemapPriority: 0.8,
    generatedFromTemplate: template.id,
  };
};

const airportLink = (slug, label) => ({ label, href: `/airport-transfers/${slug}`, description: '' });
const cityLink = (slug, label) => ({ label, href: `/chauffeur-service/${slug}`, description: '' });
const routeLink = (slug, label) => ({ label, href: `/city-to-city/${slug}`, description: '' });

/* ----------------------------- Airport pages ----------------------------- */

const AIRPORTS = [
  {
    slug: 'heathrow-airport',
    airportName: 'Heathrow Airport',
    airportCode: 'LHR',
    cityName: 'London',
    region: 'Greater London',
    terminals: ['Terminal 2', 'Terminal 3', 'Terminal 4', 'Terminal 5'],
    distance: '15 miles from central London',
    duration: '45–70 minutes',
    averagePriceLabel: '£75',
    sortOrder: 1,
  },
  {
    slug: 'gatwick-airport',
    airportName: 'Gatwick Airport',
    airportCode: 'LGW',
    cityName: 'London',
    region: 'West Sussex',
    terminals: ['North Terminal', 'South Terminal'],
    distance: '28 miles from central London',
    duration: '60–90 minutes',
    averagePriceLabel: '£95',
    sortOrder: 2,
  },
  {
    slug: 'stansted-airport',
    airportName: 'Stansted Airport',
    airportCode: 'STN',
    cityName: 'London',
    region: 'Essex',
    terminals: ['Main Terminal'],
    distance: '38 miles from central London',
    duration: '60–90 minutes',
    averagePriceLabel: '£105',
    sortOrder: 3,
  },
  {
    slug: 'luton-airport',
    airportName: 'Luton Airport',
    airportCode: 'LTN',
    cityName: 'London',
    region: 'Bedfordshire',
    terminals: ['Main Terminal'],
    distance: '34 miles from central London',
    duration: '55–85 minutes',
    averagePriceLabel: '£99',
    sortOrder: 4,
  },
  {
    slug: 'london-city-airport',
    airportName: 'London City Airport',
    airportCode: 'LCY',
    cityName: 'London',
    region: 'Greater London',
    terminals: ['Main Terminal'],
    distance: '9 miles from central London',
    duration: '30–50 minutes',
    averagePriceLabel: '£65',
    sortOrder: 5,
  },
  {
    slug: 'manchester-airport',
    airportName: 'Manchester Airport',
    airportCode: 'MAN',
    cityName: 'Manchester',
    region: 'Greater Manchester',
    terminals: ['Terminal 1', 'Terminal 2', 'Terminal 3'],
    distance: '9 miles from Manchester city centre',
    duration: '25–40 minutes',
    averagePriceLabel: '£60',
    sortOrder: 6,
  },
  {
    slug: 'birmingham-airport',
    airportName: 'Birmingham Airport',
    airportCode: 'BHX',
    cityName: 'Birmingham',
    region: 'West Midlands',
    terminals: ['Main Terminal'],
    distance: '9 miles from Birmingham city centre',
    duration: '20–35 minutes',
    averagePriceLabel: '£60',
    sortOrder: 7,
  },
];

/* ------------------------------- City pages ------------------------------ */

const CITIES = [
  { slug: 'london', cityName: 'London', region: 'Greater London', averagePriceLabel: '£55 per hour', sortOrder: 1 },
  { slug: 'manchester', cityName: 'Manchester', region: 'Greater Manchester', averagePriceLabel: '£50 per hour', sortOrder: 2 },
  { slug: 'birmingham', cityName: 'Birmingham', region: 'West Midlands', averagePriceLabel: '£50 per hour', sortOrder: 3 },
  { slug: 'edinburgh', cityName: 'Edinburgh', region: 'Scotland', averagePriceLabel: '£52 per hour', sortOrder: 4 },
  { slug: 'leeds', cityName: 'Leeds', region: 'West Yorkshire', averagePriceLabel: '£48 per hour', sortOrder: 5 },
];

/* ------------------------------ Route pages ------------------------------ */

const ROUTES = [
  {
    slug: 'london-to-manchester',
    originCity: 'London',
    destinationCity: 'Manchester',
    distance: '200 miles',
    duration: '4 hours',
    averagePriceLabel: '£480',
    sortOrder: 1,
  },
  {
    slug: 'london-to-birmingham',
    originCity: 'London',
    destinationCity: 'Birmingham',
    distance: '120 miles',
    duration: '2 hours 30 minutes',
    averagePriceLabel: '£320',
    sortOrder: 2,
  },
  {
    slug: 'london-to-oxford',
    originCity: 'London',
    destinationCity: 'Oxford',
    distance: '60 miles',
    duration: '1 hour 30 minutes',
    averagePriceLabel: '£195',
    sortOrder: 3,
  },
  {
    slug: 'london-to-brighton',
    originCity: 'London',
    destinationCity: 'Brighton',
    distance: '55 miles',
    duration: '1 hour 30 minutes',
    averagePriceLabel: '£185',
    sortOrder: 4,
  },
  {
    slug: 'manchester-to-liverpool',
    originCity: 'Manchester',
    destinationCity: 'Liverpool',
    distance: '35 miles',
    duration: '55 minutes',
    averagePriceLabel: '£140',
    sortOrder: 5,
  },
];

/* ------------------------------ Build pages ------------------------------ */

const allAirportLinks = AIRPORTS.map((airport) => airportLink(airport.slug, airport.airportName));
const allCityLinks = CITIES.map((city) => cityLink(city.slug, `Chauffeur service in ${city.cityName}`));
const allRouteLinks = ROUTES.map((route) =>
  routeLink(route.slug, `${route.originCity} to ${route.destinationCity}`),
);

export const seoPagesSeed = [
  ...AIRPORTS.map((airport) =>
    build({
      type: 'airport',
      slug: airport.slug,
      sortOrder: airport.sortOrder,
      tokens: airport,
      bookingFormType: 'airport',
      location: {
        airportName: airport.airportName,
        airportCode: airport.airportCode,
        cityName: airport.cityName,
        region: airport.region,
        country: 'United Kingdom',
        terminals: airport.terminals,
        originCity: '',
        destinationCity: '',
      },
      journey: {
        distance: airport.distance,
        duration: airport.duration,
        averagePriceLabel: `Fixed prices from ${airport.averagePriceLabel}`,
        meetAndGreet: `Your chauffeur meets you inside the ${airport.airportName} arrivals hall with a name board and assists with luggage to the vehicle.`,
        waitingTime: '60 minutes free waiting on international arrivals, 30 minutes on domestic arrivals.',
        notes: '',
      },
      related: {
        airports: allAirportLinks.filter((link) => !link.href.endsWith(airport.slug)).slice(0, 6),
        cities: allCityLinks.slice(0, 4),
        internal: [
          { label: 'Airport transfer service', href: '/airport-transfer', description: 'How our airport service works' },
          { label: 'View our fleet', href: '/fleet', description: 'Vehicles and capacities' },
        ],
      },
    }),
  ),

  ...CITIES.map((city) =>
    build({
      type: 'city',
      slug: city.slug,
      sortOrder: city.sortOrder,
      tokens: city,
      bookingFormType: 'hourly',
      location: {
        cityName: city.cityName,
        region: city.region,
        country: 'United Kingdom',
        airportName: '',
        airportCode: '',
        originCity: '',
        destinationCity: '',
        terminals: [],
      },
      journey: {
        distance: '',
        duration: '',
        averagePriceLabel: `Hourly hire from ${city.averagePriceLabel}`,
        meetAndGreet: '',
        waitingTime: '15 minutes complimentary waiting on all city pickups.',
        notes: '',
      },
      related: {
        cities: allCityLinks.filter((link) => !link.href.endsWith(city.slug)),
        airports: allAirportLinks.slice(0, 4),
        routes: allRouteLinks.filter((link) => link.label.includes(city.cityName)).slice(0, 4),
        internal: [
          { label: 'Hourly chauffeur hire', href: '/hourly-chauffeur', description: 'Car and driver by the hour' },
          { label: 'Corporate travel', href: '/corporate', description: 'Accounts for business travel' },
        ],
      },
    }),
  ),

  ...ROUTES.map((route) =>
    build({
      type: 'city-to-city',
      slug: route.slug,
      sortOrder: route.sortOrder,
      tokens: route,
      bookingFormType: 'city-to-city',
      location: {
        originCity: route.originCity,
        destinationCity: route.destinationCity,
        country: 'United Kingdom',
        cityName: '',
        airportName: '',
        airportCode: '',
        region: '',
        terminals: [],
      },
      journey: {
        distance: route.distance,
        duration: route.duration,
        averagePriceLabel: `Fixed price from ${route.averagePriceLabel}`,
        meetAndGreet: '',
        waitingTime: '15 minutes complimentary waiting at the pickup address.',
        notes: '',
      },
      related: {
        routes: allRouteLinks.filter((link) => !link.href.endsWith(route.slug)),
        cities: allCityLinks.filter((link) =>
          [route.originCity, route.destinationCity].some((city) => link.label.includes(city)),
        ),
        internal: [
          { label: 'City-to-city transfers', href: '/city-to-city-transfer', description: 'How long-distance transfers work' },
          { label: 'View our fleet', href: '/fleet', description: 'Choose the right vehicle' },
        ],
      },
    }),
  ),
];

export default seoPagesSeed;
