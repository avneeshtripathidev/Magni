export interface AssignedArtist {
  artist_id: string;
  name: string;
  stage_name?: string;
  category?: string;
  city?: string;
  profile_image_url?: string;
}

export interface ArtistLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  shared_at: string;
}

export type EventLiveStatus = 'not_started' | 'started' | 'verified';

export interface EventVerificationRecord {
  booking_id: string;
  event_title: string;
  artist_name: string;
  stage_name?: string;
  assigned_artists?: AssignedArtist[];
  client_name: string;
  client_phone?: string;
  client_email?: string;
  city: string;
  venue?: string;
  event_date: string;
  guest_count?: number;
  package_title?: string;
  budget: number;
  booking_status: 'confirmed' | 'pending' | 'completed' | 'rejected';
  payout_status?: string;

  // Admin-triggered Live Event Verification workflow
  event_live_status: EventLiveStatus;
  started_at?: string;
  started_by?: string;

  // 4 Mandatory Artist Verification Proofs
  start_image_url?: string;
  event_images: string[];
  artist_location?: ArtistLocation | null;
  event_video_url?: string;

  // Set automatically once all 4 proofs are uploaded
  verified_at?: string;
  updated_at: string;
}

export interface ProofChecklistSummary {
  hasStartImage: boolean;
  hasEventImages: boolean;
  hasLocation: boolean;
  hasVideo: boolean;
  completedCount: number;
  totalRequired: number;
  allUploaded: boolean;
}

export function computeProofStatus(record: Partial<EventVerificationRecord>): ProofChecklistSummary {
  const hasStartImage = Boolean(record.start_image_url && record.start_image_url.trim().length > 0);
  const hasEventImages = Array.isArray(record.event_images) && record.event_images.filter(Boolean).length > 0;
  const hasLocation = Boolean(
    record.artist_location &&
      typeof record.artist_location.latitude === 'number' &&
      typeof record.artist_location.longitude === 'number'
  );
  const hasVideo = Boolean(record.event_video_url && record.event_video_url.trim().length > 0);

  const completedCount = [hasStartImage, hasEventImages, hasLocation, hasVideo].filter(Boolean).length;

  return {
    hasStartImage,
    hasEventImages,
    hasLocation,
    hasVideo,
    completedCount,
    totalRequired: 4,
    allUploaded: completedCount === 4,
  };
}
