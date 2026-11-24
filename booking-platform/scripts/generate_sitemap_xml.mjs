import fs from 'fs';
import path from 'path';

// Support running from either root or booking-platform directory
const cwd = process.cwd();
const citiesFilePath = fs.existsSync(path.join(cwd, 'app/constants/indianCities1063.js'))
  ? path.join(cwd, 'app/constants/indianCities1063.js')
  : path.join(cwd, 'booking-platform/app/constants/indianCities1063.js');

const outDir = fs.existsSync(path.join(cwd, 'public'))
  ? path.join(cwd, 'public/sitemaps')
  : path.join(cwd, 'booking-platform/public/sitemaps');

// Load Indian Cities (all 1,063 cities)
const citiesFile = fs.readFileSync(citiesFilePath, 'utf-8');
const match = citiesFile.match(/export const INDIAN_CITIES_1063 = (\[[\s\S]*?\]);/);
const INDIAN_CITIES_1063 = JSON.parse(match[1]);

const baseUrl = 'https://www.magnevents.in';
const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for search engine sitemaps

// Helper to construct XML
function buildSitemapXml(urls) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const entry of urls) {
    xml += `  <url>\n`;
    xml += `    <loc>${entry.url}</loc>\n`;
    xml += `    <lastmod>${entry.lastModified || now}</lastmod>\n`;
    xml += `    <changefreq>${entry.changeFrequency || 'daily'}</changefreq>\n`;
    xml += `    <priority>${(entry.priority !== undefined ? entry.priority : 0.88).toFixed(2)}</priority>\n`;
    xml += `  </url>\n`;
  }
  xml += `</urlset>\n`;
  return xml;
}

// 1. Core Platform Routes (Hourly / Daily Crawl Frequency)
const coreRoutes = [
  { route: '', priority: 1.0, changeFrequency: 'hourly' },
  { route: '/artists', priority: 0.99, changeFrequency: 'hourly' },
  { route: '/ai-search', priority: 0.95, changeFrequency: 'hourly' },
  { route: '/search', priority: 0.95, changeFrequency: 'hourly' },
  { route: '/book', priority: 0.95, changeFrequency: 'daily' },
  { route: '/services', priority: 0.95, changeFrequency: 'daily' },
  { route: '/pricing', priority: 0.95, changeFrequency: 'daily' },
  { route: '/how-to-book', priority: 0.90, changeFrequency: 'daily' },
  { route: '/why-choose', priority: 0.90, changeFrequency: 'daily' },
  { route: '/gallery', priority: 0.88, changeFrequency: 'daily' },
  { route: '/testimonials', priority: 0.88, changeFrequency: 'daily' },
  { route: '/blog-post', priority: 0.90, changeFrequency: 'daily' },
  // 40 High-Converting Wedding Invitation & Digital Card Keyword Routes
  { route: '/wedding-invitations', priority: 1.0, changeFrequency: 'daily' },
  { route: '/wedding-card-design', priority: 0.95, changeFrequency: 'daily' },
  { route: '/digital-wedding-cards', priority: 0.95, changeFrequency: 'daily' },
  { route: '/traditional-wedding-cards', priority: 0.95, changeFrequency: 'daily' },
  { route: '/animated-wedding-invitations', priority: 0.95, changeFrequency: 'daily' },
  { route: '/video-wedding-invitations', priority: 0.95, changeFrequency: 'daily' },
  { route: '/whatsapp-wedding-invitations', priority: 0.95, changeFrequency: 'daily' },
  { route: '/whatsapp-wedding-card-maker', priority: 0.95, changeFrequency: 'daily' },
  { route: '/digital-wedding-card-maker', priority: 0.95, changeFrequency: 'daily' },
  { route: '/wedding-invitation-video-maker', priority: 0.95, changeFrequency: 'daily' },
  { route: '/luxury-wedding-invitations', priority: 0.95, changeFrequency: 'daily' },
  { route: '/royal-wedding-card-design', priority: 0.95, changeFrequency: 'daily' },
  { route: '/interactive-wedding-cards', priority: 0.95, changeFrequency: 'daily' },
  { route: '/wedding-invitation-with-rsvp', priority: 0.95, changeFrequency: 'daily' },
  { route: '/wedding-card-with-google-maps', priority: 0.95, changeFrequency: 'daily' },
  { route: '/online-wedding-invitation-maker', priority: 0.95, changeFrequency: 'daily' },
  { route: '/indian-wedding-invitation-cards', priority: 0.95, changeFrequency: 'daily' },
  { route: '/hindu-wedding-invitations', priority: 0.95, changeFrequency: 'daily' },
  { route: '/muslim-wedding-card-design', priority: 0.95, changeFrequency: 'daily' },
  { route: '/sikh-wedding-invitations', priority: 0.95, changeFrequency: 'daily' },
  { route: '/south-indian-wedding-cards', priority: 0.95, changeFrequency: 'daily' },
  { route: '/shree-ganesh-wedding-cards', priority: 0.92, changeFrequency: 'daily' },
  { route: '/scroll-wedding-invitations', priority: 0.92, changeFrequency: 'daily' },
  { route: '/royal-rajput-wedding-card', priority: 0.92, changeFrequency: 'daily' },
  { route: '/save-the-date-invitations', priority: 0.90, changeFrequency: 'daily' },
  { route: '/save-the-date-video-maker', priority: 0.90, changeFrequency: 'daily' },
  { route: '/engagement-invitations', priority: 0.90, changeFrequency: 'daily' },
  { route: '/ring-ceremony-invitation-card', priority: 0.90, changeFrequency: 'daily' },
  { route: '/haldi-mehendi-invitations', priority: 0.90, changeFrequency: 'daily' },
  { route: '/haldi-ceremony-invitation-card', priority: 0.90, changeFrequency: 'daily' },
  { route: '/mehendi-ceremony-invitation-card', priority: 0.90, changeFrequency: 'daily' },
  { route: '/sangeet-invitation-cards', priority: 0.90, changeFrequency: 'daily' },
  { route: '/cocktail-party-invitation-cards', priority: 0.90, changeFrequency: 'daily' },
  { route: '/reception-invitations', priority: 0.90, changeFrequency: 'daily' },
  { route: '/wedding-anniversary-invitation-cards', priority: 0.90, changeFrequency: 'daily' },
  { route: '/custom-wedding-invitation-design', priority: 0.92, changeFrequency: 'daily' },
  { route: '/destination-wedding-invitations', priority: 0.92, changeFrequency: 'daily' },
  { route: '/palace-wedding-invitations', priority: 0.92, changeFrequency: 'daily' },
  { route: '/monogram-wedding-cards', priority: 0.90, changeFrequency: 'daily' },
  { route: '/floral-wedding-invitations', priority: 0.90, changeFrequency: 'daily' },
  { route: '/caricature-wedding-invitations', priority: 0.90, changeFrequency: 'daily' },
  { route: '/budget-wedding-invitations', priority: 0.90, changeFrequency: 'daily' },
  { route: '/register/event', priority: 0.75, changeFrequency: 'monthly' },
].map(item => ({
  url: `${baseUrl}${item.route}`,
  lastModified: now,
  changeFrequency: item.changeFrequency,
  priority: item.priority
}));

// 2. High-Intent National Keyword Routes (Broad India Search)
const nationalRoutes = [
  '/book-singer-online', '/live-singer-booking', '/singer-for-events',
  '/book-artists-for-events', '/live-music-booking', '/book-live-band',
  '/hire-musicians-for-events', '/event-entertainment-booking', '/singer-for-wedding',
  '/live-band-for-wedding', '/bollywood-singer-for-wedding', '/sufi-singer-for-wedding',
  '/wedding-musician-booking', '/live-music-for-sangeet', '/wedding-dj-booking',
  '/singer-for-birthday-party', '/singer-for-house-party', '/live-music-for-private-parties',
  '/dj-for-birthday-party', '/acoustic-singer-for-private-events', '/ghazal-singer-for-private-party',
  '/singer-for-corporate-events', '/live-band-for-corporate-events', '/corporate-event-entertainment',
  '/musicians-for-corporate-parties', '/professional-event-performers', '/bollywood-singer-booking',
  '/punjabi-singer-booking', '/sufi-singer-booking', '/ghazal-singer-booking',
  '/live-band-booking', '/dj-booking-near-me', '/instrumentalist-booking',
  '/event-anchor-booking', '/standup-comedian-booking', '/singers-near-me',
  '/live-singers-near-me', '/singer-booking-near-me', '/live-singer-for-party',
  '/professional-singer-booking', '/affordable-singer-for-wedding', '/female-singer-booking',
  '/male-singer-booking', '/guitarist-for-private-party', '/celebrity-singer-booking',
  '/wedding-singer-booking', '/sufi-night-for-wedding', '/mehndi-singer-booking',
  '/sangeet-singer-booking', '/haldi-ceremony-singer-booking', '/reception-live-music',
  '/engagement-party-singer', '/wedding-entertainment-packages', '/corporate-event-singer',
  '/office-party-entertainment', '/corporate-gala-live-music', '/annual-function-singer',
  '/product-launch-entertainment', '/singer-booking-price', '/wedding-singer-cost',
  '/live-band-booking-price', '/sufi-singer-booking-price', '/affordable-live-music-packages',
  '/singer-for-party-under-10000', '/live-singer-for-private-party', '/live-singer-for-house-party',
  '/house-gig', '/book-singer-music-band', '/book-live-singer',
  '/book-singer-for-wedding', '/house-party-dj-booking', '/wedding-anchor-booking',
  '/corporate-event-anchor', '/standup-comedian-booking', '/magician-booking-near-me',
  '/qawwali-group-booking', '/bhajan-singer-booking', '/mata-ki-chowki-singer-booking'
].map(r => ({
  url: `${baseUrl}${r}`,
  lastModified: now,
  changeFrequency: 'daily',
  priority: 0.95
}));

// 3. Focused Wedding Hub City Landing Pages
const TOP_WEDDING_HUBS = [
  'delhi', 'new-delhi', 'delhi-ncr', 'gurgaon', 'gurugram', 'noida', 'greater-noida', 'ghaziabad', 'faridabad',
  'mumbai', 'navi-mumbai', 'thane', 'pune',
  'lucknow', 'kanpur', 'varanasi', 'agra', 'prayagraj',
  'jaipur', 'udaipur', 'jodhpur', 'goa', 'chandigarh', 'bangalore', 'bengaluru', 'hyderabad', 'kolkata', 'ahmedabad', 'surat', 'indore', 'dehradun', 'amritsar', 'ludhiana'
];

const WEDDING_CITY_PATTERNS = [
  c => `/wedding-invitations-in-${c}`,
  c => `/wedding-card-design-in-${c}`,
  c => `/digital-wedding-cards-in-${c}`,
  c => `/video-wedding-invitations-in-${c}`,
  c => `/whatsapp-wedding-cards-in-${c}`,
  c => `/luxury-wedding-invitations-in-${c}`,
  c => `/animated-wedding-invitations-in-${c}`,
  c => `/traditional-wedding-cards-in-${c}`,
];

const topWeddingCityPages = [];
for (const city of TOP_WEDDING_HUBS) {
  for (const pattern of WEDDING_CITY_PATTERNS) {
    topWeddingCityPages.push({
      url: `${baseUrl}${pattern(city)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.96
    });
  }
}

// 4. All 1,063 Indian Cities Hub Pages (/city/[slug]) - Daily Crawl, 0.90 Priority
const cityHubPages = INDIAN_CITIES_1063.map(c => ({
  url: `${baseUrl}/city/${c.slug}`,
  lastModified: now,
  changeFrequency: 'daily',
  priority: 0.90
}));

// 5. Complete Matrix of Event Types & Artist Combinations Across ALL 1,063 Indian Cities
// Covering every occasion, act, genre, instrument, and booking intent!
const PAN_PATTERNS = [
  // --- A. Wedding & Ceremonial Celebrations ---
  { pattern: c => `/wedding-singer-in-${c}`, priority: 0.92, category: 'wedding' },
  { pattern: c => `/singer-for-wedding-in-${c}`, priority: 0.91, category: 'wedding' },
  { pattern: c => `/wedding-band-in-${c}`, priority: 0.91, category: 'wedding' },
  { pattern: c => `/wedding-dj-in-${c}`, priority: 0.91, category: 'wedding' },
  { pattern: c => `/wedding-anchor-in-${c}`, priority: 0.89, category: 'wedding' },
  { pattern: c => `/sangeet-singer-in-${c}`, priority: 0.90, category: 'wedding' },
  { pattern: c => `/haldi-singer-in-${c}`, priority: 0.88, category: 'wedding' },
  { pattern: c => `/mehendi-singer-in-${c}`, priority: 0.88, category: 'wedding' },
  { pattern: c => `/reception-live-music-in-${c}`, priority: 0.89, category: 'wedding' },
  { pattern: c => `/engagement-singer-in-${c}`, priority: 0.88, category: 'wedding' },
  { pattern: c => `/anniversary-singer-in-${c}`, priority: 0.88, category: 'wedding' },
  { pattern: c => `/cocktail-party-singer-in-${c}`, priority: 0.88, category: 'wedding' },

  // --- B. Corporate & Formal Galas ---
  { pattern: c => `/corporate-singer-in-${c}`, priority: 0.90, category: 'corporate' },
  { pattern: c => `/corporate-event-singer-in-${c}`, priority: 0.90, category: 'corporate' },
  { pattern: c => `/live-band-for-corporate-events-in-${c}`, priority: 0.90, category: 'corporate' },
  { pattern: c => `/corporate-event-anchor-in-${c}`, priority: 0.88, category: 'corporate' },

  // --- C. Private Parties, House Gigs & Birthdays ---
  { pattern: c => `/singer-for-house-party-in-${c}`, priority: 0.90, category: 'party' },
  { pattern: c => `/house-party-singer-in-${c}`, priority: 0.90, category: 'party' },
  { pattern: c => `/house-party-dj-in-${c}`, priority: 0.88, category: 'party' },
  { pattern: c => `/singer-for-birthday-party-in-${c}`, priority: 0.89, category: 'party' },
  { pattern: c => `/birthday-singer-in-${c}`, priority: 0.89, category: 'party' },

  // --- D. College Fests & Campus Shows ---
  { pattern: c => `/college-fest-band-in-${c}`, priority: 0.88, category: 'college' },

  // --- E. Core High-Intent Booking & Performance Roots ---
  { pattern: c => `/singer-in-${c}`, priority: 0.93, category: 'artist' },
  { pattern: c => `/book-singer-in-${c}`, priority: 0.92, category: 'artist' },
  { pattern: c => `/live-singer-in-${c}`, priority: 0.91, category: 'artist' },

  // --- F. Musical Genres & Vocal Styles ---
  { pattern: c => `/bollywood-singer-in-${c}`, priority: 0.90, category: 'genre' },
  { pattern: c => `/sufi-singer-in-${c}`, priority: 0.89, category: 'genre' },
  { pattern: c => `/punjabi-singer-in-${c}`, priority: 0.89, category: 'genre' },
  { pattern: c => `/ghazal-singer-in-${c}`, priority: 0.88, category: 'genre' },
  { pattern: c => `/bhajan-singer-in-${c}`, priority: 0.87, category: 'genre' },

  // --- G. Live Bands & Musical Ensembles ---
  { pattern: c => `/live-band-in-${c}`, priority: 0.91, category: 'artist' },
  { pattern: c => `/rock-band-in-${c}`, priority: 0.87, category: 'artist' },
  { pattern: c => `/qawwali-group-in-${c}`, priority: 0.88, category: 'artist' },

  // --- H. DJs, Stage Sound & Club Sets ---
  { pattern: c => `/dj-in-${c}`, priority: 0.91, category: 'artist' },

  // --- I. Solo Instrumentalists ---
  { pattern: c => `/guitarist-in-${c}`, priority: 0.89, category: 'instrument' },
  { pattern: c => `/violinist-in-${c}`, priority: 0.88, category: 'instrument' },

  // --- J. Stand-up Comedians & Magicians ---
  { pattern: c => `/standup-comedian-in-${c}`, priority: 0.88, category: 'entertainment' },
  { pattern: c => `/magician-in-${c}`, priority: 0.88, category: 'entertainment' },
];

const cityKeywordPages = [];
const eventSpecificPages = [];
const artistSpecificPages = [];

for (const c of INDIAN_CITIES_1063) {
  for (const item of PAN_PATTERNS) {
    const pageUrl = `${baseUrl}${item.pattern(c.slug)}`;
    const pageObj = {
      url: pageUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: item.priority
    };
    cityKeywordPages.push(pageObj);

    // Grouping for specialized sitemaps
    if (['wedding', 'corporate', 'party', 'college'].includes(item.category)) {
      eventSpecificPages.push(pageObj);
    } else {
      artistSpecificPages.push(pageObj);
    }
  }
}

// 6. Combine & Deduplicate for Master 1,063 Cities Sitemap
const allUrls = [
  ...coreRoutes,
  ...topWeddingCityPages,
  ...nationalRoutes,
  ...cityHubPages,
  ...cityKeywordPages
];

const seen = new Set();
const uniqueMasterUrls = [];
for (const item of allUrls) {
  if (!seen.has(item.url)) {
    seen.add(item.url);
    uniqueMasterUrls.push(item);
  }
}

console.log(`[Sitemap Generator] Total Master URLs: ${uniqueMasterUrls.length}`);
console.log(`[Sitemap Generator] Event-Specific URLs: ${eventSpecificPages.length}`);
console.log(`[Sitemap Generator] Artist/Genre URLs: ${artistSpecificPages.length}`);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 7. Write Master All-1063-Cities Sitemap
const masterXml = buildSitemapXml(uniqueMasterUrls);
const masterPath = path.join(outDir, 'all-1063-cities-sitemap.xml');
fs.writeFileSync(masterPath, masterXml, 'utf-8');
console.log(`Successfully generated master: ${masterPath} (${(Buffer.byteLength(masterXml) / (1024 * 1024)).toFixed(2)} MB)`);

// 8. Write Dedicated Events Sitemap (Weddings, Corporate, Birthdays, House Parties, College Fests)
const eventsXml = buildSitemapXml(eventSpecificPages);
const eventsPath = path.join(outDir, 'events-sitemap.xml');
fs.writeFileSync(eventsPath, eventsXml, 'utf-8');
console.log(`Successfully generated events: ${eventsPath} (${(Buffer.byteLength(eventsXml) / (1024 * 1024)).toFixed(2)} MB)`);

// 9. Write Dedicated Artists & Categories Sitemap (Singers, Bands, DJs, Instrumentalists, Comedians, Magicians, Genres)
const artistsXml = buildSitemapXml(artistSpecificPages);
const artistsPath = path.join(outDir, 'artists-categories-sitemap.xml');
fs.writeFileSync(artistsPath, artistsXml, 'utf-8');
console.log(`Successfully generated artists: ${artistsPath} (${(Buffer.byteLength(artistsXml) / (1024 * 1024)).toFixed(2)} MB)`);

// 10. Write Google-Compliant Sitemap Index linking all sitemaps
let sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
sitemapIndexXml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

const sitemapFiles = [
  `${baseUrl}/sitemap.xml`,
  `${baseUrl}/sitemaps/all-1063-cities-sitemap.xml`,
  `${baseUrl}/sitemaps/events-sitemap.xml`,
  `${baseUrl}/sitemaps/artists-categories-sitemap.xml`,
];

for (const smUrl of sitemapFiles) {
  sitemapIndexXml += `  <sitemap>\n`;
  sitemapIndexXml += `    <loc>${smUrl}</loc>\n`;
  sitemapIndexXml += `    <lastmod>${now}</lastmod>\n`;
  sitemapIndexXml += `  </sitemap>\n`;
}
sitemapIndexXml += `</sitemapindex>\n`;

const indexPath = path.join(outDir, 'sitemap-index.xml');
fs.writeFileSync(indexPath, sitemapIndexXml, 'utf-8');
console.log(`Successfully generated sitemap index: ${indexPath}`);
