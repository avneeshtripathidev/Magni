"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getGoogleAdsAttribution } from '@/app/utils/googleAdsAttribution';
import '@/app/styles/components/TopOfferAnnouncementStrip.css';

export default function TopOfferAnnouncementStrip() {
  const [isVisible, setIsVisible] = useState(true);
  const [config, setConfig] = useState({
    leftText: "🎁 A Diwali Gift for You! Get 10% EXTRA OFF",
    rightText: "Use Code: DIW100 →",
    couponCode: "DIW100",
    discountPercent: 10,
    minBookingValue: 10000
  });

  const hasFiredViewRef = useRef(false);

  // 1. Fetch live admin configuration
  useEffect(() => {
    fetch('/api/settings/diwali-offer', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (typeof data.isVisible === 'boolean') setIsVisible(data.isVisible);
          setConfig(prev => ({
            ...prev,
            ...data
          }));
        }
      })
      .catch(err => console.warn('[TopOfferStrip] Settings fetch fallback:', err));
  }, []);

  // 2. Track 'offer_strip_view' on first load & maintain responsive layout height
  useEffect(() => {
    const updateHeight = () => {
      if (typeof document !== 'undefined') {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        document.documentElement.style.setProperty('--top-strip-height', isVisible ? (isMobile ? '34px' : '38px') : '0px');
      }
    };
    updateHeight();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateHeight);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateHeight);
      }
    };
  }, [isVisible]);

  // 3. Scroll effect: as user scrolls down, ad bar scrolls up out of view, while navbar stays pinned at top
  useEffect(() => {
    if (!isVisible) {
      const header = document.getElementById('unified-header');
      if (header) {
        header.style.transform = 'translateY(0px)';
      }
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || 0;
          const isMobile = window.innerWidth <= 768;
          if (isMobile) {
            const header = document.getElementById('unified-header');
            if (header) header.style.transform = 'translateY(0px)';
            ticking = false;
            return;
          }

          const stripEl = document.querySelector('.top-offer-strip-root');
          const stripHeight = stripEl ? stripEl.offsetHeight : 38;
          const header = document.getElementById('unified-header');
          if (header) {
            // Translate header up by at most stripHeight so only the ad bar scrolls away,
            // leaving the navbar locked at top: 0 for all scrollY >= stripHeight
            const translateY = Math.min(scrollY, stripHeight);
            header.style.transform = `translateY(-${translateY}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      const header = document.getElementById('unified-header');
      if (header) {
        header.style.transform = 'translateY(0px)';
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && !hasFiredViewRef.current) {
      hasFiredViewRef.current = true;
      try {
        const attribution = getGoogleAdsAttribution();
        fetch('/api/campaigns/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName: 'offer_strip_view',
            campaignId: 'diwali-special',
            campaignName: 'Diwali Special Gift (DIW100)',
            sessionId: attribution.session_id,
            metadata: {
              couponCode: config.couponCode,
              discountPercent: config.discountPercent
            },
            attribution
          }),
          keepalive: true
        }).catch(() => {});

        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'offer_strip_view', {
            event_category: 'diwali_campaign',
            event_label: config.couponCode
          });
        }
      } catch (e) {}
    }
  }, [isVisible, config.couponCode, config.discountPercent]);

  // Click handler: opens dedicated DiwaliOfferBookingForm
  const handleClick = () => {
    try {
      const attribution = getGoogleAdsAttribution();
      fetch('/api/campaigns/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'offer_strip_click',
          campaignId: 'diwali-special',
          campaignName: 'Diwali Special Gift (DIW100)',
          sessionId: attribution.session_id,
          metadata: {
            couponCode: config.couponCode,
            discountPercent: config.discountPercent
          },
          attribution
        }),
        keepalive: true
      }).catch(() => {});

      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'offer_strip_click', {
          event_category: 'diwali_campaign',
          event_label: config.couponCode
        });
      }
    } catch (e) {}

    // Dispatch global event to open dedicated offer form
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-diwali-offer', {
        detail: {
          couponCode: config.couponCode || 'DIW100',
          discountPercent: config.discountPercent || 10,
          minBookingValue: config.minBookingValue || 10000
        }
      }));
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      className="top-offer-strip-root"
      onClick={handleClick}
      role="banner"
      aria-label="Diwali Special Offer Announcement"
    >
      <div className="top-offer-strip-inner">
        {/* Left Side: Festive Icon & Offer Highlight */}
        <div className="top-offer-left">
          <span className="gift-icon">🎁</span>
          <span className="top-offer-desktop-msg">
            First Booking Welcome Offer: <span className="highlight-gold">Get 30%–70% OFF</span> on Live Artists!
          </span>
          <span className="top-offer-mobile-msg">
            Welcome Offer: <span className="highlight-gold">30%–70% OFF</span>
          </span>
        </div>

        {/* Right Side: High-Visibility Coupon Ticket & CTA */}
        <div className="top-offer-right">
          <span className="top-offer-label">Use Code:</span>
          <span className="top-offer-coupon-tag">{config.couponCode || 'FIRST15'}</span>
          <span className="top-offer-arrow">→</span>
        </div>
      </div>
    </aside>
  );
}
