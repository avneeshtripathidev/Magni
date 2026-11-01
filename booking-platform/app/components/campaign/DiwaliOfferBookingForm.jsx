"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';
import { getGoogleAdsAttribution } from '@/app/utils/googleAdsAttribution';
import { bookingService } from '@/app/services/bookingService';
import { validateName, validatePhone } from '@helpers/validation';
import '@/app/styles/components/DiwaliOfferBookingForm.css';

export default function DiwaliOfferBookingForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [hasStartedForm, setHasStartedForm] = useState(false);

  // Dynamic Settings
  const [settings, setSettings] = useState({
    couponCode: "DIW100",
    discountPercent: 10,
    minBookingValue: 10000,
    campaignName: "Diwali Special",
    offerBadge: "EXCLUSIVE DIWALI OFFER",
    formHeading: "Make Your Celebration Extra Special!",
    supportingMessage: "A Little More Celebration. A Little Less Spending. ✨",
    offerHighlight: "This Diwali, enjoy unforgettable celebrations with an exclusive gift from us.",
    ctaText: "CLAIM MY DIWALI GIFT →"
  });

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    eventType: 'Wedding',
    location: '',
    date: '',
    budgetAmount: 15000 // Numeric representation for live discount calculation
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoData, setGeoData] = useState({ latitude: null, longitude: null, detectedLocation: '' });
  const [copied, setCopied] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFiredOpenRef = useRef(false);

  // 1. Fetch live admin configuration
  useEffect(() => {
    fetch('/api/settings/diwali-offer', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSettings(prev => ({
            ...prev,
            ...data
          }));
        }
      })
      .catch(() => {});
  }, []);


  // Helper to record funnel events
  const recordEvent = (eventName, meta = {}) => {
    try {
      const attribution = getGoogleAdsAttribution();
      fetch('/api/campaigns/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          campaignId: 'diwali-special',
          campaignName: 'Diwali Special Gift (DIW100)',
          sessionId: attribution.session_id,
          referenceCode: referenceCode || meta.referenceCode || null,
          metadata: {
            couponCode: settings.couponCode,
            discountPercent: settings.discountPercent,
            minBookingValue: settings.minBookingValue,
            ...meta
          },
          attribution
        }),
        keepalive: true
      }).catch(() => {});

      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
          event_category: 'diwali_campaign',
          event_label: settings.couponCode,
          ...meta
        });
      }
    } catch (e) {}
  };

  // 3. Listen to open triggers
  useEffect(() => {
    const handleOpen = (e) => {
      if (e?.detail) {
        setSettings(prev => ({ ...prev, ...e.detail }));
      }
      setIsOpen(true);
    };

    window.addEventListener('open-diwali-offer', handleOpen);

    // URL hash check
    const checkUrl = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const couponParam = searchParams?.get('coupon');
        if (
          hash === '#diwali-gift' ||
          hash === '#diw100' ||
          hash === '#diwali-offer' ||
          couponParam?.toUpperCase() === 'DIW100'
        ) {
          setIsOpen(true);
        }
      }
    };

    checkUrl();
    window.addEventListener('hashchange', checkUrl);

    return () => {
      window.removeEventListener('open-diwali-offer', handleOpen);
      window.removeEventListener('hashchange', checkUrl);
    };
  }, [searchParams]);

  // 4. Track 'diwali_offer_form_open'
  useEffect(() => {
    if (isOpen && !hasFiredOpenRef.current) {
      hasFiredOpenRef.current = true;
      recordEvent('diwali_offer_form_open', { page: pathname });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pathname]);

  // 5. Scroll lock
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

  // Dynamic Tiered Savings Calculations (+2% per ascending tier)
  const savings = useMemo(() => {
    const amount = Number(formData.budgetAmount) || 0;
    const minVal = Number(settings.minBookingValue) || 10000;
    const isEligible = amount >= minVal;

    let pct = Number(settings.discountPercent) || 10;
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
  }, [formData.budgetAmount, settings.minBookingValue, settings.discountPercent]);

  const handleInputChange = (field, val) => {
    if (!hasStartedForm) {
      setHasStartedForm(true);
      recordEvent('diwali_offer_form_start');
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
      errs.location = 'Please enter your event city';
    }

    // Only validate date on desktop where the field is visible (hidden on mobile)
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
    if (!isMobile && !formData.date) {
      errs.date = 'Please select expected event date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const attribution = getGoogleAdsAttribution();
    const generatedRef = `MAG-DIW-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // 1. Submit lead to bookingService and database
      await bookingService.submitInstantRequest({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        eventType: formData.eventType || 'Event Booking',
        location: formData.location.trim(),
        date: formData.date || 'Flexible / To be decided',
        budget: `₹${formData.budgetAmount.toLocaleString('en-IN')}`,
        type: 'diwali_offer_lead',
        formName: 'DiwaliOfferBookingForm',
        referenceCode: generatedRef,
        couponCode: settings.couponCode,
        discountPercent: settings.discountPercent,
        campaignId: 'diwali-special',
        campaignName: 'Diwali Special Gift (DIW100)',
        message: `Applied Coupon: ${settings.couponCode} (10% EXTRA OFF). Budget: ₹${formData.budgetAmount.toLocaleString('en-IN')}. Potential Savings: ₹${savings.discountAmt.toLocaleString('en-IN')}.`,
        gclid: attribution.gclid,
        gbraid: attribution.gbraid,
        wbraid: attribution.wbraid,
        utm_source: attribution.utm_source || 'direct',
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign || 'diwali_special',
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        detectedLocation: geoData.detectedLocation
      });

      setReferenceCode(generatedRef);

      // 2. Record conversion events
      recordEvent('diwali_offer_form_submit', {
        referenceCode: generatedRef,
        budgetAmount: formData.budgetAmount,
        discountAmount: savings.discountAmt
      });
      recordEvent('diwali_coupon_applied', {
        couponCode: settings.couponCode,
        discountAmount: savings.discountAmt,
        referenceCode: generatedRef
      });

      setIsSuccess(true);
    } catch (err) {
      console.error('[DiwaliOffer] Submit error:', err);
      setErrors({ phone: 'Could not process submission. Please retry or connect on WhatsApp.' });
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
    const text = `Hi Magnevents, I claimed my Diwali 10% Extra OFF Gift with Coupon DIW100 for ${formData.eventType} on ${formData.date} in ${formData.location}. Budget: ₹${formData.budgetAmount.toLocaleString('en-IN')}, Ref Code: ${referenceCode}. Please share verified artist quotes!`;
    return `https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="diw-modal-root"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsOpen(false);
        }}
      >
        <motion.div
          className="diw-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
                aria-label="Close Diwali offer modal"
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
                  <span className="diw-coupon-pill">{settings.couponCode || 'DIW100'}</span>
                </div>
              </div>
            </div>
          </div>

          {!isSuccess ? (
            /* 2. WARM IVORY FORM BODY */
            <div className="diw-form-body">
              {/* Note: 3 black trust boxes removed as requested: 'only this sectoin remove from here' */}

              {/* Enquiry Form */}
              <form className="diw-form" onSubmit={handleSubmit}>
                <div className="diw-form-grid">
                  <div className="diw-form-group">
                    <label htmlFor="diw-name">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      id="diw-name"
                      type="text"
                      required
                      placeholder="Enter your name"
                      autoComplete="off"
                      value={formData.name}
                      className={errors.name ? 'diw-input-err' : ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    {errors.name && <span className="diw-err-msg">{errors.name}</span>}
                  </div>

                  <div className="diw-form-group">
                    <label htmlFor="diw-phone">
                      Mobile Number <span className="req">*</span>
                    </label>
                    <input
                      id="diw-phone"
                      type="tel"
                      required
                      placeholder="Enter mobile number"
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
                  <div className="diw-form-group diw-field-event-type diw-hide-mobile">
                    <label htmlFor="diw-event-type">
                      Event Type <span className="req">*</span>
                    </label>
                    <select
                      id="diw-event-type"
                      value={formData.eventType}
                      onChange={(e) => handleInputChange('eventType', e.target.value)}
                    >
                      <option value="Wedding">Wedding</option>
                      <option value="Birthday Party">Birthday Party</option>
                      <option value="Engagement / Roka">Engagement / Roka</option>
                      <option value="Corporate Event">Corporate Event</option>
                      <option value="Anniversary Celebration">Anniversary Celebration</option>
                      <option value="Private House Party">Private House Party</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="diw-form-group">
                    <label htmlFor="diw-city">
                      Event City <span className="req">*</span>
                    </label>
                    <input
                      id="diw-city"
                      type="text"
                      required
                      placeholder="Enter your city"
                      autoComplete="off"
                      value={formData.location}
                      className={errors.location ? 'diw-input-err' : ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                    {errors.location && <span className="diw-err-msg">{errors.location}</span>}
                  </div>
                </div>

                <div className="diw-form-grid">
                  <div className="diw-form-group diw-field-event-date diw-hide-mobile">
                    <label htmlFor="diw-date">
                      Expected Event Date <span className="req">*</span>
                    </label>
                    <input
                      id="diw-date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      max="2030-12-31"
                      value={formData.date}
                      className={errors.date ? 'diw-input-err' : ''}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                    {errors.date && <span className="diw-err-msg">{errors.date}</span>}
                  </div>

                  <div className="diw-form-group">
                    <label htmlFor="diw-budget">
                      Estimated Booking Budget <span className="req">*</span>
                    </label>
                    <select
                      id="diw-budget"
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
            /* ================================================================
               SUCCESS STATE: DIWALI DISCOUNT PASS & NEXT STEPS
               ================================================================ */
            <div className="diw-success-card">
              <div className="diw-success-icon">✓</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFF', margin: '0 0 6px 0' }}>
                Diwali Gift Claimed! 🎁
              </h2>
              <p style={{ fontSize: '13px', color: '#D8C4B7', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                Your <strong>{savings.pct}% EXTRA DISCOUNT</strong> with Coupon <strong>{settings.couponCode}</strong> has been secured for your {formData.eventType} in {formData.location}!
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
                    <span className="val" style={{ color: '#E8B943' }}>{settings.couponCode} ({savings.pct}% OFF)</span>
                  </div>
                  <div>
                    <span className="lbl">Estimated Savings</span>
                    <span className="val" style={{ color: '#10B981' }}>
                      {savings.isEligible ? `₹${savings.discountAmt.toLocaleString('en-IN')}` : 'Applicable on ₹10k+'}
                    </span>
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
                A Magnevents booking concierge is preparing verified artist availability with your 10% Diwali discount applied.
              </div>

              <a
                href={createWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="diw-submit-btn"
                style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFF' }}
              >
                <span>Chat on WhatsApp to Pick Your Artist</span>
                <span>→</span>
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

