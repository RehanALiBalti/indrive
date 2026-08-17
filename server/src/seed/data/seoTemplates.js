/* eslint-disable max-len */

/**
 * Reusable landing-page templates. An SEO user picks a template, fills in the
 * tokens ({{airportName}}, {{cityName}}, {{originCity}} …) and the API produces
 * a complete, editable landing page — no developer involvement, no new React.
 */
export const seoTemplatesSeed = [
  {
    id: 'template-airport',
    name: 'Airport transfer landing page',
    type: 'airport',
    description:
      'Template for /airport-transfers/{slug}. Tokens: airportName, airportCode, cityName, region, country, distance, duration, averagePriceLabel.',
    isActive: true,
    sortOrder: 1,
    defaults: {
      title: '{{airportName}} Transfers | Chauffeur Service to & from {{airportName}}',
      h1: '{{airportName}} chauffeur transfers',
      intro:
        'Pre-booked, fixed-price chauffeur transfers to and from {{airportName}} ({{airportCode}}). Your chauffeur tracks your flight, waits in arrivals with a name board and helps with your luggage — with no surge pricing and no parking charges added at the end.',
      seoTitle: '{{airportName}} Chauffeur Transfers | Fixed Price {{airportCode}} Transfers',
      seoDescription:
        'Book a chauffeur-driven transfer to or from {{airportName}} ({{airportCode}}). Flight tracking, meet and greet in arrivals, free waiting time and fixed all-inclusive prices.',
      benefits: [
        {
          title: 'Flight tracking as standard',
          description:
            'We monitor your inbound flight and adjust your pickup automatically if it is delayed or lands early. You are never charged for a delay outside your control.',
          icon: 'plane',
        },
        {
          title: 'Met inside the terminal',
          description:
            'Your chauffeur waits in the {{airportName}} arrivals hall with a name board and helps with luggage all the way to the vehicle.',
          icon: 'user',
        },
        {
          title: 'Generous free waiting time',
          description:
            '60 minutes of complimentary waiting on international arrivals and 30 minutes on domestic arrivals, measured from the actual landing time.',
          icon: 'clock',
        },
        {
          title: 'One inclusive price',
          description:
            'Airport parking, tolls, congestion charges, waiting time and VAT are all included in the price you are quoted before you travel.',
          icon: 'shield',
        },
      ],
      faqs: [
        {
          question: 'Where will my chauffeur meet me at {{airportName}}?',
          answer:
            '<p>Your chauffeur parks and walks into the terminal, meeting you in the arrivals hall with a name board. You receive their name, photo, mobile number and vehicle registration before you travel.</p>',
        },
        {
          question: 'What happens if my flight into {{airportName}} is delayed?',
          answer:
            '<p>We track your flight using the flight number you provide at booking. If it is delayed, your pickup time moves automatically at no extra cost.</p>',
        },
        {
          question: 'How much does a chauffeur transfer from {{airportName}} cost?',
          answer:
            '<p>Prices are fixed and quoted before you travel, based on the vehicle class and the distance to your destination. Typical journeys start from {{averagePriceLabel}}. Request a quote and we will confirm an exact, all-inclusive price.</p>',
        },
        {
          question: 'Can you collect several passengers with a lot of luggage?',
          answer:
            '<p>Yes. Our luxury MPVs take up to seven passengers and six large suitcases, and our executive minibuses carry up to sixteen. Tell us the passenger and luggage numbers and we will allocate the right vehicle.</p>',
        },
      ],
      sections: [],
    },
  },
  {
    id: 'template-city',
    name: 'City chauffeur landing page',
    type: 'city',
    description:
      'Template for /chauffeur-service/{slug}. Tokens: cityName, region, country, averagePriceLabel.',
    isActive: true,
    sortOrder: 2,
    defaults: {
      title: 'Chauffeur Service in {{cityName}} | Executive Car Hire with Driver',
      h1: 'Chauffeur service in {{cityName}}',
      intro:
        'Professional chauffeur-driven travel across {{cityName}} and the surrounding area. Airport transfers, business travel, hourly hire and long-distance journeys — all at fixed prices, in executive vehicles, with vetted local chauffeurs who know the city.',
      seoTitle: 'Chauffeur Service {{cityName}} | Executive Car & Driver Hire',
      seoDescription:
        'Chauffeur service in {{cityName}}: airport transfers, hourly hire and city-to-city journeys. Fixed prices, executive vehicles and professional local chauffeurs, 24/7.',
      benefits: [
        {
          title: 'Chauffeurs who know {{cityName}}',
          description:
            'Local knowledge means better routes, sensible pickup points and realistic timings — not blind reliance on a satnav.',
          icon: 'map',
        },
        {
          title: 'Every service, one provider',
          description:
            'Airport runs, hourly hire, client collection and long-distance transfers, all on the same account and the same standard.',
          icon: 'route',
        },
        {
          title: 'Fixed prices across the city',
          description:
            'No meters and no surge pricing. Congestion and clean-air charges are included in every quote.',
          icon: 'shield',
        },
        {
          title: 'Available around the clock',
          description:
            'Early flights, late finishes and overnight moves are all covered by a 24-hour operations desk.',
          icon: 'clock',
        },
      ],
      faqs: [
        {
          question: 'Do you cover the whole of {{cityName}}?',
          answer:
            '<p>Yes. We cover the entire {{cityName}} area and the surrounding region, including suburbs, business parks, hotels, stations and private addresses.</p>',
        },
        {
          question: 'Can I hire a chauffeur by the hour in {{cityName}}?',
          answer:
            '<p>You can. Hourly hire starts from three hours and your chauffeur stays with you between stops, so you can leave belongings in the vehicle and change your itinerary as the day develops.</p>',
        },
        {
          question: 'How much does a chauffeur cost in {{cityName}}?',
          answer:
            '<p>Hourly hire starts from {{averagePriceLabel}}, and point-to-point journeys are quoted at a fixed price based on distance and vehicle class. Every quote is fully inclusive.</p>',
        },
      ],
      sections: [],
    },
  },
  {
    id: 'template-route',
    name: 'City-to-city route landing page',
    type: 'city-to-city',
    description:
      'Template for /city-to-city/{slug}. Tokens: originCity, destinationCity, distance, duration, averagePriceLabel.',
    isActive: true,
    sortOrder: 3,
    defaults: {
      title: '{{originCity}} to {{destinationCity}} Chauffeur Transfer | Fixed Price',
      h1: '{{originCity}} to {{destinationCity}} chauffeur transfer',
      intro:
        'A direct, door-to-door chauffeur transfer from {{originCity}} to {{destinationCity}}. The journey covers approximately {{distance}} and takes around {{duration}} in normal traffic. One fixed price includes fuel, tolls, driver hours and VAT — with no connections, no timetable and no luggage restrictions.',
      seoTitle: '{{originCity}} to {{destinationCity}} Chauffeur | Fixed Price Transfer',
      seoDescription:
        'Fixed-price chauffeur transfer from {{originCity}} to {{destinationCity}}. Around {{duration}} door to door in an executive vehicle. Travel on your schedule with luggage included.',
      benefits: [
        {
          title: 'Door to door, no connections',
          description:
            'One vehicle from your address in {{originCity}} to your destination in {{destinationCity}} — no station transfers and no platform changes.',
          icon: 'route',
        },
        {
          title: 'Work or rest en route',
          description:
            'A quiet cabin, phone charging and privacy make roughly {{duration}} of travel productive rather than wasted.',
          icon: 'briefcase',
        },
        {
          title: 'Luggage is never a problem',
          description:
            'Bring what you need. Larger vehicles are available at no notice for groups, cases and equipment.',
          icon: 'luggage',
        },
        {
          title: 'One fixed price',
          description:
            'Fuel, tolls, congestion charges and driver hours are all included. Typical fares from {{averagePriceLabel}}.',
          icon: 'shield',
        },
      ],
      faqs: [
        {
          question: 'How long does the {{originCity}} to {{destinationCity}} journey take?',
          answer:
            '<p>The journey is approximately {{distance}} and typically takes around {{duration}} in normal traffic. Your chauffeur monitors live traffic and will suggest an earlier departure if conditions require it.</p>',
        },
        {
          question: 'How much is a chauffeur from {{originCity}} to {{destinationCity}}?',
          answer:
            '<p>Fares start from {{averagePriceLabel}} for an executive saloon and are quoted as a single fixed price including fuel, tolls and driver hours. Larger vehicles are quoted separately.</p>',
        },
        {
          question: 'Can we stop on the way?',
          answer:
            '<p>Yes. Reasonable stops for refreshments or a short meeting can be arranged in advance at no extra charge. Longer diversions are quoted before you travel.</p>',
        },
        {
          question: 'Is it cheaper than the train?',
          answer:
            '<p>For a single traveller booking well in advance, rail can be cheaper. For two or more passengers, short-notice travel, or journeys with luggage and door-to-door requirements, a chauffeur transfer is frequently comparable or better value — and considerably more comfortable.</p>',
        },
      ],
      sections: [],
    },
  },
];

export default seoTemplatesSeed;
