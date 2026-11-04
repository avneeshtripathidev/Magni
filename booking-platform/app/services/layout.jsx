export const metadata = {
  title: 'Our Services | Live Entertainment & Artist Booking | Magnevents',
  description: 'Explore our entertainment services: live singers for private house parties, wedding bands, DJ booking near you, live bands in Pune & Kochi, and stage artists.',
  keywords: [
    'singers near me',
    'singer for house party',
    'live singer for private party',
    'live singer for house party',
    'house gig',
    'book singer music band',
    'book live singer',
    'dj in kochi',
    'dj booking near me',
    'live band in pune',
    'wedding live music',
    'corporate entertainment services'
  ],
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: 'Our Services | Live Entertainment & Artist Booking | Magnevents',
    description: 'Explore our services including live bands, solo singers, DJs, and performers for weddings, corporate events, and private house parties.',
    url: '/services',
    siteName: 'Magnevents',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Magnevents Live Entertainment Services' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Services | Live Entertainment & Artist Booking | Magnevents',
    description: 'Explore our services including live bands, solo singers, DJs, and performers for weddings, corporate events, and private house parties.',
    images: ['/og-image.jpg']
  }
};

const servicesSchema = [
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.magnevents.in'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services',
        item: 'https://www.magnevents.in/services'
      }
    ]
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Live Entertainment Booking Services',
    serviceType: 'Live Music and Event Entertainment',
    provider: {
      '@type': 'EntertainmentBusiness',
      name: 'Magnevents',
      url: 'https://www.magnevents.in'
    },
    areaServed: {
      '@type': 'Country',
      name: 'India'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Entertainment Booking Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Live Singer Booking for House Parties & Weddings'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Live Bands for Weddings & Corporate Events'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Professional DJs for Sangeet, Cocktails & Nightlife'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Event Anchors & Stand-up Comedians'
          }
        }
      ]
    }
  }
];

export default function ServicesLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      {children}
    </>
  );
}
