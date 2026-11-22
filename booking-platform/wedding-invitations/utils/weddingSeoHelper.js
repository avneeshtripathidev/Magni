export function generateWeddingMetadata({
  title,
  description,
  slug,
  keywords = [],
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.magnevents.in').replace(/\/+$/, '');
  const url = `${baseUrl}/${slug.replace(/^\/+/, '')}`;

  return {
    title: `${title} | Magnevents Wedding Studio`,
    description,
    keywords: [
      'Wedding Invitation Card Design',
      'Wedding Card Design Services',
      'Digital Wedding Invitation',
      'Online Wedding Card Design',
      'Custom Wedding Invitation Design',
      'Wedding Invitation Designers',
      'Wedding E Invitation Cards',
      ...keywords
    ].join(', '),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | Magnevents`,
      description,
      url,
      siteName: 'Magnevents',
      images: [
        {
          url: `${baseUrl}/images/wedding-invitation-og.jpg`,
          width: 1200,
          height: 630,
          alt: `${title} - Magnevents Wedding Studio`,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Magnevents`,
      description,
      images: [`${baseUrl}/images/wedding-invitation-og.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function buildWeddingStructuredData({
  title,
  description,
  slug,
  serviceType = 'Wedding Invitation & Digital Card Design',
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.magnevents.in').replace(/\/+$/, '');
  const pageUrl = `${baseUrl}/${slug.replace(/^\/+/, '')}`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: title,
      serviceType: serviceType,
      provider: {
        '@type': 'Organization',
        name: 'Magnevents',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91-8076515257',
          contactType: 'customer service',
          areaServed: 'IN',
          availableLanguage: ['en', 'hi'],
        },
      },
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
      description: description,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: '1499',
        priceValidUntil: '2027-12-31',
        url: pageUrl,
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Wedding Invitations',
          item: `${baseUrl}/wedding-invitations`,
        },
        ...(slug !== 'wedding-invitations'
          ? [
              {
                '@type': 'ListItem',
                position: 3,
                name: title,
                item: pageUrl,
              },
            ]
          : []),
      ],
    },
  ];
}
