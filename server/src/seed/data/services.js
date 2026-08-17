export const servicesSeed = [
  {
    id: 'airport-transfer',
    slug: 'airport-transfer',
    name: 'Airport Transfer',
    serviceType: 'airport-transfer',
    formType: 'airport',
    landingPath: '/airport-transfer',
    icon: 'plane',
    shortDescription:
      'Chauffeur-driven airport transfers with live flight tracking, complimentary waiting time and meet-and-greet in arrivals.',
    description:
      '<p>Arriving after a long flight should be the easiest part of your journey. Our airport transfer service tracks your flight in real time, adjusts automatically for delays, and places a professional chauffeur in the arrivals hall with a name board before you clear customs.</p>' +
      '<p>Every airport transfer includes complimentary waiting time, luggage assistance and a fixed price agreed before you travel. There are no meter surprises, no surge pricing and no parking charges added at the end.</p>' +
      '<h2>What is included as standard</h2>' +
      '<ul><li>Live flight monitoring with automatic pickup adjustment</li><li>60 minutes of free waiting time on international arrivals</li><li>30 minutes of free waiting time on domestic arrivals</li><li>Meet and greet with a personalised name board</li><li>Help with luggage from the terminal to the vehicle</li><li>Fixed, all-inclusive pricing confirmed in writing</li></ul>',
    features: [
      'Live flight tracking',
      'Meet and greet in arrivals',
      '60 minutes free waiting time',
      'Fixed all-inclusive price',
      'Luggage assistance',
      'Child seats on request',
    ],
    benefits: [
      {
        title: 'Never rush a flight again',
        description:
          'Your chauffeur monitors departures and arrivals continuously and adjusts the pickup time automatically when your schedule changes.',
        icon: 'clock',
      },
      {
        title: 'Met in arrivals, not the car park',
        description:
          'A uniformed chauffeur waits inside the terminal with a name board and helps with luggage all the way to the vehicle.',
        icon: 'user',
      },
      {
        title: 'One price, agreed up front',
        description:
          'Parking, tolls, waiting time and VAT are all included in the price you are quoted. Nothing is added afterwards.',
        icon: 'shield',
      },
    ],
    startingPriceLabel: 'Fixed prices from £65',
    cta: { label: 'Get an airport transfer quote', href: '/airport-transfer#enquiry', variant: 'primary', enabled: true },
    isActive: true,
    sortOrder: 1,
    seo: {
      title: 'Airport Transfers | Chauffeur-Driven Airport Cars',
      description:
        'Book a chauffeur-driven airport transfer with live flight tracking, free waiting time and meet-and-greet in arrivals. Fixed prices, executive vehicles, 24/7 service.',
      schemaType: 'Service',
      breadcrumbLabel: 'Airport Transfer',
    },
  },
  {
    id: 'city-to-city-transfer',
    slug: 'city-to-city-transfer',
    name: 'City-to-City Transfer',
    serviceType: 'city-to-city',
    formType: 'city-to-city',
    landingPath: '/city-to-city-transfer',
    icon: 'route',
    shortDescription:
      'Comfortable long-distance transfers between cities at a fixed price, with a professional chauffeur and a car built for the motorway.',
    description:
      '<p>Long-distance travel by train means fixed timetables, connections and crowded carriages. A city-to-city chauffeur transfer takes you door to door, on your schedule, in a quiet executive vehicle where you can work, rest or take calls in privacy.</p>' +
      '<p>We quote a single fixed price for the whole journey, including fuel, tolls, congestion charges and driver hours. Stops along the way can be arranged in advance at no extra cost.</p>' +
      '<h2>Ideal for</h2>' +
      '<ul><li>Business travel between offices and client sites</li><li>Roadshows and multi-city itineraries</li><li>Events, weddings and race days</li><li>Travellers with luggage, equipment or accessibility needs</li></ul>',
    features: [
      'Door-to-door service',
      'Fixed price including tolls',
      'Complimentary stops en route',
      'Wi-Fi and phone charging',
      'Space to work in private',
      'Travel on your schedule',
    ],
    benefits: [
      {
        title: 'Door to door, no connections',
        description:
          'One vehicle from your front door to your destination. No station transfers, no platform changes, no waiting rooms.',
        icon: 'route',
      },
      {
        title: 'A mobile office',
        description:
          'Quiet cabins, phone chargers and a table-height rear seat make a long journey productive rather than lost time.',
        icon: 'briefcase',
      },
      {
        title: 'Fixed motorway pricing',
        description:
          'Tolls, congestion charges and driver hours are all included. The price we quote is the price you pay.',
        icon: 'shield',
      },
    ],
    startingPriceLabel: 'Fixed prices from £280',
    cta: {
      label: 'Get a city-to-city quote',
      href: '/city-to-city-transfer#enquiry',
      variant: 'primary',
      enabled: true,
    },
    isActive: true,
    sortOrder: 2,
    seo: {
      title: 'City-to-City Transfers | Long Distance Chauffeur Service',
      description:
        'Fixed-price city-to-city chauffeur transfers. Door-to-door long-distance travel in executive vehicles with professional drivers. Travel on your own schedule.',
      schemaType: 'Service',
      breadcrumbLabel: 'City-to-City',
    },
  },
  {
    id: 'hourly-chauffeur',
    slug: 'hourly-chauffeur',
    name: 'Hourly Chauffeur',
    serviceType: 'hourly-chauffeur',
    formType: 'hourly',
    landingPath: '/hourly-chauffeur',
    icon: 'clock',
    shortDescription:
      'A car and chauffeur at your disposal by the hour, for meetings, events, shopping or a full day of appointments.',
    description:
      '<p>Hourly chauffeur hire — sometimes called "as directed" or "car and driver" — gives you a vehicle and a professional chauffeur for a block of time. Your driver stays with you between stops, so there is no re-booking, no waiting for a car and no luggage to carry between appointments.</p>' +
      '<p>Bookings start from three hours and can be extended on the day where the chauffeur is available. Itineraries can be changed en route; simply tell your driver.</p>' +
      '<h2>Popular uses</h2>' +
      '<ul><li>Back-to-back business meetings across a city</li><li>Client entertainment and hospitality</li><li>Property viewings and site visits</li><li>Shopping, theatre and dining evenings</li><li>Wedding and event transport</li></ul>',
    features: [
      'From 3 hours',
      'Driver stays with you',
      'Change the itinerary as you go',
      'Multiple stops included',
      'Discreet, professional service',
      'Extendable on the day',
    ],
    benefits: [
      {
        title: 'Your schedule, not a timetable',
        description:
          'Add stops, change destinations and run late without re-booking. Your chauffeur simply follows your plan.',
        icon: 'clock',
      },
      {
        title: 'Leave your belongings in the car',
        description:
          'Luggage, samples and shopping stay securely in the vehicle between appointments.',
        icon: 'lock',
      },
      {
        title: 'One clear hourly rate',
        description:
          'Fuel, mileage within the agreed area, parking and waiting are included in the hourly rate.',
        icon: 'shield',
      },
    ],
    startingPriceLabel: 'From £55 per hour',
    cta: { label: 'Book a chauffeur by the hour', href: '/hourly-chauffeur#enquiry', variant: 'primary', enabled: true },
    isActive: true,
    sortOrder: 3,
    seo: {
      title: 'Hourly Chauffeur Hire | Car & Driver By The Hour',
      description:
        'Hire a chauffeur and executive vehicle by the hour. Ideal for meetings, events and full days of appointments. From three hours, with all mileage and waiting included.',
      schemaType: 'Service',
      breadcrumbLabel: 'Hourly Chauffeur',
    },
  },
];

export default servicesSeed;
