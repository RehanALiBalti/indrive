/* eslint-disable max-len */

const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString();

const author = {
  name: 'Operations Team',
  role: 'Chauffeur Operations',
  bio: 'Our operations team coordinates thousands of journeys a year and writes about what actually makes travel run smoothly.',
  avatar: { url: '', alt: '', path: '' },
};

export const blogPostsSeed = [
  {
    id: 'airport-transfer-guide',
    slug: 'airport-transfer-guide-what-to-expect',
    title: 'Airport Transfer Guide: What Actually Happens When You Land',
    excerpt:
      'From flight tracking to meeting your chauffeur in arrivals, here is exactly how a pre-booked airport transfer works — and what to do if something changes.',
    category: 'guides',
    tags: ['airport transfer', 'travel tips', 'flight delays'],
    status: 'published',
    publishedAt: daysAgo(6),
    readingMinutes: 6,
    author,
    featuredImage: { url: '', alt: 'Chauffeur waiting in an airport arrivals hall with a name board', path: '' },
    content:
      '<p>Most people book an airport transfer for one reason: they do not want to think about getting home after a flight. This guide explains exactly what happens from the moment your plane pushes back to the moment you close the car door.</p>' +
      '<h2>Before you fly</h2>' +
      '<p>When you book, the single most important detail you provide is your flight number. It is what allows us to track the aircraft rather than relying on the scheduled time. The evening before travel you receive a confirmation containing your chauffeur’s name, photograph, mobile number and the vehicle registration.</p>' +
      '<h2>While you are in the air</h2>' +
      '<p>Our operations desk monitors your flight continuously. If it departs late, or the arrival estimate moves, the pickup time is adjusted automatically. Nobody needs to call us, and there is no charge for a delay that was outside your control.</p>' +
      '<h2>When you land</h2>' +
      '<p>Your chauffeur parks in the short-stay car park and walks into the terminal so they are standing in the arrivals hall before you clear immigration. They hold a name board with your name or your company’s name — tell us at booking if you would prefer a discreet board with initials only.</p>' +
      '<h3>How much waiting time is included?</h3>' +
      '<table><thead><tr><th>Arrival type</th><th>Free waiting time</th><th>Measured from</th></tr></thead><tbody>' +
      '<tr><td>International</td><td>60 minutes</td><td>Actual landing time</td></tr>' +
      '<tr><td>Domestic</td><td>30 minutes</td><td>Actual landing time</td></tr>' +
      '<tr><td>Non-airport pickups</td><td>15 minutes</td><td>Booked pickup time</td></tr>' +
      '</tbody></table>' +
      '<h2>If you cannot find your chauffeur</h2>' +
      '<p>Call the mobile number in your confirmation. Large terminals have several arrival exits, and it is usually a matter of walking thirty metres. Our operations desk is staffed 24 hours a day if you cannot reach the chauffeur directly.</p>' +
      '<h2>Practical tips</h2>' +
      '<ul><li>Add your mobile number and keep it switched on — we send an SMS when your chauffeur is in position.</li><li>Declare luggage honestly. Two extra cases can mean a different vehicle class.</li><li>Ask for child seats when you book, not on the day.</li><li>If your plans change mid-trip, message the chauffeur directly; they can usually accommodate a new destination.</li></ul>' +
      '<h2>Departures work the same way, in reverse</h2>' +
      '<p>For outbound journeys we build in a buffer based on the time of day and live traffic. As a rule of thumb, we aim to have you at the terminal three hours before a long-haul departure and two hours before a short-haul one.</p>',
    faqs: [
      {
        question: 'Do I need to pay extra if my flight is delayed?',
        answer: '<p>No. Provided you gave us the correct flight number at booking, delays are tracked and the pickup is adjusted at no extra cost.</p>',
      },
      {
        question: 'Can my chauffeur meet me at the gate?',
        answer: '<p>Airside meet-and-assist is available at some airports through a third-party service and can be arranged on request. As standard, your chauffeur meets you in the arrivals hall.</p>',
      },
    ],
    relatedPostSlugs: ['business-travel-checklist', 'chauffeur-vs-ride-hailing'],
    cta: { label: 'Book an airport transfer', href: '/airport-transfer', variant: 'primary', enabled: true },
    seo: {
      title: 'Airport Transfer Guide: What Happens When You Land',
      description:
        'A step-by-step guide to pre-booked airport transfers: flight tracking, meet and greet in arrivals, free waiting time and what to do if plans change.',
      schemaType: 'Article',
      breadcrumbLabel: 'Airport Transfer Guide',
    },
  },
  {
    id: 'chauffeur-vs-ride-hailing',
    slug: 'chauffeur-vs-ride-hailing',
    title: 'Chauffeur Service vs Ride-Hailing: When Each One Makes Sense',
    excerpt:
      'An honest comparison of pre-booked chauffeur services and ride-hailing apps across price, reliability, vehicle quality and accountability.',
    category: 'comparisons',
    tags: ['chauffeur', 'business travel', 'comparison'],
    status: 'published',
    publishedAt: daysAgo(14),
    readingMinutes: 7,
    author,
    featuredImage: { url: '', alt: 'Executive saloon parked outside an office building', path: '' },
    content:
      '<p>Ride-hailing apps are excellent at what they were designed for: getting one person across a city, right now, cheaply. They were not designed for a 5am airport run with three suitcases, or for collecting a client from a station platform.</p>' +
      '<h2>Where ride-hailing wins</h2>' +
      '<ul><li>Short, spontaneous journeys in dense urban areas</li><li>Single travellers with no luggage</li><li>Situations where the lowest price matters more than certainty</li></ul>' +
      '<h2>Where a chauffeur service wins</h2>' +
      '<h3>1. The price is fixed before you travel</h3>' +
      '<p>Dynamic pricing means an app fare can double in bad weather or at peak times. A chauffeur quote is agreed in advance and does not change.</p>' +
      '<h3>2. Allocation happens in advance, not on the day</h3>' +
      '<p>A named chauffeur and a specific vehicle class are assigned when you book. Nobody can decline the job three minutes before pickup.</p>' +
      '<h3>3. Flight tracking is built in</h3>' +
      '<p>Apps price a wait; a chauffeur service absorbs it. Sixty minutes of free waiting on international arrivals is standard.</p>' +
      '<h3>4. Accountability</h3>' +
      '<p>When something goes wrong at 2am you want a phone number that a person answers, not an in-app support form.</p>' +
      '<h2>Cost in practice</h2>' +
      '<p>For a single passenger travelling three miles at midday, ride-hailing is almost always cheaper. For an airport transfer at peak time with luggage, the gap narrows or reverses once surge pricing, waiting charges and a second vehicle for luggage are taken into account.</p>' +
      '<h2>A simple rule</h2>' +
      '<p>If the journey matters — a flight, a client, a board meeting, an event — book it in advance. If it does not, an app is fine.</p>',
    faqs: [
      {
        question: 'Is a chauffeur always more expensive?',
        answer: '<p>Not always. For peak-time airport transfers, group travel and long-distance journeys, fixed chauffeur pricing is frequently comparable to or cheaper than surge-priced ride-hailing.</p>',
      },
    ],
    relatedPostSlugs: ['airport-transfer-guide-what-to-expect', 'business-travel-checklist'],
    cta: { label: 'Get a fixed-price quote', href: '/#enquiry', variant: 'primary', enabled: true },
    seo: {
      title: 'Chauffeur Service vs Ride-Hailing: An Honest Comparison',
      description:
        'Comparing chauffeur services and ride-hailing apps on price, reliability, vehicle quality, flight tracking and accountability — and when to use each.',
      schemaType: 'Article',
      breadcrumbLabel: 'Chauffeur vs Ride-Hailing',
    },
  },
  {
    id: 'business-travel-checklist',
    slug: 'business-travel-checklist',
    title: 'The Business Travel Ground Transport Checklist',
    excerpt:
      'Fourteen things travel managers should confirm before appointing a ground transport supplier — from duty of care to invoicing.',
    category: 'business',
    tags: ['corporate travel', 'travel management', 'duty of care'],
    status: 'published',
    publishedAt: daysAgo(25),
    readingMinutes: 5,
    author,
    featuredImage: { url: '', alt: 'Business traveller working in the rear of an executive vehicle', path: '' },
    content:
      '<p>Ground transport is usually the smallest line in a corporate travel budget and the largest source of complaints. This checklist covers what to confirm before you sign.</p>' +
      '<h2>Safety and compliance</h2>' +
      '<ul><li>Are all drivers licensed for private hire in the areas they operate?</li><li>Are enhanced background checks completed and re-run periodically?</li><li>What is the maximum vehicle age, and how often are vehicles inspected?</li><li>Is public liability and passenger insurance evidence available on request?</li></ul>' +
      '<h2>Duty of care</h2>' +
      '<ul><li>Can you retrieve a journey record — driver, vehicle, route, times — after the fact?</li><li>Is live journey tracking available for travellers in unfamiliar cities?</li><li>What is the escalation path at 3am, and who answers?</li></ul>' +
      '<h2>Service reliability</h2>' +
      '<ul><li>What on-time arrival rate is measured, and over what period?</li><li>How are flight delays handled, and what is chargeable?</li><li>What happens if a vehicle becomes unavailable at short notice?</li></ul>' +
      '<h2>Commercials</h2>' +
      '<ul><li>Is the rate card fixed, and what triggers a surcharge?</li><li>Can invoices be split by cost centre, department or project code?</li><li>Is there a minimum spend or account fee?</li><li>How are cancellations charged?</li></ul>' +
      '<h2>Sustainability</h2>' +
      '<ul><li>Is an electric or hybrid allocation available?</li><li>Can per-journey emissions be reported for ESG disclosures?</li></ul>' +
      '<p>Any supplier worth appointing will answer all fourteen without hesitation.</p>',
    faqs: [],
    relatedPostSlugs: ['chauffeur-vs-ride-hailing', 'airport-transfer-guide-what-to-expect'],
    cta: { label: 'Talk about a corporate account', href: '/corporate', variant: 'primary', enabled: true },
    seo: {
      title: 'Business Travel Ground Transport Checklist',
      description:
        'Fourteen questions travel managers should ask before appointing a chauffeur or ground transport supplier: safety, duty of care, reliability, commercials and sustainability.',
      schemaType: 'Article',
      breadcrumbLabel: 'Business Travel Checklist',
    },
  },
];

export default blogPostsSeed;
