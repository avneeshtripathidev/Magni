export const metadata = {
  title: 'Why Choose Magnevents | Premium Artist Booking',
  description: 'Discover why thousands of event planners, couples, and corporate hosts choose Magnevents for booking the best live artists with zero hassle and full transparency.',
  alternates: {
    canonical: '/why-choose',
  },
  openGraph: {
    title: 'Why Choose Magnevents | Premium Artist Booking',
    description: 'Discover why thousands of event planners, couples, and corporate hosts choose Magnevents for booking the best live artists with zero hassle and full transparency.',
    url: '/why-choose',
    siteName: 'Magnevents',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Why Choose Magnevents' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Why Choose Magnevents | Premium Artist Booking',
    description: 'Discover why thousands of event planners, couples, and corporate hosts choose Magnevents for booking the best live artists with zero hassle and full transparency.',
    images: ['/og-image.jpg']
  }
};

const breadcrumbSchema = {
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
      name: 'Why Choose Us',
      item: 'https://www.magnevents.in/why-choose'
    }
  ]
};

export default function WhyChooseLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
