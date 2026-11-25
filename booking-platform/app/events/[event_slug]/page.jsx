import SEOLandingPage from '@/app/components/common/SEOLandingPage';
import { generateOverview, generateServices, generateFAQs, generateRelatedLinks } from '@/app/utils/seoTemplates';
import { getTopArtistsForSEO } from '@/app/utils/fetchTopArtists';
import { parseLocationSlug } from '@/app/utils/seoUrlParser';

export const revalidate = 86400; // Cache at Edge CDN for 24 hours

// Prerender core event category hubs at build time
export async function generateStaticParams() {
  return [
    { event_slug: 'wedding-singers' },
    { event_slug: 'corporate-event-entertainment' },
    { event_slug: 'birthday-party-dj' },
    { event_slug: 'live-bands-for-wedding' },
    { event_slug: 'college-fest-performers' },
    { event_slug: 'sufi-night-for-wedding' },
    { event_slug: 'house-party-live-music' },
    { event_slug: 'cocktail-party-singers' },
  ];
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const parsed = parseLocationSlug(awaitedParams.event_slug);

  const displayTitle = `Book ${parsed.formattedTitle} | Magnevents Event Discovery`;
  const metaDescription = `Find and book verified ${parsed.formattedTitle.toLowerCase()} starting from ₹5,999. Direct artist booking with 0% agency commission across ${parsed.parsedCity}.`;

  return {
    title: displayTitle,
    description: metaDescription,
    alternates: {
      canonical: `/events/${parsed.slug}`,
    },
    openGraph: {
      title: displayTitle,
      description: metaDescription,
      url: `/events/${parsed.slug}`,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: metaDescription
    }
  };
}

export default async function EventDiscoveryPage({ params }) {
  const awaitedParams = await params;
  const rawSlug = awaitedParams.event_slug || '';
  const parsed = parseLocationSlug(rawSlug);

  const topArtists = await getTopArtistsForSEO({
    category: parsed.parsedCategory,
    subCategory: parsed.parsedSubCategory,
    city: parsed.parsedCity,
    limit: 5
  });

  const overviewHtml = generateOverview(parsed.parsedCategory, parsed.parsedCity);
  const services = generateServices(parsed.parsedCategory, parsed.parsedCity);
  const faqs = generateFAQs(parsed.parsedCategory, parsed.parsedCity);
  const relatedLinks = generateRelatedLinks(parsed.parsedCategory, parsed.parsedCity);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `Best ${parsed.formattedTitle}`,
      "description": `Book verified ${parsed.formattedTitle} for your upcoming event.`,
      "url": `https://www.magnevents.in/events/${parsed.slug}`
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": parsed.formattedTitle,
      "serviceType": parsed.parsedCategory,
      "provider": {
        "@type": "EntertainmentBusiness",
        "name": "Magnevents",
        "url": "https://www.magnevents.in"
      },
      "areaServed": parsed.parsedCity === 'All Cities' ? 'India' : parsed.parsedCity,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": "5999",
        "availability": "https://schema.org/InStock"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.magnevents.in" },
        { "@type": "ListItem", "position": 2, "name": "Events", "item": "https://www.magnevents.in/services" },
        { "@type": "ListItem", "position": 3, "name": parsed.formattedTitle, "item": `https://www.magnevents.in/events/${parsed.slug}` }
      ]
    }
  ];

  return (
    <SEOLandingPage
      locationSlug={parsed.slug}
      heroTitle={`Top ${parsed.formattedTitle}`}
      heroSubtitle={`Discover verified live entertainment and artists tailored specifically for your celebration.`}
      schema={schema}
      category={parsed.parsedCategory}
      city={parsed.parsedCity}
      subCategory={parsed.parsedSubCategory}
      topArtists={topArtists}
      overviewHtml={overviewHtml}
      services={services}
      faqs={faqs}
      relatedLinks={relatedLinks}
    />
  );
}
