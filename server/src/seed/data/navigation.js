export const navigationSeed = [
  {
    id: 'header',
    label: 'Main navigation',
    items: [
      {
        id: 'services',
        label: 'Services',
        href: '/airport-transfer',
        children: [
          {
            id: 'services-airport',
            label: 'Airport Transfer',
            href: '/airport-transfer',
            description: 'Flight-tracked pickups with meet and greet',
          },
          {
            id: 'services-city',
            label: 'City-to-City Transfer',
            href: '/city-to-city-transfer',
            description: 'Fixed-price long-distance journeys',
          },
          {
            id: 'services-hourly',
            label: 'Hourly Chauffeur',
            href: '/hourly-chauffeur',
            description: 'A car and driver at your disposal',
          },
        ],
      },
      { id: 'fleet', label: 'Fleet', href: '/fleet', children: [] },
      {
        id: 'company',
        label: 'Company',
        href: '/about-us',
        children: [
          { id: 'company-about', label: 'About Us', href: '/about-us', description: 'Who we are' },
          { id: 'company-how', label: 'How It Works', href: '/how-it-works', description: 'Booking in four steps' },
          { id: 'company-why', label: 'Why Choose Us', href: '/why-choose-us', description: 'Our service standards' },
          { id: 'company-blog', label: 'Travel Guides', href: '/blog', description: 'Advice and insights' },
        ],
      },
      { id: 'corporate', label: 'Corporate', href: '/corporate', children: [] },
      {
        id: 'help',
        label: 'Help',
        href: '/help',
        children: [
          { id: 'help-faq', label: 'FAQ', href: '/faq', description: 'Common questions answered' },
          { id: 'help-support', label: 'Support', href: '/help', description: 'Get help with a journey' },
          { id: 'help-contact', label: 'Contact Us', href: '/contact', description: 'Speak to our team' },
        ],
      },
      { id: 'quote', label: 'Get a Quote', href: '/#enquiry', highlight: true, children: [] },
    ],
  },
  {
    id: 'footer-services',
    label: 'Services',
    items: [
      { id: 'f-s-1', label: 'Airport Transfer', href: '/airport-transfer', children: [] },
      { id: 'f-s-2', label: 'City-to-City Transfer', href: '/city-to-city-transfer', children: [] },
      { id: 'f-s-3', label: 'Hourly Chauffeur', href: '/hourly-chauffeur', children: [] },
      { id: 'f-s-4', label: 'Corporate Travel', href: '/corporate', children: [] },
      { id: 'f-s-5', label: 'Our Fleet', href: '/fleet', children: [] },
    ],
  },
  {
    id: 'footer-company',
    label: 'Company',
    items: [
      { id: 'f-c-1', label: 'About Us', href: '/about-us', children: [] },
      { id: 'f-c-2', label: 'How It Works', href: '/how-it-works', children: [] },
      { id: 'f-c-3', label: 'Why Choose Us', href: '/why-choose-us', children: [] },
      { id: 'f-c-4', label: 'Travel Guides', href: '/blog', children: [] },
      { id: 'f-c-5', label: 'Contact Us', href: '/contact', children: [] },
    ],
  },
  {
    id: 'footer-legal',
    label: 'Legal',
    items: [
      { id: 'f-l-1', label: 'Privacy Policy', href: '/privacy-policy', children: [] },
      { id: 'f-l-2', label: 'Terms & Conditions', href: '/terms-and-conditions', children: [] },
      { id: 'f-l-3', label: 'Cookie Policy', href: '/cookie-policy', children: [] },
      { id: 'f-l-4', label: 'Cancellation & Refunds', href: '/cancellation-and-refund-policy', children: [] },
      { id: 'f-l-5', label: 'Help & Support', href: '/help', children: [] },
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile menu',
    items: [
      { id: 'm-1', label: 'Home', href: '/', children: [] },
      { id: 'm-2', label: 'Airport Transfer', href: '/airport-transfer', children: [] },
      { id: 'm-3', label: 'City-to-City', href: '/city-to-city-transfer', children: [] },
      { id: 'm-4', label: 'Hourly Chauffeur', href: '/hourly-chauffeur', children: [] },
      { id: 'm-5', label: 'Fleet', href: '/fleet', children: [] },
      { id: 'm-6', label: 'Corporate', href: '/corporate', children: [] },
      { id: 'm-7', label: 'About Us', href: '/about-us', children: [] },
      { id: 'm-8', label: 'How It Works', href: '/how-it-works', children: [] },
      { id: 'm-9', label: 'Travel Guides', href: '/blog', children: [] },
      { id: 'm-10', label: 'FAQ', href: '/faq', children: [] },
      { id: 'm-11', label: 'Contact', href: '/contact', children: [] },
      { id: 'm-12', label: 'Get a Quote', href: '/#enquiry', highlight: true, children: [] },
    ],
  },
];

export default navigationSeed;
