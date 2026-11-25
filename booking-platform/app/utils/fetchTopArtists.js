import { supabase } from '@database/connection/supabase';

// In-memory cache to make repeated SSR requests execute in under 1ms
const seoArtistCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Guaranteed verified live performers fallback roster
export const VERIFIED_FALLBACK_ARTISTS = [
  {
    id: 'be552746-943a-4c52-ae62-639cbee5ee47',
    name: 'Rohit.j Live',
    rawName: 'Singer Rohit Joshi',
    alias: 'Rohit.j Live',
    category: 'Singer',
    subCategory: 'Bollywood, Retro, Sufi',
    city: 'Delhi',
    state: 'Delhi',
    rating: 5.0,
    successful_bookings: 28,
    price_min: 15000,
    price_max: 50000,
    bio: 'Renowned Bollywood playback and live performer delivering high-energy wedding and private event concerts across India.',
    img: 'https://pub-1802bb19214743ffa99aa227f25e7ede.r2.dev/talent-track/artists/1aebea4e-76c8-428b-97e1-38db4bb57eca.jpeg',
    galleryImages: [],
    isFromCity: false,
    slug: 'rohit-j-live'
  },
  {
    id: '8d6b7e3b-4b2a-4924-98d6-a133f2910cb2',
    name: 'RDM Live',
    rawName: 'Ridam',
    alias: 'RDM Live',
    category: 'Singer',
    subCategory: 'Bollywood, Sufi, Acoustic',
    city: 'Delhi',
    state: 'Delhi',
    rating: 4.9,
    successful_bookings: 32,
    price_min: 12000,
    price_max: 45000,
    bio: 'Soulful acoustic vocalist and stage performer specializing in Bollywood classics, contemporary melodies, and Sufi nights.',
    img: 'https://pub-1802bb19214743ffa99aa227f25e7ede.r2.dev/talent-track/artists/1aebea4e-76c8-428b-97e1-38db4bb57eca.jpeg',
    galleryImages: [],
    isFromCity: false,
    slug: 'rdm-live'
  },
  {
    id: '3d4ea4a1-545d-4d5c-8297-d4c28fabbf21',
    name: 'NIIL',
    rawName: 'Nilesh',
    alias: 'NIIL',
    category: 'Singer',
    subCategory: 'Bollywood, Retro, Western',
    city: 'New Delhi',
    state: 'Delhi',
    rating: 4.9,
    successful_bookings: 24,
    price_min: 15000,
    price_max: 55000,
    bio: 'Versatile vocalist with electrifying stage presence for grand wedding sangeets, corporate galas, and concert nights.',
    img: 'https://pub-1802bb19214743ffa99aa227f25e7ede.r2.dev/talent-track/artists/1aebea4e-76c8-428b-97e1-38db4bb57eca.jpeg',
    galleryImages: [],
    isFromCity: false,
    slug: 'niil'
  },
  {
    id: 'dc8e3224-fee3-4fdb-bff2-5bfb25d694cd',
    name: 'AAA live',
    rawName: 'Aatir',
    alias: 'AAA live',
    category: 'Singer',
    subCategory: 'Bollywood, Retro, Indie',
    city: 'New Delhi',
    state: 'Delhi',
    rating: 4.9,
    successful_bookings: 22,
    price_min: 10000,
    price_max: 35000,
    bio: 'Dynamic acoustic guitarist and live singer performing unforgettable singalongs and Bollywood unplugged sets.',
    img: 'https://pub-1802bb19214743ffa99aa227f25e7ede.r2.dev/talent-track/artists/1aebea4e-76c8-428b-97e1-38db4bb57eca.jpeg',
    galleryImages: [],
    isFromCity: false,
    slug: 'aaa-live'
  },
  {
    id: '8af68290-60b8-4ced-bb9e-4bcd8bea9c92',
    name: 'VB Live',
    rawName: 'Vaibhav Kundra',
    alias: 'VB Live',
    category: 'Singer',
    subCategory: 'Bollywood, Punjabi, Sufi',
    city: 'Delhi',
    state: 'Delhi',
    rating: 4.9,
    successful_bookings: 29,
    price_min: 15000,
    price_max: 60000,
    bio: 'High-energy live performer blending Bollywood chartbusters with high-octane Punjabi beats and soulful melodies.',
    img: 'https://pub-1802bb19214743ffa99aa227f25e7ede.r2.dev/talent-track/artists/1aebea4e-76c8-428b-97e1-38db4bb57eca.jpeg',
    galleryImages: [],
    isFromCity: false,
    slug: 'vb-live'
  }
];

export async function getTopArtistsForSEO({ category = 'All', subCategory = '', city = 'All Cities', limit = 5 }) {
  const cacheKey = `${category}__${subCategory}__${city}__${limit}`.toLowerCase();
  const cached = seoArtistCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    let artists = [];

    const formatArtist = (artist, isFromCity = false) => {
      const alias = artist.alias ? artist.alias.trim() : '';
      const name = artist.name ? artist.name.trim() : '';
      const displayName = alias || name || 'Verified Artist';
      const slug = (alias || name || artist.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const img = artist.cover_image_url || artist.artist_images?.[0]?.image_url || null;
      const galleryImages = [
        ...(artist.cover_image_url ? [artist.cover_image_url] : []),
        ...((artist.artist_images || []).map(i => i.image_url).filter(Boolean))
      ];

      return {
        id: artist.id,
        artist_no: artist.artist_no,
        name: displayName,
        rawName: name,
        alias: alias,
        category: artist.category || 'Performer',
        subCategory: artist.sub_category || '',
        city: artist.city || 'India',
        state: artist.state || '',
        rating: artist.rating ? Number(artist.rating) : 5.0,
        successful_bookings: artist.successful_bookings ? Number(artist.successful_bookings) : 25,
        price_min: artist.price_min ? Number(artist.price_min) : 10000,
        price_max: artist.price_max ? Number(artist.price_max) : 25000,
        bio: artist.bio || '',
        img,
        galleryImages,
        isFromCity,
        slug
      };
    };

    // Helper to get normalized category search term for database queries
    const getCatFilterTerm = (cat) => {
      if (!cat || cat === 'All') return null;
      const c = cat.toLowerCase();
      if (c.includes('band')) return 'band';
      if (c.includes('dj')) return 'dj';
      if (c.includes('comedian')) return 'comedian';
      if (c.includes('magician')) return 'magician';
      if (c.includes('dancer')) return 'dancer';
      if (c.includes('anchor')) return 'anchor';
      if (c.includes('musician') || c.includes('music') || c.includes('guitarist')) return 'music';
      if (c.includes('singer') || c.includes('artist') || c.includes('ghazal') || c.includes('sufi')) return 'singer';
      return cat.replace(/s$/i, '').toLowerCase();
    };

    const filterTerm = getCatFilterTerm(category);

    // 1. Try local city + category / subCategory
    if (city && city !== 'All Cities') {
      let q = supabase
        .from('artists')
        .select('id, artist_no, name, alias, category, sub_category, city, state, rating, successful_bookings, price_min, price_max, bio, cover_image_url, artist_images(image_url)')
        .eq('is_live', true)
        .ilike('city', `%${city}%`);

      if (filterTerm) {
        q = q.or(`category.ilike.%${filterTerm}%,sub_category.ilike.%${filterTerm}%,name.ilike.%${filterTerm}%,alias.ilike.%${filterTerm}%`);
      }

      const { data, error } = await q.order('rating', { ascending: false }).limit(limit);
      if (!error && data && data.length > 0) {
        artists = data.map(a => formatArtist(a, true));
      }
    }

    // 2. If fewer than limit, try subCategory nationwide (e.g. Gazals, Sufi, Sangeet)
    if (artists.length < limit && subCategory) {
      const existingIds = artists.map(a => a.id);
      let q = supabase
        .from('artists')
        .select('id, artist_no, name, alias, category, sub_category, city, state, rating, successful_bookings, price_min, price_max, bio, cover_image_url, artist_images(image_url)')
        .eq('is_live', true)
        .ilike('sub_category', `%${subCategory}%`);

      if (existingIds.length > 0) {
        q = q.not('id', 'in', `(${existingIds.join(',')})`);
      }

      const { data, error } = await q.order('rating', { ascending: false }).order('successful_bookings', { ascending: false }).limit(limit - artists.length);
      if (!error && data && data.length > 0) {
        artists = [...artists, ...data.map(a => formatArtist(a, false))];
      }
    }

    // 3. If still fewer than limit, try category nationwide
    if (artists.length < limit && filterTerm) {
      const existingIds = artists.map(a => a.id);
      let q = supabase
        .from('artists')
        .select('id, artist_no, name, alias, category, sub_category, city, state, rating, successful_bookings, price_min, price_max, bio, cover_image_url, artist_images(image_url)')
        .eq('is_live', true);

      q = q.or(`category.ilike.%${filterTerm}%,sub_category.ilike.%${filterTerm}%,name.ilike.%${filterTerm}%,alias.ilike.%${filterTerm}%`);

      if (existingIds.length > 0) {
        q = q.not('id', 'in', `(${existingIds.join(',')})`);
      }

      const { data, error } = await q.order('rating', { ascending: false }).order('successful_bookings', { ascending: false }).limit(limit - artists.length);
      if (!error && data && data.length > 0) {
        artists = [...artists, ...data.map(a => formatArtist(a, false))];
      }
    }

    // 4. If still fewer than limit, fetch top rated live performers nationwide
    if (artists.length < limit) {
      const existingIds = artists.map(a => a.id);
      let q = supabase
        .from('artists')
        .select('id, artist_no, name, alias, category, sub_category, city, state, rating, successful_bookings, price_min, price_max, bio, cover_image_url, artist_images(image_url)')
        .eq('is_live', true);

      if (existingIds.length > 0) {
        q = q.not('id', 'in', `(${existingIds.join(',')})`);
      }

      const { data, error } = await q.order('rating', { ascending: false }).limit(limit - artists.length);
      if (!error && data && data.length > 0) {
        artists = [...artists, ...data.map(a => formatArtist(a, false))];
      }
    }

    // 5. If database had fewer than limit or failed, fill with verified fallback performers
    if (artists.length < limit) {
      const existingNames = new Set(artists.map(a => a.name.toLowerCase()));
      for (const fallback of VERIFIED_FALLBACK_ARTISTS) {
        if (!existingNames.has(fallback.name.toLowerCase()) && artists.length < limit) {
          artists.push(fallback);
        }
      }
    }

    const finalArtists = artists.slice(0, limit);
    seoArtistCache.set(cacheKey, { data: finalArtists, timestamp: Date.now() });
    return finalArtists;
  } catch (err) {
    console.error('Error fetching top artists for SEO:', err);
    return VERIFIED_FALLBACK_ARTISTS.slice(0, limit);
  }
}
