"use client";

import { useEffect } from 'react';

/**
 * QuickBookingModal is permanently routed to the high-converting Date-Lock Instant Form (GoogleAdsOfferInstantForm).
 * This guarantees the user's preferred 4-field luxury date lock form is universally presented
 * across all traffic channels (Google Ads, organic search, direct visitors, and local dev),
 * completely retiring and eliminating the legacy beige modal.
 */
export default function QuickBookingModal() {
  useEffect(() => {
    const handleForwardToInstantOffer = (e) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-google-ads-offer', {
          detail: e?.detail || {}
        }));
      }
    };

    window.addEventListener('open-quick-booking', handleForwardToInstantOffer);
    window.addEventListener('open-token-booking', handleForwardToInstantOffer);
    window.addEventListener('open-instant-form', handleForwardToInstantOffer);
    window.addEventListener('open-instant-booking', handleForwardToInstantOffer);

    const checkHash = () => {
      if (typeof window !== 'undefined') {
        const hash = (window.location.hash || '').toLowerCase();
        const search = (window.location.search || '').toLowerCase();
        if (
          hash === '#book-99' ||
          hash === '#quick-booking' ||
          hash === '#quick-contact' ||
          hash === '#instant-form' ||
          hash === '#instant' ||
          search.includes('quick-booking') ||
          search.includes('instant_form')
        ) {
          window.dispatchEvent(new CustomEvent('open-google-ads-offer'));
        }
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);

    // Clean up any legacy localStorage blockers
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('mgn_popup_form_submitted');
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('open-quick-booking', handleForwardToInstantOffer);
      window.removeEventListener('open-token-booking', handleForwardToInstantOffer);
      window.removeEventListener('open-instant-form', handleForwardToInstantOffer);
      window.removeEventListener('open-instant-booking', handleForwardToInstantOffer);
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  // Return null so the legacy beige 3-field card is permanently suppressed
  return null;
}
