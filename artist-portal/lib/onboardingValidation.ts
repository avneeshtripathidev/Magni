/**
 * Centralized Strict Onboarding Validation Engine
 * 
 * Enforces 100% completion across all 4 mandatory onboarding steps:
 * Step 1: Identity & Act
 * Step 2: Repertoire & Bio
 * Step 3: Pricing & Logistics
 * Step 4: Portfolio, Media & Socials
 */

export interface StepValidationResult {
  isValid: boolean;
  missing: string[];
}

/**
 * Checks whether an image URL is a fallback / default placeholder rather than a genuine user upload
 */
export function isDefaultAvatar(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  if (trimmed === '') return true;
  if (trimmed.includes('unsplash.com/photo-1511671782779-c97d3d27a1d4')) return true;
  if (trimmed.includes('default-avatar') || trimmed.includes('/placeholder') || trimmed.includes('avatar-placeholder')) return true;
  if (trimmed === '/default-avatar.png' || trimmed === '/placeholder.png') return true;
  return false;
}

/**
 * Step 1: Identity & Act
 */
export function validateStep1(data: any): StepValidationResult {
  const missing: string[] = [];
  if (!data) return { isValid: false, missing: ['All Step 1 details missing'] };

  const name = String(data.name || data.legal_name || '').trim();
  if (!name || name.length < 2) missing.push('Legal Full Name');

  const stageName = String(data.stage_name || '').trim();
  if (!stageName || stageName.length < 2) missing.push('Stage / Act Name');

  const phone = String(data.phone_no || data.phone || '').replace(/\D/g, '');
  if (phone.length < 10) missing.push('Valid 10-digit Phone / WhatsApp');

  const email = String(data.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push('Valid Email Address');

  const category = String(data.category || '').trim();
  if (!category) missing.push('Primary Performance Category');

  const subCategory = String(data.sub_category || '').trim();
  if (!subCategory) missing.push('Specialty / Sub-Category');

  const city = String(data.city || '').trim();
  if (!city) missing.push('Base City');

  const state = String(data.state || '').trim();
  if (!state) missing.push('State / Region');

  const exp = data.experience_years;
  if (exp === undefined || exp === null || exp === '' || Number(exp) < 0) {
    missing.push('Years of Experience');
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Step 2: Repertoire & Bio
 */
export function validateStep2(data: any): StepValidationResult {
  const missing: string[] = [];
  if (!data) return { isValid: false, missing: ['All Step 2 details missing'] };

  const genres = Array.isArray(data.genres) ? data.genres.filter(Boolean) : [];
  if (genres.length === 0) missing.push('At least 1 Musical Genre');

  const languages = Array.isArray(data.languages) ? data.languages.filter(Boolean) : [];
  if (languages.length === 0) missing.push('At least 1 Performance Language');

  const coverage = Array.isArray(data.serviceable_cities) 
    ? data.serviceable_cities.filter(Boolean)
    : (data.performance_details?.serviceable_cities || []);
  if (coverage.length === 0 && !data.city) {
    missing.push('At least 1 Coverage City');
  }

  const bio = String(data.bio || '').trim();
  if (!bio || bio.length < 20) {
    missing.push('Artist Biography (minimum 20 characters)');
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Step 3: Pricing & Logistics
 */
export function validateStep3(data: any): StepValidationResult {
  const missing: string[] = [];
  if (!data) return { isValid: false, missing: ['All Step 3 details missing'] };

  const pricing = data.submitted_pricing || {};
  const perf = data.performance_details || {};

  const startingPrice = Number(data.starting_price || pricing.solo_price || pricing.starting_price || data.price_min || 0);
  if (startingPrice <= 0) missing.push('Starting / Solo Rate (₹)');

  const duoPrice = Number(data.duo_price || pricing.duo_price || 0);
  if (duoPrice <= 0) missing.push('Duo Act Rate (₹)');

  const bandPrice = Number(data.band_price || pricing.band_price || data.price_max || 0);
  if (bandPrice <= 0) missing.push('Full Band Rate (₹)');

  const hourlyPrice = Number(data.hourly_price || pricing.hourly_price || 0);
  if (hourlyPrice <= 0) missing.push('Hourly Overtime Rate (₹)');

  const travelPolicy = String(data.travel_policy || pricing.travel_charges_policy || '').trim();
  if (!travelPolicy) missing.push('Travel & Hospitality Policy');

  const minDuration = Number(data.min_duration || perf.min_duration_minutes || 0);
  if (minDuration <= 0) missing.push('Min Set Duration');

  const maxDuration = Number(data.max_duration || perf.max_duration_minutes || 0);
  if (maxDuration <= 0) missing.push('Max Set Duration');
  if (minDuration > 0 && maxDuration > 0 && maxDuration < minDuration) {
    missing.push('Max Set Duration must be >= Min Duration');
  }

  const techRider = String(data.tech_requirements || perf.technical_requirements || '').trim();
  if (!techRider) missing.push('Technical Stage Rider');

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Step 4: Portfolio, Media & Socials
 */
export function validateStep4(data: any): StepValidationResult {
  const missing: string[] = [];
  if (!data) return { isValid: false, missing: ['All Step 4 details missing'] };

  const profileImg = data.profile_image_url || data.gallery_images?.[0];
  if (!profileImg || isDefaultAvatar(profileImg)) {
    missing.push('Primary Profile Photo (Upload real performer photo)');
  }

  const coverImg = data.cover_image_url;
  if (!coverImg || isDefaultAvatar(coverImg)) {
    missing.push('Stage Cover Banner (Upload real stage banner)');
  }

  const videos = Array.isArray(data.youtube_links) 
    ? data.youtube_links.filter((v: any) => typeof v === 'string' && v.trim().length > 5)
    : [];
  const singleVideo = data.video_url || data.cloudflare_video_url;
  if (videos.length === 0 && (!singleVideo || String(singleVideo).trim().length < 5)) {
    missing.push('At least 1 Performance Video Showreel / Reel');
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Calculate strict profile completion percentage (0 to 100)
 * 25% for each genuinely complete step. Reaches 100% ONLY when all mandatory fields across Steps 1-4 are filled.
 */
export function calculateStrictCompletion(data: any): number {
  if (!data) return 0;
  let score = 0;

  if (validateStep1(data).isValid) score += 25;
  if (validateStep2(data).isValid) score += 25;
  if (validateStep3(data).isValid) score += 25;
  if (validateStep4(data).isValid) score += 25;

  return score;
}

/**
 * Returns true ONLY if all 4 steps are strictly valid and completion is 100%
 */
export function checkIsOnboardingComplete(data: any): boolean {
  if (!data) return false;
  if (data.is_onboarding_complete === true || data.performance_details?.is_onboarding_complete === true) {
    return true;
  }
  return calculateStrictCompletion(data) === 100;
}

/**
 * Returns the highest incomplete step number (1, 2, 3, or 4)
 */
export function getHighestIncompleteStep(data: any): number {
  if (!data) return 1;
  if (!validateStep1(data).isValid) return 1;
  if (!validateStep2(data).isValid) return 2;
  if (!validateStep3(data).isValid) return 3;
  if (!validateStep4(data).isValid) return 4;
  return 4;
}
