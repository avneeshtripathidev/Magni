import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'approved':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/25',
        dot: 'bg-emerald-400'
      };
    case 'under_review':
      return {
        bg: 'bg-sky-500/10',
        text: 'text-sky-400',
        border: 'border-sky-500/25',
        dot: 'bg-sky-400'
      };
    case 'rejected':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/25',
        dot: 'bg-rose-400'
      };
    case 'suspended':
      return {
        bg: 'bg-zinc-500/10',
        text: 'text-zinc-400',
        border: 'border-zinc-500/25',
        dot: 'bg-zinc-400'
      };
    case 'pending':
    default:
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/25',
        dot: 'bg-amber-400'
      };
  }
}

import { calculateStrictCompletion } from './onboardingValidation';

export function calculateCompletion(artist: any): number {
  if (!artist) return 0;
  return calculateStrictCompletion(artist);
}

/**
 * Generates the full public live URL for an artist on magnevents.in
 */
export function getLiveArtistProfileUrl(artist: {
  slug?: string | null;
  stage_name?: string | null;
  alias?: string | null;
  name?: string | null;
  id?: string | null;
} | null | undefined): string {
  if (!artist) return 'https://www.magnevents.in/artists';
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const baseOrigin = isLocal
    ? (process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000')
    : 'https://www.magnevents.in';

  const rawSlug = artist.slug ? String(artist.slug).trim() : '';
  const fallback = artist.stage_name || artist.alias || artist.name || artist.id || '';
  const target = rawSlug || fallback;

  const cleanSlug = encodeURIComponent(
    String(target).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || String(artist.id || '')
  );

  return `${baseOrigin}/artist/${cleanSlug}`;
}

