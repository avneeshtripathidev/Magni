import { ArtistProfile } from '../types/artist';
import { getArtistTierProgress } from './artistTiers';

export interface WhatsAppShareOptions {
  rank?: number;
  completedEvents?: number;
}

const formatINR = (amount?: number): string => {
  if (!amount || amount <= 0) return 'On Request';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export function sanitizeWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return '';
  // Default to India country code (+91) if 10-digit local number
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/**
 * Formats ALL details of an artist into a clean, WhatsApp-ready message
 * with bold headings, pricing breakdown, tier/rank, repertoire, rider & media links.
 */
export function formatArtistWhatsAppText(
  artist: ArtistProfile,
  options: WhatsAppShareOptions = {}
): string {
  const completedEvents =
    options.completedEvents ?? artist.successful_bookings ?? 0;
  const tierProg = getArtistTierProgress(completedEvents);
  const pricing = artist.submitted_pricing;
  const perf = artist.performance_details;

  const startingPrice =
    pricing?.starting_price || pricing?.solo_price || artist.price_min || 0;

  const statusLabel =
    artist.verification_status === 'approved'
      ? 'Verified & Live'
      : artist.verification_status === 'under_review'
      ? 'Under Review'
      : artist.verification_status === 'rejected'
      ? 'Rejected'
      : 'Pending Verification';

  const locationLine = [artist.city, artist.state, artist.country]
    .filter(Boolean)
    .join(', ');

  const lines: string[] = [
    `✨ *MAGNEVENTS ARTIST PROFILE* ✨`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🎤 *Name:* ${artist.name}`,
    artist.stage_name ? `🎭 *Stage Act:* ${artist.stage_name}` : '',
    `🎵 *Category:* ${artist.category}${
      artist.sub_category ? ` (${artist.sub_category})` : ''
    }`,
    `🏅 *Position:* ${
      options.rank ? `Rank #${options.rank} • ` : ''
    }${tierProg.tier.name} (${completedEvents} Events Completed)`,
    `⭐ *Rating:* ${artist.rating || 4.9}/5  |  *Experience:* ${
      artist.experience_years || 1
    }+ Years`,
    `✅ *Status:* ${statusLabel}`,
    ``,
    `📍 *LOCATION & CONTACT*`,
    `• *Base City:* ${locationLine || 'India'}`,
    artist.phone_no ? `• *Phone / WhatsApp:* ${artist.phone_no}` : '',
    artist.email ? `• *Email:* ${artist.email}` : '',
    perf?.travel_readiness
      ? `• *Travel:* ${perf.travel_readiness.replace('_', ' ').toUpperCase()}`
      : '',
    perf?.serviceable_cities?.length
      ? `• *Serviceable Cities:* ${perf.serviceable_cities.join(', ')}`
      : '',
    ``,
    `💰 *PRICING & PACKAGES*`,
    `• *Starting Fee:* ${formatINR(startingPrice)}`,
    pricing?.solo_price ? `• *Solo Performance:* ${formatINR(pricing.solo_price)}` : '',
    pricing?.duo_price ? `• *Duo Setup:* ${formatINR(pricing.duo_price)}` : '',
    pricing?.band_price ? `• *Full Band / Gala:* ${formatINR(pricing.band_price)}` : '',
    pricing?.hourly_price
      ? `• *Hourly Rate:* ${formatINR(pricing.hourly_price)} / hr`
      : '',
    pricing?.travel_charges_policy
      ? `• *Travel Policy:* ${pricing.travel_charges_policy}`
      : '',
    ``,
    `🎶 *REPERTOIRE & BIO*`,
    artist.genres?.length ? `• *Genres:* ${artist.genres.join(', ')}` : '',
    artist.languages?.length
      ? `• *Languages:* ${artist.languages.join(', ')}`
      : '',
    artist.bio ? `• *About:* ${artist.bio}` : '',
  ];

  if (perf) {
    lines.push(
      ``,
      `🎛️ *STAGE & TECHNICAL RIDER*`,
      `• *Set Duration:* ${perf.min_duration_minutes || 60} – ${
        perf.max_duration_minutes || 180
      } mins`,
      `• *Sound System:* ${
        perf.sound_system_provided ? 'Provided by Artist' : 'Required at Venue'
      }`,
      perf.technical_requirements
        ? `• *Tech Rider:* ${perf.technical_requirements}`
        : ''
    );
  }

  const mediaLines: string[] = [];
  if (artist.youtube_links?.length) {
    artist.youtube_links.forEach((link, idx) => {
      if (link) mediaLines.push(`• *Showreel ${idx + 1}:* ${link}`);
    });
  }
  if (artist.audio_samples?.length) {
    artist.audio_samples.forEach((link, idx) => {
      if (link) mediaLines.push(`• *Audio Sample ${idx + 1}:* ${link}`);
    });
  }
  if (artist.instagram_url) mediaLines.push(`• *Instagram:* ${artist.instagram_url}`);
  if (artist.youtube_url) mediaLines.push(`• *YouTube:* ${artist.youtube_url}`);
  if (artist.spotify_url) mediaLines.push(`• *Spotify:* ${artist.spotify_url}`);
  if (artist.website_url) mediaLines.push(`• *Website:* ${artist.website_url}`);

  if (mediaLines.length > 0) {
    lines.push(``, `🎬 *PORTFOLIO & LINKS*`, ...mediaLines);
  }

  lines.push(
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `_Shared via Magnevents Artist Portal_`
  );

  // Remove empty string placeholders while preserving intentional blank separator lines
  const cleaned: string[] = [];
  for (const line of lines) {
    if (line === '' && cleaned[cleaned.length - 1] === '') continue;
    cleaned.push(line);
  }
  return cleaned.join('\n').trim();
}

/**
 * Copies the formatted WhatsApp text to clipboard with fallback for non-HTTPS localhost.
 */
export async function copyArtistWhatsAppDetails(
  artist: ArtistProfile,
  options: WhatsAppShareOptions = {}
): Promise<{ success: boolean; text: string }> {
  const text = formatArtistWhatsAppText(artist, options);
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { success: true, text };
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return { success: ok, text };
  } catch {
    return { success: false, text };
  }
}

/**
 * Generates a WhatsApp share URL (`https://wa.me/?text=...` or direct to a phone number).
 */
export function buildWhatsAppShareUrl(
  artist: ArtistProfile,
  options: WhatsAppShareOptions = {},
  targetPhone?: string
): string {
  const text = formatArtistWhatsAppText(artist, options);
  const encoded = encodeURIComponent(text);
  const phone = sanitizeWhatsAppPhone(targetPhone);
  return phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
