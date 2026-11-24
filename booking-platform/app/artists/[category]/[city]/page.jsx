import SEOLandingPage from '@/app/components/common/SEOLandingPage';
import { generateOverview, generateServices, generateFAQs, generateRelatedLinks } from '@/app/utils/seoTemplates';
import { getTopArtistsForSEO } from '@/app/utils/fetchTopArtists';
import { getCityBySlug } from '@/app/constants/indianCities1063.js';

export const revalidate = 86400; // Cache at Edge CDN for 24 hours

function formatCategory(rawCategory) {
  const cat = (rawCategory || '').toLowerCase();
  if (cat.includes('dj')) return 'Dj';
  if (cat.includes('band')) return 'Live band';
  if (cat.includes('comedian') || cat.includes('standup')) return 'Comedian';
  if (cat.includes('magician')) return 'Magician';
  if (cat.includes('anchor') || cat.includes('emcee')) return 'Anchor';
  if (cat.includes('instrumentalist') || cat.includes('guitarist') || cat.includes('violinist')) return 'Musician';
  return 'Singer';
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const categoryRaw = awaitedParams.category || 'singers';
  const cityRaw = awaitedParams.city || 'delhi';
  
  const matchedCity = getCityBySlug(cityRaw);
  const cityName = matchedCity ? matchedCity.name : cityRaw.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const categoryName = formatCategory(categoryRaw);

  const title = `Top ${categoryName}s in ${cityName} | Book Verified Performers`;
  const description = `Book verified ${categoryName.toLowerCase()}s in ${cityName} for weddings, corporate galas, and private events starting at ₹5,999. Direct artist booking with 0% agency fees.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/artists/${categoryRaw}/${cityRaw}`,
    },
    openGraph: {
      title,
      description,
      url: `/artists/${categoryRaw}/${cityRaw}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function CategoryCityArtistPage({ params }) {
  const awaitedParams = await params;
  const categoryRaw = awaitedParams.category || 'singers';
  const cityRaw = awaitedParams.city || 'delhi';

  const matchedCity = getCityBySlug(cityRaw);
  const cityName = matchedCity ? matchedCity.name : cityRaw.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const categoryName = formatCategory(categoryRaw);
  const locationSlug = `${categoryRaw}-in-${cityRaw}`;

  const topArtists = await getTopArtistsForSEO({
    category: categoryName,
    city: cityName,
    limit: 6
  });

  const overviewHtml = generateOverview(categoryName, cityName);
  const services = generateServices(categoryName, cityName);
  const faqs = generateFAQs(categoryName, cityName);
  const relatedLinks = generateRelatedLinks(categoryName, cityName);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `Best ${categoryName}s in ${cityName}`,
      "description": `Book verified ${categoryName.toLowerCase()}s in ${cityName}.`,
      "url": `https://www.magnevents.in/artists/${categoryRaw}/${cityRaw}`
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": `${categoryName} Booking in ${cityName}`,
      "serviceType": categoryName,
      "provider": {
        "@type": "EntertainmentBusiness",
        "name": "Magnevents",
        "url": "https://www.magnevents.in"
      },
      "areaServed": cityName,
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
        { "@type": "ListItem", "position": 2, "name": "Artists", "item": "https://www.magnevents.in/artists" },
        { "@type": "ListItem", "position": 3, "name": `${categoryName}s in ${cityName}`, "item": `https://www.magnevents.in/artists/${categoryRaw}/${cityRaw}` }
      ]
    }
  ];

  return (
    <SEOLandingPage
      locationSlug={locationSlug}
      heroTitle={`Top ${categoryName}s in ${cityName}`}
      heroSubtitle={`Discover and book top-rated verified performers directly in ${cityName} with 0% agency fees.`}
      schema={schema}
      category={categoryName}
      city={cityName}
      subCategory=""
      topArtists={topArtists}
      overviewHtml={overviewHtml}
      services={services}
      faqs={faqs}
      relatedLinks={relatedLinks}
    />
  );
}
