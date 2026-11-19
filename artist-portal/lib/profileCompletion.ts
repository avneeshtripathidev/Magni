import { ArtistProfile } from '../types/artist';

export interface MissingProfileSection {
  id: 'profile' | 'portfolio' | 'verification';
  title: string;
  href: '/profile' | '/portfolio' | '/verification';
  missingFields: string[];
}

export function getMissingProfileSections(
  artist: ArtistProfile | null,
  requireKYC: boolean = false
): MissingProfileSection[] {
  if (!artist) {
    return [
      {
        id: 'profile',
        title: 'Profile & Logistics',
        href: '/profile',
        missingFields: ['Full Name', 'Phone Number', 'City', 'Bio', 'Starting Rate'],
      },
    ];
  }

  const sections: MissingProfileSection[] = [];

  // 1. Profile & Logistics (/profile)
  const profileMissing: string[] = [];
  if (!artist.name || artist.name.trim().length < 2) profileMissing.push('Full / Stage Name');
  const cleanPhone = (artist.phone_no || '').replace(/\D/g, '');
  if (cleanPhone.length < 7) profileMissing.push('Phone Number');
  if (!artist.city || artist.city.trim().length < 2) profileMissing.push('City');
  if (!artist.category || artist.category.trim().length < 2) profileMissing.push('Category');
  if (!artist.bio || artist.bio.trim().length < 20) profileMissing.push('Artist Bio (min 20 chars)');
  if (!Array.isArray(artist.genres) || artist.genres.length === 0) profileMissing.push('Genres');
  const startingRate = Number(artist.submitted_pricing?.starting_price || artist.price_min || 0);
  if (startingRate <= 0) profileMissing.push('Starting Rate');

  if (profileMissing.length > 0) {
    sections.push({
      id: 'profile',
      title: 'Profile & Logistics',
      href: '/profile',
      missingFields: profileMissing,
    });
  }

  // 2. Portfolio & Reels (/portfolio)
  const portfolioMissing: string[] = [];
  const hasPhoto = Boolean(artist.cover_image_url || artist.profile_image_url);
  if (!hasPhoto) portfolioMissing.push('Cover / Profile Photo');

  const hasVideo = Boolean(
    artist.video_url ||
      artist.cloudflare_video_url ||
      (Array.isArray(artist.youtube_links) && artist.youtube_links.length > 0)
  );
  if (!hasVideo) portfolioMissing.push('Live Performance Video / Showreel');

  if (portfolioMissing.length > 0) {
    sections.push({
      id: 'portfolio',
      title: 'Portfolio & Reels',
      href: '/portfolio',
      missingFields: portfolioMissing,
    });
  }

  // 3. ID Verification / KYC (/verification) - only required when assigned to live events
  if (requireKYC) {
    const verificationMissing: string[] = [];
    const docs = artist.verification_documents;
    if (!docs?.legal_name || docs.legal_name.trim().length < 2) verificationMissing.push('Legal Name');
    if (!docs?.id_number_masked || docs.id_number_masked.trim().length < 4) {
      verificationMissing.push('Government ID Number');
    }

    if (verificationMissing.length > 0) {
      sections.push({
        id: 'verification',
        title: 'ID Verification (KYC)',
        href: '/verification',
        missingFields: verificationMissing,
      });
    }
  }

  return sections;
}
