/**
 * Magnevents Advanced Booking-Intent Keyword Engine
 * 
 * Generates and validates high-converting, intent-focused search queries combining:
 * [Event Type] + [Artist / Service] + [City / Location] + [Booking Intent Modifier]
 * 
 * Supports:
 * - Transactional Booking Intent (Book, Hire, Price, Cost, Fees, Charges)
 * - Evaluative & Local Intent (Best, Top, Near me, Affordable, Verified, Professional)
 * - Occasion Intent (for wedding, for sangeet, for corporate event, for house party, for college fest)
 * - Hinglish & Regional Transliterations (e.g., "Shaadi ke liye singer", "Sangeet ke liye DJ", "House party artist")
 * - Smart deduplication, priority scoring, and URL slug mapping
 */

import { INDIAN_CITIES_1063 } from '../../app/constants/indianCities1063.js';

export const EVENT_CATEGORIES = [
  {
    id: 'wedding',
    name: 'Weddings & Celebrations',
    slug: 'wedding',
    types: [
      { name: 'Wedding', slug: 'wedding', intentWeight: 0.98 },
      { name: 'Sangeet', slug: 'sangeet', intentWeight: 0.96 },
      { name: 'Haldi', slug: 'haldi', intentWeight: 0.94 },
      { name: 'Mehendi', slug: 'mehendi', intentWeight: 0.94 },
      { name: 'Reception', slug: 'reception', intentWeight: 0.95 },
      { name: 'Engagement / Ring Ceremony', slug: 'engagement', intentWeight: 0.93 },
      { name: 'Cocktail Party', slug: 'cocktail-party', intentWeight: 0.92 },
      { name: 'Anniversary', slug: 'anniversary', intentWeight: 0.90 },
      { name: 'Destination Wedding', slug: 'destination-wedding', intentWeight: 0.97 },
      { name: 'Bridal Entry', slug: 'bridal-entry', intentWeight: 0.91 }
    ]
  },
  {
    id: 'corporate',
    name: 'Corporate & Formal Galas',
    slug: 'corporate',
    types: [
      { name: 'Corporate Event', slug: 'corporate-events', intentWeight: 0.95 },
      { name: 'Annual Day / Function', slug: 'annual-function', intentWeight: 0.94 },
      { name: 'Corporate Gala Dinner', slug: 'corporate-gala', intentWeight: 0.93 },
      { name: 'Product Launch', slug: 'product-launch', intentWeight: 0.92 },
      { name: 'Corporate Offsite', slug: 'corporate-offsite', intentWeight: 0.90 },
      { name: 'Business Summit / Conference', slug: 'conference-entertainment', intentWeight: 0.89 },
      { name: 'Award Ceremony', slug: 'award-ceremony', intentWeight: 0.91 }
    ]
  },
  {
    id: 'party',
    name: 'Private & House Parties',
    slug: 'party',
    types: [
      { name: 'House Party', slug: 'house-party', intentWeight: 0.96 },
      { name: 'Birthday Party', slug: 'birthday-party', intentWeight: 0.95 },
      { name: 'Terrace Party / House Gig', slug: 'house-gig', intentWeight: 0.93 },
      { name: 'Private Dinner Gathering', slug: 'private-party', intentWeight: 0.91 },
      { name: 'Kids Birthday Party', slug: 'kids-birthday', intentWeight: 0.88 },
      { name: 'Milestone 50th / 25th Birthday', slug: 'milestone-birthday', intentWeight: 0.90 }
    ]
  },
  {
    id: 'college',
    name: 'College & Educational Fests',
    slug: 'college',
    types: [
      { name: 'College Fest', slug: 'college-fest', intentWeight: 0.94 },
      { name: 'Campus Youth Festival', slug: 'campus-fest', intentWeight: 0.92 },
      { name: 'Freshers Party', slug: 'freshers-party', intentWeight: 0.90 },
      { name: 'Farewell Night', slug: 'farewell-night', intentWeight: 0.89 },
      { name: 'College Celebrity Night', slug: 'celebrity-night', intentWeight: 0.96 }
    ]
  },
  {
    id: 'live-music',
    name: 'Live Music & Performing Arts',
    slug: 'live-music',
    types: [
      { name: 'Bollywood Live Singer', slug: 'bollywood-singer', intentWeight: 0.98 },
      { name: 'Sufi & Qawwali Night', slug: 'sufi-singer', intentWeight: 0.96 },
      { name: 'Punjabi Folk & Pop', slug: 'punjabi-singer', intentWeight: 0.96 },
      { name: 'Ghazal Mehfil', slug: 'ghazal-singer', intentWeight: 0.94 },
      { name: 'Acoustic Guitarist / Singer', slug: 'acoustic-singer', intentWeight: 0.95 },
      { name: 'Live Rock / Pop Band', slug: 'live-band', intentWeight: 0.97 },
      { name: 'Wedding & Club DJ', slug: 'wedding-dj', intentWeight: 0.97 },
      { name: 'Violinist / Instrumentalists', slug: 'instrumentalist', intentWeight: 0.92 },
      { name: 'Event Emcee / Anchor', slug: 'anchor', intentWeight: 0.93 },
      { name: 'Standup Comedy Headliner', slug: 'standup-comedian', intentWeight: 0.91 },
      { name: 'Magician & Illusionist', slug: 'magician', intentWeight: 0.90 }
    ]
  },
  {
    id: 'religious',
    name: 'Religious & Devotional Gatherings',
    slug: 'religious',
    types: [
      { name: 'Bhajan Sandhya', slug: 'bhajan-singer', intentWeight: 0.94 },
      { name: 'Mata Ki Chowki', slug: 'mata-ki-chowki', intentWeight: 0.95 },
      { name: 'Jagran / Jagrata', slug: 'jagran-singer', intentWeight: 0.94 },
      { name: 'Kirtan Ensemble', slug: 'kirtan-group', intentWeight: 0.90 },
      { name: 'Dandiya & Garba Night', slug: 'garba-night', intentWeight: 0.93 }
    ]
  }
];

export const INTENT_MODIFIERS = [
  // Tier 1: High Transactional Intent
  { prefix: 'Book', suffix: '', tier: 'transactional', score: 1.00 },
  { prefix: 'Hire', suffix: '', tier: 'transactional', score: 0.98 },
  { prefix: '', suffix: 'Booking', tier: 'transactional', score: 0.99 },
  { prefix: '', suffix: 'Price', tier: 'transactional', score: 0.95 },
  { prefix: '', suffix: 'Cost', tier: 'transactional', score: 0.94 },
  { prefix: '', suffix: 'Charges', tier: 'transactional', score: 0.92 },
  { prefix: '', suffix: 'Packages', tier: 'transactional', score: 0.93 },

  // Tier 2: Evaluative & Local Intent
  { prefix: 'Best', suffix: '', tier: 'evaluative', score: 0.96 },
  { prefix: 'Top', suffix: '', tier: 'evaluative', score: 0.94 },
  { prefix: '', suffix: 'Near Me', tier: 'evaluative', score: 0.97 },
  { prefix: 'Affordable', suffix: '', tier: 'evaluative', score: 0.91 },
  { prefix: 'Professional', suffix: '', tier: 'evaluative', score: 0.92 },
  { prefix: 'Verified', suffix: '', tier: 'evaluative', score: 0.90 },

  // Tier 3: Hinglish & Multilingual Conversational
  { prefix: '', suffix: 'ke liye', tier: 'hinglish', score: 0.91 },
  { prefix: 'Shaadi ke liye', suffix: '', tier: 'hinglish', score: 0.94 },
  { prefix: 'Sangeet ke liye', suffix: '', tier: 'hinglish', score: 0.93 },
  { prefix: 'House party ke liye', suffix: '', tier: 'hinglish', score: 0.92 }
];

export const ARTIST_ACTS = [
  { name: 'Singer', slug: 'singer', synonyms: ['vocalist', 'artist'] },
  { name: 'Live Singer', slug: 'live-singer', synonyms: ['performer'] },
  { name: 'Bollywood Singer', slug: 'bollywood-singer', synonyms: ['hindi singer'] },
  { name: 'Sufi Singer', slug: 'sufi-singer', synonyms: ['qawwali singer'] },
  { name: 'Punjabi Singer', slug: 'punjabi-singer', synonyms: ['bhangra singer'] },
  { name: 'Ghazal Singer', slug: 'ghazal-singer', synonyms: ['mehfil singer'] },
  { name: 'Acoustic Singer', slug: 'acoustic-singer', synonyms: ['unplugged singer'] },
  { name: 'Live Band', slug: 'live-band', synonyms: ['music band', 'orchestra'] },
  { name: 'Wedding Band', slug: 'wedding-band', synonyms: ['brass band', 'sangeet band'] },
  { name: 'Rock Band', slug: 'rock-band', synonyms: ['fusion band'] },
  { name: 'DJ', slug: 'dj', synonyms: ['disc jockey', 'music DJ'] },
  { name: 'Wedding DJ', slug: 'wedding-dj', synonyms: ['sangeet DJ'] },
  { name: 'House Party DJ', slug: 'house-party-dj', synonyms: ['club DJ'] },
  { name: 'Guitarist', slug: 'guitarist', synonyms: ['acoustic guitarist'] },
  { name: 'Violinist', slug: 'violinist', synonyms: ['instrumentalist'] },
  { name: 'Anchor', slug: 'anchor', synonyms: ['emcee', 'host'] },
  { name: 'Wedding Anchor', slug: 'wedding-anchor', synonyms: ['sangeet anchor'] },
  { name: 'Corporate Anchor', slug: 'corporate-event-anchor', synonyms: ['business emcee'] },
  { name: 'Standup Comedian', slug: 'standup-comedian', synonyms: ['comedian'] },
  { name: 'Magician', slug: 'magician', synonyms: ['illusionist', 'mentalist'] },
  { name: 'Qawwali Group', slug: 'qawwali-group', synonyms: ['sufi group'] },
  { name: 'Bhajan Singer', slug: 'bhajan-singer', synonyms: ['chowki singer', 'jagran singer'] }
];

/**
 * Generates prioritized booking keywords for a specified city or all cities.
 */
export function generateKeywordsForCity(citySlug, options = {}) {
  const city = INDIAN_CITIES_1063.find(c => c.slug === citySlug) || {
    name: citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    slug: citySlug,
    state: 'India'
  };

  const limit = options.limit || 50;
  const filterCategory = options.category;
  const keywords = [];

  for (const act of ARTIST_ACTS) {
    // 1. Direct [Act] in [City]
    keywords.push({
      keyword: `${act.name} in ${city.name}`,
      slug: `/${act.slug}-in-${city.slug}`,
      intent: 'evaluative',
      priority: 0.95,
      act: act.name,
      city: city.name,
      state: city.state
    });

    // 2. High Intent: Book [Act] in [City]
    keywords.push({
      keyword: `Book ${act.name} in ${city.name}`,
      slug: `/book-${act.slug}-in-${city.slug}`,
      intent: 'transactional',
      priority: 0.98,
      act: act.name,
      city: city.name,
      state: city.state
    });

    // 3. Event-Specific Combinations
    for (const cat of EVENT_CATEGORIES) {
      if (filterCategory && cat.id !== filterCategory) continue;

      for (const eventType of cat.types.slice(0, 3)) {
        // e.g., "Wedding Singer in Lucknow", "Corporate DJ in Delhi"
        const eventActName = `${eventType.name} ${act.name}`;
        const eventActSlug = `${eventType.slug}-${act.slug}`;

        keywords.push({
          keyword: `${eventActName} in ${city.name}`,
          slug: `/${eventActSlug}-in-${city.slug}`,
          intent: 'transactional',
          priority: Number((0.90 * eventType.intentWeight).toFixed(2)),
          act: act.name,
          event: eventType.name,
          city: city.name,
          state: city.state
        });

        // e.g., "Hire Wedding Singer in Lucknow"
        keywords.push({
          keyword: `Hire ${eventActName} in ${city.name}`,
          slug: `/hire-${eventActSlug}-in-${city.slug}`,
          intent: 'transactional',
          priority: Number((0.92 * eventType.intentWeight).toFixed(2)),
          act: act.name,
          event: eventType.name,
          city: city.name,
          state: city.state
        });
      }
    }

    // 4. Hinglish / Multilingual Variations
    keywords.push({
      keyword: `Shaadi ke liye ${act.name} ${city.name}`,
      slug: `/wedding-${act.slug}-in-${city.slug}`,
      intent: 'hinglish',
      priority: 0.89,
      act: act.name,
      city: city.name,
      state: city.state
    });
  }

  // Deduplicate by slug
  const seenSlugs = new Set();
  const uniqueKeywords = [];
  for (const item of keywords) {
    if (!seenSlugs.has(item.slug)) {
      seenSlugs.add(item.slug);
      uniqueKeywords.push(item);
    }
  }

  // Sort by priority descending
  uniqueKeywords.sort((a, b) => b.priority - a.priority);

  return uniqueKeywords.slice(0, limit);
}

/**
 * Searches and scores any incoming user query against the keyword taxonomy.
 */
export function analyzeBookingIntent(query) {
  if (!query || typeof query !== 'string') {
    return { hasIntent: false, score: 0, details: null };
  }

  const clean = query.trim().toLowerCase();
  let score = 0;
  const detected = {
    actions: [],
    acts: [],
    events: [],
    cities: []
  };

  // Check intent actions
  const actions = ['book', 'booking', 'hire', 'price', 'cost', 'charges', 'contact', 'near me', 'best', 'top', 'affordable'];
  for (const a of actions) {
    if (clean.includes(a)) {
      detected.actions.push(a);
      score += 0.25;
    }
  }

  // Check acts
  for (const act of ARTIST_ACTS) {
    if (clean.includes(act.name.toLowerCase()) || clean.includes(act.slug)) {
      detected.acts.push(act.name);
      score += 0.35;
      break;
    }
  }

  // Check events
  for (const cat of EVENT_CATEGORIES) {
    for (const type of cat.types) {
      if (clean.includes(type.name.toLowerCase()) || clean.includes(type.slug)) {
        detected.events.push(type.name);
        score += 0.25;
        break;
      }
    }
  }

  // Check cities
  for (const city of INDIAN_CITIES_1063) {
    if (clean.includes(city.name.toLowerCase()) || clean.includes(city.slug)) {
      detected.cities.push(city.name);
      score += 0.30;
      break;
    }
  }

  const finalScore = Math.min(1.0, Number(score.toFixed(2)));
  return {
    hasIntent: finalScore >= 0.50,
    score: finalScore,
    detected
  };
}
