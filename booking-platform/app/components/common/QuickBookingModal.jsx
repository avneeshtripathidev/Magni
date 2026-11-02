"use client";

import { useEffect } from 'react';

/**
 * QuickBookingModal is permanently retired.
 * General quick booking requests are now routed to the Main Booking Form (ContactModal),
 * completely retiring and eliminating the legacy beige modal.
 */
export default function QuickBookingModal() {
  useEffect(() => {
    const handleForwardToMainBooking = (e) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-contact-modal', {
          detail: { type: 'booking', ...(e?.detail || {}) }
        }));
      }
    };

    const handleForwardToInstantOffer = (e) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-google-ads-offer', {
          detail: e?.detail || {}
        }));
      }
    };

    window.addEventListener('open-quick-booking', handleForwardToMainBooking);
    window.addEventListener('open-token-booking', handleForwardToMainBooking);
    window.addEventListener('open-instant-form', handleForwardToInstantOffer);
    window.addEventListener('open-instant-booking', handleForwardToInstantOffer);

    const checkHash = () => {
      if (typeof window !== 'undefined') {
        const hash = (window.location.hash || '').toLowerCase();
        const search = (window.location.search || '').toLowerCase();
        if (hash === '#instant-form' || hash === '#instant' || search.includes('instant_form') || hash === '#offer') {
          window.dispatchEvent(new CustomEvent('open-google-ads-offer'));
        } else if (
          hash === '#book-99' ||
          hash === '#quick-booking' ||
          hash === '#quick-contact' ||
          search.includes('quick-booking')
        ) {
          window.dispatchEvent(new CustomEvent('open-contact-modal', { detail: { type: 'booking' } }));
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
      window.removeEventListener('open-quick-booking', handleForwardToMainBooking);
      window.removeEventListener('open-token-booking', handleForwardToMainBooking);
      window.removeEventListener('open-instant-form', handleForwardToInstantOffer);
      window.removeEventListener('open-instant-booking', handleForwardToInstantOffer);
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  // Return null so the legacy beige 3-field card is permanently suppressed
  return null;
}
