export const metadata = {
  title: 'How To Book An Artist | Magnevents',
  description: 'Learn how to easily book a live singer, band, or artist for your next event through Magnevents in three simple steps. Transparent pricing & 0% markup.',
  alternates: {
    canonical: '/how-to-book',
  },
  openGraph: {
    title: 'How To Book An Artist | Magnevents',
    description: 'Learn how to easily book a live singer, band, or artist for your next event through Magnevents in three simple steps. Transparent pricing & 0% markup.',
    url: '/how-to-book',
    siteName: 'Magnevents',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'How To Book An Artist on Magnevents' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How To Book An Artist | Magnevents',
    description: 'Learn how to easily book a live singer, band, or artist for your next event through Magnevents in three simple steps. Transparent pricing & 0% markup.',
    images: ['/og-image.jpg']
  }
};

const howToBookSchema = [
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
        name: 'How To Book',
        item: 'https://www.magnevents.in/how-to-book'
      }
    ]
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Book a Live Artist or Singer on Magnevents',
    description: 'Follow this 3-step guide to browse, select, and book verified live singers and entertainers with zero agency markup.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Explore & Shortlist Artists',
        text: 'Filter verified singers, bands, or DJs by category, event type, budget, and city location.'
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Review Direct Pricing & Portfolio',
        text: 'Listen to live performance audio/video samples and see transparent starting prices with 0% hidden fees.'
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Confirm Date & Artist Arrival Guarantee',
        text: 'Submit your date lock request to receive instant confirmation backed by the Magnevents Artist Arrival Guarantee.'
      }
    ]
  }
];

export default function HowToBookLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToBookSchema) }}
      />
      {children}
    </>
  );
}
