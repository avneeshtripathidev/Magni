/**
 * Artist CTA Click Tracker
 * Captures visitor clicks on "Are you an Artist?" buttons across Magnevents
 * and records visitor IP, locality, device, and timestamp to Supabase analytics.
 */

export function trackArtistCtaClick(source = 'nav_header') {
  if (typeof window === 'undefined') return;

  try {
    const payload = {
      type: 'artist_cta_click',
      path: '/register/artist',
      source,
      userAgent: window.navigator?.userAgent || '',
      clientDetails: {
        source,
        button: 'Are you an Artist?',
        referrer: document.referrer || '',
        fullUrl: window.location?.href || '',
        screen: window.screen ? `${window.screen.width}x${window.screen.height}` : '',
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: window.navigator?.language || '',
        platform: window.navigator?.platform || '',
        timezone: Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || '',
      }
    };

    const jsonStr = JSON.stringify(payload);

    // 1. sendBeacon is optimal for outgoing navigation clicks because the browser guarantees delivery in background
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const sent = navigator.sendBeacon('/api/analytics', blob);
        if (sent) return;
      } catch (beaconErr) {
        // Fallback to fetch
      }
    }

    // 2. Fetch with keepalive: true ensures the request completes even if the page navigates away
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr,
      keepalive: true,
    }).catch(() => {
      // Non-blocking fallback
    });
  } catch (e) {
    // Non-blocking
  }
}
