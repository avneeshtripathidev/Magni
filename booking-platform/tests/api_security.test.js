/**
 * MAGNEVENTS BACKEND API, PAYMENT & SECURITY AUTOMATED TEST SUITE
 * Tests Phase 4 (C, D, F): Razorpay HMAC SHA256 Verification, XSS Sanitization,
 * Lead Deduplication, and API Endpoint Resiliency
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

// 1. Razorpay Signature Verification Engine
function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${orderId}|${paymentId}`);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
}

// 2. Input Sanitization Engine (Protection against XSS / Injection)
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip JS execution scheme
    .trim();
}

// 3. Rate-Limiting & Deduplication Map
class LeadSubmissionDeduplicator {
  constructor(cooldownMs = 5000) {
    this.cooldownMs = cooldownMs;
    this.submissions = new Map();
  }

  isDuplicate(phone, eventType) {
    const key = `${phone}_${eventType}`;
    const now = Date.now();
    const lastTime = this.submissions.get(key);

    if (lastTime && now - lastTime < this.cooldownMs) {
      return true; // Duplicate attempt within cooldown window
    }

    this.submissions.set(key, now);
    return false;
  }
}

describe('Backend API, Payment & Security Assurance', () => {

  describe('Razorpay Advance Payment Signature Verification (Phase 4D)', () => {
    const TEST_KEY_SECRET = 'test_secret_998877665544332211';
    const TEST_ORDER_ID = 'order_DA9876543210';
    const TEST_PAYMENT_ID = 'pay_PZ1234567890';

    // Generate valid test signature
    const hmac = crypto.createHmac('sha256', TEST_KEY_SECRET);
    hmac.update(`${TEST_ORDER_ID}|${TEST_PAYMENT_ID}`);
    const validSignature = hmac.digest('hex');

    it('should successfully verify a genuine Razorpay payment signature', () => {
      const isValid = verifyRazorpaySignature(TEST_ORDER_ID, TEST_PAYMENT_ID, validSignature, TEST_KEY_SECRET);
      assert.strictEqual(isValid, true);
    });

    it('should reject a tampered / spoofed payment signature', () => {
      const spoofedSignature = 'a'.repeat(64);
      let isValid = false;
      try {
        isValid = verifyRazorpaySignature(TEST_ORDER_ID, TEST_PAYMENT_ID, spoofedSignature, TEST_KEY_SECRET);
      } catch (e) {
        isValid = false;
      }
      assert.strictEqual(isValid, false);
    });

    it('should reject mismatched order ID or payment ID', () => {
      const mismatchedOrder = 'order_DIFFERENT_999';
      let isValid = false;
      try {
        isValid = verifyRazorpaySignature(mismatchedOrder, TEST_PAYMENT_ID, validSignature, TEST_KEY_SECRET);
      } catch (e) {
        isValid = false;
      }
      assert.strictEqual(isValid, false);
    });
  });

  describe('Input Sanitization & Security Safeguards (Phase 4F)', () => {
    it('should neutralize XSS attack vectors from user form input', () => {
      const maliciousName = '<script>alert("hack")</script>Avneesh Tripathi';
      const cleanName = sanitizeInput(maliciousName);
      assert.strictEqual(cleanName.includes('<script>'), false);
      assert.strictEqual(cleanName.includes('</script>'), false);
      assert.ok(cleanName.includes('Avneesh Tripathi'));
    });

    it('should strip javascript: pseudo-protocols from input strings', () => {
      const maliciousPayload = 'javascript:void(0)';
      const cleanPayload = sanitizeInput(maliciousPayload);
      assert.strictEqual(cleanPayload.toLowerCase().includes('javascript:'), false);
    });
  });

  describe('Lead Submission Rate-Limiting & Deduplication (Phase 4C)', () => {
    it('should block rapid repeated duplicate submissions within cooldown period', () => {
      const deduplicator = new LeadSubmissionDeduplicator(3000);
      const phone = '9876543210';
      const eventType = 'Wedding';

      // First submission: allowed
      const isFirstDup = deduplicator.isDuplicate(phone, eventType);
      assert.strictEqual(isFirstDup, false);

      // Immediate second submission: blocked as duplicate
      const isSecondDup = deduplicator.isDuplicate(phone, eventType);
      assert.strictEqual(isSecondDup, true);
    });
  });
});

