export const metadata = {
  title: 'Book Live Singers, DJs & Bands in India | Artists | Magnevents',
  description: 'Browse and book verified live singers for house parties, DJs near you, live bands in Pune & Delhi NCR, acoustic artists, and performers with direct booking and transparent pricing.',
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
    'hire singers online',
    'verified artists India'
  ],
  alternates: {
    canonical: '/artists',
  },
  openGraph: {
    title: 'Book Live Singers, DJs & Bands in India | Artists | Magnevents',
    description: 'Browse and book verified live singers for house parties, DJs near you, live bands in Pune, acoustic artists, and performers with direct booking and transparent pricing.',
    url: '/artists',
  }
};

export default function ArtistsLayout({ children }) {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Verified Live Artists & Performers in India",
      "description": "Browse and book verified live singers, bands, DJs, comedians, and instrumentalists across India with direct booking and transparent pricing.",
      "url": "https://www.magnevents.in/artists"
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.magnevents.in"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Artists",
          "item": "https://www.magnevents.in/artists"
        }
      ]
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
