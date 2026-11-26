/**
 * Pure JavaScript utility for parsing, validating, and structuring
 * programmatic SEO location slugs for Magnevents.
 */

import { ALL_1063_SLUGS, getCityBySlug, INDIAN_CITIES_1063 } from '../constants/indianCities1063.js';

export { getCityBySlug, INDIAN_CITIES_1063 };

export const VALID_KEYWORDS = [
  'singer', 'singers', 'band', 'bands', 'dj', 'djs', 'comedian', 'comedians', 
  'anchor', 'anchors', 'emcee', 'emcees', 'dancer', 'dancers', 'magician', 'magicians', 
  'guitarist', 'guitarists', 'violinist', 'violinists', 'saxophonist', 'flutist', 'pianist', 'dhol',
  'rapper', 'rappers', 'hip-hop', 'hiphop', 'rap',
  'standup', 'qawwali', 'bhajan', 'music', 'musician', 'musicians', 'artist', 'artists', 
  'performer', 'performers', 'instrumentalist', 'instrumentalists',
  'ghazal', 'gazal', 'sufi', 'gig', 'entertainment', 'packages', 'sangeet', 
  'mehndi', 'mehendi', 'haldi', 'acoustic', 'corporate', 'wedding', 'shaadi', 'party', 'parties', 
  'function', 'reception', 'engagement', 'anniversary', 'birthday', 'house-party', 'chowki',
  'cocktail', 'college', 'fest', 'rock', 'bachelor', 'terrace', 'group',
  'bollywood', 'punjabi', 'retro', 'classical',
  'best-wishes', 'book', 'hire', 'live'
];

const CORE_MAJOR_CITIES = [
  // Delhi NCR & Haryana / UP NCR
  'delhi', 'new-delhi', 'delhi-ncr', 'noida', 'greater-noida', 'gurgaon', 'gurugram',
  'faridabad', 'ghaziabad', 'meerut', 'hapur', 'bulandshahr', 'sonipat', 'panipat',
  'rohtak', 'loni', 'khora', 'karawal-nagar', 'kirari-suleman-nagar', 'nangloi-jat',
  'bhalswa-jahangir-pur', 'bahadurgarh',
  // Mumbai MMR & Maharashtra
  'mumbai', 'navi-mumbai', 'thane', 'pune', 'pimpri-chinchwad', 'kalyan-dombivli',
  'vasai-virar', 'mira-bhayandar', 'ulhasnagar', 'bhiwandi', 'panvel', 'nagpur',
  'nashik', 'aurangabad', 'chhatrapati-sambhajinagar', 'kolhapur', 'solapur',
  'amravati', 'nanded', 'jalgaon', 'akola', 'latur', 'dhule', 'ahmednagar',
  'chandrapur', 'parbhani', 'ichalkaranji', 'jalna', 'malegaon', 'sangli',
  'satara', 'bhusawal', 'lonavala', 'alibaug', 'mahabaleshwar', 'lavasa',
  // Key Metros & Capitals
  'bangalore', 'bengaluru', 'hyderabad', 'secunderabad', 'chennai', 'kolkata',
  'ahmedabad', 'chandigarh', 'mohali', 'panchkula', 'zirakpur', 'jaipur', 'lucknow',
  'goa', 'north-goa', 'south-goa', 'panaji', 'margao', 'indore', 'bhopal', 'surat',
  'patna', 'varanasi', 'agra', 'kanpur', 'vadodara', 'rajkot', 'ludhiana', 'amritsar',
  'jalandhar', 'dehradun', 'ranchi', 'bhubaneswar', 'raipur', 'guwahati', 'kochi',
  'thiruvananthapuram', 'coimbatore', 'visakhapatnam', 'vijayawada',
  // Gujarat
  'gandhinagar', 'bhavnagar', 'jamnagar', 'junagadh', 'anand', 'navsari', 'morbi',
  'nadiad', 'bharuch', 'porbandar', 'gandhidham', 'vapi', 'bhuj', 'mehsana', 'valsad',
  'daman', 'diu', 'silvassa',
  // Uttar Pradesh
  'prayagraj', 'allahabad', 'bareilly', 'aligarh', 'gorakhpur', 'jhansi', 'mathura',
  'vrindavan', 'ayodhya', 'moradabad', 'saharanpur', 'firozabad', 'muzaffarnagar',
  'rampur', 'shahjahanpur', 'farrukhabad', 'etawah', 'mirzapur', 'sambhal', 'amroha',
  'fatehpur', 'raebareli', 'sitapur', 'bahraich', 'mau', 'orai',
  // Punjab & Haryana
  'patiala', 'bathinda', 'hoshiarpur', 'pathankot', 'moga', 'khanna', 'phagwara',
  'ambala', 'karnal', 'hisar', 'yamunanagar', 'kurukshetra', 'bhiwani', 'sirsa', 'jind',
  // Rajasthan
  'udaipur', 'jodhpur', 'kota', 'bikaner', 'ajmer', 'pushkar', 'bhilwara', 'alwar',
  'sikar', 'sri-ganganagar', 'pali', 'bharatpur', 'beawar', 'hanumangarh', 'jaisalmer',
  'mount-abu',
  // Uttarakhand, Himachal Pradesh, J&K & Ladakh
  'haridwar', 'rishikesh', 'roorkee', 'haldwani', 'nainital', 'mussoorie', 'kashipur',
  'rudrapur', 'jim-corbett', 'shimla', 'manali', 'dharamshala', 'kasauli', 'solan',
  'mandi', 'srinagar', 'jammu', 'leh',
  // Karnataka, Telangana, Andhra Pradesh, Tamil Nadu & Kerala
  'mysore', 'mysuru', 'mangalore', 'hubli', 'dharwad', 'belgaum', 'gulbarga',
  'davanagere', 'bellary', 'shimoga', 'tumkur', 'udupi', 'bidar', 'hospet', 'raichur',
  'coorg', 'warangal', 'nizamabad', 'karimnagar', 'khammam', 'ramagundam',
  'guntur', 'nellore', 'kurnool', 'rajahmundry', 'tirupati', 'kakinada', 'kadapa',
  'anantapur', 'vizianagaram', 'eluru', 'ongole', 'nandyal', 'chittoor',
  'madurai', 'tiruchirappalli', 'trichy', 'salem', 'tiruppur', 'erode', 'tirunelveli',
  'vellore', 'thoothukudi', 'dindigul', 'thanjavur', 'nagercoil', 'kanchipuram',
  'kumbakonam', 'ooty', 'kodaikanal', 'mahabalipuram',
  'kozhikode', 'thrissur', 'kollam', 'palakkad', 'alappuzha', 'kannur', 'kottayam',
  'munnar', 'kovalam',
  // West Bengal, Bihar, Jharkhand, Odisha, Madhya Pradesh & Chhattisgarh
  'howrah', 'durgapur', 'asansol', 'siliguri', 'kharagpur', 'bardhaman', 'malda',
  'haldia', 'baharampur', 'habra', 'jalpaiguri', 'darjeeling',
  'gaya', 'bhagalpur', 'muzaffarpur', 'purnia', 'darbhanga', 'bihar-sharif', 'arrah',
  'begusarai', 'katihar', 'chapra', 'munger', 'saharsa', 'sasaram', 'hajipur',
  'jamshedpur', 'dhanbad', 'bokaro', 'deoghar', 'hazaribagh', 'giridih',
  'cuttack', 'rourkela', 'berhampur', 'sambalpur', 'puri', 'balasore',
  'gwalior', 'jabalpur', 'ujjain', 'sagar', 'dewas', 'satna', 'ratlam', 'rewa',
  'katni', 'singrauli', 'burhanpur', 'khandwa', 'chhindwara', 'morena', 'bhind',
  'bhilai', 'bilaspur', 'korba', 'durg', 'rajnandgaon', 'jagdalpur', 'raigarh',
  // North East & Union Territories
  'silchar', 'dibrugarh', 'jorhat', 'tezpur', 'shillong', 'gangtok', 'agartala',
  'aizawl', 'imphal', 'dimapur', 'kohima', 'itanagar', 'puducherry', 'pondicherry',
  'port-blair'
];

export const MAJOR_CITIES = Array.from(new Set([...CORE_MAJOR_CITIES, ...ALL_1063_SLUGS]));

export function parseLocationSlug(rawSlug) {
  const cleanSlug = decodeURIComponent(rawSlug || '').trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/\/+$/, '');
  const isValidKeyword = VALID_KEYWORDS.some(kw => cleanSlug.includes(kw));

  let parsedCategory = 'Singer';
  let parsedSubCategory = '';
  let parsedCity = 'All Cities';

  if (cleanSlug.includes('band') || cleanSlug.includes('qawwali')) parsedCategory = 'Live band';
  else if (cleanSlug.includes('musician') || cleanSlug.includes('music') || cleanSlug.includes('guitarist') || cleanSlug.includes('violinist') || cleanSlug.includes('saxophonist') || cleanSlug.includes('flutist') || cleanSlug.includes('pianist') || cleanSlug.includes('dhol')) parsedCategory = 'Musician';
  else if (cleanSlug.includes('dj')) parsedCategory = 'Dj';
  else if (cleanSlug.includes('comedian') || cleanSlug.includes('standup')) parsedCategory = 'Comedian';
  else if (cleanSlug.includes('magician')) parsedCategory = 'Magician';
  else if (cleanSlug.includes('dancer')) parsedCategory = 'Dancer';
  else if (cleanSlug.includes('anchor') || cleanSlug.includes('emcee')) parsedCategory = 'Anchor';
  else if (cleanSlug.includes('singer') || cleanSlug.includes('artist') || cleanSlug.includes('ghazal') || cleanSlug.includes('gazal') || cleanSlug.includes('sufi') || cleanSlug.includes('bhajan') || cleanSlug.includes('gig')) parsedCategory = 'Singer';

  if (cleanSlug.includes('ghazal') || cleanSlug.includes('gazal')) parsedSubCategory = 'Gazals';
  else if (cleanSlug.includes('sufi') || cleanSlug.includes('qawwali')) parsedSubCategory = 'Sufi';
  else if (cleanSlug.includes('sangeet')) parsedSubCategory = 'Sangeet';
  else if (cleanSlug.includes('mehndi') || cleanSlug.includes('mehendi') || cleanSlug.includes('haldi')) parsedSubCategory = 'Mehndi';
  else if (cleanSlug.includes('corporate') || cleanSlug.includes('office') || cleanSlug.includes('gala') || cleanSlug.includes('function')) parsedSubCategory = 'Corporate';
  else if (cleanSlug.includes('acoustic')) parsedSubCategory = 'Acoustic';
  else if (cleanSlug.includes('wedding') || cleanSlug.includes('reception') || cleanSlug.includes('engagement') || cleanSlug.includes('shaadi') || cleanSlug.includes('cocktail') || cleanSlug.includes('anniversary')) parsedSubCategory = 'Wedding';
  else if (cleanSlug.includes('retro')) parsedSubCategory = 'Retro';
  else if (cleanSlug.includes('punjabi')) parsedSubCategory = 'Punjabi';
  else if (cleanSlug.includes('bollywood')) parsedSubCategory = 'Bollywood';
  else if (cleanSlug.includes('rock')) parsedSubCategory = 'Rock';
  else if (cleanSlug.includes('classical') || cleanSlug.includes('bhajan')) parsedSubCategory = 'Classical';

  const parts = cleanSlug.split('-in-');
  if (parts.length > 1) {
    const rawCitySlug = parts[1].trim();
    const matchedCity = getCityBySlug(rawCitySlug);
    if (matchedCity) {
      parsedCity = matchedCity.name;
    } else {
      const cityStr = rawCitySlug.replace(/-/g, ' ').trim();
      if (cityStr.toLowerCase() === 'delhi ncr') {
        parsedCity = 'Delhi NCR';
      } else {
        parsedCity = cityStr.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
  }

  const formattedTitle = cleanSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    slug: cleanSlug,
    isValidKeyword,
    parsedCategory,
    parsedSubCategory,
    parsedCity,
    formattedTitle
  };
}

/**
 * Resolves any user search query (e.g. "singer in gurgaon", "dj in delhi", "indore")
 * to the optimal dynamic destination route.
 * 
 * - "singer in gurgaon" -> "/singer-in-gurgaon"
 * - "dj in delhi"       -> "/dj-in-delhi"
 * - "gurgaon singer"    -> "/singer-in-gurgaon"
 * - "indore"            -> "/city/indore"
 * - "Arijit Singh"      -> "/ai-search?q=Arijit%20Singh"
 */
export function resolveSearchQueryToRoute(query) {
  if (!query || typeof query !== 'string') return '/ai-search';
  const clean = query.trim().toLowerCase().replace(/[\s_]+/g, ' ');
  const cleanSlug = clean.replace(/\s+/g, '-');

  // 1. Direct match: e.g. 'singer in gurgaon', 'guitarist in indore', 'wedding band in delhi'
  const inMatch = clean.match(/^([a-z0-9\s-]+)\s+(?:in|at|for|near)\s+([a-z0-9\s-]+)$/);
  if (inMatch) {
    const rawCategory = inMatch[1].trim().replace(/\s+/g, '-');
    const rawCity = inMatch[2].trim().replace(/\s+/g, '-');
    const hasKeyword = VALID_KEYWORDS.some(kw => rawCategory.includes(kw));
    const hasCity = MAJOR_CITIES.includes(rawCity) || !!getCityBySlug(rawCity);
    if (hasKeyword && hasCity) {
      return `/${rawCategory}-in-${rawCity}`;
    }
  }

  // 2. City-only search: e.g. 'gurgaon', 'delhi', 'mumbai'
  if (MAJOR_CITIES.includes(cleanSlug) || !!getCityBySlug(cleanSlug)) {
    return `/city/${cleanSlug}`;
  }

  // 3. Category + City inverted or without 'in': e.g. 'gurgaon singer' or 'indore guitarist'
  for (const city of MAJOR_CITIES) {
    const citySpace = city.replace(/-/g, ' ');
    if (clean.includes(citySpace)) {
      const remaining = clean.replace(citySpace, '').replace(/\b(in|at|for|near|best|top|hire|book)\b/g, '').trim().replace(/\s+/g, '-');
      if (remaining && VALID_KEYWORDS.some(kw => remaining.includes(kw))) {
        return `/${remaining}-in-${city}`;
      }
    }
  }

  // 4. Keyword only without city: e.g. 'singer', 'dj', 'band'
  const isKeywordOnly = VALID_KEYWORDS.some(kw => cleanSlug === kw || cleanSlug === kw + 's');
  if (isKeywordOnly) {
    return `/${cleanSlug}`;
  }

  // 5. Fallback to AI Search with query
  return `/ai-search?q=${encodeURIComponent(query.trim())}`;
}


