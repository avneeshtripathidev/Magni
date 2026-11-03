/**
 * Pure JavaScript utility for parsing, validating, and structuring
 * programmatic SEO location slugs for Magnevents.
 */

export const VALID_KEYWORDS = [
  'singer', 'band', 'dj', 'comedian', 'anchor', 'dancer', 'magician', 
  'guitarist', 'violinist', 'saxophonist', 'flutist', 'pianist', 'dhol',
  'emcee', 'standup', 'qawwali', 'bhajan', 'music', 'musician', 'artist', 
  'ghazal', 'gazal', 'sufi', 'gig', 'entertainment', 'packages', 'sangeet', 
  'mehndi', 'haldi', 'acoustic', 'corporate', 'wedding', 'party', 'function', 
  'reception', 'engagement', 'anniversary', 'birthday', 'house-party', 'chowki',
  'bollywood', 'punjabi', 'retro', 'classical'
];

export const MAJOR_CITIES = [
  'delhi', 'new-delhi', 'noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad',
  'mumbai', 'bangalore', 'bengaluru', 'pune', 'hyderabad', 'chennai', 'kolkata', 'ahmedabad',
  'chandigarh', 'jaipur', 'lucknow', 'surat', 'indore', 'patna', 'bhopal', 'agra',
  'kanpur', 'nagpur', 'thane', 'visakhapatnam', 'vadodara', 'ludhiana', 'nashik',
  'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad', 'dhanbad', 'amritsar',
  'allahabad', 'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada',
  'jodhpur', 'madurai', 'raipur', 'kota', 'guwahati', 'thiruvananthapuram', 'kochi'
];

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
  else if (cleanSlug.includes('mehndi') || cleanSlug.includes('haldi')) parsedSubCategory = 'Mehndi';
  else if (cleanSlug.includes('corporate') || cleanSlug.includes('office') || cleanSlug.includes('gala') || cleanSlug.includes('function')) parsedSubCategory = 'Corporate';
  else if (cleanSlug.includes('acoustic')) parsedSubCategory = 'Acoustic';
  else if (cleanSlug.includes('wedding') || cleanSlug.includes('reception') || cleanSlug.includes('engagement') || cleanSlug.includes('shaadi')) parsedSubCategory = 'Wedding';
  else if (cleanSlug.includes('retro')) parsedSubCategory = 'Retro';
  else if (cleanSlug.includes('punjabi')) parsedSubCategory = 'Punjabi';
  else if (cleanSlug.includes('bollywood')) parsedSubCategory = 'Bollywood';
  else if (cleanSlug.includes('rock')) parsedSubCategory = 'Rock';
  else if (cleanSlug.includes('classical') || cleanSlug.includes('bhajan')) parsedSubCategory = 'Classical';

  const parts = cleanSlug.split('-in-');
  if (parts.length > 1) {
    const cityStr = parts[1].replace(/-/g, ' ').trim();
    if (cityStr.toLowerCase() === 'delhi ncr') {
      parsedCity = 'Delhi NCR';
    } else {
      parsedCity = cityStr.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

