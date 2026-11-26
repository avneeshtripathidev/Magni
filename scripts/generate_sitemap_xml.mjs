import fs from 'fs';
import path from 'path';

// Support running from either root or booking-platform directory
const cwd = process.cwd();
const outDir = fs.existsSync(path.join(cwd, 'public'))
  ? path.join(cwd, 'public/sitemaps')
  : path.join(cwd, 'booking-platform/public/sitemaps');

const rootPublicDir = fs.existsSync(path.join(cwd, 'public'))
  ? path.join(cwd, 'public')
  : path.join(cwd, 'booking-platform/public');

const baseUrl = 'https://www.magnevents.in';
const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Helper to construct XML
function buildSitemapXml(urls) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const entry of urls) {
    xml += `  <url>\n`;
    xml += `    <loc>${entry.url}</loc>\n`;
    xml += `    <lastmod>${entry.lastModified || now}</lastmod>\n`;
    xml += `    <changefreq>${entry.changeFrequency || 'weekly'}</changefreq>\n`;
    xml += `    <priority>${(entry.priority !== undefined ? entry.priority : 0.85).toFixed(2)}</priority>\n`;
    xml += `  </url>\n`;
  }
  xml += `</urlset>\n`;
  return xml;
}

// 1. Core Platform Pages
const coreRoutes = [
  { route: '', priority: 1.0, changeFrequency: 'daily' },
  { route: '/artists', priority: 0.98, changeFrequency: 'daily' },
  { route: '/ai-search', priority: 0.90, changeFrequency: 'weekly' },
  { route: '/search', priority: 0.90, changeFrequency: 'weekly' },
  { route: '/book', priority: 0.90, changeFrequency: 'weekly' },
  { route: '/services', priority: 0.88, changeFrequency: 'weekly' },
  { route: '/pricing', priority: 0.88, changeFrequency: 'weekly' },
  { route: '/how-to-book', priority: 0.85, changeFrequency: 'weekly' },
  { route: '/why-choose', priority: 0.85, changeFrequency: 'weekly' },
  { route: '/gallery', priority: 0.80, changeFrequency: 'weekly' },
  { route: '/testimonials', priority: 0.80, changeFrequency: 'weekly' },
  { route: '/blog-post', priority: 0.85, changeFrequency: 'weekly' },
  { route: '/register/event', priority: 0.75, changeFrequency: 'monthly' },
].map(item => ({
  url: `${baseUrl}${item.route}`,
  lastModified: now,
  changeFrequency: item.changeFrequency,
  priority: item.priority
}));

// 2. High-Intent National Performance Keywords
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
  changeFrequency: 'weekly',
  priority: 0.88
}));

// 3. Top Major Indian Metros & Cultural Hubs
const TOP_METROS = [
  'delhi', 'new-delhi', 'noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad',
  'mumbai', 'navi-mumbai', 'thane', 'pune',
  'bangalore', 'bengaluru', 'hyderabad', 'kolkata', 'chennai', 'ahmedabad',
  'jaipur', 'udaipur', 'chandigarh', 'lucknow', 'varanasi', 'goa', 'indore',
  'bhopal', 'surat', 'patna', 'agra', 'kanpur', 'dehradun', 'amritsar'
];

const METRO_PATTERNS = [
  c => `/singer-in-${c}`,
  c => `/book-singer-in-${c}`,
  c => `/live-singer-in-${c}`,
  c => `/wedding-singer-in-${c}`,
  c => `/dj-in-${c}`,
  c => `/wedding-dj-in-${c}`,
  c => `/live-band-in-${c}`,
  c => `/wedding-band-in-${c}`,
  c => `/city/${c}`
];

const metroPages = [];
for (const city of TOP_METROS) {
  for (const pattern of METRO_PATTERNS) {
    metroPages.push({
      url: `${baseUrl}${pattern(city)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85
    });
  }
}

// 4. Combine & Deduplicate URLs
const allUrls = [
  ...coreRoutes,
  ...nationalRoutes,
  ...metroPages,
];

const seen = new Set();
const uniqueUrls = [];
for (const item of allUrls) {
  if (!seen.has(item.url)) {
    seen.add(item.url);
    uniqueUrls.push(item);
  }
}

console.log(`[Sitemap Generator] Total Curated URLs: ${uniqueUrls.length}`);

// Ensure directories exist
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
if (!fs.existsSync(rootPublicDir)) {
  fs.mkdirSync(rootPublicDir, { recursive: true });
}

// 1. Generate master clean sitemap
const masterXml = buildSitemapXml(uniqueUrls);
const masterPath = path.join(outDir, 'all-1063-cities-sitemap.xml');
fs.writeFileSync(masterPath, masterXml, 'utf-8');

// 2. Generate events & artists sub-sitemaps
const eventsXml = buildSitemapXml(uniqueUrls.filter(u => u.url.includes('wedding') || u.url.includes('party') || u.url.includes('corporate')));
const eventsPath = path.join(outDir, 'events-sitemap.xml');
fs.writeFileSync(eventsPath, eventsXml, 'utf-8');

const artistsXml = buildSitemapXml(uniqueUrls.filter(u => u.url.includes('singer') || u.url.includes('dj') || u.url.includes('band') || u.url.includes('artist')));
const artistsPath = path.join(outDir, 'artists-categories-sitemap.xml');
fs.writeFileSync(artistsPath, artistsXml, 'utf-8');

// 3. Generate sitemap index
const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemaps/all-1063-cities-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/events-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/artists-categories-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>
`;
const indexPath = path.join(outDir, 'sitemap-index.xml');
fs.writeFileSync(indexPath, sitemapIndexXml, 'utf-8');

// 4. Generate root /sitemap.xml
fs.writeFileSync(path.join(rootPublicDir, 'sitemap.xml'), masterXml, 'utf-8');

console.log(`Successfully generated lightweight sitemaps in ${outDir} (${uniqueUrls.length} total URLs)`);
