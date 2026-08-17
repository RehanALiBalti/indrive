/**
 * Seed fleet. Images are intentionally empty: the admin uploads real photography
 * through the CMS media library, and the UI renders a branded placeholder until
 * then. Nothing about the fleet is hard-coded in React.
 */
export const vehiclesSeed = [
  {
    id: 'executive-saloon',
    slug: 'executive-saloon',
    name: 'Executive Saloon',
    category: 'Business Class',
    tagline: 'The everyday standard for business travel',
    shortDescription:
      'A quiet, comfortable executive saloon for one to three passengers. The most popular choice for airport transfers and business travel.',
    description:
      '<p>The executive saloon is the backbone of any chauffeur fleet. Leather seating, climate control and a genuinely quiet cabin make it equally suited to an early airport run or a full day of meetings.</p>' +
      '<p>Boot space comfortably takes two large suitcases plus hand luggage. If you are travelling with more, the luxury MPV is the better choice.</p>',
    images: [],
    passengers: 3,
    luggage: 2,
    handLuggage: 2,
    features: [
      'Leather interior',
      'Climate control',
      'Complimentary bottled water',
      'Phone charging',
      'Privacy glass',
      'Onboard Wi-Fi on request',
    ],
    exampleModels: ['Mercedes-Benz E-Class', 'BMW 5 Series', 'Audi A6'],
    startingPriceLabel: 'From £65',
    cta: { label: 'Request this vehicle', href: '/#enquiry', variant: 'primary', enabled: true },
    isActive: true,
    sortOrder: 1,
    seo: {
      title: 'Executive Saloon Hire with Chauffeur',
      description:
        'Chauffeur-driven executive saloon for up to 3 passengers and 2 large suitcases. Mercedes E-Class, BMW 5 Series or similar.',
      schemaType: 'Product',
    },
  },
  {
    id: 'luxury-saloon',
    slug: 'luxury-saloon',
    name: 'Luxury Saloon',
    category: 'First Class',
    tagline: 'First-class comfort for VIP travel',
    shortDescription:
      'A flagship luxury saloon with extended rear legroom, reclining seats and exceptional cabin isolation.',
    description:
      '<p>Our first-class saloons are reserved for occasions where comfort matters most: board-level travel, VIP guests and long motorway journeys.</p>' +
      '<p>Expect extended rear legroom, individually reclining rear seats, four-zone climate control and near-silent running at motorway speeds.</p>',
    images: [],
    passengers: 3,
    luggage: 2,
    handLuggage: 2,
    features: [
      'Extended rear legroom',
      'Reclining rear seats',
      'Four-zone climate control',
      'Rear privacy blinds',
      'Premium audio',
      'Refreshments provided',
    ],
    exampleModels: ['Mercedes-Benz S-Class', 'BMW 7 Series', 'Audi A8'],
    startingPriceLabel: 'From £110',
    cta: { label: 'Request this vehicle', href: '/#enquiry', variant: 'primary', enabled: true },
    isActive: true,
    sortOrder: 2,
    seo: {
      title: 'Luxury Saloon Chauffeur Hire | Mercedes S-Class',
      description:
        'First-class chauffeur-driven luxury saloon with extended legroom and reclining rear seats. Mercedes S-Class, BMW 7 Series or similar.',
      schemaType: 'Product',
    },
  },
  {
    id: 'luxury-mpv',
    slug: 'luxury-mpv',
    name: 'Luxury MPV',
    category: 'Business Van',
    tagline: 'Space for people and luggage',
    shortDescription:
      'A premium people carrier seating up to seven passengers with generous luggage capacity — ideal for families and small teams.',
    description:
      '<p>When a saloon is not enough, the luxury MPV carries up to seven passengers in individual seats with room for a full set of luggage.</p>' +
      '<p>Sliding doors, a low step-in height and a flat floor make it the most practical option for families, older travellers and anyone with bulky luggage such as golf clubs or ski equipment.</p>',
    images: [],
    passengers: 7,
    luggage: 6,
    handLuggage: 7,
    features: [
      'Individual captain seats',
      'Sliding doors',
      'Generous luggage space',
      'Climate control throughout',
      'Easy step-in height',
      'Child seats on request',
    ],
    exampleModels: ['Mercedes-Benz V-Class', 'Volkswagen Multivan'],
    startingPriceLabel: 'From £95',
    cta: { label: 'Request this vehicle', href: '/#enquiry', variant: 'primary', enabled: true },
    isActive: true,
    sortOrder: 3,
    seo: {
      title: 'Luxury MPV Chauffeur Hire | 7 Seater Executive Travel',
      description:
        'Chauffeur-driven luxury MPV for up to 7 passengers and 6 large suitcases. Mercedes V-Class or similar. Ideal for families and small teams.',
      schemaType: 'Product',
    },
  },
  {
    id: 'electric-executive',
    slug: 'electric-executive',
    name: 'Electric Executive',
    category: 'Electric',
    tagline: 'Zero-emission executive travel',
    shortDescription:
      'A fully electric executive vehicle for businesses with sustainability targets, offering the same comfort with zero tailpipe emissions.',
    description:
      '<p>Our electric executive vehicles deliver the same standard of comfort as the combustion fleet with zero tailpipe emissions and a notably quieter cabin.</p>' +
      '<p>Corporate clients can request electric-only allocation across their account and receive journey-level emissions reporting for ESG purposes.</p>',
    images: [],
    passengers: 3,
    luggage: 2,
    handLuggage: 2,
    features: [
      'Zero tailpipe emissions',
      'Exceptionally quiet cabin',
      'Emissions reporting available',
      'Clean Air Zone compliant',
      'Rapid-charge network coverage',
      'Premium interior finish',
    ],
    exampleModels: ['Mercedes-Benz EQE', 'BMW i5', 'Tesla Model S'],
    startingPriceLabel: 'From £75',
    cta: { label: 'Request this vehicle', href: '/#enquiry', variant: 'primary', enabled: true },
    isActive: true,
    sortOrder: 4,
    seo: {
      title: 'Electric Chauffeur Service | Zero Emission Executive Cars',
      description:
        'Fully electric chauffeur-driven executive cars with zero tailpipe emissions and journey-level emissions reporting for corporate accounts.',
      schemaType: 'Product',
    },
  },
  {
    id: 'executive-minibus',
    slug: 'executive-minibus',
    name: 'Executive Minibus',
    category: 'Group Travel',
    tagline: 'Keep the whole group together',
    shortDescription:
      'An executive minibus for groups of up to sixteen passengers, with a dedicated luggage area and a professional driver.',
    description:
      '<p>For conference delegations, sports teams, wedding parties and roadshows, the executive minibus keeps everyone together in one vehicle.</p>' +
      '<p>Reclining coach seating, air conditioning, USB charging and a separate luggage compartment make longer group journeys genuinely comfortable.</p>',
    images: [],
    passengers: 16,
    luggage: 16,
    handLuggage: 16,
    features: [
      'Up to 16 passengers',
      'Separate luggage compartment',
      'Reclining coach seats',
      'USB charging at every seat',
      'Air conditioning',
      'PSV-licensed drivers',
    ],
    exampleModels: ['Mercedes-Benz Sprinter Executive'],
    startingPriceLabel: 'From £180',
    cta: { label: 'Request this vehicle', href: '/#enquiry', variant: 'primary', enabled: true },
    isActive: true,
    sortOrder: 5,
    seo: {
      title: 'Executive Minibus Hire with Driver | Group Transfers',
      description:
        'Executive minibus hire with a professional driver for groups of up to 16 passengers. Ideal for conferences, events and group airport transfers.',
      schemaType: 'Product',
    },
  },
];

export default vehiclesSeed;
