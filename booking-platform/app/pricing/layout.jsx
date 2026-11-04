export const metadata = {
  title: 'Pricing & Packages | Book Live Singers | Magnevents',
  description: 'View transparent pricing and packages for booking live singers, bands, and performers for your events. No hidden fees, direct artist booking on Magnevents.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pricing & Packages | Book Live Singers | Magnevents',
    description: 'View transparent pricing and packages for booking live singers, bands, and performers for your events. No hidden fees, direct artist booking on Magnevents.',
    url: '/pricing',
    siteName: 'Magnevents',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Magnevents Pricing & Packages' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing & Packages | Book Live Singers | Magnevents',
    description: 'View transparent pricing and packages for booking live singers, bands, and performers for your events. No hidden fees, direct artist booking on Magnevents.',
    images: ['/og-image.jpg']
  }
};

const pricingSchema = [
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
        name: 'Pricing & Packages',
        item: 'https://www.magnevents.in/pricing'
      }
    ]
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Live Artist Booking Packages',
    description: 'Transparent pricing for live singers, DJs, and live bands for house parties, weddings, and corporate events across India.',
    provider: {
      '@type': 'EntertainmentBusiness',
      name: 'Magnevents',
      url: 'https://www.magnevents.in'
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: '5999',
      highPrice: '150000',
      offerCount: '500+'
    }
  }
];

export default function PricingLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      {children}
    </>
  );
}
