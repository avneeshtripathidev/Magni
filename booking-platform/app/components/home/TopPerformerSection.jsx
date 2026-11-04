"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FadeSection from '@/app/components/common/FadeSection';
import Stars from '@/app/components/common/Stars';
import { formatINR } from '@helpers/formatters';
import { supabase } from '@database/connection/supabase';

// Module-level in-memory cache for instant re-render across navigations
let cachedArtistOfMonth = null;

function TopPerformerSection() {
  const [artist, setArtist] = useState(cachedArtistOfMonth);
  const [loading, setLoading] = useState(!cachedArtistOfMonth);

  useEffect(() => {
    if (cachedArtistOfMonth) {
      setArtist(cachedArtistOfMonth);
      setLoading(false);
      return;
    }

    const fetchArtistOfMonth = async () => {
      try {
        const { data, error } = await supabase
          .from('artists')
          .select('*, artist_images(image_url)')
          .eq('is_artist_of_month', true)
          .eq('is_live', true)
          .limit(1)
          .single();

        let topArtist = data;

        if (error || !data) {
          const { data: fallbackData } = await supabase
            .from('artists')
            .select('*, artist_images(image_url)')
            .eq('is_live', true)
            .limit(1)
            .single();
            
          if (fallbackData) {
            topArtist = fallbackData;
          } else {
            setArtist(null);
            return;
          }
        }

        if (topArtist) {
          let genres = [];
          if (topArtist.sub_categories && topArtist.sub_categories.length > 0) {
             genres = topArtist.sub_categories;
          } else if (topArtist.sub_category) {
             genres = topArtist.sub_category.split(',').map(g => g.trim().toUpperCase());
          }

          const parsedArtist = {
            name: topArtist.alias || topArtist.name,
            alias: topArtist.alias,
            image: topArtist.artist_images?.[0]?.image_url || '/placeholder.png',
            genres: genres,
            originalPrice: topArtist.original_price || topArtist.price_max || 0,
            exclusivePrice: topArtist.exclusive_price || topArtist.price_min || 0,
            rating: topArtist.rating || 0,
            bookings: topArtist.successful_bookings || 0,
          };

          cachedArtistOfMonth = parsedArtist;
          setArtist(parsedArtist);
        }
      } catch (err) {
        console.error('Error fetching artist of the month:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistOfMonth();
  }, []);

  if (!loading && !artist) {
    return null;
  }

  return (
    <FadeSection className="hp-shell hp-block">
      <div className="hp-section-head">
        <h2 className="hp-top-performer-title hp-display-title">
          Top Performer <span>of the Month</span>
        </h2>
      </div>
      <div className="hp-aom-card">
        {loading ? (
          <>
            <div className="hp-aom-img-wrap skeleton-pulse" style={{ background: 'rgba(255,255,255,0.05)', minHeight: '100%' }} suppressHydrationWarning></div>
            <div className="hp-aom-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
               <div className="skeleton-pulse" style={{ height: '12px', width: '30%', background: 'rgba(255,255,255,0.05)', marginBottom: '12px', borderRadius: '4px' }}></div>
               <div className="skeleton-pulse" style={{ height: '32px', width: '50%', background: 'rgba(255,255,255,0.05)', marginBottom: '20px', borderRadius: '6px' }}></div>
               <div className="hp-aom-stats-grid">
                 <div className="skeleton-pulse" style={{ height: '40px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}></div>
                 <div className="skeleton-pulse" style={{ height: '40px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}></div>
                 <div className="skeleton-pulse" style={{ height: '40px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}></div>
                 <div className="skeleton-pulse" style={{ height: '40px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}></div>
               </div>
               <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                 <div className="skeleton-pulse" style={{ height: '42px', flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
                 <div className="skeleton-pulse" style={{ height: '42px', flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}></div>
               </div>
            </div>
          </>
        ) : (
          <>
            <div className="hp-aom-img-wrap">
              <img
                src={typeof artist.image === "object" ? artist.image?.src : artist.image}
                alt={artist.name}
                loading="lazy"
                decoding="async"
                style={{ objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%', zIndex: 2 }}  
              />
              <div className="hp-aom-badge" style={{ zIndex: 10 }}>
                <span className="hp-aom-badge-icon">🏆</span>
                Artist of the Month
              </div>
            </div>
            <div className="hp-aom-content">
              <p className="hp-aom-genres">{(artist.genres || []).join(', ')}</p>
              <h3 className="hp-aom-name">{artist.name}</h3>

              <div className="hp-aom-stats-grid">
                <div className="hp-aom-stat-row">
                  <span>Original Price</span>
                  <strong>Rs {formatINR(artist.originalPrice)}</strong>
                </div>
                <div className="hp-aom-stat-row is-exclusive">
                  <span>Exclusive Price</span>
                  <strong>Rs {formatINR(artist.exclusivePrice)}</strong>
                </div>
                <div className="hp-aom-stat-row">
                  <span>Star Rating</span>
                  <div className="hp-aom-rating">
                    <Stars count={Math.round(Number(artist.rating))} />
                    <strong>{artist.rating}/5</strong>
                  </div>
                </div>
                {artist.bookings > 0 && (
                  <div className="hp-aom-stat-row">
                    <span>Total Bookings</span>
                    <strong>{artist.bookings}</strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-contact-modal', {
                    detail: { type: 'booking', artist: artist }
                  }))}
                  className="hp-btn hp-aom-btn"
                  style={{ flex: 1, whiteSpace: 'nowrap', padding: '12px 14px' }}
                >
                  Book Now
                </button>
                <Link href={`/artist/${encodeURIComponent((artist.alias || artist.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: 'none', display: 'flex' }}>
                  <button
                    className="hp-btn hp-aom-profile-btn"
                    style={{ 
                      flex: 1, 
                      whiteSpace: 'nowrap', 
                      padding: '12px 14px' 
                    }}
                  >
                    View Profile
                  </button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </FadeSection>
  );
}

export default React.memo(TopPerformerSection);
