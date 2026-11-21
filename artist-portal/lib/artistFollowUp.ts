import { ArtistProfile } from '../types/artist';
import { sanitizeWhatsAppPhone } from './whatsappArtistShare';

export interface FollowUpMessage {
  id: string;
  artist_id: string;
  sender: 'director' | 'artist';
  sender_name: string;
  subject: string;
  message: string;
  channels: ('email' | 'whatsapp' | 'portal')[];
  created_at: string;
  status: 'sent' | 'replied';
  reply_note?: string;
  reply_at?: string;
}

export interface FollowUpPreset {
  id: string;
  label: string;
  icon: string;
  subject: string;
  message: (artist: ArtistProfile) => string;
}

export const FOLLOW_UP_PRESETS: FollowUpPreset[] = [
  {
    id: 'showreel',
    label: 'Live Video Showreel',
    icon: '🎬',
    subject: 'Question regarding your live video clips & stage showreels',
    message: (artist) =>
      `Hi ${artist.stage_name || artist.name}! We are reviewing your artist listing application on Magnevents for ${artist.category}. Could you share 1 or 2 high-clarity live stage performance videos or YouTube links so clients can see your live energy? If you have any questions or doubts, please feel free to reply right here!`,
  },
  {
    id: 'rider',
    label: 'Sound & Tech Rider',
    icon: '🎛️',
    subject: 'Clarification on sound system & stage technical rider',
    message: (artist) =>
      `Hi ${artist.stage_name || artist.name}! We're coordinating technical details for your upcoming gigs in ${artist.city}. Could you clarify if you provide your own console & wireless mics, or if the event venue/host should arrange the complete PA setup? Let us know if you have any questions or doubts!`,
  },
  {
    id: 'pricing',
    label: 'Event Rates & Travel',
    icon: '💰',
    subject: 'Confirmation on live performance rates & outstation travel',
    message: (artist) =>
      `Hi ${artist.stage_name || artist.name}! Quick follow-up regarding your submitted rates on Magnevents: please confirm if your rate covers local travel in ${artist.city}, and what your standard requirements are for outstation gigs. If you have any questions or doubts, reply directly here!`,
  },
  {
    id: 'availability',
    label: 'Calendar & Availability',
    icon: '📅',
    subject: 'Upcoming event dates & live availability check',
    message: (artist) =>
      `Hi ${artist.stage_name || artist.name}! We have prospective event inquiries looking for verified ${artist.category} performers in ${artist.city}. Could you confirm your tentative availability for upcoming weekend gigs? Feel free to reply directly with any questions or doubts!`,
  },
  {
    id: 'general',
    label: 'General Inquiry / Doubt',
    icon: '💬',
    subject: 'Follow-up regarding your Magnevents Artist Application',
    message: (artist) =>
      `Hi ${artist.stage_name || artist.name}! This is the Director from Magnevents following up on your application. We wanted to connect and clarify a few details regarding your live act. If you have any doubts, questions, or updates, please feel free to reply directly!`,
  },
];

const STORAGE_PREFIX = 'magne_artist_followups_';

export function getArtistFollowUps(artistId: string): FollowUpMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${artistId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Could not read follow-up history:', e);
    return [];
  }
}

export function saveArtistFollowUp(message: FollowUpMessage): FollowUpMessage[] {
  if (typeof window === 'undefined') return [message];
  try {
    const existing = getArtistFollowUps(message.artist_id);
    const updated = [message, ...existing.filter((m) => m.id !== message.id)];
    localStorage.setItem(`${STORAGE_PREFIX}${message.artist_id}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Could not save follow-up message:', e);
    return [message];
  }
}

export function logArtistReply(
  artistId: string,
  followUpId: string,
  replyText: string
): FollowUpMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getArtistFollowUps(artistId);
    const updated = existing.map((msg) => {
      if (msg.id === followUpId) {
        return {
          ...msg,
          status: 'replied' as const,
          reply_note: replyText,
          reply_at: new Date().toISOString(),
        };
      }
      return msg;
    });
    localStorage.setItem(`${STORAGE_PREFIX}${artistId}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Could not log artist reply:', e);
    return [];
  }
}

export function buildArtistFollowUpWhatsAppUrl(
  artist: ArtistProfile,
  message: string,
  targetPhone?: string
): string {
  const phone = sanitizeWhatsAppPhone(targetPhone || artist.phone_no);
  const text = `Hi *${artist.stage_name || artist.name}*! 👋\n\nThis is the Director from *Magnevents Artist Team* following up on your application for *${artist.category}* in ${artist.city}.\n\n💬 *Question / Follow-up Note:*\n${message}\n\n━━━━━━━━━━━━━━━━━━━━━━\n_If you have any questions, doubts, or updates, please feel free to reply directly to this message!_`;
  const encoded = encodeURIComponent(text);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function buildArtistFollowUpEmailUrl(
  artist: ArtistProfile,
  subject: string,
  message: string
): string {
  if (!artist.email) return '';
  const body = `Hi ${artist.stage_name || artist.name},\n\nThis is the Director from Magnevents following up on your artist listing application for ${artist.category} in ${artist.city}.\n\n--- Follow-Up Query ---\n${message}\n-----------------------\n\nIf you have any questions, doubts, or updates to share, simply reply directly to this email.\n\nBest regards,\nMagnevents Artist Verification Team\nWebsite: https://artists.magnevents.in\nSupport: support@magnevents.in`;
  return `mailto:${artist.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
