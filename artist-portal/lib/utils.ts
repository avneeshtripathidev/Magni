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

export function calculateCompletion(artist: any): number {
  if (!artist) return 0;
  let score = 20; // Base registration

  if (artist.bio && artist.bio.length > 25) score += 15;
  if (artist.category && artist.genres && artist.genres.length > 0) score += 15;
  if (artist.profile_image_url || artist.cover_image_url) score += 15;
  if (artist.youtube_links && artist.youtube_links.length > 0) score += 15;
  if (artist.submitted_pricing && artist.submitted_pricing.starting_price > 0) score += 10;
  if (artist.verification_documents && artist.verification_documents.id_document_url) score += 10;

  return Math.min(score, 100);
}
