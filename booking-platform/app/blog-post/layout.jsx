export const metadata = {
  title: 'Live Music Blog | Wedding Entertainment, Artist Booking & Event Guides | Magnevents',
  description: 'Discover expert advice, artist highlights, and booking tips for your next big event. Read the Magnevents Journal for insights into the live music scene.',
  alternates: {
    canonical: '/blog-post',
  },
  openGraph: {
    title: 'Live Music Blog | Wedding Entertainment, Artist Booking & Event Guides | Magnevents',
    description: 'Discover expert advice, artist highlights, and booking tips for your next big event. Read the Magnevents Journal for insights into the live music scene.',
    url: '/blog-post',
    siteName: 'Magnevents',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Magnevents Entertainment Blog' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Music Blog | Wedding Entertainment, Artist Booking & Event Guides | Magnevents',
    description: 'Discover expert advice, artist highlights, and booking tips for your next big event. Read the Magnevents Journal for insights into the live music scene.',
    images: ['/og-image.jpg']
  }
};

const blogListSchema = {
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
      name: 'Blog',
      item: 'https://www.magnevents.in/blog-post'
    }
  ]
};

export default function BlogLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />
      {children}
    </>
  );
}
