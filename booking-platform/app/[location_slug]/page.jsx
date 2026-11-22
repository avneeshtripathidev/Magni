import { redirect } from 'next/navigation';
import SEOLandingPage from '@/app/components/common/SEOLandingPage';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';
import { generateOverview, generateServices, generateFAQs, generateRelatedLinks } from '@/app/utils/seoTemplates';
import { getTopArtistsForSEO } from '@/app/utils/fetchTopArtists';
import { parseLocationSlug, MAJOR_CITIES } from '@/app/utils/seoUrlParser';

export const revalidate = 86400; // Cache at Edge CDN for 24 hours - instant 5ms loading

function isWeddingInviteQuery(slug) {
  const s = (slug || '').toLowerCase();
  return (
    s.includes('invitation') ||
    s.includes('wedding-card') ||
    s.includes('digital-card') ||
    s.includes('save-the-date') ||
    s.includes('patrika') ||
    s.includes('wedding-anniversary')
  );
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const parsed = parseLocationSlug(awaitedParams.location_slug);

  if (!parsed.isValidKeyword) {
    return {
      title: 'Page Not Found | Magnevents',
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } }
    };
  }

  // Specialized Wedding Invitation Metadata
  if (isWeddingInviteQuery(parsed.slug)) {
    const citySuffix = parsed.parsedCity !== 'All Cities' ? ` in ${parsed.parsedCity}` : ' in India';
    const displayTitle = `${parsed.formattedTitle}${citySuffix} | Magnevents Wedding Studio`;
    const metaDescription = `Design custom ${parsed.formattedTitle.toLowerCase()}${citySuffix}. Luxury WhatsApp digital cards, 1080p animated video invites, Google Maps venue navigation & RSVP tracking. Express 24-48h delivery.`;
    return {
      title: displayTitle.length > 68 ? `${parsed.formattedTitle} | Magnevents` : displayTitle,
      description: metaDescription,
      alternates: {
        canonical: `/${parsed.slug}`,
      },
      openGraph: {
        title: displayTitle,
        description: metaDescription,
        url: `/${parsed.slug}`,
        type: 'website'
      },
      twitter: {
        card: 'summary_large_image',
        title: displayTitle,
        description: metaDescription
      }
    };
  }

  const citySuffix = parsed.parsedCity !== 'All Cities' ? ` in ${parsed.parsedCity}` : ' in India';
  const displayTitle = `Book ${parsed.formattedTitle}${citySuffix.includes(parsed.parsedCity) ? '' : citySuffix} | Magnevents`;
  const metaDescription = `Book verified ${parsed.formattedTitle.toLowerCase()} starting from ₹5,999. Direct artist booking with 0% agency fees and 100% Artist Arrival Guarantee across ${parsed.parsedCity === 'All Cities' ? 'India' : parsed.parsedCity}.`;

  return {
    title: displayTitle.length > 65 ? `${parsed.formattedTitle} | Magnevents` : displayTitle,
    description: metaDescription,
    alternates: {
      canonical: `/${parsed.slug}`,
    },
    openGraph: {
      title: displayTitle,
      description: metaDescription,
      url: `/${parsed.slug}`,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: metaDescription
    }
  };
}

export default async function LocationServicePage({ params }) {
  const awaitedParams = await params;
  const rawSlug = awaitedParams.location_slug || '';
  const parsed = parseLocationSlug(rawSlug);

  if (MAJOR_CITIES.includes(parsed.slug)) {
    redirect(`/city/${parsed.slug}`);
  }

  if (rawSlug !== parsed.slug) {
    redirect(`/${parsed.slug}`);
  }

  if (!parsed.isValidKeyword) {
    redirect('/artists');
  }

  // If query is for wedding invitations, render dedicated rich Wedding Invitations View
  if (isWeddingInviteQuery(parsed.slug)) {
    const cityText = parsed.parsedCity !== 'All Cities' ? ` in ${parsed.parsedCity}` : '';
    const structuredData = buildWeddingStructuredData({
      title: `${parsed.formattedTitle}${cityText ? ` in ${cityText}` : ''} | Magnevents Wedding Studio`,
      description: `Bespoke digital wedding cards, luxury invitations, and video suites${cityText ? ` in ${cityText}` : ''}.`,
      slug: parsed.slug,
    });

    return (
      <WeddingInvitationsView
        pageSlug={parsed.slug}
        h1Title={`${parsed.formattedTitle}${cityText ? ` in ${cityText}` : ''}`}
        subtitle={`Discover luxury digital cards, video invites & royal traditional stationery customized for your celebration${cityText ? ` in ${cityText}` : ''}. Clickable Google Maps, WhatsApp RSVP, and express 24h turnaround.`}
        initialCategory="all"
        structuredData={structuredData}
      />
    );
  }

  // Fetch top 5 curated artists from the database for this category & city
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
      "description": `Book verified ${parsed.formattedTitle} for your next event.`,
      "url": `https://www.magnevents.in/${parsed.slug}`
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
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
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
          "name": parsed.parsedCity === 'All Cities' ? 'Artists' : parsed.parsedCity,
          "item": parsed.parsedCity === 'All Cities' 
            ? "https://www.magnevents.in/artists"
            : `https://www.magnevents.in/city/${parsed.parsedCity.toLowerCase().replace(/ /g, '-')}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": `Book ${parsed.parsedCategory} in ${parsed.parsedCity}`,
          "item": `https://www.magnevents.in/${parsed.slug}`
        }
      ]
    }
  ];

  return (
    <SEOLandingPage 
      locationSlug={parsed.slug}
      heroTitle={`Top ${parsed.formattedTitle}`}
      heroSubtitle={`Book verified performers directly for your next grand event.`}
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
