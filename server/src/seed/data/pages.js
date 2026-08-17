/* eslint-disable max-len */

const section = (type, props = {}) => ({
  id: props.id || `${type}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  enabled: true,
  eyebrow: '',
  title: '',
  subtitle: '',
  body: '',
  image: { url: '', alt: '', path: '' },
  items: [],
  cta: { label: '', href: '', variant: 'primary', enabled: true },
  secondaryCta: { label: '', href: '', variant: 'outline', enabled: false },
  settings: { background: 'default', align: 'left', columns: 3, imagePosition: 'right' },
  ...props,
});

const legalSeo = (title, description) => ({
  title,
  description,
  schemaType: 'WebPage',
  noindex: false,
  breadcrumbLabel: title,
});

/* -------------------------------------------------------------------------- */

export const pagesSeed = [
  /* ------------------------------- Homepage ------------------------------- */
  {
    id: 'home',
    slug: 'home',
    path: '/',
    title: 'Premium Chauffeur & Private Transfer Service',
    h1: 'Chauffeur-driven travel, without the uncertainty',
    subtitle:
      'Fixed prices, vetted professional chauffeurs and immaculate executive vehicles for airport transfers, city-to-city journeys and hourly hire.',
    status: 'published',
    isSystem: true,
    sitemapPriority: 1,
    sitemapChangefreq: 'weekly',
    sections: [
      section('hero', {
        id: 'home-hero',
        eyebrow: 'Available 24 hours a day, 365 days a year',
        title: 'Chauffeur-driven travel, without the uncertainty',
        subtitle:
          'Fixed prices agreed before you travel. Vetted, professional chauffeurs. Executive vehicles that arrive early, every time.',
        cta: { label: 'Get an instant quote', href: '#enquiry', variant: 'primary', enabled: true },
        secondaryCta: { label: 'View our fleet', href: '/fleet', variant: 'outline', enabled: true },
        items: [
          { title: 'Flight tracking included', icon: 'plane' },
          { title: 'Fixed, all-inclusive pricing', icon: 'shield' },
          { title: 'Vetted, licensed chauffeurs', icon: 'badge' },
          { title: '24/7 human support', icon: 'headset' },
        ],
        settings: { background: 'dark', align: 'left', layout: 'booking', anchorId: 'enquiry' },
      }),
      section('services', {
        id: 'home-services',
        eyebrow: 'What we do',
        title: 'Three services, one standard',
        subtitle:
          'Whether you are landing at 6am, crossing the country for a client meeting or moving between appointments all day, the service level does not change.',
        settings: { background: 'default', align: 'center', columns: 3 },
      }),
      section('features', {
        id: 'home-why',
        eyebrow: 'Why clients stay with us',
        title: 'The details that make the difference',
        settings: { background: 'muted', align: 'center', columns: 4 },
        items: [
          {
            title: 'Fixed prices, no surge',
            description:
              'The price we quote includes the vehicle, chauffeur, fuel, tolls, parking, waiting time and VAT. It does not change because it is raining.',
            icon: 'shield',
          },
          {
            title: 'Chauffeurs, not drivers',
            description:
              'Every chauffeur is licensed, background-checked and trained in defensive driving and discreet client service before they carry a passenger.',
            icon: 'badge',
          },
          {
            title: 'We arrive before you do',
            description:
              'Chauffeurs are dispatched to be on site ahead of the booked time, with live flight and traffic monitoring adjusting the plan automatically.',
            icon: 'clock',
          },
          {
            title: 'Real people, around the clock',
            description:
              'A human answers the phone at 3am. Every booking includes direct contact details for your chauffeur and our operations desk.',
            icon: 'headset',
          },
        ],
      }),
      section('steps', {
        id: 'home-how',
        eyebrow: 'How it works',
        title: 'Booking takes about ninety seconds',
        settings: { background: 'default', align: 'center', columns: 4 },
        items: [
          {
            title: 'Tell us the journey',
            description: 'Pickup, destination, date, time and how many of you are travelling.',
            value: '01',
          },
          {
            title: 'Receive a fixed quote',
            description: 'We confirm availability and a fully inclusive price, usually within the hour.',
            value: '02',
          },
          {
            title: 'Confirm your booking',
            description: 'Approve the quote and we allocate a vehicle and a named chauffeur.',
            value: '03',
          },
          {
            title: 'Travel',
            description:
              'You receive your chauffeur’s details before pickup and can contact them directly at any time.',
            value: '04',
          },
        ],
        cta: { label: 'See how it works in detail', href: '/how-it-works', variant: 'ghost', enabled: true },
      }),
      section('vehicles', {
        id: 'home-fleet',
        eyebrow: 'The fleet',
        title: 'Choose the right vehicle for the journey',
        subtitle:
          'From executive saloons to sixteen-seat minibuses, every vehicle is under five years old and inspected on a fixed schedule.',
        settings: { background: 'muted', align: 'center', columns: 4, limit: 4 },
        cta: { label: 'View the full fleet', href: '/fleet', variant: 'outline', enabled: true },
      }),
      section('coverage', {
        id: 'home-coverage',
        eyebrow: 'Where we operate',
        title: 'Airports, cities and popular routes',
        subtitle: 'Fixed-price transfers to and from every major airport, with long-distance routes covered nationwide.',
        settings: { background: 'default', align: 'center', columns: 3 },
      }),
      section('testimonials', {
        id: 'home-testimonials',
        eyebrow: 'Client feedback',
        title: 'Trusted by travellers and travel managers',
        settings: { background: 'dark', align: 'center', columns: 3, limit: 3 },
      }),
      section('faq', {
        id: 'home-faq',
        eyebrow: 'Questions',
        title: 'Everything you might be wondering',
        settings: { background: 'default', align: 'center', limit: 6 },
        cta: { label: 'Read all FAQs', href: '/faq', variant: 'ghost', enabled: true },
      }),
      section('blogList', {
        id: 'home-blog',
        eyebrow: 'Travel guides',
        title: 'Advice for smoother journeys',
        settings: { background: 'muted', align: 'center', columns: 3, limit: 3 },
        cta: { label: 'Read the blog', href: '/blog', variant: 'ghost', enabled: true },
      }),
      section('cta', {
        id: 'home-cta',
        title: 'Ready to book your journey?',
        subtitle: 'Tell us where you are going and we will come back with a fixed price, usually within the hour.',
        cta: { label: 'Get a quote', href: '#enquiry', variant: 'primary', enabled: true },
        secondaryCta: { label: 'Talk to our team', href: '/contact', variant: 'outline', enabled: true },
        settings: { background: 'accent', align: 'center' },
      }),
    ],
    seo: {
      title: 'Premium Chauffeur & Private Transfer Service',
      description:
        'Chauffeur-driven airport transfers, city-to-city journeys and hourly hire. Fixed transparent pricing, vetted professional drivers and executive vehicles, available 24/7.',
      schemaType: 'WebPage',
      breadcrumbLabel: 'Home',
      keywords: ['chauffeur service', 'airport transfer', 'executive car hire', 'private transfer'],
    },
  },

  /* ------------------------------- About Us ------------------------------- */
  {
    id: 'about-us',
    slug: 'about-us',
    path: '/about-us',
    title: 'About Us',
    h1: 'A chauffeur company built around reliability',
    subtitle:
      'We started with two vehicles and a simple promise: arrive early, quote honestly and never make the client chase us.',
    status: 'published',
    sections: [
      section('hero', {
        title: 'A chauffeur company built around reliability',
        subtitle:
          'We started with two vehicles and a simple promise: arrive early, quote honestly and never make the client chase us.',
        settings: { background: 'dark', align: 'left', layout: 'compact' },
        cta: { label: 'Talk to our team', href: '/contact', variant: 'primary', enabled: true },
      }),
      section('richText', {
        title: 'Our story',
        body:
          '<p>We began operating in 2014 with two executive saloons and a handful of corporate clients who were tired of unreliable transport. The proposition was straightforward: a fixed price agreed in advance, a chauffeur who arrives before the booked time, and a phone that is answered by a person.</p>' +
          '<p>A decade later the fleet has grown considerably and we handle everything from single airport runs to multi-day event logistics, but the operating principles have not changed. We still measure ourselves on the same three things: on-time arrival, price accuracy and how quickly a human responds when something needs to change.</p>' +
          '<h2>How we work</h2>' +
          '<p>Chauffeurs are employed and trained rather than loosely contracted, which is why service is consistent. Vehicles are maintained on a fixed schedule and retired at five years. Every journey is monitored by an operations desk that is staffed around the clock, so a delayed flight or a change of plan is handled before you have to ask.</p>',
        settings: { background: 'default', align: 'left' },
      }),
      section('stats', {
        title: 'Where we are today',
        settings: { background: 'muted', align: 'center', columns: 4 },
        items: [
          { value: '10+', title: 'Years operating', description: 'Continuously since 2014' },
          { value: '99.2%', title: 'On-time arrival', description: 'Rolling twelve-month average' },
          { value: '120+', title: 'Vetted chauffeurs', description: 'Licensed and background checked' },
          { value: '24/7', title: 'Operations desk', description: 'Answered by a person' },
        ],
      }),
      section('features', {
        eyebrow: 'What we stand for',
        title: 'Four commitments we do not compromise on',
        settings: { background: 'default', align: 'center', columns: 4 },
        items: [
          {
            title: 'Punctuality',
            description: 'Chauffeurs are dispatched to arrive ahead of schedule, with traffic and flight data monitored live.',
            icon: 'clock',
          },
          {
            title: 'Transparency',
            description: 'One inclusive price, quoted before you travel and matched exactly on the invoice.',
            icon: 'shield',
          },
          {
            title: 'Discretion',
            description: 'Confidential conversations stay in the car. Our chauffeurs are trained accordingly.',
            icon: 'lock',
          },
          {
            title: 'Safety',
            description: 'Enhanced background checks, defensive driving training and a fully insured, inspected fleet.',
            icon: 'badge',
          },
        ],
      }),
      section('testimonials', {
        eyebrow: 'Client feedback',
        title: 'What our clients say',
        settings: { background: 'muted', align: 'center', columns: 3, limit: 3 },
      }),
      section('cta', {
        title: 'Let’s talk about your travel',
        subtitle: 'Whether it is a single transfer or an ongoing corporate programme, we would be glad to help.',
        cta: { label: 'Contact us', href: '/contact', variant: 'primary', enabled: true },
        secondaryCta: { label: 'Corporate travel', href: '/corporate', variant: 'outline', enabled: true },
        settings: { background: 'accent', align: 'center' },
      }),
    ],
    seo: {
      title: 'About Us',
      description:
        'Learn about our chauffeur company: a decade of reliable, fixed-price private transfers with employed, vetted chauffeurs and a 24/7 operations desk.',
      schemaType: 'WebPage',
      breadcrumbLabel: 'About Us',
    },
  },

  /* ----------------------------- How It Works ----------------------------- */
  {
    id: 'how-it-works',
    slug: 'how-it-works',
    path: '/how-it-works',
    title: 'How It Works',
    h1: 'How booking a chauffeur works',
    subtitle: 'From first enquiry to arriving at your destination, here is exactly what happens.',
    status: 'published',
    sections: [
      section('hero', {
        title: 'How booking a chauffeur works',
        subtitle: 'From first enquiry to arriving at your destination, here is exactly what happens.',
        settings: { background: 'dark', align: 'left', layout: 'compact' },
      }),
      section('steps', {
        title: 'Four steps, start to finish',
        settings: { background: 'default', align: 'center', columns: 4 },
        items: [
          {
            value: '01',
            title: 'Send us the journey details',
            description:
              'Use the quote form or call us. We need the pickup address, destination, date, time and the number of passengers and bags. For airport pickups, add the flight number.',
          },
          {
            value: '02',
            title: 'We confirm availability and price',
            description:
              'Our team checks vehicle and chauffeur availability and sends a fully inclusive fixed price, normally within the hour and always within four hours.',
          },
          {
            value: '03',
            title: 'You confirm the booking',
            description:
              'Approve the quote and pay securely by card, or have it billed to your corporate account. You receive a written confirmation immediately.',
          },
          {
            value: '04',
            title: 'Your chauffeur arrives',
            description:
              'The evening before, we send your chauffeur’s name, photo, mobile number and vehicle registration. They arrive ahead of the booked time.',
          },
        ],
      }),
      section('imageText', {
        eyebrow: 'On the day',
        title: 'What happens at the airport',
        body:
          '<p>We track your inbound flight from the moment it departs. If it is delayed, your pickup moves automatically — you do not need to tell us.</p>' +
          '<p>Your chauffeur parks, walks into the terminal and waits in the arrivals hall with a name board. International arrivals include 60 minutes of free waiting from the actual landing time; domestic arrivals include 30 minutes.</p>' +
          '<p>If you cannot find your chauffeur, their direct mobile number is in your confirmation email and SMS, and our operations desk is available 24 hours a day.</p>',
        settings: { background: 'muted', align: 'left', imagePosition: 'right' },
      }),
      section('features', {
        eyebrow: 'Included as standard',
        title: 'Every journey includes',
        settings: { background: 'default', align: 'center', columns: 3 },
        items: [
          { title: 'A fixed, inclusive price', description: 'Fuel, tolls, parking, congestion charges and VAT are all in the quote.', icon: 'shield' },
          { title: 'Chauffeur details in advance', description: 'Name, photo, mobile number and vehicle registration, sent before pickup.', icon: 'user' },
          { title: 'Complimentary waiting time', description: '60 minutes at international arrivals, 30 domestic, 15 minutes elsewhere.', icon: 'clock' },
          { title: 'Bottled water and charging', description: 'Refreshments and phone charging in every vehicle.', icon: 'sparkle' },
          { title: 'Child seats on request', description: 'Infant carriers, child seats and boosters at no extra charge.', icon: 'baby' },
          { title: '24/7 operations support', description: 'A person answers, at any hour, on any day of the year.', icon: 'headset' },
        ],
      }),
      section('faq', {
        title: 'Common questions about booking',
        settings: { background: 'muted', align: 'center', category: 'booking', limit: 8 },
      }),
      section('cta', {
        title: 'Ready when you are',
        subtitle: 'Send us your journey details and we will come back with a fixed price.',
        cta: { label: 'Get a quote', href: '/#enquiry', variant: 'primary', enabled: true },
        settings: { background: 'accent', align: 'center' },
      }),
    ],
    seo: {
      title: 'How It Works',
      description:
        'How to book a chauffeur with us: send your journey details, receive a fixed inclusive quote, confirm, and travel. Flight tracking and waiting time included.',
      breadcrumbLabel: 'How It Works',
    },
  },

  /* ----------------------------- Why Choose Us ---------------------------- */
  {
    id: 'why-choose-us',
    slug: 'why-choose-us',
    path: '/why-choose-us',
    title: 'Why Choose Us',
    h1: 'Why clients choose us over an app',
    subtitle: 'Ride-hailing is convenient until it matters. Here is where a chauffeur service is different.',
    status: 'published',
    sections: [
      section('hero', {
        title: 'Why clients choose us over an app',
        subtitle: 'Ride-hailing is convenient until it matters. Here is where a chauffeur service is different.',
        settings: { background: 'dark', align: 'left', layout: 'compact' },
      }),
      section('features', {
        eyebrow: 'The difference',
        title: 'Six reasons clients move their travel to us',
        settings: { background: 'default', align: 'center', columns: 3 },
        items: [
          {
            title: 'The price does not move',
            description:
              'No surge pricing at 6am or in the rain. The fixed quote covers the vehicle, chauffeur, fuel, tolls, parking and VAT.',
            icon: 'shield',
          },
          {
            title: 'A named chauffeur, allocated in advance',
            description:
              'You know who is collecting you, in which vehicle, before the day. Not whoever happens to accept the job.',
            icon: 'user',
          },
          {
            title: 'Flights are tracked, not guessed',
            description:
              'Delays adjust your pickup automatically. Nobody cancels on you because you were slow through passport control.',
            icon: 'plane',
          },
          {
            title: 'Vehicles you would put a client in',
            description:
              'Executive saloons and MPVs under five years old, cleaned between every journey and inspected on schedule.',
            icon: 'car',
          },
          {
            title: 'Accountability when plans change',
            description:
              'A staffed operations desk 24/7. A real person who can re-route, re-time or re-allocate a vehicle in minutes.',
            icon: 'headset',
          },
          {
            title: 'Invoicing that finance teams accept',
            description:
              'Consolidated monthly billing with cost-centre and project-code reporting for corporate accounts.',
            icon: 'file',
          },
        ],
      }),
      section('stats', {
        settings: { background: 'muted', align: 'center', columns: 4 },
        items: [
          { value: '99.2%', title: 'On-time arrival rate', description: '' },
          { value: '<60min', title: 'Average quote turnaround', description: '' },
          { value: '4.9/5', title: 'Average client rating', description: '' },
          { value: '0', title: 'Surge price surcharges', description: '' },
        ],
      }),
      section('testimonials', {
        title: 'In our clients’ words',
        settings: { background: 'default', align: 'center', columns: 3, limit: 6 },
      }),
      section('cta', {
        title: 'See the difference on your next journey',
        cta: { label: 'Get a quote', href: '/#enquiry', variant: 'primary', enabled: true },
        secondaryCta: { label: 'Compare our fleet', href: '/fleet', variant: 'outline', enabled: true },
        settings: { background: 'accent', align: 'center' },
      }),
    ],
    seo: {
      title: 'Why Choose Us',
      description:
        'Fixed pricing with no surge, named chauffeurs allocated in advance, live flight tracking and a 24/7 operations desk. Why clients choose a chauffeur service over an app.',
      breadcrumbLabel: 'Why Choose Us',
    },
  },

  /* ------------------------------- Corporate ------------------------------ */
  {
    id: 'corporate',
    slug: 'corporate',
    path: '/corporate',
    title: 'Corporate & Business Travel',
    h1: 'Corporate chauffeur services',
    subtitle:
      'Consolidated invoicing, agreed rate cards, priority allocation and a named account manager for organisations that travel regularly.',
    status: 'published',
    sections: [
      section('hero', {
        eyebrow: 'For businesses',
        title: 'Corporate chauffeur services',
        subtitle:
          'Consolidated invoicing, agreed rate cards, priority allocation and a named account manager for organisations that travel regularly.',
        cta: { label: 'Request a corporate account', href: '#corporate-enquiry', variant: 'primary', enabled: true },
        secondaryCta: { label: 'Download rate card', href: '/contact', variant: 'outline', enabled: false },
        settings: { background: 'dark', align: 'left', layout: 'compact', anchorId: 'corporate-hero' },
      }),
      section('features', {
        eyebrow: 'Account benefits',
        title: 'Built for travel managers and finance teams',
        settings: { background: 'default', align: 'center', columns: 3 },
        items: [
          { title: 'Monthly consolidated invoicing', description: 'One invoice, itemised by traveller, cost centre, department or project code.', icon: 'file' },
          { title: 'Agreed rate cards', description: 'Fixed negotiated rates for your most frequent routes, reviewed annually.', icon: 'shield' },
          { title: 'Priority allocation', description: 'Account bookings are allocated first, including at peak times and short notice.', icon: 'clock' },
          { title: 'Named account manager', description: 'A single point of contact who knows your travellers and your policies.', icon: 'user' },
          { title: 'Duty-of-care reporting', description: 'Journey records, driver details and live tracking for traveller safety obligations.', icon: 'badge' },
          { title: 'Sustainability reporting', description: 'Electric-only allocation available with per-journey emissions reporting.', icon: 'leaf' },
        ],
      }),
      section('steps', {
        eyebrow: 'Getting set up',
        title: 'From enquiry to first booking in a week',
        settings: { background: 'muted', align: 'center', columns: 4 },
        items: [
          { value: '01', title: 'Tell us about your travel', description: 'Volumes, routes, vehicle preferences and policy requirements.' },
          { value: '02', title: 'Receive a proposal', description: 'A tailored rate card and service agreement, usually within two working days.' },
          { value: '03', title: 'Account setup', description: 'We configure cost centres, approved bookers, billing and reporting.' },
          { value: '04', title: 'Start booking', description: 'Your team books by email, phone or through your named account manager.' },
        ],
      }),
      section('richText', {
        title: 'Who we work with',
        body:
          '<p>Our corporate clients range from professional services firms sending partners to client sites, to conference organisers moving hundreds of delegates over a weekend.</p>' +
          '<ul><li><strong>Professional and financial services</strong> — executive travel, client collection and roadshows</li><li><strong>Technology and media</strong> — production crews, equipment transport and event logistics</li><li><strong>Healthcare and life sciences</strong> — consultant travel and confidential patient transport</li><li><strong>Events and hospitality</strong> — delegate transfers, VIP handling and multi-vehicle coordination</li><li><strong>Private offices and family offices</strong> — discreet, long-standing arrangements with preferred chauffeurs</li></ul>',
        settings: { background: 'default', align: 'left' },
      }),
      section('contactForm', {
        id: 'corporate-enquiry-section',
        eyebrow: 'Get started',
        title: 'Request a corporate account',
        subtitle: 'Tell us about your requirements and we will arrange a call within one working day.',
        settings: { background: 'muted', align: 'center', layout: 'corporate', anchorId: 'corporate-enquiry' },
      }),
      section('faq', {
        title: 'Corporate account questions',
        settings: { background: 'default', align: 'center', category: 'corporate', limit: 6 },
      }),
    ],
    seo: {
      title: 'Corporate & Business Travel',
      description:
        'Corporate chauffeur accounts with consolidated monthly invoicing, agreed rate cards, priority allocation, duty-of-care reporting and a named account manager.',
      breadcrumbLabel: 'Corporate',
    },
  },

  /* -------------------------------- Contact ------------------------------- */
  {
    id: 'contact',
    slug: 'contact',
    path: '/contact',
    title: 'Contact Us',
    h1: 'Contact our team',
    subtitle: 'Call us at any hour, or send a message and we will reply the same day.',
    status: 'published',
    sections: [
      section('hero', {
        title: 'Contact our team',
        subtitle: 'Call us at any hour, or send a message and we will reply the same day.',
        settings: { background: 'dark', align: 'left', layout: 'compact' },
      }),
      section('contactInfo', {
        title: 'How to reach us',
        settings: { background: 'default', align: 'left', columns: 3 },
      }),
      section('contactForm', {
        id: 'contact-form-section',
        title: 'Send us a message',
        subtitle: 'Fields marked with an asterisk are required. We reply to every message.',
        settings: { background: 'muted', align: 'center', layout: 'contact', anchorId: 'contact-form' },
      }),
      section('faq', {
        title: 'You might find your answer here',
        settings: { background: 'default', align: 'center', limit: 5 },
        cta: { label: 'Read all FAQs', href: '/faq', variant: 'ghost', enabled: true },
      }),
    ],
    seo: {
      title: 'Contact Us',
      description:
        'Contact our chauffeur team by phone, email or message. Available 24 hours a day, 7 days a week for bookings, quotes and support.',
      breadcrumbLabel: 'Contact',
      schemaType: 'LocalBusiness',
    },
  },

  /* ---------------------------------- FAQ --------------------------------- */
  {
    id: 'faq',
    slug: 'faq',
    path: '/faq',
    title: 'Frequently Asked Questions',
    h1: 'Frequently asked questions',
    subtitle: 'Answers to the questions we are asked most often about booking, pricing, airports and our fleet.',
    status: 'published',
    sections: [
      section('hero', {
        title: 'Frequently asked questions',
        subtitle: 'Answers to the questions we are asked most often about booking, pricing, airports and our fleet.',
        settings: { background: 'dark', align: 'left', layout: 'compact' },
      }),
      section('faq', {
        title: '',
        settings: { background: 'default', align: 'left', layout: 'grouped' },
      }),
      section('cta', {
        title: 'Still need help?',
        subtitle: 'Our support team is available 24 hours a day.',
        cta: { label: 'Contact support', href: '/help', variant: 'primary', enabled: true },
        secondaryCta: { label: 'Send a message', href: '/contact', variant: 'outline', enabled: true },
        settings: { background: 'accent', align: 'center' },
      }),
    ],
    seo: {
      title: 'Frequently Asked Questions',
      description:
        'Answers about booking a chauffeur, fixed pricing, airport meet-and-greet, waiting time, luggage, child seats, cancellations and corporate accounts.',
      breadcrumbLabel: 'FAQ',
      schemaType: 'FAQPage',
    },
  },

  /* --------------------------------- Help --------------------------------- */
  {
    id: 'help',
    slug: 'help',
    path: '/help',
    title: 'Help & Support',
    h1: 'Help and support',
    subtitle: 'Existing booking, billing question or something that did not go to plan — this is the fastest route to a person.',
    status: 'published',
    sections: [
      section('hero', {
        title: 'Help and support',
        subtitle:
          'Existing booking, billing question or something that did not go to plan — this is the fastest route to a person.',
        settings: { background: 'dark', align: 'left', layout: 'compact' },
      }),
      section('features', {
        eyebrow: 'Common requests',
        title: 'What do you need help with?',
        settings: { background: 'default', align: 'center', columns: 3 },
        items: [
          { title: 'Change or cancel a booking', description: 'Use the support form below with your booking reference, or call us for changes within four hours of pickup.', icon: 'clock' },
          { title: 'Billing and invoices', description: 'Request a copy invoice, a VAT receipt or a query on a charge.', icon: 'file' },
          { title: 'Lost property', description: 'Tell us the journey date and what you have lost. We check the vehicle the same day.', icon: 'search' },
          { title: 'Make a complaint', description: 'Complaints go straight to a manager and are acknowledged within one working day.', icon: 'alert' },
          { title: 'Technical problems', description: 'Trouble with the website, a confirmation email or a payment link.', icon: 'tool' },
          { title: 'Something else', description: 'If none of these fit, send us the details and we will route it to the right person.', icon: 'headset' },
        ],
      }),
      section('contactForm', {
        id: 'support-form-section',
        title: 'Open a support request',
        subtitle: 'Include your booking reference if you have one so we can find your journey immediately.',
        settings: { background: 'muted', align: 'center', layout: 'support', anchorId: 'support-form' },
      }),
      section('contactInfo', {
        title: 'Prefer to talk?',
        settings: { background: 'default', align: 'left', columns: 3 },
      }),
    ],
    seo: {
      title: 'Help & Support',
      description:
        'Get help with an existing booking, billing, lost property or a complaint. Support available 24 hours a day, 7 days a week.',
      breadcrumbLabel: 'Help',
    },
  },

  /* --------------------------------- Fleet -------------------------------- */
  {
    id: 'fleet',
    slug: 'fleet',
    path: '/fleet',
    title: 'Our Fleet',
    h1: 'Our fleet',
    subtitle:
      'Executive saloons, first-class luxury, spacious MPVs, electric vehicles and group minibuses — all under five years old.',
    status: 'published',
    isSystem: true,
    sitemapPriority: 0.9,
    sections: [
      section('cta', {
        title: 'Not sure which vehicle you need?',
        subtitle: 'Tell us how many passengers and bags you have and we will recommend the right class.',
        cta: { label: 'Ask our team', href: '/contact', variant: 'primary', enabled: true },
        settings: { background: 'accent', align: 'center' },
      }),
    ],
    seo: {
      title: 'Our Fleet | Executive Cars, MPVs & Minibuses',
      description:
        'Browse our chauffeur fleet: executive saloons, first-class luxury saloons, seven-seat MPVs, electric executives and sixteen-seat minibuses.',
      breadcrumbLabel: 'Fleet',
    },
  },

  /* --------------------------------- Blog --------------------------------- */
  {
    id: 'blog',
    slug: 'blog',
    path: '/blog',
    title: 'Travel Guides & News',
    h1: 'Travel guides and news',
    subtitle: 'Practical advice on airport travel, business journeys and getting the most from a chauffeur service.',
    status: 'published',
    isSystem: true,
    sitemapPriority: 0.7,
    sitemapChangefreq: 'daily',
    sections: [],
    seo: {
      title: 'Travel Guides & News',
      description:
        'Chauffeur travel guides, airport transfer advice, business travel tips and company news.',
      breadcrumbLabel: 'Blog',
    },
  },

  /* ------------------------------- Thank you ------------------------------ */
  {
    id: 'thank-you',
    slug: 'thank-you',
    path: '/thank-you',
    title: 'Thank You',
    h1: 'Thank you — we have your request',
    subtitle: 'A member of our team will be in touch shortly.',
    status: 'published',
    isSystem: true,
    showInSitemap: false,
    sections: [
      section('features', {
        title: 'What happens next',
        settings: { background: 'default', align: 'center', columns: 3 },
        items: [
          { title: 'We review your request', description: 'Our operations team checks vehicle and chauffeur availability for your journey.', icon: 'search' },
          { title: 'You receive a fixed quote', description: 'Normally within the hour, always within four hours, by email.', icon: 'file' },
          { title: 'You confirm and travel', description: 'Approve the quote and we send your chauffeur’s details before pickup.', icon: 'car' },
        ],
      }),
      section('cta', {
        title: 'While you wait',
        subtitle: 'Have a look at the fleet or read our airport travel guides.',
        cta: { label: 'View the fleet', href: '/fleet', variant: 'primary', enabled: true },
        secondaryCta: { label: 'Read travel guides', href: '/blog', variant: 'outline', enabled: true },
        settings: { background: 'muted', align: 'center' },
      }),
    ],
    seo: {
      title: 'Thank You',
      description: 'Thank you for your enquiry. Our team will be in touch shortly.',
      noindex: true,
      breadcrumbLabel: 'Thank You',
    },
  },

  /* ------------------------------- Not found ------------------------------ */
  {
    id: 'not-found',
    slug: '404',
    path: '/404',
    title: 'Page Not Found',
    h1: 'We could not find that page',
    subtitle: 'The link may be out of date, or the page may have moved.',
    status: 'published',
    isSystem: true,
    showInSitemap: false,
    sections: [
      section('features', {
        title: 'Try one of these instead',
        settings: { background: 'default', align: 'center', columns: 3 },
        items: [
          { title: 'Airport transfers', description: 'Flight-tracked pickups with meet and greet.', icon: 'plane', link: { label: 'Airport transfers', href: '/airport-transfer', variant: 'ghost', enabled: true } },
          { title: 'Our fleet', description: 'Executive saloons through to sixteen-seat minibuses.', icon: 'car', link: { label: 'View the fleet', href: '/fleet', variant: 'ghost', enabled: true } },
          { title: 'Contact us', description: 'Speak to a person, 24 hours a day.', icon: 'headset', link: { label: 'Contact us', href: '/contact', variant: 'ghost', enabled: true } },
        ],
      }),
    ],
    seo: {
      title: 'Page Not Found',
      description: 'The page you requested could not be found.',
      noindex: true,
      breadcrumbLabel: 'Not Found',
    },
  },

  /* --------------------------------- Legal -------------------------------- */
  {
    id: 'privacy-policy',
    slug: 'privacy-policy',
    path: '/privacy-policy',
    title: 'Privacy Policy',
    h1: 'Privacy policy',
    subtitle: 'How we collect, use and protect your personal information.',
    status: 'published',
    sitemapPriority: 0.3,
    sitemapChangefreq: 'yearly',
    sections: [
      section('richText', {
        body:
          '<p><strong>Last updated:</strong> this policy is maintained by the site administrator and should be reviewed by your legal adviser before launch.</p>' +
          '<h2>1. Who we are</h2><p>This privacy policy explains how we collect and process personal data when you use this website, request a quote, make a booking or contact our support team. We are the data controller for that information.</p>' +
          '<h2>2. Information we collect</h2><ul><li><strong>Contact details</strong> — name, email address and telephone number you provide in our forms.</li><li><strong>Journey details</strong> — pickup and destination addresses, dates, times, passenger and luggage numbers, and flight numbers.</li><li><strong>Account information</strong> — if you create an account, your email address, display name and authentication identifiers.</li><li><strong>Technical information</strong> — a hashed record of your IP address, your browser user agent and the page you submitted a form from, used to prevent abuse.</li><li><strong>Analytics data</strong> — where you have consented, aggregated usage statistics collected through our analytics provider.</li></ul>' +
          '<h2>3. How we use your information</h2><ul><li>To prepare quotes and fulfil bookings you request</li><li>To contact you about a journey or an enquiry</li><li>To provide customer support and handle complaints</li><li>To meet our legal, insurance and licensing obligations</li><li>To prevent fraud and abuse of our forms</li><li>To send marketing communications where you have opted in</li></ul>' +
          '<h2>4. Legal bases</h2><p>We process your data to perform a contract with you, to comply with legal obligations, on the basis of our legitimate interest in operating and securing our service, and — for marketing and non-essential cookies — on the basis of your consent.</p>' +
          '<h2>5. Sharing your information</h2><p>We share journey details with the chauffeur allocated to your booking. We use trusted processors for hosting, database storage, email delivery and analytics. We do not sell personal data.</p>' +
          '<h2>6. Retention</h2><p>Enquiry and booking records are retained for as long as necessary to provide the service and to meet accounting and legal requirements. Marketing consents are retained until you withdraw them.</p>' +
          '<h2>7. Your rights</h2><p>You may request access to, correction of, or deletion of your personal data, object to processing, request restriction, or request portability. You may also withdraw consent at any time and complain to your data protection regulator.</p>' +
          '<h2>8. Security</h2><p>Data is stored in managed cloud infrastructure with encryption in transit and at rest. Administrative access is restricted, authenticated and role-controlled.</p>' +
          '<h2>9. Contact</h2><p>To exercise any of your rights, or if you have questions about this policy, please contact us using the details on our contact page.</p>',
        settings: { background: 'default', align: 'left', layout: 'prose' },
      }),
    ],
    seo: legalSeo('Privacy Policy', 'How we collect, use, share and protect your personal information, and the rights you have over your data.'),
  },
  {
    id: 'terms-and-conditions',
    slug: 'terms-and-conditions',
    path: '/terms-and-conditions',
    title: 'Terms & Conditions',
    h1: 'Terms and conditions',
    subtitle: 'The terms on which we provide our chauffeur and private transfer services.',
    status: 'published',
    sitemapPriority: 0.3,
    sitemapChangefreq: 'yearly',
    sections: [
      section('richText', {
        body:
          '<p><strong>Please note:</strong> these terms are a starting point maintained in the CMS and should be reviewed by your legal adviser before launch.</p>' +
          '<h2>1. About these terms</h2><p>These terms apply to all quotations, bookings and journeys provided by us. By requesting a quote or confirming a booking you accept them.</p>' +
          '<h2>2. Quotations</h2><p>Quotations are valid for 7 days unless stated otherwise and are based on the journey details you supply. If those details change materially — a different pickup address, additional stops, more passengers or luggage than declared — the price may be revised.</p>' +
          '<h2>3. Bookings</h2><p>A booking is confirmed only when we issue a written confirmation. We allocate a vehicle class rather than a specific model; the example models listed on our fleet pages are indicative.</p>' +
          '<h2>4. Prices and payment</h2><p>Quoted prices are inclusive of the vehicle, chauffeur, fuel, mileage within the agreed journey, tolls, congestion and clean-air charges, airport parking and VAT. Additional waiting time, additional stops and route changes made on the day are chargeable.</p>' +
          '<h2>5. Waiting time</h2><p>Airport pickups include 60 minutes of complimentary waiting time from the actual landing time on international arrivals and 30 minutes on domestic arrivals. All other pickups include 15 minutes. Additional waiting is charged in 15-minute increments at the applicable hourly rate.</p>' +
          '<h2>6. Cancellations</h2><p>Cancellation charges are set out in our cancellation and refund policy, which forms part of these terms.</p>' +
          '<h2>7. Your responsibilities</h2><ul><li>Provide accurate pickup and destination details and a contactable telephone number</li><li>Declare the correct number of passengers and items of luggage</li><li>Wear seat belts and follow reasonable instructions from the chauffeur</li><li>Not smoke or vape in the vehicle</li><li>Supervise children and inform us of child seat requirements in advance</li></ul>' +
          '<h2>8. Our responsibilities and liability</h2><p>We will provide the service with reasonable care and skill. We are not liable for delays caused by circumstances outside our reasonable control, including severe weather, road closures, accidents and industrial action. Nothing in these terms limits liability for death or personal injury caused by negligence, or for fraud.</p>' +
          '<h2>9. Lost property</h2><p>Items found in a vehicle are logged and retained for 30 days. We will make reasonable efforts to return them; return postage may be chargeable.</p>' +
          '<h2>10. Complaints</h2><p>Complaints should be raised through our support form within 14 days of the journey. We acknowledge complaints within one working day and aim to resolve them within ten.</p>' +
          '<h2>11. Governing law</h2><p>These terms are governed by the laws of the jurisdiction in which our company is registered, and the courts of that jurisdiction have exclusive jurisdiction.</p>',
        settings: { background: 'default', align: 'left', layout: 'prose' },
      }),
    ],
    seo: legalSeo('Terms & Conditions', 'The terms on which we provide chauffeur and private transfer services, including quotations, pricing, waiting time and liability.'),
  },
  {
    id: 'cookie-policy',
    slug: 'cookie-policy',
    path: '/cookie-policy',
    title: 'Cookie Policy',
    h1: 'Cookie policy',
    subtitle: 'What cookies we use, why we use them and how you can control them.',
    status: 'published',
    sitemapPriority: 0.3,
    sitemapChangefreq: 'yearly',
    sections: [
      section('richText', {
        body:
          '<h2>1. What cookies are</h2><p>Cookies are small text files stored on your device by your browser. Similar technologies include local storage and session storage, which this website also uses.</p>' +
          '<h2>2. Cookies we use</h2>' +
          '<table><thead><tr><th>Category</th><th>Purpose</th><th>Consent required</th></tr></thead><tbody>' +
          '<tr><td>Strictly necessary</td><td>Keeping you signed in, remembering your cookie preferences and protecting forms from abuse.</td><td>No</td></tr>' +
          '<tr><td>Analytics</td><td>Understanding which pages are used so we can improve them. Data is aggregated.</td><td>Yes</td></tr>' +
          '<tr><td>Marketing</td><td>Measuring the effectiveness of campaigns and showing relevant advertising.</td><td>Yes</td></tr>' +
          '</tbody></table>' +
          '<h2>3. Managing your preferences</h2><p>When you first visit the site you are asked to accept or decline non-essential cookies. You can change your choice at any time using the cookie preferences link in the footer. Declining non-essential cookies does not affect your ability to request a quote or make a booking.</p>' +
          '<h2>4. Browser controls</h2><p>Most browsers let you block or delete cookies through their settings. Blocking strictly necessary cookies may prevent parts of the site, such as signing in, from working.</p>' +
          '<h2>5. Third parties</h2><p>Where analytics or tag management is enabled by our administrator, those providers may set their own cookies. Their use of data is governed by their own privacy policies.</p>' +
          '<h2>6. Changes</h2><p>We update this policy whenever the cookies we use change. The current version is always published here.</p>',
        settings: { background: 'default', align: 'left', layout: 'prose' },
      }),
    ],
    seo: legalSeo('Cookie Policy', 'The cookies and similar technologies this website uses, what they do, and how to control your preferences.'),
  },
  {
    id: 'cancellation-and-refund-policy',
    slug: 'cancellation-and-refund-policy',
    path: '/cancellation-and-refund-policy',
    title: 'Cancellation & Refund Policy',
    h1: 'Cancellation and refund policy',
    subtitle: 'How cancellations, amendments, no-shows and refunds are handled.',
    status: 'published',
    sitemapPriority: 0.3,
    sitemapChangefreq: 'yearly',
    sections: [
      section('richText', {
        body:
          '<h2>1. Cancelling a booking</h2>' +
          '<table><thead><tr><th>When you cancel</th><th>Charge</th></tr></thead><tbody>' +
          '<tr><td>More than 24 hours before pickup</td><td>No charge — full refund</td></tr>' +
          '<tr><td>Between 24 and 4 hours before pickup</td><td>50% of the fare</td></tr>' +
          '<tr><td>Less than 4 hours before pickup</td><td>100% of the fare</td></tr>' +
          '<tr><td>No-show at the pickup point</td><td>100% of the fare</td></tr>' +
          '</tbody></table>' +
          '<p>Airport pickups are treated as a no-show only after the complimentary waiting time has elapsed and we have been unable to reach you on the number provided.</p>' +
          '<h2>2. Amending a booking</h2><p>Changes to the time, pickup address, destination or vehicle class are free of charge when made more than 4 hours before pickup, subject to availability. Later changes are accommodated where possible and may incur a charge if a different vehicle or chauffeur must be allocated.</p>' +
          '<h2>3. Cancellations by us</h2><p>In the rare event that we must cancel — for example a vehicle becomes unserviceable and no replacement is available — you receive a full refund and, where possible, we arrange an equivalent alternative at our cost.</p>' +
          '<h2>4. Delays outside our control</h2><p>We do not charge for delays caused by flight changes when the correct flight number was supplied at the time of booking. Severe weather, road closures and other events outside our reasonable control may affect timings; we will keep you informed and will not apply a cancellation charge where the journey becomes impossible.</p>' +
          '<h2>5. Refunds</h2><p>Approved refunds are returned to the original payment method within 5 to 10 working days. Corporate account bookings are credited against the next invoice.</p>' +
          '<h2>6. How to cancel</h2><p>Cancel through our support form quoting your booking reference, or call the number on your confirmation. Cancellations are effective from the time we receive them.</p>',
        settings: { background: 'default', align: 'left', layout: 'prose' },
      }),
      section('cta', {
        title: 'Need to change a booking?',
        subtitle: 'Our support team can amend or cancel your journey.',
        cta: { label: 'Contact support', href: '/help', variant: 'primary', enabled: true },
        settings: { background: 'accent', align: 'center' },
      }),
    ],
    seo: legalSeo(
      'Cancellation & Refund Policy',
      'Our cancellation charges, amendment rules, no-show policy and how refunds are processed.',
    ),
  },
];

export default pagesSeed;
