export const metadata = {
  title: 'Client Testimonials & Reviews | Magnevents',
  description: 'Read reviews and testimonials from our happy clients who booked live singers and bands through Magnevents for their special events.',
  alternates: {
    canonical: 'https://www.magnevents.in/testimonials',
  },
  openGraph: {
    title: 'Client Testimonials & Reviews | Magnevents',
    description: 'Read reviews and testimonials from our happy clients who booked live singers and bands through Magnevents for their special events.',
    url: 'https://www.magnevents.in/testimonials',
    siteName: 'Magnevents',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Client Testimonials & Reviews - Magnevents' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Client Testimonials & Reviews | Magnevents',
    description: 'Read reviews and testimonials from our happy clients who booked live singers and bands through Magnevents for their special events.',
    images: ['/og-image.jpg']
  }
};

const testimonialsSchema = {
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
      name: 'Client Reviews & Testimonials',
      item: 'https://www.magnevents.in/testimonials'
    }
  ]
};

export default function TestimonialsLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(testimonialsSchema) }}
      />
      {children}
    </>
  );
}
