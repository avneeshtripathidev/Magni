/**
 * Google Ads Traffic Identification & Attribution Engine
 * Handles precise capture, cross-page persistence, and session management
 * for Google Ads (gclid, gbraid, wbraid, UTMs) and other traffic channels.
 */

const STORAGE_KEY_CAMPAIGN = 'magnevents_ad_attribution';
const STORAGE_KEY_IS_GADS = 'magnevents_is_google_ads';
const STORAGE_KEY_DISMISSED = 'magnevents_gads_offer_dismissed';
const STORAGE_KEY_SUBMITTED = 'magnevents_gads_offer_submitted';
const STORAGE_KEY_SESSION_ID = 'analytics_session_id';
const STORAGE_KEY_GADS_VARIANT = 'magnevents_gads_form_variant';

/**
 * Generates or retrieves an existing persistent session ID
 */
export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return '';
  try {
    let sid = sessionStorage.getItem(STORAGE_KEY_SESSION_ID);
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      sessionStorage.setItem(STORAGE_KEY_SESSION_ID, sid);
    }
    return sid;
  } catch (e) {
    return 'sess_' + Date.now();
  }
}

/**
 * Checks whether URL query or stored session indicates a Google Ads visit
 */
export function isGoogleAdsTraffic() {
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search);

    // QA / Reset Override: easily clear session and test organic traffic
    const trafficOverride = (params.get('traffic') || params.get('source') || '').toLowerCase();
    const isExplicitOrganic = trafficOverride === 'organic' || trafficOverride === 'direct' || params.get('reset') === 'true' || params.get('clear') === 'true';
    if (isExplicitOrganic) {
      sessionStorage.removeItem(STORAGE_KEY_IS_GADS);
      sessionStorage.removeItem(STORAGE_KEY_CAMPAIGN);
      sessionStorage.removeItem(STORAGE_KEY_GADS_VARIANT);
      sessionStorage.removeItem(STORAGE_KEY_DISMISSED);
      return false;
    }

    // 1. Check current URL search parameters
    const gclid = params.get('gclid');
    const gbraid = params.get('gbraid');
    const wbraid = params.get('wbraid');
    const utmSource = (params.get('utm_source') || '').toLowerCase();
    const utmMedium = (params.get('utm_medium') || '').toLowerCase();
    const campaignId = params.get('campaign_id') || params.get('campaign');

    const hasAdClickId = !!(gclid || gbraid || wbraid);
    const isPaidMedium = /cpc|ppc|paid|google_ad|paidsearch|ad/i.test(utmMedium);
    const isGooglePaid = utmSource.includes('google') && isPaidMedium;

    if (hasAdClickId || isGooglePaid) {
      return true;
    }

    // 2. Check active session storage (user navigating to subsequent pages)
    const storedIsGads = sessionStorage.getItem(STORAGE_KEY_IS_GADS);
    if (storedIsGads === 'true') {
      return true;
    }

    // 3. Check parsed stored attribution
    const stored = sessionStorage.getItem(STORAGE_KEY_CAMPAIGN);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.gclid || parsed.gbraid || parsed.wbraid || (parsed.utm_source?.includes('google') && /cpc|ppc|paid/i.test(parsed.utm_medium || ''))) {
        return true;
      }
    }
  } catch (e) {}

  return false;
}

/**
 * Determines the form variant for traffic:
 * - Normal / Non-ad traffic ALWAYS receives 'normal_form' (100%).
 * - Google Ads traffic is allocated 60% 'offer_form' and 40% 'normal_form'.
 * - Supports QA query override: ?form_variant=offer or ?form_variant=normal
 * - Assignment is strictly persistent per user session.
 */
export function getGoogleAdsFormVariant() {
  if (typeof window === 'undefined') return 'normal_form';

  // 1. Non-ad visitors always see the normal form
  if (!isGoogleAdsTraffic()) {
    return 'normal_form';
  }

  try {
    // 2. QA / Debug override via URL parameters
    const params = new URLSearchParams(window.location.search);
    const variantParam = (params.get('form_variant') || params.get('variant') || '').toLowerCase();
    if (variantParam === 'offer' || variantParam === 'offer_form') {
      sessionStorage.setItem(STORAGE_KEY_GADS_VARIANT, 'offer_form');
      return 'offer_form';
    }
    if (variantParam === 'normal' || variantParam === 'normal_form' || variantParam === 'control') {
      sessionStorage.setItem(STORAGE_KEY_GADS_VARIANT, 'normal_form');
      return 'normal_form';
    }

    // 3. Existing session assignment check (prevents flip-flopping across page visits)
    const storedVariant = sessionStorage.getItem(STORAGE_KEY_GADS_VARIANT);
    if (storedVariant === 'offer_form' || storedVariant === 'normal_form') {
      return storedVariant;
    }

    // 4. Compute 60/40 allocation: 60% offer_form, 40% normal_form
    const isOffer = Math.random() < 0.6;
    const assignedVariant = isOffer ? 'offer_form' : 'normal_form';
    sessionStorage.setItem(STORAGE_KEY_GADS_VARIANT, assignedVariant);
    return assignedVariant;
  } catch (e) {
    return 'offer_form';
  }
}

/**
 * Checks whether user is eligible to see the Google Ads Offer Form:
 * True if user is from Google Ads AND assigned to the 60% 'offer_form' variant.
 */
export function isGoogleAdsOfferEligible() {
  if (typeof window === 'undefined') return false;
  return isGoogleAdsTraffic() && getGoogleAdsFormVariant() === 'offer_form';
}

/**
 * Captures attribution parameters from the current URL and persists them throughout the session
 */
export function captureAndPersistGoogleAdsAttribution() {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const sessionId = getOrCreateSessionId();

    const gclid = params.get('gclid') || '';
    const gbraid = params.get('gbraid') || '';
    const wbraid = params.get('wbraid') || '';
    const utmSource = params.get('utm_source') || '';
    const utmMedium = params.get('utm_medium') || '';
    const utmCampaign = params.get('utm_campaign') || params.get('campaign') || '';
    const utmContent = params.get('utm_content') || '';
    const utmTerm = params.get('utm_term') || params.get('keyword') || '';

    const hasIncomingAdParams = !!(gclid || gbraid || wbraid || utmSource || utmCampaign);
    const isAd = isGoogleAdsTraffic();

    let existingData = {};
    const cached = sessionStorage.getItem(STORAGE_KEY_CAMPAIGN);
    if (cached) {
      try { existingData = JSON.parse(cached); } catch (e) {}
    }

    const attribution = {
      gclid: gclid || existingData.gclid || null,
      gbraid: gbraid || existingData.gbraid || null,
      wbraid: wbraid || existingData.wbraid || null,
      utm_source: utmSource || existingData.utm_source || (isAd ? 'google' : null),
      utm_medium: utmMedium || existingData.utm_medium || (isAd ? 'cpc' : null),
      utm_campaign: utmCampaign || existingData.utm_campaign || null,
      utm_content: utmContent || existingData.utm_content || null,
      utm_term: utmTerm || existingData.utm_term || null,
      landing_page: existingData.landing_page || window.location.href,
      referrer: existingData.referrer || document.referrer || 'Direct',
      first_visit_timestamp: existingData.first_visit_timestamp || new Date().toISOString(),
      session_id: sessionId,
      traffic_source: isAd ? 'Google Ads' : (existingData.traffic_source || 'Direct'),
      form_variant: isAd ? getGoogleAdsFormVariant() : 'normal_form'
    };

    sessionStorage.setItem(STORAGE_KEY_CAMPAIGN, JSON.stringify(attribution));
    if (isAd) {
      sessionStorage.setItem(STORAGE_KEY_IS_GADS, 'true');
      localStorage.setItem('magnevents_last_gads_visit', new Date().toISOString());
    }

    return attribution;
  } catch (err) {
    console.warn('[Attribution] Storage error:', err);
    return null;
  }
}

/**
 * Returns current attribution object
 */
export function getGoogleAdsAttribution() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CAMPAIGN);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return captureAndPersistGoogleAdsAttribution() || {};
}

/**
 * Offer Form display guards (prevents spamming users)
 */
export function hasDismissedGoogleAdsOffer() {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_KEY_DISMISSED) === 'true';
}

export function setDismissedGoogleAdsOffer() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
  } catch (e) {}
}

export function hasSubmittedGoogleAdsOffer() {
  if (typeof window === 'undefined') return false;
  return (
    sessionStorage.getItem(STORAGE_KEY_SUBMITTED) === 'true' ||
    localStorage.getItem(STORAGE_KEY_SUBMITTED) === 'true'
  );
}

export function setSubmittedGoogleAdsOffer(refCode) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY_SUBMITTED, 'true');
    localStorage.setItem(STORAGE_KEY_SUBMITTED, 'true');
    if (refCode) {
      sessionStorage.setItem('magnevents_offer_last_ref', refCode);
    }
  } catch (e) {}
}

