import { redirect } from 'next/navigation';
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

  return {
    title: `Book ${parsed.formattedTitle} | Magnevents`,
    alternates: {
      canonical: `https://www.magnevents.in/${parsed.slug}`,
    },
  };
}

export default async function EventDiscoveryPage({ params }) {
  const awaitedParams = await params;
  const rawSlug = awaitedParams.event_slug || '';
  const parsed = parseLocationSlug(rawSlug);

  // Consolidate to primary canonical landing route
  redirect(`/${parsed.slug}`);
}
