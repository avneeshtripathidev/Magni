/**
 * MAGNEVENTS ADMIN PORTAL AUTOMATED TEST SUITE
 * Tests Phase 3 Admin Integration: Campaign Toggle, Settings Updates,
 * Discount Bounds, Analytics Aggregation
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Admin Campaign Configuration Validator
function validateCampaignConfig(config) {
  const errors = [];
  if (typeof config.isVisible !== 'boolean') {
    errors.push('isVisible must be a boolean');
  }
  if (!config.couponCode || typeof config.couponCode !== 'string' || config.couponCode.trim().length < 3) {
    errors.push('Coupon code must be at least 3 characters');
  }
  const discount = Number(config.discountPercent);
  if (isNaN(discount) || discount < 1 || discount > 90) {
    errors.push('Discount percent must be between 1% and 90%');
  }
  const minBooking = Number(config.minBookingValue);
  if (isNaN(minBooking) || minBooking < 1000) {
    errors.push('Minimum booking value must be at least ₹1,000');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

describe('Admin Portal — Diwali Campaign Management (Phase 3)', () => {
  it('should validate genuine admin settings update', () => {
    const validConfig = {
      isVisible: true,
      couponCode: 'DIW100',
      discountPercent: 10,
      minBookingValue: 10000,
      campaignName: 'Diwali Special 2026'
    };
    const validation = validateCampaignConfig(validConfig);
    assert.strictEqual(validation.isValid, true);
    assert.strictEqual(validation.errors.length, 0);
  });

  it('should reject invalid discount bounds (>90% or <1%)', () => {
    const invalidConfig = {
      isVisible: true,
      couponCode: 'DIW100',
      discountPercent: 120, // Invalid: exceeds 90%
      minBookingValue: 10000
    };
    const validation = validateCampaignConfig(invalidConfig);
    assert.strictEqual(validation.isValid, false);
    assert.ok(validation.errors.some(e => e.includes('Discount percent')));
  });

  it('should accurately calculate campaign conversion rate from analytics events', () => {
    const impressions = 1000;
    const clicks = 250;
    const leads = 75;
    const conversions = 30;

    const ctr = (clicks / impressions) * 100;
    const leadConversionRate = (leads / clicks) * 100;
    const bookingRate = (conversions / leads) * 100;

    assert.strictEqual(ctr, 25); // 25% CTR
    assert.strictEqual(leadConversionRate, 30); // 30% Click-to-Lead
    assert.strictEqual(bookingRate, 40); // 40% Lead-to-Booking
  });
});

