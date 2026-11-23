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

// Load Indian Cities
const citiesFile = fs.readFileSync(citiesFilePath, 'utf-8');
const match = citiesFile.match(/export const INDIAN_CITIES_1063 = (\[[\s\S]*?\]);/);
const INDIAN_CITIES_1063 = JSON.parse(match[1]);

const baseUrl = 'https://www.magnevents.in';
const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for sitemaps

// 1. Core Platform Routes
const coreRoutes = [
  { route: '', priority: 1.0, changeFrequency: 'daily' },
  { route: '/ai-search', priority: 0.95, changeFrequency: 'daily' },
  { route: '/search', priority: 0.95, changeFrequency: 'daily' },
  { route: '/artists', priority: 0.95, changeFrequency: 'daily' },
  { route: '/book', priority: 0.90, changeFrequency: 'weekly' },
  { route: '/services', priority: 0.9, changeFrequency: 'weekly' },
  { route: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
  { route: '/how-to-book', priority: 0.85, changeFrequency: 'weekly' },
  { route: '/why-choose', priority: 0.85, changeFrequency: 'weekly' },
  { route: '/gallery', priority: 0.8, changeFrequency: 'weekly' },
  { route: '/testimonials', priority: 0.8, changeFrequency: 'weekly' },
  { route: '/blog-post', priority: 0.85, changeFrequency: 'weekly' },
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

// 2. High Intent National Routes
const nationalRoutes = [
  '/singers-near-me', '/live-singers-near-me', '/singer-booking-near-me',
  '/live-singer-for-party', '/professional-singer-booking', '/affordable-singer-for-wedding',
  '/female-singer-booking', '/male-singer-booking', '/bollywood-singer-for-event',
  '/sufi-singer-booking', '/acoustic-singer-booking', '/live-band-booking',
  '/guitarist-for-private-party', '/celebrity-singer-booking', '/wedding-singer-booking',
  '/live-band-for-wedding', '/sufi-night-for-wedding', '/mehndi-singer-booking',
  '/sangeet-singer-booking', '/haldi-ceremony-singer-booking', '/reception-live-music',
  '/engagement-party-singer', '/wedding-entertainment-packages', '/corporate-event-singer',
  '/live-band-for-corporate-event', '/office-party-entertainment', '/corporate-gala-live-music',
  '/annual-function-singer', '/product-launch-entertainment', '/singer-booking-price',
  '/wedding-singer-cost', '/live-band-booking-price', '/sufi-singer-booking-price',
  '/affordable-live-music-packages', '/singer-for-party-under-10000', '/singer-for-house-party',
  '/live-singer-for-private-party', '/live-singer-for-house-party', '/house-gig',
  '/book-singer-music-band', '/book-live-singer', '/book-singer-for-wedding',
  '/dj-booking-near-me', '/wedding-dj-booking', '/house-party-dj-booking',
  '/wedding-anchor-booking', '/corporate-event-anchor', '/standup-comedian-booking',
  '/magician-booking-near-me', '/qawwali-group-booking', '/ghazal-singer-booking',
  '/punjabi-singer-booking', '/bhajan-singer-booking', '/mata-ki-chowki-singer-booking'
].map(r => ({
  url: `${baseUrl}${r}`,
  lastModified: now,
  changeFrequency: 'daily',
  priority: 0.94
}));

// 3. Metro Clusters
const DELHI_NCR = ['delhi', 'new-delhi', 'noida', 'greater-noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad'];
const MUMBAI_MMR = ['mumbai', 'navi-mumbai', 'thane', 'pune'];
const KEY_METROS = ['bangalore', 'bengaluru', 'hyderabad', 'kolkata', 'chennai', 'ahmedabad', 'jaipur', 'chandigarh', 'lucknow', 'goa', 'indore', 'bhopal', 'surat', 'patna', 'varanasi', 'agra', 'kanpur'];

const METRO_PATTERNS = [
  c => `/singer-in-${c}`,
  c => `/book-singer-in-${c}`,
  c => `/live-singer-in-${c}`,
  c => `/wedding-singer-in-${c}`,
  c => `/singer-for-house-party-in-${c}`,
  c => `/dj-in-${c}`,
  c => `/wedding-dj-in-${c}`,
  c => `/live-band-in-${c}`,
  c => `/wedding-band-in-${c}`,
  c => `/bollywood-singer-in-${c}`,
  c => `/sufi-singer-in-${c}`,
  c => `/guitarist-in-${c}`,
  c => `/corporate-musician-in-${c}`
];

const metroPages = [];
for (const c of DELHI_NCR) {
  for (const p of METRO_PATTERNS) {
    metroPages.push({ url: `${baseUrl}${p(c)}`, lastModified: now, changeFrequency: 'daily', priority: 0.98 });
  }
}
for (const c of MUMBAI_MMR) {
  for (const p of METRO_PATTERNS) {
    metroPages.push({ url: `${baseUrl}${p(c)}`, lastModified: now, changeFrequency: 'daily', priority: 0.92 });
  }
}
for (const c of KEY_METROS) {
  for (const p of METRO_PATTERNS) {
    metroPages.push({ url: `${baseUrl}${p(c)}`, lastModified: now, changeFrequency: 'daily', priority: 0.88 });
  }
}

// 3b. Focused Wedding City Pages
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

// 4. All 1,063 Indian Cities Hub Pages
const cityHubPages = INDIAN_CITIES_1063.map(c => ({
  url: `${baseUrl}/city/${c.slug}`,
  lastModified: now,
  changeFrequency: 'weekly',
  priority: 0.85
}));

// 5. All 1,063 Indian Cities High-Intent Core Keyword Pages
const PAN_PATTERNS = [
  c => `/singer-in-${c}`,
  c => `/wedding-singer-in-${c}`,
  c => `/dj-in-${c}`,
  c => `/live-band-in-${c}`,
];

const cityKeywordPages = [];
for (const c of INDIAN_CITIES_1063) {
  for (const p of PAN_PATTERNS) {
    cityKeywordPages.push({
      url: `${baseUrl}${p(c.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.80
    });
  }
}

// 6. Combine & Deduplicate
const allUrls = [
  ...coreRoutes,
  ...topWeddingCityPages,
  ...nationalRoutes,
  ...metroPages,
  ...cityHubPages,
  ...cityKeywordPages
];

const seen = new Set();
const uniqueUrls = [];
for (const item of allUrls) {
  if (!seen.has(item.url)) {
    seen.add(item.url);
    uniqueUrls.push(item);
  }
}

console.log(`Total URLs to write in sitemap: ${uniqueUrls.length}`);

// Generate XML
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

for (const entry of uniqueUrls) {
  xml += `  <url>\n`;
  xml += `    <loc>${entry.url}</loc>\n`;
  xml += `    <lastmod>${entry.lastModified}</lastmod>\n`;
  xml += `    <changefreq>${entry.changeFrequency}</changefreq>\n`;
  xml += `    <priority>${entry.priority.toFixed(2)}</priority>\n`;
  xml += `  </url>\n`;
}

xml += `</urlset>\n`;

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, 'all-1063-cities-sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf-8');
console.log(`Successfully generated: ${outPath} (${(Buffer.byteLength(xml) / (1024 * 1024)).toFixed(2)} MB)`);
