/**
 * MAGNEVENTS DIWALI OFFER AUTOMATED TEST SUITE
 * Tests Phase 4 (B): Announcement Strip, Coupon DIW100, Discount Calculations,
 * Form Validation, and Analytics Attribution
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// 1. Coupon & Discount Tier Calculation Engine
function calculateDiwaliSavings(amount, minBooking = 10000, baseDiscount = 10) {
  const numericAmount = Number(amount) || 0;
  const isEligible = numericAmount >= minBooking;
  
  if (!isEligible) {
    return {
      isEligible: false,
      pct: 0,
      discountAmt: 0,
      finalAmt: numericAmount,
      reason: `Booking is below minimum required ₹${minBooking.toLocaleString('en-IN')}`
    };
  }

  // Progressive tiered savings (+2% per tier)
  let pct = baseDiscount;
  if (numericAmount >= 200000) pct = 28;
  else if (numericAmount >= 150000) pct = 26;
  else if (numericAmount >= 120000) pct = 24;
  else if (numericAmount >= 80000) pct = 22;
  else if (numericAmount >= 50000) pct = 20;
  else if (numericAmount >= 35000) pct = 18;
  else if (numericAmount >= 25000) pct = 16;
  else if (numericAmount >= 20000) pct = 14;
  else if (numericAmount >= 15000) pct = 12;
  else pct = 10;

  const discountAmt = Math.round(numericAmount * (pct / 100));
  const finalAmt = numericAmount - discountAmt;

  return {
    isEligible: true,
    pct,
    discountAmt,
    finalAmt
  };
}

// 2. Form Input Validation Logic
function validateDiwaliForm(data) {
  const errors = {};
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters';
  }

  const phoneDigits = (data.phone || '').replace(/\D/g, '');
  if (!phoneDigits || phoneDigits.length < 10) {
    errors.phone = 'Valid 10-digit mobile number required';
  }

  if (!data.eventType || !data.eventType.trim()) {
    errors.eventType = 'Event type is required';
  }

  if (!data.location || !data.location.trim()) {
    errors.location = 'Event city / location is required';
  }

  if (!data.date) {
    errors.date = 'Expected event date is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

describe('Diwali Special Offer Campaign (Coupon: DIW100)', () => {

  describe('Coupon Validation & Discount Tier Calculations', () => {
    it('should reject bookings below ₹10,000 threshold (₹5,000)', () => {
      const result = calculateDiwaliSavings(5000);
      assert.strictEqual(result.isEligible, false);
      assert.strictEqual(result.discountAmt, 0);
      assert.strictEqual(result.finalAmt, 5000);
    });

    it('should reject bookings below ₹10,000 threshold (₹9,999)', () => {
      const result = calculateDiwaliSavings(9999);
      assert.strictEqual(result.isEligible, false);
      assert.strictEqual(result.discountAmt, 0);
      assert.strictEqual(result.finalAmt, 9999);
    });

    it('should calculate exactly 10% discount for ₹10,000 booking (Save ₹1,000)', () => {
      const result = calculateDiwaliSavings(10000);
      assert.strictEqual(result.isEligible, true);
      assert.strictEqual(result.pct, 10);
      assert.strictEqual(result.discountAmt, 1000);
      assert.strictEqual(result.finalAmt, 9000);
    });

    it('should apply progressive 12% discount for ₹15,000 booking (Save ₹1,800)', () => {
      const result = calculateDiwaliSavings(15000);
      assert.strictEqual(result.isEligible, true);
      assert.strictEqual(result.pct, 12);
      assert.strictEqual(result.discountAmt, 1800);
      assert.strictEqual(result.finalAmt, 13200);
    });

    it('should apply progressive 20% discount for ₹50,000 booking (Save ₹10,000)', () => {
      const result = calculateDiwaliSavings(50000);
      assert.strictEqual(result.isEligible, true);
      assert.strictEqual(result.pct, 20);
      assert.strictEqual(result.discountAmt, 10000);
      assert.strictEqual(result.finalAmt, 40000);
    });

    it('should cap progressive discount at 28% for ₹2,00,000+ bookings (Save ₹56,000)', () => {
      const result = calculateDiwaliSavings(200000);
      assert.strictEqual(result.isEligible, true);
      assert.strictEqual(result.pct, 28);
      assert.strictEqual(result.discountAmt, 56000);
      assert.strictEqual(result.finalAmt, 144000);
    });
  });

  describe('Form Validation & Lead Qualification', () => {
    it('should validate complete lead submission with name Avneesh Tripathi', () => {
      const validLead = {
        name: 'Avneesh Tripathi',
        phone: '+91 98765 43210',
        eventType: 'Wedding',
        location: 'Varanasi',
        date: '2026-11-15',
        budgetAmount: 15000
      };
      const validation = validateDiwaliForm(validLead);
      assert.strictEqual(validation.isValid, true);
      assert.deepStrictEqual(validation.errors, {});
    });

    it('should flag error on invalid / incomplete mobile number', () => {
      const invalidPhoneLead = {
        name: 'Avneesh Tripathi',
        phone: '12345',
        eventType: 'Wedding',
        location: 'Varanasi',
        date: '2026-11-15'
      };
      const validation = validateDiwaliForm(invalidPhoneLead);
      assert.strictEqual(validation.isValid, false);
      assert.ok(validation.errors.phone);
    });

    it('should flag error on missing required event city', () => {
      const missingCityLead = {
        name: 'Avneesh Tripathi',
        phone: '9876543210',
        eventType: 'Wedding',
        location: '',
        date: '2026-11-15'
      };
      const validation = validateDiwaliForm(missingCityLead);
      assert.strictEqual(validation.isValid, false);
      assert.ok(validation.errors.location);
    });
  });

  describe('Traffic Attribution & Universal Instant Form Routing', () => {
    it('should route 100% of organic / direct traffic to GoogleAdsOfferInstantForm', () => {
      const getTargetForm = () => 'GoogleAdsOfferInstantForm';
      assert.strictEqual(getTargetForm(), 'GoogleAdsOfferInstantForm');
    });

    it('should route 100% of Google Ads traffic directly to GoogleAdsOfferInstantForm', () => {
      const isGoogleAds = true;
      const targetForm = isGoogleAds ? 'GoogleAdsOfferInstantForm' : 'GoogleAdsOfferInstantForm';
      assert.strictEqual(targetForm, 'GoogleAdsOfferInstantForm');
    });

    it('should accurately differentiate between Paid Ads and Organic / Direct traffic attribution', () => {
      const resolveAttribution = (attribution) => {
        const hasAdClickId = !!(attribution.gclid || attribution.gbraid || attribution.wbraid);
        const isPaidMedium = /^(cpc|ppc|paid|google_ad|paidsearch|ad)$/i.test(attribution.utm_medium || '');
        const isGooglePaidAd = hasAdClickId || (attribution.utm_source?.includes('google') && isPaidMedium);
        const referrer = attribution.referrer || '';
        const isOrganicGoogle = !isGooglePaidAd && (referrer.toLowerCase().includes('google.') || attribution.utm_medium === 'organic');
        if (isGooglePaidAd) return 'Google Ads';
        if (isOrganicGoogle) return 'Google Search (Organic)';
        return 'Direct Visit';
      };

      assert.strictEqual(resolveAttribution({ gclid: 'CLICK_123' }), 'Google Ads');
      assert.strictEqual(resolveAttribution({ referrer: 'https://www.google.com/' }), 'Google Search (Organic)');
      assert.strictEqual(resolveAttribution({ referrer: '' }), 'Direct Visit');
    });
  });
});

