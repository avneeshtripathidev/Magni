import { useState, useCallback } from 'react';
import { supabase } from '@database/connection/supabase';
import { buildCityFilter, isNearbyLocation } from '@/app/utils/cityProximity';
import { formatArtistDisplayName } from '@/app/utils/nameFormatter';

const CLOUDFLARE_BASE = process.env.NEXT_PUBLIC_CLOUDFLARE_BASE_URL || 'https://customer-placeholder.cloudflarestream.com/';

const clientArtistsCache = new Map();
const featuredCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30s TTL so newly approved and live artists appear quickly

const constructCloudflareUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${CLOUDFLARE_BASE}${url}/watch`;
};

function getCategoryOrQuery(category) {
  if (!category || category === 'All') return null;
  const c = category.toLowerCase().trim();
  if (c.includes('dj')) {
    return 'category.ilike.%dj%,sub_category.ilike.%dj%,name.ilike.%dj%,alias.ilike.%dj%';
  }
  if (c.includes('rap') || c.includes('hip-hop') || c.includes('hiphop')) {
    return 'category.ilike.%rap%,sub_category.ilike.%rap%,category.ilike.%hip%,sub_category.ilike.%hip%';
  }
  if (c.includes('singer')) {
    return 'category.ilike.%singer%,sub_category.ilike.%singer%,category.ilike.%vocalist%,sub_category.ilike.%vocalist%';
  }
  if (c.includes('band')) {
    return 'category.ilike.%band%,sub_category.ilike.%band%,category.ilike.%orchestra%';
  }
  if (c.includes('magic')) {
    return 'category.ilike.%magic%,sub_category.ilike.%magic%,category.ilike.%illusion%';
  }
  if (c.includes('anchor')) {
    return 'category.ilike.%anchor%,sub_category.ilike.%anchor%,category.ilike.%emcee%,category.ilike.%mc%';
  }
  if (c.includes('comed')) {
    return 'category.ilike.%comed%,sub_category.ilike.%comed%,category.ilike.%standup%';
  }
  if (c.includes('instrument')) {
    return 'category.ilike.%instrument%,sub_category.ilike.%instrument%,category.ilike.%guitar%,category.ilike.%flute%,category.ilike.%violin%,category.ilike.%sax%,category.ilike.%dhol%';
  }
  const clean = category.replace(/s$/i, '');
  return `category.ilike.%${clean}%,sub_category.ilike.%${clean}%`;
}

function formatArtistRecord(artist, selectedCity, isTravelFallback = false) {
  const isCitySelected = selectedCity && selectedCity !== 'All Cities';
  const artistCity = artist.city || '';
  const isExactLocal = isCitySelected && (artistCity.toLowerCase().includes(selectedCity.toLowerCase()) || selectedCity.toLowerCase().includes(artistCity.toLowerCase()));
  const isNearby = isCitySelected && !isExactLocal && isNearbyLocation(selectedCity, artistCity);
  const isTravelReady = isCitySelected && (isTravelFallback || (!isExactLocal && !isNearby));

  let travelNotice = null;
  if (isTravelReady) {
    travelNotice = `Available for ${selectedCity} (Travels from ${artistCity || 'India'})`;
  } else if (isNearby) {
    travelNotice = `Nearby Performer (~100km radius)`;
  }

  return {
    id: artist.id,
    artist_no: artist.artist_no,
    name: formatArtistDisplayName(artist.name, artist.stage_name || artist.alias),
    slug: artist.slug || (artist.stage_name || artist.alias || artist.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    category: artist.category,
    subCategory: artist.sub_category,
    city: artist.city,
    state: artist.state,
    languages: artist.performing_language || (Array.isArray(artist.languages) ? artist.languages.join(', ') : (artist.languages || 'Hindi, English')),
    priceMin: artist.price_min,
    priceMax: artist.price_max,
    originalPrice: artist.original_price,
    exclusivePrice: artist.exclusive_price,
    price: artist.price_min,
    successful_bookings: artist.successful_bookings,
    rating: artist.rating,
    isLocal: isExactLocal,
    isNearby: isNearby,
    isTravelReady: isTravelReady,
    travelNotice: travelNotice,
    img: artist.cover_image_url || artist.profile_image_url || artist.artist_images?.[0]?.image_url || null,
    galleryImages: [
      ...(artist.cover_image_url ? [artist.cover_image_url] : []),
      ...(artist.profile_image_url && artist.profile_image_url !== artist.cover_image_url ? [artist.profile_image_url] : []),
      ...(artist.artist_images?.map(img => img.image_url).filter(Boolean) || [])
    ],
    cloudflareVideoUrls: artist.cloudflare_video_url ? artist.cloudflare_video_url.split(',').map(url => constructCloudflareUrl(url.trim())).filter(Boolean) : [],
    videoUrls: artist.video_url ? artist.video_url.split(',').map(url => url.trim()).filter(Boolean) : [],
    quote: artist.bio || '',
  };
}

export const useArtists = (itemsPerPage = 15) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [fallbackNotice, setFallbackNotice] = useState(null);

  const fetchArtists = useCallback(async (page = 1, category = 'All', city = 'All Cities') => {
    const cacheKey = `${page}_${category}_${city}_${itemsPerPage}`.toLowerCase();
    const cached = clientArtistsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      setArtists(cached.artists);
      setTotalPages(cached.totalPages);
      setFallbackNotice(cached.fallbackNotice || null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setFallbackNotice(null);

    try {
      const catOr = getCategoryOrQuery(category);
      const cityOr = buildCityFilter(city);

      // --- TIER 1: Exact city + 100km nearby locations ---
      let query = supabase
        .from('artists')
        .select('*, artist_images(image_url)', { count: 'exact' })
        .eq('is_live', true);

      if (catOr) {
        query = query.or(catOr);
      }

      if (cityOr) {
        query = query.or(cityOr);
      }

      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let { data, count, error: queryError } = await query
        .order('is_featured', { ascending: false, nullsLast: true })
        .order('is_trending', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (queryError) {
        throw queryError;
      }

      let activeNotice = null;

      // --- TIER 2: If 0 artists found in selected city & 100km radius, fallback to nationwide travel-ready performers ---
      if ((!data || data.length === 0) && city !== 'All Cities') {
        let fallbackQuery = supabase
          .from('artists')
          .select('*, artist_images(image_url)', { count: 'exact' })
          .eq('is_live', true);

        if (catOr) {
          fallbackQuery = fallbackQuery.or(catOr);
        }

        const fallbackRes = await fallbackQuery
          .order('is_featured', { ascending: false, nullsLast: true })
          .order('is_trending', { ascending: false, nullsLast: true })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (!fallbackRes.error && fallbackRes.data && fallbackRes.data.length > 0) {
          data = fallbackRes.data;
          count = fallbackRes.count;
          const displayCat = category === 'All' ? 'artists' : category;
          activeNotice = `No local ${displayCat} registered in ${city} yet. Showing top verified ${displayCat} available to travel for ${city} events.`;
        }
      }

      if (data) {
        const isTravelFallback = Boolean(activeNotice);
        const formattedArtists = data.map(artist => formatArtistRecord(artist, city, isTravelFallback));
        setArtists(formattedArtists);
        setFallbackNotice(activeNotice);
        const total = Math.ceil((count || 0) / itemsPerPage);
        setTotalPages(total || 1);
        clientArtistsCache.set(cacheKey, { 
          artists: formattedArtists, 
          totalPages: total || 1, 
          fallbackNotice: activeNotice, 
          timestamp: Date.now() 
        });
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
      setError(err);
      setArtists([]);
      setTotalPages(1);
      setFallbackNotice(null);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  return { artists, loading, totalPages, fetchArtists, error, fallbackNotice };
};

export const useFeaturedArtists = (limit = 6) => {
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatured = useCallback(async () => {
    const cached = featuredCache.get(limit);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      setFeaturedArtists(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*, artist_images(image_url)')
        .eq('is_featured', true)
        .eq('is_live', true)
        .limit(limit);

      if (error) {
        console.warn('Failed to fetch featured artists from DB, using fallback.', error.message);
        return;
      }

      const formatArtistData = (artists) => artists.map(artist => ({
        id: artist.id,
        artist_no: artist.artist_no,
        name: formatArtistDisplayName(artist.name, artist.stage_name || artist.alias),
        slug: artist.slug || (artist.stage_name || artist.alias || artist.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        category: artist.category,
        subCategory: artist.sub_category,
        city: artist.city,
        state: artist.state,
        languages: artist.performing_language || (Array.isArray(artist.languages) ? artist.languages.join(', ') : (artist.languages || 'Hindi, English')),
        successful_bookings: artist.successful_bookings,
        rating: artist.rating,
        bio: artist.bio || '',
        description: artist.bio ? (artist.bio.length > 95 ? artist.bio.substring(0, 92) + '...' : artist.bio) : 'Verified live performer available for private and corporate event bookings.',
        img: artist.cover_image_url || artist.profile_image_url || artist.artist_images?.[0]?.image_url || null,
      }));

      if (data && data.length > 0) {
        const formatted = formatArtistData(data);
        setFeaturedArtists(formatted);
        featuredCache.set(limit, { data: formatted, timestamp: Date.now() });
      } else {
        const { data: anyData } = await supabase
          .from('artists')
          .select('*, artist_images(image_url)')
          .eq('is_live', true)
          .limit(limit);
          
        if (anyData && anyData.length > 0) {
          const formatted = formatArtistData(anyData);
          setFeaturedArtists(formatted);
          featuredCache.set(limit, { data: formatted, timestamp: Date.now() });
        } else {
          setFeaturedArtists([]);
        }
      }
    } catch (err) {
      console.error('Error fetching featured artists:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  return { featuredArtists, loading, fetchFeatured };
};
