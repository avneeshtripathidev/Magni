import { supabase } from '@database/connection/supabase';
import { findArtistBySlugOrId } from '@/app/utils/artistLookup';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const { id } = awaitedParams;
  
  try {
    const data = await findArtistBySlugOrId(supabase, id, 'name, alias, bio, artist_images(image_url)');

    if (!data) {
      // Check if service video exists as fallback
      const decodedId = decodeURIComponent(id || '').trim();
      const { data: svData } = await supabase
        .from('service_videos')
        .select('userName, artistBio')
        .or(`userName.ilike.%${decodedId}%,artistName.ilike.%${decodedId}%`)
        .limit(1);

      if (!svData || svData.length === 0) {
        return {
          title: 'Artist Not Found | Magnevents',
          robots: {
            index: false,
            follow: false,
            googleBot: {
              index: false,
              follow: false,
            },
          },
        };
      }
    }

    const name = data?.alias || data?.name || 'Live Artist';
    const description = data?.bio ? data.bio.substring(0, 160) : `Book ${name} for your next event. Hire premium live entertainment and musicians for weddings, corporate events, and private parties via Magnevents.`;
    const image = data?.artist_images?.[0]?.image_url || '/icon-512.png';
    const primarySlug = (data?.alias || data?.name) 
      ? (data.alias || data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : (id || '').toLowerCase();

    return {
      title: `${name} | Book Live Singer & Performer | Magnevents`,
      description,
      alternates: {
        canonical: `https://www.magnevents.in/artist/${primarySlug || id}`,
      },
      openGraph: {
        title: `${name} | Book Live Singer & Performer | Magnevents`,
        description,
        images: [image],
        url: `https://www.magnevents.in/artist/${primarySlug || id}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} | Book Live Singer & Performer | Magnevents`,
        description,
        images: [image],
      }
    };
  } catch (err) {
    console.error('Error generating artist metadata:', err);
    return {
      title: 'Artist Profile | Magnevents',
      robots: { index: false, follow: false }
    };
  }
}

export default async function ArtistLayout({ children, params }) {
  const awaitedParams = await params;
  const { id } = awaitedParams;
  
  let data = null;
  try {
    data = await findArtistBySlugOrId(supabase, id, 'name, alias, bio, artist_images(image_url), category, city, rating, successful_bookings');
  } catch (err) {
    console.error('Error in ArtistLayout findArtistBySlugOrId:', err);
  }

  // If artist does not exist, check fallback service_videos; if still not found, redirect to /artists
  if (!data) {
    let hasFallbackVideo = false;
    try {
      const decodedId = decodeURIComponent(id || '').trim();
      const { data: svData } = await supabase
        .from('service_videos')
        .select('userName, category, artistType, artistBio')
        .or(`userName.ilike.%${decodedId}%,artistName.ilike.%${decodedId}%`)
        .limit(1);

      hasFallbackVideo = Boolean(svData && svData.length > 0);
    } catch (e) {
      hasFallbackVideo = false;
    }

    if (!hasFallbackVideo) {
      redirect('/artists');
    }
  }

  const name = data?.alias || data?.name || 'Live Artist';
  const image = data?.artist_images?.[0]?.image_url || '/icon-512.png';
  const bio = data?.bio || `Hire ${name}, a professional ${data?.category || 'artist'} from ${data?.city || 'India'} for your next event.`;

  const isBand = data?.category?.toLowerCase().includes('band') || false;
  const entityType = isBand ? 'PerformingGroup' : 'Person';

  const rating = Number(data?.rating) || 4.5;
  const reviewCount = Number(data?.successful_bookings) || 10;
  const hasReviews = (data?.successful_bookings && Number(data.successful_bookings) > 0) || (data?.rating && Number(data.rating) > 0);

  const primarySlug = (data?.alias || data?.name) 
    ? (data.alias || data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    : (id || '').toLowerCase();

  const artistUrl = `https://www.magnevents.in/artist/${primarySlug || id}`;
  const priceMin = (data?.price_min && Number(data.price_min) > 0) ? String(data.price_min) : "5999";

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": entityType,
      "name": name,
      "description": bio,
      "image": image,
      "jobTitle": data?.category || "Live Performer",
      "url": artistUrl,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": data?.city || "Delhi NCR",
        "addressCountry": "IN"
      }
    },
    ...(hasReviews ? [{
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `${name} - Live Performance & Event Booking`,
      "description": bio,
      "image": image,
      "category": data?.category || "Live Entertainment",
      "brand": {
        "@type": "Brand",
        "name": name
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": priceMin,
        "availability": "https://schema.org/InStock",
        "url": artistUrl
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": rating.toFixed(1),
        "reviewCount": reviewCount,
        "bestRating": "5",
        "worstRating": "1"
      }
    }] : []),
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
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": name,
          "item": artistUrl
        }
      ]
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      {children}
    </>
  );
}
