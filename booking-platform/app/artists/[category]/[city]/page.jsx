import { redirect } from 'next/navigation';

export const revalidate = 86400; // Cache at Edge CDN for 24 hours

// Prerender primary category & city hubs at build time
export async function generateStaticParams() {
  return [
    { category: 'singers', city: 'delhi' },
    { category: 'djs', city: 'delhi' },
    { category: 'live-bands', city: 'delhi' },
    { category: 'singers', city: 'mumbai' },
    { category: 'djs', city: 'mumbai' },
    { category: 'live-bands', city: 'mumbai' },
    { category: 'singers', city: 'bengaluru' },
    { category: 'singers', city: 'lucknow' },
    { category: 'singers', city: 'chandigarh' },
    { category: 'singers', city: 'jaipur' },
  ];
}

function formatCategory(rawCategory) {
  const cat = (rawCategory || '').toLowerCase();
  if (cat.includes('dj')) return 'dj';
  if (cat.includes('band')) return 'live-band';
  if (cat.includes('comedian') || cat.includes('standup')) return 'comedian';
  if (cat.includes('magician')) return 'magician';
  if (cat.includes('anchor') || cat.includes('emcee')) return 'anchor';
  if (cat.includes('instrumentalist') || cat.includes('guitarist') || cat.includes('violinist')) return 'musician';
  return 'singer';
}

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const categoryRaw = awaitedParams.category || 'singers';
  const cityRaw = awaitedParams.city || 'delhi';
  const targetCat = formatCategory(categoryRaw);
  const targetSlug = `${targetCat}-in-${cityRaw.toLowerCase()}`;

  return {
    title: `Live Artists in ${cityRaw} | Magnevents`,
    alternates: {
      canonical: `https://www.magnevents.in/${targetSlug}`,
    },
  };
}

export default async function CategoryCityArtistPage({ params }) {
  const awaitedParams = await params;
  const categoryRaw = awaitedParams.category || 'singers';
  const cityRaw = awaitedParams.city || 'delhi';
  const targetCat = formatCategory(categoryRaw);
  const targetSlug = `${targetCat}-in-${cityRaw.toLowerCase()}`;

  redirect(`/${targetSlug}`);
}
