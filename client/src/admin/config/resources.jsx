import { Link } from 'react-router-dom';
import { StatusBadge, dateTime } from '../components/AdminTable.jsx';
import { Badge, Rating } from '../../components/ui/Misc.jsx';
import { truncate, titleCase } from '../../lib/format.js';

export const SEO_PAGE_PREFIX = {
  airport: '/airport-transfers',
  city: '/chauffeur-service',
  'city-to-city': '/city-to-city',
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

const STATUS_FILTER = {
  name: 'status',
  label: 'Status',
  options: [{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS],
};

const ACTIVE_FIELD = {
  name: 'isActive',
  label: 'Show on the website',
  type: 'boolean',
  defaultChecked: true,
};

const SORT_FIELD = {
  name: 'sortOrder',
  label: 'Sort order',
  type: 'number',
  min: 0,
  max: 9999,
  hint: 'Lower numbers appear first.',
};

const BENEFIT_FIELDS = [
  { name: 'title', label: 'Title' },
  { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
  { name: 'icon', label: 'Icon', type: 'icon' },
];

const FAQ_FIELDS = [
  { name: 'question', label: 'Question' },
  { name: 'answer', label: 'Answer', type: 'richtext', rows: 8 },
];

const LINK_FIELDS = [
  { name: 'label', label: 'Link text' },
  { name: 'href', label: 'Destination', placeholder: '/airport-transfers/heathrow-airport' },
  { name: 'description', label: 'Supporting text', type: 'textarea', rows: 2 },
];

const titleCell = (row, to, subtitle) => (
  <>
    <Link className="admin-table__primary" to={to}>
      {row.title || row.name || row.question || 'Untitled'}
    </Link>
    {subtitle ? <span className="admin-table__sub">{subtitle}</span> : null}
  </>
);

/* -------------------------------------------------------------------------- */
/* Resource definitions                                                        */
/* -------------------------------------------------------------------------- */

export const RESOURCES = {
  pages: {
    key: 'pages',
    api: '/admin/pages',
    title: 'Pages',
    singular: 'Page',
    description:
      'Static pages such as About, How it works and the legal pages. Each page is built from re-orderable content sections.',
    titleField: 'title',
    slugField: 'slug',
    statusField: 'status',
    supportsSections: true,
    supportsSeo: true,
    supportsDuplicate: true,
    viewPath: (item) => item.path || `/${item.slug}`,
    filters: [STATUS_FILTER],
    defaults: {
      status: 'draft',
      sections: [],
      showInSitemap: true,
      sitemapPriority: 0.7,
      sitemapChangefreq: 'monthly',
    },
    columns: [
      {
        key: 'title',
        label: 'Page',
        render: (row) => titleCell(row, `/admin/pages/${row.id}`, row.path || `/${row.slug}`),
      },
      { key: 'sections', label: 'Sections', render: (row) => (row.sections?.length ?? 0) },
      { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
      { key: 'updatedAt', label: 'Updated', render: (row) => dateTime(row.updatedAt) },
    ],
    tabs: [
      {
        id: 'content',
        label: 'Content',
        fields: [
          { name: 'title', label: 'Page title', required: true },
          { name: 'slug', label: 'Slug', type: 'slug', required: true },
          {
            name: 'path',
            label: 'URL path',
            hint: 'Leave empty to use /slug. Set it for nested URLs such as /legal/privacy-policy.',
          },
          { name: 'h1', label: 'H1 heading', hint: 'Falls back to the page title.' },
          { name: 'subtitle', label: 'Intro / lead text', type: 'textarea', rows: 3 },
          { name: 'heroImage', label: 'Hero image', type: 'image', folder: 'pages' },
        ],
      },
    ],
    sidebar: [
      { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
      { name: 'showInSitemap', label: 'Include in XML sitemap', type: 'boolean', defaultChecked: true },
      {
        name: 'sitemapPriority',
        label: 'Sitemap priority',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.1,
        hint: 'Between 0 and 1.',
      },
      {
        name: 'sitemapChangefreq',
        label: 'Change frequency',
        type: 'select',
        options: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map((value) => ({
          value,
          label: titleCase(value),
        })),
      },
    ],
  },

  services: {
    key: 'services',
    api: '/admin/services',
    title: 'Services',
    singular: 'Service',
    description:
      'The services shown across the site. Each one has its own landing page, enquiry form and content sections.',
    titleField: 'name',
    slugField: 'slug',
    statusField: 'isActive',
    supportsSections: true,
    supportsSeo: true,
    supportsDuplicate: true,
    viewPath: (item) => item.landingPath || `/${item.slug}`,
    defaults: { isActive: true, sortOrder: 0, sections: [], features: [], benefits: [], formType: 'none' },
    columns: [
      {
        key: 'name',
        label: 'Service',
        render: (row) => titleCell(row, `/admin/services/${row.id}`, row.landingPath || `/${row.slug}`),
      },
      { key: 'serviceType', label: 'Type', render: (row) => <Badge>{titleCase(row.serviceType)}</Badge> },
      { key: 'sortOrder', label: 'Order' },
      {
        key: 'isActive',
        label: 'Status',
        render: (row) => <StatusBadge status={row.isActive === false ? 'inactive' : 'active'} />,
      },
      { key: 'updatedAt', label: 'Updated', render: (row) => dateTime(row.updatedAt) },
    ],
    tabs: [
      {
        id: 'content',
        label: 'Content',
        fields: [
          { name: 'name', label: 'Service name', required: true },
          { name: 'slug', label: 'Slug', type: 'slug', required: true },
          {
            name: 'landingPath',
            label: 'Landing page URL',
            hint: 'Defaults to /slug.',
          },
          {
            name: 'serviceType',
            label: 'Service type',
            type: 'select',
            options: [
              { value: 'airport-transfer', label: 'Airport transfer' },
              { value: 'city-to-city', label: 'City to city' },
              { value: 'hourly-chauffeur', label: 'Hourly chauffeur' },
              { value: 'other', label: 'Other' },
            ],
          },
          {
            name: 'formType',
            label: 'Enquiry form',
            type: 'select',
            hint: 'Which set of journey fields the booking widget shows on this page.',
            options: [
              { value: 'airport', label: 'Airport transfer fields' },
              { value: 'city-to-city', label: 'City-to-city fields' },
              { value: 'hourly', label: 'Hourly fields' },
              { value: 'none', label: 'No booking widget' },
            ],
          },
          { name: 'icon', label: 'Icon', type: 'icon' },
          { name: 'shortDescription', label: 'Short description', type: 'textarea', rows: 2 },
          { name: 'description', label: 'Full description', type: 'richtext' },
          { name: 'image', label: 'Card image', type: 'image', folder: 'services' },
          { name: 'heroImage', label: 'Hero image', type: 'image', folder: 'services' },
          { name: 'startingPriceLabel', label: 'Price label', placeholder: 'From £65' },
        ],
      },
      {
        id: 'details',
        label: 'Features & benefits',
        fields: [
          { name: 'features', label: 'Included features', type: 'stringList', placeholder: 'Add a feature' },
          {
            name: 'benefits',
            label: 'Benefits',
            type: 'repeater',
            fields: BENEFIT_FIELDS,
            addLabel: 'Add benefit',
            max: 24,
          },
          { name: 'cta', label: 'Primary call to action', type: 'cta' },
        ],
      },
    ],
    sidebar: [ACTIVE_FIELD, SORT_FIELD],
  },

  vehicles: {
    key: 'vehicles',
    api: '/admin/vehicles',
    title: 'Fleet',
    singular: 'Vehicle',
    description: 'Vehicles shown on the fleet page and in booking enquiries.',
    titleField: 'name',
    slugField: 'slug',
    statusField: 'isActive',
    supportsSeo: true,
    supportsDuplicate: true,
    viewPath: (item) => `/fleet/${item.slug}`,
    defaults: {
      isActive: true,
      sortOrder: 0,
      images: [],
      features: [],
      exampleModels: [],
      passengers: 3,
      luggage: 2,
      handLuggage: 2,
    },
    columns: [
      {
        key: 'image',
        label: '',
        width: '72px',
        render: (row) =>
          row.images?.[0]?.url ? (
            <img className="admin-table__thumb" src={row.images[0].url} alt={row.images[0].alt || row.name} />
          ) : (
            <span className="admin-table__thumb" />
          ),
      },
      {
        key: 'name',
        label: 'Vehicle',
        render: (row) => titleCell(row, `/admin/vehicles/${row.id}`, row.category),
      },
      {
        key: 'capacity',
        label: 'Capacity',
        render: (row) => `${row.passengers ?? 0} passengers · ${row.luggage ?? 0} bags`,
      },
      { key: 'sortOrder', label: 'Order' },
      {
        key: 'isActive',
        label: 'Status',
        render: (row) => <StatusBadge status={row.isActive === false ? 'inactive' : 'active'} />,
      },
    ],
    tabs: [
      {
        id: 'content',
        label: 'Vehicle',
        fields: [
          { name: 'name', label: 'Vehicle name', required: true, placeholder: 'Mercedes-Benz E-Class' },
          { name: 'slug', label: 'Slug', type: 'slug', required: true },
          { name: 'category', label: 'Class', required: true, placeholder: 'Business' },
          { name: 'tagline', label: 'Tagline', placeholder: 'The executive standard' },
          { name: 'shortDescription', label: 'Short description', type: 'textarea', rows: 2 },
          { name: 'description', label: 'Full description', type: 'richtext' },
          { name: 'startingPriceLabel', label: 'Price label', placeholder: 'From £65' },
          { name: 'cta', label: 'Call to action', type: 'cta' },
        ],
      },
      {
        id: 'specs',
        label: 'Capacity & features',
        fields: [
          { name: 'passengers', label: 'Passengers', type: 'number', min: 1, max: 100, required: true },
          { name: 'luggage', label: 'Large suitcases', type: 'number', min: 0, max: 100 },
          { name: 'handLuggage', label: 'Cabin bags', type: 'number', min: 0, max: 100 },
          { name: 'features', label: 'On-board features', type: 'stringList', placeholder: 'Add a feature' },
          {
            name: 'exampleModels',
            label: 'Example models',
            type: 'stringList',
            placeholder: 'Add a model',
            hint: 'Shown as "or similar" on the vehicle page.',
          },
        ],
      },
      {
        id: 'images',
        label: 'Images',
        fields: [
          {
            name: 'images',
            label: 'Gallery',
            type: 'imageList',
            folder: 'vehicles',
            max: 12,
            hint: 'The first image is used on cards and as the main photo.',
          },
        ],
      },
    ],
    sidebar: [ACTIVE_FIELD, SORT_FIELD],
  },

  blog: {
    key: 'blog',
    api: '/admin/blog',
    title: 'Blog',
    singular: 'Article',
    description: 'Guides and articles. Draft articles are never visible on the public site.',
    titleField: 'title',
    slugField: 'slug',
    statusField: 'status',
    supportsSeo: true,
    supportsDuplicate: true,
    viewPath: (item) => `/blog/${item.slug}`,
    filters: [STATUS_FILTER],
    defaults: { status: 'draft', tags: [], faqs: [], category: 'guides', author: {} },
    columns: [
      {
        key: 'title',
        label: 'Article',
        render: (row) => titleCell(row, `/admin/blog/${row.id}`, `/blog/${row.slug}`),
      },
      { key: 'category', label: 'Category', render: (row) => <Badge>{titleCase(row.category)}</Badge> },
      { key: 'publishedAt', label: 'Published', render: (row) => dateTime(row.publishedAt) },
      { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ],
    tabs: [
      {
        id: 'content',
        label: 'Article',
        fields: [
          { name: 'title', label: 'Title', required: true },
          { name: 'slug', label: 'Slug', type: 'slug', required: true },
          { name: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 3, hint: 'Generated from the body if empty.' },
          { name: 'featuredImage', label: 'Featured image', type: 'image', folder: 'blog' },
          { name: 'content', label: 'Body', type: 'richtext', rows: 24 },
          { name: 'cta', label: 'Call to action', type: 'cta' },
        ],
      },
      {
        id: 'extras',
        label: 'FAQs & links',
        fields: [
          {
            name: 'faqs',
            label: 'Article FAQs',
            type: 'repeater',
            fields: FAQ_FIELDS,
            titleKey: 'question',
            addLabel: 'Add question',
          },
          {
            name: 'relatedPostSlugs',
            label: 'Related articles',
            type: 'stringList',
            placeholder: 'Article slug',
            max: 8,
            hint: 'Enter the slug of each related article. Leave empty to show the newest articles.',
          },
        ],
      },
      {
        id: 'author',
        label: 'Author',
        fields: [
          { name: 'author.name', label: 'Name' },
          { name: 'author.role', label: 'Role' },
          { name: 'author.bio', label: 'Short bio', type: 'textarea', rows: 3 },
          { name: 'author.avatar', label: 'Photo', type: 'image', folder: 'blog' },
        ],
      },
    ],
    sidebar: [
      { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
      { name: 'publishedAt', label: 'Publish date', type: 'date', hint: 'Set automatically when first published.' },
      { name: 'category', label: 'Category', placeholder: 'guides' },
      { name: 'tags', label: 'Tags', type: 'stringList', placeholder: 'Add a tag' },
    ],
  },

  faqs: {
    key: 'faqs',
    api: '/admin/faqs',
    title: 'FAQs',
    singular: 'FAQ',
    description: 'Questions used on the FAQ page and inside FAQ sections across the site.',
    titleField: 'question',
    statusField: 'isActive',
    defaults: { isActive: true, sortOrder: 0, category: 'general', tags: [] },
    columns: [
      {
        key: 'question',
        label: 'Question',
        render: (row) => titleCell(row, `/admin/faqs/${row.id}`),
      },
      { key: 'category', label: 'Category', render: (row) => <Badge>{titleCase(row.category)}</Badge> },
      { key: 'sortOrder', label: 'Order' },
      {
        key: 'isActive',
        label: 'Status',
        render: (row) => <StatusBadge status={row.isActive === false ? 'inactive' : 'active'} />,
      },
    ],
    tabs: [
      {
        id: 'content',
        label: 'Question',
        fields: [
          { name: 'question', label: 'Question', required: true },
          { name: 'answer', label: 'Answer', type: 'richtext', rows: 10, required: true },
        ],
      },
    ],
    sidebar: [
      {
        name: 'category',
        label: 'Category',
        placeholder: 'general',
        hint: 'FAQ sections can be filtered by this value.',
      },
      { name: 'tags', label: 'Tags', type: 'stringList', placeholder: 'Add a tag' },
      ACTIVE_FIELD,
      SORT_FIELD,
    ],
  },

  testimonials: {
    key: 'testimonials',
    api: '/admin/testimonials',
    title: 'Testimonials',
    singular: 'Testimonial',
    description: 'Customer reviews shown on the homepage, service pages and landing pages.',
    titleField: 'name',
    statusField: 'isActive',
    defaults: { isActive: true, sortOrder: 0, rating: 5 },
    columns: [
      { key: 'name', label: 'Customer', render: (row) => titleCell(row, `/admin/testimonials/${row.id}`, row.company) },
      { key: 'quote', label: 'Quote', render: (row) => truncate(row.quote, 90) },
      { key: 'rating', label: 'Rating', render: (row) => <Rating value={row.rating} /> },
      {
        key: 'isActive',
        label: 'Status',
        render: (row) => <StatusBadge status={row.isActive === false ? 'inactive' : 'active'} />,
      },
    ],
    tabs: [
      {
        id: 'content',
        label: 'Testimonial',
        fields: [
          { name: 'name', label: 'Customer name', required: true },
          { name: 'quote', label: 'Testimonial', type: 'textarea', rows: 5, required: true },
          { name: 'rating', label: 'Rating out of 5', type: 'number', min: 1, max: 5 },
          { name: 'role', label: 'Job title' },
          { name: 'company', label: 'Company' },
          { name: 'location', label: 'Location' },
          { name: 'serviceUsed', label: 'Service used', placeholder: 'Airport transfer' },
          { name: 'avatar', label: 'Photo', type: 'image', folder: 'testimonials' },
        ],
      },
    ],
    sidebar: [ACTIVE_FIELD, SORT_FIELD],
  },

  'seo-pages': {
    key: 'seo-pages',
    api: '/admin/seo-pages',
    title: 'SEO landing pages',
    singular: 'Landing page',
    description:
      'Airport, city and route landing pages. Create as many as you need — no developer involvement required.',
    titleField: 'title',
    slugField: 'slug',
    statusField: 'status',
    supportsSections: true,
    supportsSeo: true,
    supportsDuplicate: true,
    viewPath: (item) => `${SEO_PAGE_PREFIX[item.type] || ''}/${item.slug}`,
    filters: [
      STATUS_FILTER,
      {
        name: 'type',
        label: 'Template',
        options: [
          { value: '', label: 'All templates' },
          { value: 'airport', label: 'Airport' },
          { value: 'city', label: 'City' },
          { value: 'city-to-city', label: 'City to city' },
        ],
      },
    ],
    defaults: {
      type: 'airport',
      status: 'draft',
      sections: [],
      benefits: [],
      faqs: [],
      relatedRoutes: [],
      relatedCities: [],
      relatedAirports: [],
      internalLinks: [],
      location: {},
      journey: {},
      showFleetSection: true,
      showServicesSection: true,
      showTestimonialsSection: true,
      showFaqSection: true,
      showBookingWidget: true,
      bookingFormType: 'airport',
      sitemapPriority: 0.8,
      sortOrder: 0,
    },
    columns: [
      {
        key: 'title',
        label: 'Landing page',
        render: (row) =>
          titleCell(row, `/admin/seo-pages/${row.id}`, `${SEO_PAGE_PREFIX[row.type] || ''}/${row.slug}`),
      },
      { key: 'type', label: 'Template', render: (row) => <Badge>{titleCase(row.type)}</Badge> },
      { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
      { key: 'updatedAt', label: 'Updated', render: (row) => dateTime(row.updatedAt) },
    ],
    tabs: [
      {
        id: 'content',
        label: 'Content',
        fields: [
          {
            name: 'type',
            label: 'Template',
            type: 'select',
            required: true,
            hint: 'Decides the URL prefix and which location fields apply.',
            options: [
              { value: 'airport', label: 'Airport transfer (/airport-transfers/…)' },
              { value: 'city', label: 'City chauffeur (/chauffeur-service/…)' },
              { value: 'city-to-city', label: 'City to city route (/city-to-city/…)' },
            ],
          },
          { name: 'slug', label: 'Slug', type: 'slug', required: true },
          { name: 'title', label: 'Page title', required: true },
          { name: 'h1', label: 'H1 heading', required: true },
          { name: 'intro', label: 'Intro text', type: 'textarea', rows: 4 },
          { name: 'heroImage', label: 'Hero image', type: 'image', folder: 'seo' },
          { name: 'cta', label: 'Call to action', type: 'cta' },
        ],
      },
      {
        id: 'location',
        label: 'Location',
        fields: [
          {
            name: 'location.airportName',
            label: 'Airport name',
            condition: (values) => values.type === 'airport',
          },
          {
            name: 'location.airportCode',
            label: 'IATA code',
            placeholder: 'LHR',
            condition: (values) => values.type === 'airport',
          },
          {
            name: 'location.terminals',
            label: 'Terminals',
            type: 'stringList',
            placeholder: 'Terminal 5',
            condition: (values) => values.type === 'airport',
          },
          {
            name: 'location.cityName',
            label: 'City',
            condition: (values) => values.type === 'city' || values.type === 'airport',
          },
          {
            name: 'location.originCity',
            label: 'Origin city',
            condition: (values) => values.type === 'city-to-city',
          },
          {
            name: 'location.destinationCity',
            label: 'Destination city',
            condition: (values) => values.type === 'city-to-city',
          },
          { name: 'location.region', label: 'Region / county' },
          { name: 'location.country', label: 'Country' },
          { name: 'location.postcode', label: 'Postcode' },
          { name: 'location.latitude', label: 'Latitude', type: 'number', min: -90, max: 90, step: 0.000001 },
          { name: 'location.longitude', label: 'Longitude', type: 'number', min: -180, max: 180, step: 0.000001 },
        ],
      },
      {
        id: 'journey',
        label: 'Journey facts',
        fields: [
          { name: 'journey.distance', label: 'Distance', placeholder: '32 miles' },
          { name: 'journey.duration', label: 'Typical duration', placeholder: '55–80 minutes' },
          { name: 'journey.averagePriceLabel', label: 'Guide price', placeholder: 'From £95' },
          { name: 'journey.meetAndGreet', label: 'Meet and greet details', type: 'textarea', rows: 3 },
          { name: 'journey.waitingTime', label: 'Included waiting time', placeholder: '60 minutes after landing' },
          { name: 'journey.notes', label: 'Additional journey notes', type: 'richtext', rows: 8 },
        ],
      },
      {
        id: 'benefits',
        label: 'Benefits & FAQs',
        fields: [
          {
            name: 'benefits',
            label: 'Benefits',
            type: 'repeater',
            fields: BENEFIT_FIELDS,
            addLabel: 'Add benefit',
          },
          {
            name: 'faqs',
            label: 'FAQs',
            type: 'repeater',
            fields: FAQ_FIELDS,
            titleKey: 'question',
            addLabel: 'Add question',
          },
        ],
      },
      {
        id: 'links',
        label: 'Internal links',
        fields: [
          {
            name: 'relatedAirports',
            label: 'Related airports',
            type: 'repeater',
            fields: LINK_FIELDS,
            titleKey: 'label',
            addLabel: 'Add airport link',
          },
          {
            name: 'relatedCities',
            label: 'Related cities',
            type: 'repeater',
            fields: LINK_FIELDS,
            titleKey: 'label',
            addLabel: 'Add city link',
          },
          {
            name: 'relatedRoutes',
            label: 'Related routes',
            type: 'repeater',
            fields: LINK_FIELDS,
            titleKey: 'label',
            addLabel: 'Add route link',
          },
          {
            name: 'internalLinks',
            label: 'Other internal links',
            type: 'repeater',
            fields: LINK_FIELDS,
            titleKey: 'label',
            addLabel: 'Add link',
          },
        ],
      },
    ],
    sidebar: [
      { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
      { name: 'showBookingWidget', label: 'Show booking widget', type: 'boolean', defaultChecked: true },
      {
        name: 'bookingFormType',
        label: 'Booking widget fields',
        type: 'select',
        options: [
          { value: 'airport', label: 'Airport transfer' },
          { value: 'city-to-city', label: 'City to city' },
          { value: 'hourly', label: 'Hourly' },
        ],
      },
      { name: 'showServicesSection', label: 'Show services section', type: 'boolean', defaultChecked: true },
      { name: 'showFleetSection', label: 'Show fleet section', type: 'boolean', defaultChecked: true },
      { name: 'showTestimonialsSection', label: 'Show testimonials', type: 'boolean', defaultChecked: true },
      { name: 'showFaqSection', label: 'Show FAQ section', type: 'boolean', defaultChecked: true },
      { name: 'sitemapPriority', label: 'Sitemap priority', type: 'number', min: 0, max: 1, step: 0.1 },
      SORT_FIELD,
    ],
  },

  'seo-templates': {
    key: 'seo-templates',
    api: '/admin/seo-templates',
    title: 'SEO templates',
    singular: 'Template',
    description:
      'Reusable starting points for landing pages. Use tokens such as {{airportName}}, {{cityName}}, {{originCity}}, {{destinationCity}} and {{brandName}} — they are replaced when a page is generated.',
    titleField: 'name',
    statusField: 'isActive',
    supportsDuplicate: true,
    defaults: { isActive: true, sortOrder: 0, type: 'airport', defaults: { benefits: [], faqs: [], sections: [] } },
    columns: [
      { key: 'name', label: 'Template', render: (row) => titleCell(row, `/admin/seo-templates/${row.id}`) },
      { key: 'type', label: 'Type', render: (row) => <Badge>{titleCase(row.type)}</Badge> },
      {
        key: 'isActive',
        label: 'Status',
        render: (row) => <StatusBadge status={row.isActive === false ? 'inactive' : 'active'} />,
      },
      { key: 'updatedAt', label: 'Updated', render: (row) => dateTime(row.updatedAt) },
    ],
    tabs: [
      {
        id: 'content',
        label: 'Template',
        fields: [
          { name: 'name', label: 'Template name', required: true },
          {
            name: 'type',
            label: 'Landing page type',
            type: 'select',
            options: [
              { value: 'airport', label: 'Airport' },
              { value: 'city', label: 'City' },
              { value: 'city-to-city', label: 'City to city' },
            ],
          },
          { name: 'description', label: 'Internal notes', type: 'textarea', rows: 2 },
          { name: 'defaults.title', label: 'Default page title', placeholder: '{{airportName}} Transfers' },
          { name: 'defaults.h1', label: 'Default H1', placeholder: 'Chauffeur transfers to {{airportName}}' },
          { name: 'defaults.intro', label: 'Default intro', type: 'textarea', rows: 4 },
          { name: 'defaults.seoTitle', label: 'Default SEO title' },
          { name: 'defaults.seoDescription', label: 'Default meta description', type: 'textarea', rows: 3 },
        ],
      },
      {
        id: 'defaults',
        label: 'Default content',
        fields: [
          {
            name: 'defaults.benefits',
            label: 'Default benefits',
            type: 'repeater',
            fields: BENEFIT_FIELDS,
            addLabel: 'Add benefit',
          },
          {
            name: 'defaults.faqs',
            label: 'Default FAQs',
            type: 'repeater',
            fields: FAQ_FIELDS,
            titleKey: 'question',
            addLabel: 'Add question',
          },
        ],
      },
    ],
    sidebar: [ACTIVE_FIELD, SORT_FIELD],
    sectionsPath: 'defaults.sections',
    supportsSections: true,
  },
};

export const getResource = (key) => RESOURCES[key];

export default RESOURCES;
