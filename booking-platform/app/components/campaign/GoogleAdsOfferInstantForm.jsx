"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  isGoogleAdsOfferEligible,
  getGoogleAdsAttribution,
  hasDismissedGoogleAdsOffer,
  setDismissedGoogleAdsOffer,
  hasSubmittedGoogleAdsOffer,
  setSubmittedGoogleAdsOffer
} from '@/app/utils/googleAdsAttribution';
import { bookingService } from '@/app/services/bookingService';
import { validateName, validatePhone } from '@helpers/validation';
import { getSilentLocationIfGranted } from '@/app/utils/geolocation';
import '@/app/styles/components/DiwaliOfferBookingForm.css';

export default function GoogleAdsOfferInstantForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasStartedForm, setHasStartedForm] = useState(false);

  // Form Fields matching User Screenshot
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    eventType: 'Wedding Ceremony',
    location: '',
    date: '',
    budgetAmount: 25000 // Default ₹20,000 - ₹35,000
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [geoData, setGeoData] = useState({ latitude: null, longitude: null, detectedLocation: '' });
  const [copied, setCopied] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFiredViewRef = useRef(false);

  // Geolocation detection
  useEffect(() => {
    getSilentLocationIfGranted().then(geo => {
      if (geo && geo.success) {
        setGeoData({ latitude: geo.latitude, longitude: geo.longitude, detectedLocation: geo.detectedLocation });
        if (geo.city || geo.detectedLocation) {
          setFormData(prev => ({ ...prev, location: prev.location || geo.city || geo.detectedLocation }));
        }
      }
    });
  }, []);

  // Helper to record funnel tracking events
  const recordFunnelEvent = async (eventName, extraMeta = {}) => {
    try {
      const attribution = getGoogleAdsAttribution();
      const payload = {
        eventName,
        campaignId: 'diwali-special',
        campaignName: 'Diwali Special Offer & Date Lock (DIW100)',
        sessionId: attribution.session_id,
        referenceCode: referenceCode || extraMeta.referenceCode || null,
        metadata: {
          couponCode: 'DIW100',
          dateLockFee: 2499,
          budgetAmount: formData.budgetAmount,
          ...extraMeta
        },
        attribution
      };

      fetch('/api/campaigns/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});

      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
          event_category: 'campaign_funnel',
          event_label: 'DIW100',
          ...extraMeta
        });
      }
    } catch (e) {
      console.warn('[FunnelTracker] Notice:', e);
    }
  };

  // Traffic identification & 3-second auto-open logic
  useEffect(() => {
    const isOfferEligible = isGoogleAdsOfferEligible();
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hasOfferHash = hash === '#offer' || hash === '#lock-booking' || hash === '#google-offer' || hash === '#diwali-gift';
    const isExplicitOffer = searchParams?.get('offer') === 'true' || searchParams?.get('variant') === 'offer';

    const handleExplicitOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-google-ads-offer', handleExplicitOpen);

    if ((isOfferEligible && !hasDismissedGoogleAdsOffer() && !hasSubmittedGoogleAdsOffer()) || hasOfferHash || isExplicitOffer) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('open-google-ads-offer', handleExplicitOpen);
      };
    }

    return () => {
      window.removeEventListener('open-google-ads-offer', handleExplicitOpen);
    };
  }, [pathname, searchParams]);

  // Record view
  useEffect(() => {
    if (isOpen && !hasFiredViewRef.current) {
      hasFiredViewRef.current = true;
      recordFunnelEvent('offer_form_view', { page: pathname });
    }
  }, [isOpen]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Dynamic Tiered Savings Calculations
  const savings = useMemo(() => {
    const amount = Number(formData.budgetAmount) || 0;
    const minVal = 10000;
    const isEligible = amount >= minVal;

    let pct = 10;
    if (isEligible) {
      if (amount >= 200000) pct = 28;
      else if (amount >= 150000) pct = 26;
      else if (amount >= 120000) pct = 24;
      else if (amount >= 80000) pct = 22;
      else if (amount >= 50000) pct = 20;
      else if (amount >= 35000) pct = 18;
      else if (amount >= 25000) pct = 16;
      else if (amount >= 20000) pct = 14;
      else if (amount >= 15000) pct = 12;
      else pct = 10;
    } else {
      pct = 0;
    }

    const discountAmt = isEligible ? Math.round(amount * (pct / 100)) : 0;
    const finalAmt = isEligible ? amount - discountAmt : amount;

    return {
      amount,
      minVal,
      isEligible,
      discountAmt,
      finalAmt,
      pct
    };
  }, [formData.budgetAmount]);

  const handleClose = () => {
    setDismissedGoogleAdsOffer();
    setIsOpen(false);
  };

  const handleInputChange = (field, val) => {
    if (!hasStartedForm) {
      setHasStartedForm(true);
      recordFunnelEvent('offer_form_start');
    }

    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    const nameErr = validateName(formData.name);
    if (nameErr) errs.name = nameErr;

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) errs.phone = phoneErr;

    if (!formData.location?.trim()) {
      errs.location = 'Please enter your event city / location';
    }

    // Only validate date on desktop where the field is visible (hidden on mobile)
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
    if (!isMobile && !formData.date) {
      errs.date = 'Please select expected event date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Lead
  const handleSubmitLead = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const attribution = getGoogleAdsAttribution();
    const generatedRef = `MGN-DIW-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await bookingService.submitInstantRequest({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        eventType: formData.eventType || 'Event Booking',
        location: formData.location.trim(),
        date: formData.date || 'Flexible / To be decided',
        budget: `₹${formData.budgetAmount.toLocaleString('en-IN')}`,
        type: 'google_ads_lead',
        formName: 'GoogleAdsOfferInstantForm',
        referenceCode: generatedRef,
        campaignId: 'diwali-special',
        campaignName: 'Diwali Special Offer & Date Lock (DIW100)',
        appliedCoupon: 'DIW100',
        dateLockAmount: 2499,
        discountPercent: savings.pct,
        discountAmount: savings.discountAmt,
        finalBookingValue: savings.finalAmt,
        paymentStatus: 'unpaid',
        gclid: attribution.gclid,
        gbraid: attribution.gbraid,
        wbraid: attribution.wbraid,
        utm_source: attribution.utm_source || 'google',
        utm_medium: attribution.utm_medium || 'cpc',
        utm_campaign: attribution.utm_campaign || 'diwali_special_offer',
        utm_content: attribution.utm_content,
        utm_term: attribution.utm_term,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        detectedLocation: geoData.detectedLocation
      });

      setReferenceCode(generatedRef);
      setSubmittedGoogleAdsOffer(generatedRef);

      recordFunnelEvent('offer_form_submit', { referenceCode: generatedRef });
      recordFunnelEvent('qualified_lead', { referenceCode: generatedRef, eventType: formData.eventType });

      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          'send_to': 'AW-16657289873/9sBzCMry1eocEJGl6IY-',
          'value': savings.discountAmt || 2499,
          'currency': 'INR'
        });
      }

      setIsSuccess(true);
    } catch (err) {
      console.error('[GoogleAdsOffer] Submission error:', err);
      setErrors({ phone: 'Could not submit your inquiry. Please try again or connect via WhatsApp.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && referenceCode) {
      navigator.clipboard.writeText(referenceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createWhatsAppUrl = () => {
    const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE || '918076515257';
    const text = `Hi Magnevents, I claimed my Diwali Offer & Date Lock (₹2,499) with Coupon DIW100 for ${formData.eventType} on ${formData.date} in ${formData.location}. Budget: ₹${formData.budgetAmount.toLocaleString('en-IN')}, Ref Code: ${referenceCode}. Please share verified artist quotes and lock date!`;
    return `https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="diw-modal-root"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          className="diw-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />

        <motion.div
          className="diw-modal-card"
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 18 }}
          transition={{ type: 'spring', damping: 28, stiffness: 380 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. WINE RED PROMOTIONAL HERO BANNER MATCHING media_1793545767944_e6f822fb.jpg */}
          <div className="diw-promo-header">
            {/* Top Bar with Badge & Close Button */}
            <div className="diw-header-top">
              <div className="diw-badge-tag">
                <span>🎁</span>
                <span>EXCLUSIVE DIWALI OFFER</span>
              </div>

              <button
                type="button"
                className="diw-close-btn"
                onClick={handleClose}
                aria-label="Close offer modal"
              >
                ✕
              </button>
            </div>

            {/* Discount Highlight Spotlight Card */}
            <div className="diw-discount-highlight-card">
              <div className="diw-discount-badge-col">
                <span className="diw-discount-big">10% EXTRA OFF</span>
                <span className="diw-discount-tagline">YOUR EVENT BOOKING!</span>
              </div>
              <div className="diw-discount-info-col">
                <span className="diw-discount-min">On bookings worth <strong>₹10,000 or more.</strong></span>
                <div className="diw-coupon-pill-wrap">
                  <span className="diw-coupon-pill">DIW100</span>
                </div>
              </div>
            </div>
          </div>

          {!isSuccess ? (
            /* 2. WARM IVORY FORM BODY */
            <div className="diw-form-body">
              {/* Note: 3 black trust boxes removed as requested: 'only this sectoin remove from here' */}

              {/* Enquiry Form */}
              <form className="diw-form" onSubmit={handleSubmitLead}>
                <div className="diw-form-grid">
                  <div className="diw-form-group">
                    <label htmlFor="gao-name">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      id="gao-name"
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={formData.name}
                      className={errors.name ? 'diw-input-err' : ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    {errors.name && <span className="diw-err-msg">{errors.name}</span>}
                  </div>

                  <div className="diw-form-group">
                    <label htmlFor="gao-phone">
                      Mobile Number <span className="req">*</span>
                    </label>
                    <input
                      id="gao-phone"
                      type="tel"
                      required
                      placeholder="Enter mobile number"
                      value={formData.phone}
                      className={errors.phone ? 'diw-input-err' : ''}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[^\d+]/g, '');
                        handleInputChange('phone', sanitized);
                      }}
                    />
                    {errors.phone && <span className="diw-err-msg">{errors.phone}</span>}
                  </div>
                </div>

                <div className="diw-form-grid">
                  <div className="diw-form-group diw-field-event-type diw-hide-mobile">
                    <label htmlFor="gao-event-type">
                      Event Type <span className="req">*</span>
                    </label>
                    <select
                      id="gao-event-type"
                      value={formData.eventType}
                      onChange={(e) => handleInputChange('eventType', e.target.value)}
                    >
                      <option value="Wedding Ceremony">Wedding Ceremony</option>
                      <option value="Birthday Party">Birthday Party</option>
                      <option value="Engagement / Roka">Engagement / Roka</option>
                      <option value="Corporate Event">Corporate Event</option>
                      <option value="Anniversary Celebration">Anniversary Celebration</option>
                      <option value="Private House Party">Private House Party</option>
                      <option value="Cocktail & Sundowner">Cocktail & Sundowner</option>
                      <option value="Sufi / Ghazal Night">Sufi / Ghazal Night</option>
                      <option value="Bhajan / Devotional">Bhajan / Devotional</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="diw-form-group">
                    <label htmlFor="gao-city">
                      Event City / Location <span className="req">*</span>
                    </label>
                    <input
                      id="gao-city"
                      type="text"
                      required
                      placeholder="Enter city / location"
                      value={formData.location}
                      className={errors.location ? 'diw-input-err' : ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                    {errors.location && <span className="diw-err-msg">{errors.location}</span>}
                  </div>
                </div>

                <div className="diw-form-grid">
                  <div className="diw-form-group diw-field-event-date diw-hide-mobile">
                    <label htmlFor="gao-date">
                      Expected Event Date <span className="req">*</span>
                    </label>
                    <input
                      id="gao-date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      className={errors.date ? 'diw-input-err' : ''}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                    {errors.date && <span className="diw-err-msg">{errors.date}</span>}
                  </div>

                  <div className="diw-form-group">
                    <label htmlFor="gao-budget">
                      Estimated Event Budget <span className="req">*</span>
                    </label>
                    <select
                      id="gao-budget"
                      value={formData.budgetAmount}
                      onChange={(e) => handleInputChange('budgetAmount', Number(e.target.value))}
                    >
                      <option value={10000}>₹10,000 - ₹20,000 (10% Extra OFF)</option>
                      <option value={25000}>₹20,000 - ₹35,000 (16% Extra OFF)</option>
                      <option value={35000}>₹35,000 - ₹50,000 (18% Extra OFF)</option>
                      <option value={50000}>₹50,000 - ₹80,000 (20% Extra OFF)</option>
                      <option value={80000}>₹80,000 - ₹1,20,000 (22% Extra OFF)</option>
                      <option value={120000}>₹1,20,000 - ₹2,00,000 (24% Extra OFF)</option>
                      <option value={200000}>₹2,00,000+ (28% Extra OFF)</option>
                    </select>
                  </div>
                </div>

                {/* Primary Coral CTA Button */}
                <button
                  type="submit"
                  className="diw-submit-btn"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Securing Your Diwali Gift...' : 'CLAIM MY DIWALI GIFT →'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* SUCCESS STATE */
            <div className="diw-success-card">
              <div className="diw-success-icon">✓</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFF', margin: '0 0 6px 0' }}>
                Diwali Offer &amp; Date Lock Claimed! 🎁
              </h2>
              <p style={{ fontSize: '13px', color: '#D8C4B7', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                Your <strong>{savings.pct}% EXTRA DISCOUNT</strong> with Coupon <strong>DIW100</strong> and <strong>₹2,499 Date Lock Pass</strong> have been secured for your {formData.eventType} in {formData.location}!
              </p>

              <div className="diw-success-pass">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed rgba(232,185,67,0.35)' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#8C827A', textTransform: 'uppercase' }}>Enquiry Reference ID</span>
                    <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 900, color: '#E8B943', marginTop: '2px' }}>
                      {referenceCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    style={{ background: 'rgba(232,185,67,0.15)', border: '1px solid rgba(232,185,67,0.35)', color: '#E8B943', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {copied ? '✓ Copied' : 'Copy ID'}
                  </button>
                </div>

                <div className="diw-success-grid">
                  <div>
                    <span className="lbl">Applied Coupon</span>
                    <span className="val" style={{ color: '#E8B943' }}>DIW100 ({savings.pct}% OFF)</span>
                  </div>
                  <div>
                    <span className="lbl">Date Lock Pass</span>
                    <span className="val" style={{ color: '#FFF' }}>₹2,499 Priority Lock</span>
                  </div>
                  <div>
                    <span className="lbl">Event Date</span>
                    <span className="val">{formData.date}</span>
                  </div>
                  <div>
                    <span className="lbl">Event Location</span>
                    <span className="val">{formData.location}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#D8C4B7', marginBottom: '14px', lineHeight: 1.4 }}>
                A Magnevents booking concierge is preparing verified artist availability with your Diwali discounts unlocked and Date Lock reserved.
              </div>

              <a
                href={createWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="diw-submit-btn"
                style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span>💬 Connect on WhatsApp with ID</span>
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
