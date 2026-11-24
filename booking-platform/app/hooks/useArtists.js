import { useState, useCallback } from 'react';
import { supabase } from '@database/connection/supabase';

const CLOUDFLARE_BASE = process.env.NEXT_PUBLIC_CLOUDFLARE_BASE_URL || 'https://customer-placeholder.cloudflarestream.com/';

const clientArtistsCache = new Map();
const featuredCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30s TTL so newly approved and live artists appear quickly

const constructCloudflareUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${CLOUDFLARE_BASE}${url}/watch`;
};

export const useArtists = (itemsPerPage = 15) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const fetchArtists = useCallback(async (page = 1, category = 'All', city = 'All Cities') => {
    const cacheKey = `${page}_${category}_${city}_${itemsPerPage}`.toLowerCase();
    const cached = clientArtistsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      setArtists(cached.artists);
      setTotalPages(cached.totalPages);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('artists')
        .select('*, artist_images(image_url)', { count: 'exact' })
        .eq('is_live', true);

      if (category !== 'All') {
        const filterCat = category.replace(/s$/i, '');
        query = query.or(`category.ilike.%${filterCat}%,sub_category.ilike.%${filterCat}%`);
      }

      if (city !== 'All Cities') {
        if (city === 'Delhi NCR') {
          query = query.or('city.ilike.%Delhi%,city.ilike.%Noida%,city.ilike.%Gurugram%,city.ilike.%Gurgaon%,city.ilike.%Faridabad%,city.ilike.%Ghaziabad%');
        } else {
          query = query.ilike('city', `%${city}%`);
        }
      }

      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count, error: queryError } = await query
        .order('is_featured', { ascending: false, nullsLast: true })
        .order('is_trending', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (queryError) {
        throw queryError;
      }

      if (data) {
        const formattedArtists = data.map(artist => ({
          id: artist.id,
          artist_no: artist.artist_no,
          name: artist.stage_name || artist.alias || artist.name,
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
          img: artist.cover_image_url || artist.profile_image_url || artist.artist_images?.[0]?.image_url || null,
          galleryImages: [
            ...(artist.cover_image_url ? [artist.cover_image_url] : []),
            ...(artist.profile_image_url && artist.profile_image_url !== artist.cover_image_url ? [artist.profile_image_url] : []),
            ...(artist.artist_images?.map(img => img.image_url).filter(Boolean) || [])
          ],
          cloudflareVideoUrls: artist.cloudflare_video_url ? artist.cloudflare_video_url.split(',').map(url => constructCloudflareUrl(url.trim())).filter(Boolean) : [],
          videoUrls: artist.video_url ? artist.video_url.split(',').map(url => url.trim()).filter(Boolean) : [],
          quote: artist.bio || '',
        }));
        setArtists(formattedArtists);
        const total = Math.ceil((count || 0) / itemsPerPage);
        setTotalPages(total);
        clientArtistsCache.set(cacheKey, { artists: formattedArtists, totalPages: total, timestamp: Date.now() });
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
      setError(err);
      setArtists([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  return { artists, loading, totalPages, fetchArtists, error };
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
        name: artist.stage_name || artist.alias || artist.name,
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
