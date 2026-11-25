/**
 * Indian Cities Proximity & 100km Radius Clustering Utility for Magnevents
 * Enables smart discovery of artists within a 100km travel radius across Indian cities.
 */

export const NEARBY_CITY_CLUSTERS = {
  'delhi ncr': [
    'delhi', 'new delhi', 'noida', 'greater noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad',
    'meerut', 'sonipat', 'panipat', 'rohtak', 'hapur', 'bulandshahr', 'modinagar', 'baghpat',
    'palwal', 'rewari', 'bahadurgarh', 'jhajjar', 'alwar', 'mathura', 'muzaffarnagar', 'karnal'
  ],
  'delhi': [
    'delhi', 'new delhi', 'noida', 'greater noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad',
    'meerut', 'sonipat', 'panipat', 'rohtak', 'hapur', 'bulandshahr', 'modinagar', 'baghpat'
  ],
  'mumbai': [
    'mumbai', 'navi mumbai', 'thane', 'kalyan', 'dombivli', 'mira bhayandar', 'vasai', 'virar',
    'ulhasnagar', 'bhiwandi', 'panvel', 'pune', 'lonavala', 'alibaug', 'karjat', 'khopoli', 'pen', 'palghar'
  ],
  'bangalore': [
    'bangalore', 'bengaluru', 'hosur', 'tumkur', 'ramanagara', 'kolar', 'chikkaballapur', 'mandya', 'mysore'
  ],
  'hyderabad': [
    'hyderabad', 'secunderabad', 'cyberabad', 'sangareddy', 'medak', 'mahbubnagar', 'nalgonda', 'siddipet'
  ],
  'pune': [
    'pune', 'pimpri', 'chinchwad', 'lonavala', 'talegaon', 'shirur', 'saswad', 'baramati', 'satara', 'mumbai', 'navi mumbai', 'thane'
  ],
  'chandigarh': [
    'chandigarh', 'mohali', 'panchkula', 'zirakpur', 'ambala', 'patiala', 'ludhiana', 'rupnagar', 'kurukshetra', 'karnal'
  ],
  'jaipur': [
    'jaipur', 'dausa', 'ajmer', 'kishangarh', 'alwar', 'tonk', 'chomu', 'pushkar'
  ],
  'lucknow': [
    'lucknow', 'kanpur', 'unnao', 'barabanki', 'rae bareli', 'sitapur', 'ayodhya', 'hardoi'
  ],
  'varanasi': [
    'varanasi', 'prayagraj', 'allahabad', 'mirzapur', 'jaunpur', 'ghazipur', 'chandauli', 'bhadohi', 'sasaram'
  ],
  'kolkata': [
    'kolkata', 'howrah', 'hooghly', 'barrackpore', 'barasat', 'kalyani', 'chandannagar', 'burdwan', 'haldia'
  ],
  'ahmedabad': [
    'ahmedabad', 'gandhinagar', 'anand', 'nadiad', 'vadodara', 'mehsana', 'kheda', 'surendranagar'
  ],
  'chennai': [
    'chennai', 'kanchipuram', 'chengalpattu', 'tiruvallur', 'arakkonam', 'mahabalipuram'
  ],
  'indore': [
    'indore', 'ujjain', 'dewas', 'dhar', 'mhow', 'pithampur', 'ratlam'
  ],
  'dehradun': [
    'dehradun', 'rishikesh', 'haridwar', 'roorkee', 'mussoorie', 'paonta sahib', 'saharanpur'
  ],
  'goa': [
    'goa', 'panaji', 'margao', 'vasco', 'mapusa', 'ponda', 'candolim', 'calangute', 'karwar', 'belgaum'
  ],
  'nagpur': [
    'nagpur', 'wardha', 'chandrapur', 'amravati', 'bhandara', 'gondia'
  ],
  'chandrapur': [
    'chandrapur', 'nagpur', 'wardha', 'ballarpur', 'yavatmal'
  ]
};

/**
 * Normalizes city name for case-insensitive lookup
 */
function normalize(str) {
  return (str || '').toLowerCase().trim().replace(/[\-_]/g, ' ');
}

/**
 * Returns all cities within ~100 km radius of the given base city
 */
export function getNearbyCities(cityName) {
  if (!cityName || cityName === 'All Cities') return [];
  const norm = normalize(cityName);

  for (const [key, cluster] of Object.entries(NEARBY_CITY_CLUSTERS)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      return cluster;
    }
  }

  // Fallback: check if the city appears inside any cluster
  for (const cluster of Object.values(NEARBY_CITY_CLUSTERS)) {
    if (cluster.some(c => norm.includes(c) || c.includes(norm))) {
      return cluster;
    }
  }

  return [norm];
}

/**
 * Checks if targetCity is within ~100km radius of baseCity
 */
export function isNearbyLocation(baseCity, targetCity) {
  if (!baseCity || !targetCity) return false;
  const bNorm = normalize(baseCity);
  const tNorm = normalize(targetCity);
  if (bNorm === 'all cities') return true;
  if (bNorm === tNorm || bNorm.includes(tNorm) || tNorm.includes(bNorm)) return true;

  const cluster = getNearbyCities(baseCity);
  return cluster.some(c => tNorm.includes(c) || c.includes(tNorm));
}

/**
 * Builds a Supabase .or(...) query string that encompasses the target city
 * and all neighboring towns within ~100 km
 */
export function buildCityFilter(cityName) {
  if (!cityName || cityName === 'All Cities') return null;
  const cities = getNearbyCities(cityName);
  const unique = Array.from(new Set(cities)).filter(Boolean);

  if (unique.length === 0) {
    return `city.ilike.%${cityName}%`;
  }

  return unique.map(c => `city.ilike.%${c}%`).join(',');
}
