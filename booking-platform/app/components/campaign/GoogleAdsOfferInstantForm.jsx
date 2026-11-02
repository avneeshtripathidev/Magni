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

  // Geolocation detection (stored for attribution metadata, no auto-prefill in city field)
  useEffect(() => {
    getSilentLocationIfGranted().then(geo => {
      if (geo && geo.success) {
        setGeoData({ latitude: geo.latitude, longitude: geo.longitude, detectedLocation: geo.detectedLocation });
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

  // Traffic identification & prompt auto-open logic
  useEffect(() => {
    const handleExplicitOpen = () => {
      setIsOpen(true);
    };

    // Listen to all campaign & booking events
    window.addEventListener('open-google-ads-offer', handleExplicitOpen);
    window.addEventListener('open-instant-form', handleExplicitOpen);
    window.addEventListener('open-instant-booking', handleExplicitOpen);
    window.addEventListener('open-offer-form', handleExplicitOpen);
    window.addEventListener('open-lock-booking', handleExplicitOpen);
    window.addEventListener('open-date-lock', handleExplicitOpen);

    const checkHashAndParams = () => {
      if (typeof window === 'undefined') return false;
      const hash = (window.location.hash || '').toLowerCase();
      const search = window.location.search || '';
      const params = new URLSearchParams(search);

      const hasOfferHash = [
        '#offer',
        '#instant-form',
        '#instant',
        '#instant-booking',
        '#lock-booking',
        '#google-offer',
        '#diwali-gift',
        '#offer-form'
      ].includes(hash);

      const isExplicitOffer =
        params.get('offer') === 'true' ||
        params.get('offer') === '1' ||
        params.get('instant_form') === 'true' ||
        params.get('instant') === 'true' ||
        params.get('instant') === '1' ||
        params.get('variant') === 'offer' ||
        params.get('form') === 'instant';

      return hasOfferHash || isExplicitOffer;
    };

    const isExplicit = checkHashAndParams();
    const isEligible = isGoogleAdsOfferEligible();
    const isLocalDev = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );

    // If explicit query param / hash: open immediately (200ms)
    if (isExplicit) {
      const explicitTimer = setTimeout(() => {
        setIsOpen(true);
      }, 200);

      const onHashChange = () => {
        if (checkHashAndParams()) setIsOpen(true);
      };
      window.addEventListener('hashchange', onHashChange);
      window.addEventListener('popstate', onHashChange);

      return () => {
        clearTimeout(explicitTimer);
        window.removeEventListener('open-google-ads-offer', handleExplicitOpen);
        window.removeEventListener('open-instant-form', handleExplicitOpen);
        window.removeEventListener('open-instant-booking', handleExplicitOpen);
        window.removeEventListener('open-offer-form', handleExplicitOpen);
        window.removeEventListener('open-lock-booking', handleExplicitOpen);
        window.removeEventListener('open-date-lock', handleExplicitOpen);
        window.removeEventListener('hashchange', onHashChange);
        window.removeEventListener('popstate', onHashChange);
      };
    }

    // Google Ads traffic auto-open:
    // In local dev, ignore dismissed/submitted locks so developer & tester can always view and test.
    // In production, open once after 1000ms if not dismissed or submitted in the current session.
    const canAutoOpen = isEligible && (
      isLocalDev || (!hasDismissedGoogleAdsOffer() && !hasSubmittedGoogleAdsOffer())
    );

    if (canAutoOpen) {
      const autoTimer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      const onHashChange = () => {
        if (checkHashAndParams()) setIsOpen(true);
      };
      window.addEventListener('hashchange', onHashChange);
      window.addEventListener('popstate', onHashChange);

      return () => {
        clearTimeout(autoTimer);
        window.removeEventListener('open-google-ads-offer', handleExplicitOpen);
        window.removeEventListener('open-instant-form', handleExplicitOpen);
        window.removeEventListener('open-instant-booking', handleExplicitOpen);
        window.removeEventListener('open-offer-form', handleExplicitOpen);
        window.removeEventListener('open-lock-booking', handleExplicitOpen);
        window.removeEventListener('open-date-lock', handleExplicitOpen);
        window.removeEventListener('hashchange', onHashChange);
        window.removeEventListener('popstate', onHashChange);
      };
    }

    const onHashChange = () => {
      if (checkHashAndParams()) setIsOpen(true);
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);

    return () => {
      window.removeEventListener('open-google-ads-offer', handleExplicitOpen);
      window.removeEventListener('open-instant-form', handleExplicitOpen);
      window.removeEventListener('open-instant-booking', handleExplicitOpen);
      window.removeEventListener('open-offer-form', handleExplicitOpen);
      window.removeEventListener('open-lock-booking', handleExplicitOpen);
      window.removeEventListener('open-date-lock', handleExplicitOpen);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
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
        eventType: formData.eventType || 'Wedding Ceremony',
        location: formData.location?.trim() || 'Flexible / Pan India',
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
    const text = `Hi Magnevents, I claimed my Diwali Offer & Date Lock (₹2,499) with Coupon DIW100 for ${formData.eventType}. Budget: ₹${formData.budgetAmount.toLocaleString('en-IN')}, Ref Code: ${referenceCode}. Please share verified artist quotes and lock date!`;
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
          {/* 1. WINE RED PROMOTIONAL HERO BANNER (MATCHING media_1793554544528_d984c3a0.jpg) */}
          <div className="diw-promo-header">
            {/* Top Bar with Badge & Close Button */}
            <div className="diw-header-top">
              <div className="diw-badge-tag">
                <span>🪔</span>
                <span>VALID ONLY UNTIL DIWALI!</span>
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

            {/* Headline */}
            <h2 className="diw-title">Your Dream Event Starts Here!</h2>

            {/* Spotlight Date-Lock Box */}
            <div className="diw-date-lock-card">
              <div className="diw-lock-info-col">
                <span className="diw-lock-badge">LIMITED-TIME DIWALI OFFER</span>
                <span className="diw-lock-headline">Lock Your Event Booking at Just ₹2,499</span>
              </div>
              <div className="diw-lock-price-badge">
                <span className="diw-lock-original-price">₹10,000</span>
                <span className="diw-lock-current-price">₹2,499</span>
                <span className="diw-lock-price-lbl">DATE LOCK</span>
              </div>
            </div>
          </div>

          {!isSuccess ? (
            /* 2. WARM IVORY FORM BODY */
            <div className="diw-form-body">
              {/* Triple Discount Showcase Grid */}
              <div className="diw-triple-discount-wrap">
                <div className="diw-triple-discount-header">
                  <span>SAVE UP TO 65%</span>
                </div>
                <div className="diw-triple-cards-grid">
                  {/* Card 1: Package Offer */}
                  <div className="diw-triple-card">
                    <span className="diw-triple-pill">PACKAGE OFFER</span>
                    <span className="diw-triple-val">45%–50% OFF</span>
                    <span className="diw-triple-lbl">Event Booking</span>
                  </div>

                  {/* Card 2: Diwali Special (Highlighted) */}
                  <div className="diw-triple-card diw-triple-card-featured">
                    <span className="diw-triple-pill diw-pill-gold">DIWALI SPECIAL 🪔</span>
                    <span className="diw-triple-val diw-val-gold">+10% EXTRA</span>
                    <span className="diw-triple-lbl diw-lbl-gold">Code: DIW100</span>
                  </div>

                  {/* Card 3: Welcome Gift */}
                  <div className="diw-triple-card">
                    <span className="diw-triple-pill">WELCOME GIFT 🎁</span>
                    <span className="diw-triple-val">+5% FIRST OFF</span>
                    <span className="diw-triple-lbl">1st Booking Bonus</span>
                  </div>
                </div>
              </div>

              {/* Enquiry Form: Clean 4 Fields (City & Date removed per user request) */}
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
                      placeholder="e.g. Avneesh Tripathi"
                      autoComplete="off"
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
                      placeholder="+91 98765-43210"
                      autoComplete="off"
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
                  <div className="diw-form-group">
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
                    <label htmlFor="gao-budget">
                      Estimated Event Budget <span className="req">*</span>
                    </label>
                    <select
                      id="gao-budget"
                      value={formData.budgetAmount}
                      onChange={(e) => handleInputChange('budgetAmount', Number(e.target.value))}
                    >
                      <option value={10000}>₹10,000 - ₹20,000 (10% Extra OFF)</option>
                      <option value={25000}>₹20,000 - ₹35,000 (Eligible for 16% Extra OFF)</option>
                      <option value={35000}>₹35,000 - ₹50,000 (Eligible for 18% Extra OFF)</option>
                      <option value={50000}>₹50,000 - ₹80,000 (Eligible for 20% Extra OFF)</option>
                      <option value={80000}>₹80,000 - ₹1,20,000 (Eligible for 22% Extra OFF)</option>
                      <option value={120000}>₹1,20,000 - ₹2,00,000 (Eligible for 24% Extra OFF)</option>
                      <option value={200000}>₹2,00,000+ (Eligible for 28% Extra OFF)</option>
                    </select>
                  </div>
                </div>

                {/* Primary Coral CTA Button */}
                <button
                  type="submit"
                  className="diw-submit-btn"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Securing Your Offer & Date...' : 'Unlock My Offer & Lock Date →'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* SUCCESS STATE */
            <div className="diw-success-card">
              <div className="diw-success-icon-wrap">
                <div className="diw-success-icon">✓</div>
              </div>

              <h2 className="diw-success-title">
                Diwali Offer &amp; Date Lock Claimed! 🎁
              </h2>

              <p className="diw-success-desc">
                Your <strong>{savings.pct}% EXTRA DISCOUNT</strong> with Coupon <strong>DIW100</strong> and <strong>₹2,499 Date Lock Pass</strong> have been secured for your <strong>{formData.eventType}</strong>{formData.location ? ` in ${formData.location}` : ''}!
              </p>

              <div className="diw-success-pass">
                <div className="diw-pass-header">
                  <div>
                    <span className="diw-pass-ref-label">Official Priority Pass</span>
                    <div className="diw-pass-ref-code">
                      {referenceCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="diw-pass-copy-btn"
                  >
                    {copied ? '✓ Copied' : 'Copy ID'}
                  </button>
                </div>

                <div className="diw-pass-divider" />

                <div className="diw-success-grid">
                  <div>
                    <span className="lbl">Applied Coupon</span>
                    <span className="val val-coupon">DIW100 ({savings.pct}% OFF)</span>
                  </div>
                  <div>
                    <span className="lbl">Date Lock Pass</span>
                    <span className="val val-savings">₹2,499 Priority Lock</span>
                  </div>
                  <div>
                    <span className="lbl">Event Category</span>
                    <span className="val">{formData.eventType || 'Live Artists'}</span>
                  </div>
                  <div>
                    <span className="lbl">Booking Budget</span>
                    <span className="val">₹{formData.budgetAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="diw-pass-guarantee">
                  <span>✓ 100% Date Lock Priority</span>
                  <span>•</span>
                  <span>Direct Artist Pricing</span>
                </div>
              </div>

              <p className="diw-concierge-note">
                ⚡ A Magnevents booking concierge is preparing verified artist availability with your Diwali discounts unlocked and Date Lock reserved.
              </p>

              <a
                href={createWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="diw-whatsapp-btn"
              >
                <span>💬 Connect on WhatsApp with ID</span>
                <span>→</span>
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
