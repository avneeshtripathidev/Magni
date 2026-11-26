import { defaultBlogs } from '@/app/blog-post/data';

// Cache at Edge CDN for 24 hours - 0.1ms execution time, near-zero Fluid CPU
export const revalidate = 86400;

export default async function sitemap() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.magnevents.in').replace(/\/+$/, '');
  const now = new Date().toISOString();

  // 1. Core High-Priority Platform Routes (Only 200 OK indexable routes - NO redirects)
  const coreRoutes = [
    { route: '', priority: 1.0, changeFrequency: 'daily' },
    { route: '/artists', priority: 0.98, changeFrequency: 'daily' },
    { route: '/ai-search', priority: 0.90, changeFrequency: 'weekly' },
    { route: '/services', priority: 0.88, changeFrequency: 'weekly' },
    { route: '/pricing', priority: 0.88, changeFrequency: 'weekly' },
    { route: '/how-to-book', priority: 0.85, changeFrequency: 'weekly' },
    { route: '/why-choose', priority: 0.85, changeFrequency: 'weekly' },
    { route: '/gallery', priority: 0.80, changeFrequency: 'weekly' },
    { route: '/testimonials', priority: 0.80, changeFrequency: 'weekly' },
    { route: '/blog-post', priority: 0.85, changeFrequency: 'weekly' },
  ].map((item) => ({
    url: `${baseUrl}${item.route}`,
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  // 2. High-Intent National Keyword Routes (Unique search intents only - no duplicates)
  const nationalKeywordRoutes = [
    '/singers-near-me',
    '/live-singers-near-me',
    '/singer-booking-near-me',
    '/live-singer-for-party',
    '/professional-singer-booking',
    '/affordable-singer-for-wedding',
    '/female-singer-booking',
    '/male-singer-booking',
    '/bollywood-singer-for-event',
    '/sufi-singer-booking',
    '/acoustic-singer-booking',
    '/live-band-booking',
    '/guitarist-for-private-party',
    '/celebrity-singer-booking',
    '/wedding-singer-booking',
    '/live-band-for-wedding',
    '/sufi-night-for-wedding',
    '/mehndi-singer-booking',
    '/sangeet-singer-booking',
    '/haldi-ceremony-singer-booking',
    '/reception-live-music',
    '/engagement-party-singer',
    '/wedding-entertainment-packages',
    '/corporate-event-singer',
    '/live-band-for-corporate-event',
    '/office-party-entertainment',
    '/corporate-gala-live-music',
    '/annual-function-singer',
    '/product-launch-entertainment',
    '/singer-booking-price',
    '/wedding-singer-cost',
    '/live-band-booking-price',
    '/sufi-singer-booking-price',
    '/affordable-live-music-packages',
    '/singer-for-party-under-10000',
    '/singer-for-house-party',
    '/dj-booking-near-me',
    '/wedding-dj-booking',
    '/house-party-dj-booking',
    '/wedding-anchor-booking',
    '/corporate-event-anchor',
    '/standup-comedian-booking',
    '/magician-booking-near-me',
    '/qawwali-group-booking',
    '/ghazal-singer-booking',
    '/punjabi-singer-booking',
    '/bhajan-singer-booking',
    '/mata-ki-chowki-singer-booking'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.88,
  }));

  // 3. Blog pages
  const staticBlogUrls = (defaultBlogs || []).map((b) => ({
    url: `${baseUrl}/blog-post/${b.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...coreRoutes, ...nationalKeywordRoutes, ...staticBlogUrls];
}
