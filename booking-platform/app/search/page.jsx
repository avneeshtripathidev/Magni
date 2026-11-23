import { redirect } from 'next/navigation';
import { resolveSearchQueryToRoute } from '@/app/utils/seoUrlParser';

export const dynamic = 'force-dynamic';

export default async function SearchRedirectPage({ searchParams }) {
  const awaitedParams = await searchParams;
  const q = awaitedParams?.q || awaitedParams?.query || '';
  if (!q.trim()) {
    redirect('/ai-search');
  }
  const destination = resolveSearchQueryToRoute(q);
  redirect(destination);
}
