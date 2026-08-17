export const faqsSeed = [
  {
    id: 'faq-booking-lead-time',
    question: 'How far in advance should I book?',
    answer:
      '<p>We recommend booking at least 24 hours before travel so we can allocate the right vehicle and chauffeur. We do accept same-day requests wherever a vehicle is available — for journeys within the next three hours, please call us directly rather than using the online form.</p>',
    category: 'booking',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'faq-price-fixed',
    question: 'Is the price I am quoted the final price?',
    answer:
      '<p>Yes. Every quote is fully inclusive of the vehicle, chauffeur, fuel, mileage, tolls, congestion and clean-air charges, airport parking and VAT. The only charges that can ever be added afterwards are waiting time beyond your free allowance, extra stops requested on the day, or a change of destination.</p>',
    category: 'pricing',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'faq-flight-delay',
    question: 'What happens if my flight is delayed?',
    answer:
      '<p>We track every inbound flight automatically using its flight number. If your flight is delayed or lands early, your pickup time is adjusted for you at no extra cost and your chauffeur will be waiting when you actually land.</p>',
    category: 'airport',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'faq-waiting-time',
    question: 'How much free waiting time is included?',
    answer:
      '<p>Airport pickups include 60 minutes of free waiting time from landing on international arrivals and 30 minutes on domestic arrivals — measured from the actual landing time, not the scheduled one. All other pickups include 15 minutes. Beyond that, waiting is charged in 15-minute increments at the vehicle’s hourly rate.</p>',
    category: 'airport',
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'faq-meet-greet',
    question: 'Where will I meet my chauffeur at the airport?',
    answer:
      '<p>Your chauffeur meets you inside the terminal in the arrivals hall, holding a name board. You will receive their name, mobile number and vehicle details by email and SMS before you travel, so you can contact them directly at any point.</p>',
    category: 'airport',
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'faq-child-seats',
    question: 'Can you provide child seats?',
    answer:
      '<p>Yes. Rear-facing infant carriers, forward-facing child seats and booster seats are all available at no additional charge. Please tell us the ages and weights of the children when you book so we fit the correct seat.</p>',
    category: 'vehicles',
    sortOrder: 6,
    isActive: true,
  },
  {
    id: 'faq-luggage',
    question: 'How much luggage can I bring?',
    answer:
      '<p>An executive saloon takes two large suitcases plus two items of hand luggage. A luxury MPV takes up to six large cases. If you are travelling with golf clubs, skis, musical instruments or a wheelchair, let us know and we will allocate a suitable vehicle at no extra cost.</p>',
    category: 'vehicles',
    sortOrder: 7,
    isActive: true,
  },
  {
    id: 'faq-cancellation',
    question: 'What is your cancellation policy?',
    answer:
      '<p>Cancellations made more than 24 hours before the scheduled pickup are refunded in full. Between 24 and 4 hours, 50% of the fare is charged. Within 4 hours of pickup, or in the event of a no-show, the full fare is charged. Full details are set out in our cancellation and refund policy.</p>',
    category: 'booking',
    sortOrder: 8,
    isActive: true,
  },
  {
    id: 'faq-payment',
    question: 'How do I pay?',
    answer:
      '<p>Private clients pay securely by card when the booking is confirmed. Corporate accounts can be invoiced monthly in arrears with consolidated reporting by cost centre, department or project code.</p>',
    category: 'pricing',
    sortOrder: 9,
    isActive: true,
  },
  {
    id: 'faq-drivers',
    question: 'Are your drivers licensed and vetted?',
    answer:
      '<p>Every chauffeur holds a current private hire licence, has passed an enhanced background check and completes our own defensive driving and customer service training before carrying passengers. All vehicles are fully insured for private hire and inspected on a fixed schedule.</p>',
    category: 'safety',
    sortOrder: 10,
    isActive: true,
  },
  {
    id: 'faq-amend-booking',
    question: 'Can I change a booking after it is confirmed?',
    answer:
      '<p>Yes. Send us the change through the support form or call the number on your confirmation. Changes to time, pickup address or vehicle class are free of charge if made more than four hours before pickup, subject to availability.</p>',
    category: 'booking',
    sortOrder: 11,
    isActive: true,
  },
  {
    id: 'faq-corporate-account',
    question: 'Do you offer corporate accounts?',
    answer:
      '<p>We do. Corporate accounts include consolidated monthly invoicing, cost-centre reporting, agreed rate cards, priority allocation and a named account manager. Tell us about your requirements through the corporate enquiry form and we will arrange a call.</p>',
    category: 'corporate',
    sortOrder: 12,
    isActive: true,
  },
];

export default faqsSeed;
