import { supabase } from '@database/connection/supabase';
import { defaultBlogs } from '@/app/blog-post/data';
import { INDIAN_CITIES_1063 } from '@/app/constants/indianCities1063';

export const revalidate = 3600; // Cache at Edge for 1 hour (auto-refreshes daily/hourly)

export default async function sitemap() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.magnevents.in').replace(/\/+$/, '');
  const now = new Date().toISOString();

  // 1. Core High-Priority Platform Routes
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
    // 40 High-Converting Wedding Invitation & Digital Card Keyword Routes (Daily Crawl, 1.00 - 0.90 Priority)
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
  ].map((item) => ({
    url: `${baseUrl}${item.route}`,
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  // 2. High-Intent National Keyword Routes (Broad India Search)
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
    '/live-singer-for-private-party',
    '/live-singer-for-house-party',
    '/house-gig',
    '/book-singer-music-band',
    '/book-live-singer',
    '/book-singer-for-wedding',
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
  ];

  // 3. Indian City Clusters Covering All 28 States & 8 Union Territories
  const DELHI_NCR_CITIES = [
    'delhi', 'new-delhi', 'noida', 'greater-noida', 'gurgaon', 'gurugram',
    'ghaziabad', 'faridabad', 'meerut', 'hapur', 'bulandshahr', 'sonipat',
    'panipat', 'rohtak', 'loni', 'khora', 'karawal-nagar', 'kirari-suleman-nagar',
    'nangloi-jat', 'bhalswa-jahangir-pur'
  ];

  const MUMBAI_REGION_CITIES = [
    'mumbai', 'navi-mumbai', 'thane', 'pune', 'pimpri-chinchwad', 'kalyan-dombivli',
    'vasai-virar', 'mira-bhayandar', 'ulhasnagar', 'bhiwandi', 'panvel'
  ];

  const KEY_METRO_CITIES = [
    'bangalore', 'bengaluru', 'hyderabad', 'secunderabad', 'jaipur', 'chandigarh',
    'mohali', 'kolkata', 'chennai', 'ahmedabad', 'lucknow', 'goa', 'north-goa',
    'south-goa', 'indore', 'bhopal', 'surat', 'patna', 'varanasi', 'agra',
    'kanpur', 'nagpur', 'nashik', 'aurangabad', 'chhatrapati-sambhajinagar',
    'vadodara', 'rajkot', 'ludhiana', 'amritsar', 'jalandhar', 'dehradun',
    'ranchi', 'bhubaneswar', 'raipur', 'guwahati', 'kochi', 'thiruvananthapuram',
    'coimbatore', 'visakhapatnam', 'vijayawada'
  ];

  const ALL_INDIA_TIER2_TIER3_CITIES = [
    // Uttar Pradesh
    'prayagraj', 'allahabad', 'bareilly', 'aligarh', 'gorakhpur', 'jhansi', 'mathura',
    'ayodhya', 'moradabad', 'saharanpur', 'firozabad', 'muzaffarnagar', 'rampur',
    'shahjahanpur', 'farrukhabad', 'etawah', 'mirzapur', 'sambhal', 'amroha', 'fatehpur',
    'raebareli', 'sitapur', 'bahraich', 'mau', 'bhind', 'orai',
    // Punjab & Haryana
    'patiala', 'bathinda', 'hoshiarpur', 'pathankot', 'moga', 'khanna', 'phagwara',
    'panchkula', 'ambala', 'karnal', 'hisar', 'yamunanagar', 'kurukshetra', 'bhiwani',
    'sirsa', 'bahadurgarh', 'jind',
    // Rajasthan
    'udaipur', 'jodhpur', 'kota', 'bikaner', 'ajmer', 'bhilwara', 'alwar', 'sikar',
    'sri-ganganagar', 'pali', 'bharatpur', 'beawar', 'hanumangarh',
    // Uttarakhand & Himachal Pradesh & J&K
    'haridwar', 'rishikesh', 'roorkee', 'haldwani', 'nainital', 'kashipur', 'rudrapur',
    'shimla', 'manali', 'dharamshala', 'solan', 'mandi', 'srinagar', 'jammu',
    // Gujarat & Maharashtra (Other)
    'bhavnagar', 'jamnagar', 'gandhinagar', 'junagadh', 'anand', 'navsari', 'morbi',
    'nadiad', 'bharuch', 'porbandar', 'gandhidham', 'vapi', 'bhuj', 'mehsana', 'valsad',
    'kolhapur', 'solapur', 'amravati', 'nanded', 'jalgaon', 'akola', 'latur', 'dhule',
    'ahmednagar', 'chandrapur', 'parbhani', 'ichalkaranji', 'jalna', 'malegaon',
    'sangli', 'satara', 'bhusawal',
    // Karnataka, Telangana, Andhra Pradesh, Tamil Nadu, Kerala
    'mysore', 'mangalore', 'hubli', 'dharwad', 'belgaum', 'gulbarga', 'davanagere',
    'bellary', 'shimoga', 'tumkur', 'udupi', 'bidar', 'hospet', 'raichur',
    'warangal', 'nizamabad', 'karimnagar', 'khammam', 'ramagundam',
    'guntur', 'nellore', 'kurnool', 'rajahmundry', 'tirupati', 'kakinada', 'kadapa',
    'anantapur', 'vizianagaram', 'eluru', 'ongole', 'nandyal', 'chittoor',
    'madurai', 'tiruchirappalli', 'salem', 'tiruppur', 'erode', 'tirunelveli', 'vellore',
    'thoothukudi', 'dindigul', 'thanjavur', 'nagercoil', 'kanchipuram', 'kumbakonam',
    'kozhikode', 'thrissur', 'kollam', 'palakkad', 'alappuzha', 'kannur', 'kottayam',
    // West Bengal, Bihar, Jharkhand, Odisha, Madhya Pradesh, Chhattisgarh
    'howrah', 'durgapur', 'asansol', 'siliguri', 'kharagpur', 'bardhaman', 'malda',
    'haldia', 'baharampur', 'habra', 'jalpaiguri',
    'gaya', 'bhagalpur', 'muzaffarpur', 'purnia', 'darbhanga', 'bihar-sharif', 'arrah',
    'begusarai', 'katihar', 'chapra', 'munger', 'saharsa', 'sasaram', 'hajipur',
    'jamshedpur', 'dhanbad', 'bokaro', 'deoghar', 'hazaribagh', 'giridih',
    'cuttack', 'rourkela', 'berhampur', 'sambalpur', 'puri', 'balasore',
    'gwalior', 'jabalpur', 'ujjain', 'sagar', 'dewas', 'satna', 'ratlam', 'rewa',
    'katni', 'singrauli', 'burhanpur', 'khandwa', 'chhindwara', 'morena',
    'bhilai', 'bilaspur', 'korba', 'durg', 'rajnandgaon', 'jagdalpur', 'raigarh',
    // North East & Union Territories
    'silchar', 'dibrugarh', 'jorhat', 'tezpur', 'shillong', 'gangtok', 'agartala',
    'aizawl', 'imphal', 'dimapur', 'kohima', 'itanagar', 'puducherry', 'pondicherry'
  ];

  // 4. Keyword Patterns Across Geographies
  const METRO_KEYWORD_PATTERNS = [
    (c) => `/singer-in-${c}`,
    (c) => `/book-singer-in-${c}`,
    (c) => `/live-singer-in-${c}`,
    (c) => `/female-singer-in-${c}`,
    (c) => `/male-singer-in-${c}`,
    (c) => `/singer-for-house-party-in-${c}`,
    (c) => `/house-party-singer-in-${c}`,
    (c) => `/wedding-singer-in-${c}`,
    (c) => `/singer-for-wedding-in-${c}`,
    (c) => `/sangeet-singer-in-${c}`,
    (c) => `/cocktail-singer-in-${c}`,
    (c) => `/birthday-singer-in-${c}`,
    (c) => `/corporate-singer-in-${c}`,
    (c) => `/corporate-musician-in-${c}`,
    (c) => `/sufi-singer-in-${c}`,
    (c) => `/ghazal-singer-in-${c}`,
    (c) => `/acoustic-singer-in-${c}`,
    (c) => `/punjabi-singer-in-${c}`,
    (c) => `/bollywood-singer-in-${c}`,
    (c) => `/dj-in-${c}`,
    (c) => `/wedding-dj-in-${c}`,
    (c) => `/house-party-dj-in-${c}`,
    (c) => `/live-band-in-${c}`,
    (c) => `/wedding-band-in-${c}`,
    (c) => `/rock-band-in-${c}`,
    (c) => `/sufi-band-in-${c}`,
    (c) => `/guitarist-in-${c}`,
    (c) => `/guitarist-for-house-party-in-${c}`,
    (c) => `/anchor-in-${c}`,
    (c) => `/wedding-anchor-in-${c}`,
    (c) => `/standup-comedian-in-${c}`,
    (c) => `/magician-in-${c}`,
    (c) => `/live-music-in-${c}`
  ];

  const TIER2_TIER3_PATTERNS = [
    (c) => `/singer-in-${c}`,
    (c) => `/book-singer-in-${c}`,
    (c) => `/live-singer-in-${c}`,
    (c) => `/wedding-singer-in-${c}`,
    (c) => `/singer-for-house-party-in-${c}`,
    (c) => `/dj-in-${c}`,
    (c) => `/live-band-in-${c}`,
    (c) => `/wedding-band-in-${c}`,
    (c) => `/corporate-musician-in-${c}`,
    (c) => `/bollywood-singer-in-${c}`,
    (c) => `/sufi-singer-in-${c}`,
    (c) => `/guitarist-in-${c}`
  ];

  // 4b. Focused Wedding Invitation City Landing Pages (Delhi NCR, Mumbai MMR, Lucknow, and Richest Wedding Hubs - Daily Crawl, 0.96 Priority)
  const TOP_WEDDING_HUBS = [
    // Delhi & Delhi NCR
    'delhi', 'new-delhi', 'delhi-ncr', 'gurgaon', 'gurugram', 'noida', 'greater-noida', 'ghaziabad', 'faridabad',
    // Mumbai Region & Pune
    'mumbai', 'navi-mumbai', 'thane', 'pune',
    // Lucknow & Key UP Centers
    'lucknow', 'kanpur', 'varanasi', 'agra', 'prayagraj',
    // Richest Destination Wedding Hotspots
    'jaipur', 'udaipur', 'jodhpur', 'goa', 'chandigarh', 'bangalore', 'bengaluru', 'hyderabad', 'kolkata', 'ahmedabad', 'surat', 'indore', 'dehradun', 'amritsar', 'ludhiana'
  ];

  const WEDDING_CITY_PATTERNS = [
    (c) => `/wedding-invitations-in-${c}`,
    (c) => `/wedding-card-design-in-${c}`,
    (c) => `/digital-wedding-cards-in-${c}`,
    (c) => `/video-wedding-invitations-in-${c}`,
    (c) => `/whatsapp-wedding-cards-in-${c}`,
    (c) => `/luxury-wedding-invitations-in-${c}`,
    (c) => `/animated-wedding-invitations-in-${c}`,
    (c) => `/traditional-wedding-cards-in-${c}`,
  ];

  const topWeddingCityLandingPages = [];
  for (const city of TOP_WEDDING_HUBS) {
    for (const pattern of WEDDING_CITY_PATTERNS) {
      topWeddingCityLandingPages.push({
        url: `${baseUrl}${pattern(city)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.96,
      });
    }
  }

  // 5. Generate Priority-Tiered Landing Page Entries
  const delhiNcrLandingPages = [];
  const mumbaiLandingPages = [];
  const keyMetroLandingPages = [];
  const otherIndiaLandingPages = [];

  // Delhi NCR (0.98 Priority, Daily Crawl)
  for (const city of DELHI_NCR_CITIES) {
    for (const pattern of METRO_KEYWORD_PATTERNS) {
      delhiNcrLandingPages.push({
        url: `${baseUrl}${pattern(city)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.98,
      });
    }
  }

  // Mumbai MMR & Pune (0.92 Priority, Daily Crawl)
  for (const city of MUMBAI_REGION_CITIES) {
    for (const pattern of METRO_KEYWORD_PATTERNS) {
      mumbaiLandingPages.push({
        url: `${baseUrl}${pattern(city)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.92,
      });
    }
  }

  // Key Metros (0.88 Priority, Daily Crawl)
  for (const city of KEY_METRO_CITIES) {
    for (const pattern of METRO_KEYWORD_PATTERNS) {
      keyMetroLandingPages.push({
        url: `${baseUrl}${pattern(city)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.88,
      });
    }
  }

  // All India Tier 2 / 3 (0.75 Priority, Weekly Crawl)
  for (const city of ALL_INDIA_TIER2_TIER3_CITIES) {
    for (const pattern of TIER2_TIER3_PATTERNS) {
      otherIndiaLandingPages.push({
        url: `${baseUrl}${pattern(city)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
  }

  // 5b. All 1,063 Indian Cities - Dedicated City Hub Landing Pages (/city/[slug])
  const all1063CityHubPages = INDIAN_CITIES_1063.map((city) => ({
    url: `${baseUrl}/city/${city.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 5c. All 1,063 Indian Cities - High-Intent Core Keyword Landing Pages
  const all1063CityKeywordPages = [];
  const PAN_INDIA_CORE_PATTERNS = [
    (c) => `/singer-in-${c}`,
    (c) => `/wedding-singer-in-${c}`,
    (c) => `/dj-in-${c}`,
    (c) => `/live-band-in-${c}`,
  ];

  for (const city of INDIAN_CITIES_1063) {
    for (const pattern of PAN_INDIA_CORE_PATTERNS) {
      all1063CityKeywordPages.push({
        url: `${baseUrl}${pattern(city.slug)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.80,
      });
    }
  }

  // National Keyword Pages
  const nationalPages = nationalKeywordRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.94,
  }));

  // 6. Dynamic Artist Profiles from Supabase
  let artistRoutes = [];
  try {
    const { data: artists } = await supabase
      .from('artists')
      .select('id, name, alias, is_live, updated_at')
      .eq('is_live', true);

    if (artists && artists.length > 0) {
      artistRoutes = artists.map((artist) => {
        const rawName = artist.alias || artist.name || artist.id;
        const slug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        return {
          url: `${baseUrl}/artist/${slug || artist.id}`,
          lastModified: artist.updated_at ? new Date(artist.updated_at).toISOString() : now,
          changeFrequency: 'weekly',
          priority: 0.88,
        };
      });
    }
  } catch (err) {
    console.error('Error fetching artists for sitemap:', err);
  }

  // 7. Dynamic SEO Cities & City Blogs
  let cityRoutes = [];
  try {
    const { data: cities } = await supabase
      .from('seo_cities')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (cities && cities.length > 0) {
      cityRoutes = cities.map((city) => ({
        url: `${baseUrl}/city/${city.slug}`,
        lastModified: city.updated_at ? new Date(city.updated_at).toISOString() : now,
        changeFrequency: 'daily',
        priority: 0.90,
      }));
    }
  } catch (err) {
    console.error('Error fetching cities for sitemap:', err);
  }

  let cityBlogRoutes = [];
  try {
    const { data: seoBlogs } = await supabase
      .from('seo_blogs')
      .select('slug, updated_at, seo_cities(slug)')
      .eq('status', 'published');

    if (seoBlogs && seoBlogs.length > 0) {
      cityBlogRoutes = seoBlogs
        .filter((blog) => blog.slug && blog.seo_cities?.slug)
        .map((blog) => ({
          url: `${baseUrl}/city/${blog.seo_cities.slug}/blog/${blog.slug}`,
          lastModified: blog.updated_at ? new Date(blog.updated_at).toISOString() : now,
          changeFrequency: 'daily',
          priority: 0.85,
        }));
    }
  } catch (err) {
    console.error('Error fetching SEO city blogs for sitemap:', err);
  }

  // 8. General Platform Blogs
  let generalBlogRoutes = [];
  try {
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug, updated_at');

    if (blogs && blogs.length > 0) {
      generalBlogRoutes = blogs
        .filter((b) => b.slug)
        .map((b) => ({
          url: `${baseUrl}/blog-post/${b.slug}`,
          lastModified: b.updated_at ? new Date(b.updated_at).toISOString() : now,
          changeFrequency: 'weekly',
          priority: 0.78,
        }));
    }

    if (defaultBlogs && Array.isArray(defaultBlogs)) {
      const staticBlogUrls = defaultBlogs.map((b) => ({
        url: `${baseUrl}/blog-post/${b.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.78,
      }));
      generalBlogRoutes = [...generalBlogRoutes, ...staticBlogUrls];
    }
  } catch (err) {
    console.error('Error fetching general blogs for sitemap:', err);
  }

  // 9. Combine, Deduplicate and Return Full Sitemap
  const allEntries = [
    ...coreRoutes,
    ...topWeddingCityLandingPages,
    ...nationalPages,
    ...delhiNcrLandingPages,
    ...mumbaiLandingPages,
    ...keyMetroLandingPages,
    ...otherIndiaLandingPages,
    ...all1063CityHubPages,
    ...all1063CityKeywordPages,
    ...cityRoutes,
    ...cityBlogRoutes,
    ...artistRoutes,
    ...generalBlogRoutes,
  ];

  const seenUrls = new Set();
  const deduplicated = [];

  for (const entry of allEntries) {
    if (entry.url && !seenUrls.has(entry.url)) {
      seenUrls.add(entry.url);
      deduplicated.push(entry);
    }
  }

  return deduplicated;
}
