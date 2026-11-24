export type VerificationStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export interface SubmittedPricing {
  starting_price: number;
  solo_price: number;
  duo_price: number;
  band_price: number;
  hourly_price: number;
  travel_charges_policy: string;
}

export interface PerformanceDetails {
  min_duration_minutes: number;
  max_duration_minutes: number;
  sound_system_provided: boolean;
  technical_requirements: string;
  travel_readiness: 'local_only' | 'state_wide' | 'pan_india' | 'international';
  serviceable_cities: string[];
  blocked_dates?: string[];
}

export interface VerificationDocuments {
  legal_name: string;
  id_type: 'aadhaar' | 'pan' | 'passport' | 'voter_id' | 'driving_license' | '';
  id_number_masked: string;
  id_document_url: string;
  address_proof_url: string;
  pan_or_tax_id: string;
}

export interface ArtistProfile {
  id: string;
  user_id?: string;
  artist_no?: string;
  name: string;
  stage_name?: string;
  slug: string;
  phone_no: string;
  email?: string;
  category: string;
  sub_category?: string;
  genres: string[];
  city: string;
  state?: string;
  country: string;
  languages: string[];
  bio?: string;
  experience_years: number;
  rating?: number;
  successful_bookings?: number;
  price_min: number;
  price_max: number;
  cover_image_url?: string;
  profile_image_url?: string;
  gallery_images?: string[];
  video_url?: string;
  cloudflare_video_url?: string;
  youtube_links: string[];
  audio_samples: string[];
  instagram_url?: string;
  youtube_url?: string;
  spotify_url?: string;
  website_url?: string;
  submitted_pricing: SubmittedPricing;
  performance_details: PerformanceDetails;
  verification_documents: VerificationDocuments;
  verification_status: VerificationStatus;
  rejection_reason?: string;
  is_onboarding_complete?: boolean;
  onboarding_step?: number;
  profile_completion: number;
  profile_submitted_at?: string;
  verified_at?: string;
  is_live: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArtistNotification {
  id: string;
  artist_id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'verification' | 'booking' | 'system' | 'info';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface VerificationHistoryItem {
  id: string;
  artist_id: string;
  previous_status?: string;
  new_status: string;
  reason?: string;
  changed_by?: string;
  created_at: string;
}
