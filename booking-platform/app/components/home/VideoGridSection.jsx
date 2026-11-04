"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import VideoModal from './VideoModal';

const videoItems = [
  {
    id: 1,
    title: 'Book Singer for a House Party',
    category: 'House Party & Acoustic',
    badge: '🔥 #1 HOUSE PARTY',
    tag: 'Living Room Acoustic',
    duration: '2-3 Hours Live',
    setup: 'Compact Sound Included',
    price: '₹6,999',
    regularPrice: '₹16,000',
    poster: '/posters/house_party_original.webp',
    fallbackPoster: '/videos/house_party_acoustic_thumb.jpg',
    videoUrl: '/videos/house_party_acoustic.mp4',
    rating: '4.96★'
  },
  {
    id: 2,
    title: 'Book Singer for Birthday Party',
    category: 'Birthday Celebrations',
    badge: '🎉 BIRTHDAY SPECIAL',
    tag: 'High-Energy Bollywood',
    duration: 'Medleys & Singalongs',
    setup: 'Mic & Acoustic Gear Included',
    price: '₹6,499',
    regularPrice: '₹15,000',
    poster: '/posters/birthday_party_original.webp',
    fallbackPoster: '/videos/birthday_party_singer_thumb.jpg',
    videoUrl: '/videos/birthday_party_singer.mp4',
    rating: '4.98★'
  },
  {
    id: 3,
    title: 'Book a Live Band for Weddings',
    category: 'Wedding & Grand Events',
    badge: '👑 ROYAL SANGEET BAND',
    tag: '4-5 Piece Live Ensemble',
    duration: 'Full Concert Experience',
    setup: 'Stage Audio & Lighting',
    price: '₹19,999',
    regularPrice: '₹45,000',
    poster: '/posters/wedding_band_original.webp',
    fallbackPoster: '/posters/wedding_sangeet_band.jpg',
    videoUrl: '/videos/terrace_sundowner_jam.mp4',
    rating: '4.98★'
  },
  {
    id: 4,
    title: 'Singer for Farmhouse Event',
    category: 'Farmhouse & Cocktails',
    badge: '🍸 LUXURY LAWN PARTY',
    tag: 'Poolside & Lawn Vibe',
    duration: 'Fusion & Bollywood Beats',
    setup: 'Poolside & Lawn Sound',
    price: '₹13,999',
    regularPrice: '₹32,000',
    poster: '/posters/farmhouse_cocktail_original.webp',
    fallbackPoster: '/videos/terrace_sundowner_jam_thumb.jpg',
    videoUrl: '/videos/terrace_sundowner_jam.mp4',
    rating: '4.97★'
  },
  {
    id: 5,
    title: 'Rooftop Terrace Sundowner Jam',
    category: 'Terrace & Sundowner',
    badge: '🌅 SUNSET SPECIAL',
    tag: 'Golden Hour Indie & Pop',
    duration: 'Guitar & Bongo Duo',
    setup: 'Open-Air Acoustic Setup',
    price: '₹8,499',
    regularPrice: '₹20,000',
    poster: '/posters/terrace_sundowner_original.webp',
    fallbackPoster: '/videos/terrace_sundowner_jam_thumb.jpg',
    videoUrl: '/videos/terrace_sundowner_jam.mp4',
    rating: '4.94★'
  },
  {
    id: 6,
    title: 'Intimate Ghazal & Sufi Mehfil',
    category: 'Ghazal & Sufi',
    badge: '🕯️ CANDLELIGHT MEHFIL',
    tag: 'Soulful Classical Acoustics',
    duration: 'Harmonium & Live Tabla',
    setup: 'Intimate Seating Setup',
    price: '₹9,999',
    regularPrice: '₹24,000',
    poster: '/posters/ghazal_sufi_original.webp',
    fallbackPoster: '/videos/house_party_acoustic_thumb.jpg',
    videoUrl: '/videos/house_party_acoustic.mp4',
    rating: '5.0★'
  }
];

export default function VideoGridSection() {
  const scrollRef = useRef(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -380 : 380;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const openQuoteModal = (item) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-contact-modal', {
          detail: {
            type: 'booking',
            artist: { name: item.title, category: item.category }
          }
        })
      );
    }
  };

  const playVideo = (item) => {
    setSelectedVideo({
      title: item.title,
      url: item.videoUrl || '/videos/house_party_acoustic.mp4',
      orientation: 'landscape'
    });
  };

  return (
    <section className="video-horizontal-section hp-shell hp-block" aria-label="Experience the Vibe">
      {/* Header with Eyebrow, Title and Navigation Buttons */}
      <div className="vhs-header">
        <div className="vhs-header-content">
          <div className="vhs-eyebrow">
            <span className="vhs-pulse-dot" aria-hidden="true" />
            <span>LIVE PERFORMANCE SHOWCASE</span>
          </div>
          <h2 className="vhs-heading">
            Experience the <span className="lux-gold-gradient">Vibe</span>
          </h2>
          <p className="vhs-subheading">
            Watch real live clips from house parties, birthdays, and luxury celebrations across Delhi &amp; NCR.
          </p>
        </div>

        {/* Desktop Carousel Controls */}
        <div className="vhs-controls" aria-label="Slider navigation">
          <button
            type="button"
            onClick={() => scroll('left')}
            className={`vhs-arrow-btn ${!canScrollLeft ? 'is-disabled' : ''}`}
            disabled={!canScrollLeft}
            aria-label="Previous video"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className={`vhs-arrow-btn ${!canScrollRight ? 'is-disabled' : ''}`}
            disabled={!canScrollRight}
            aria-label="Next video"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal Cards Track */}
      <div className="vhs-track-wrapper">
        <div className="vhs-track" ref={scrollRef}>
          {videoItems.map((item) => (
            <article key={item.id} className="vhs-card">
              {/* Media Container with Poster, Badges, and Play Trigger */}
              <div
                className="vhs-media-wrap"
                onClick={() => playVideo(item)}
                role="button"
                tabIndex={0}
                aria-label={`Play preview for ${item.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playVideo(item);
                  }
                }}
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  className="vhs-poster-img"
                  loading="lazy"
                  onError={(e) => {
                    if (e.currentTarget.src !== item.fallbackPoster) {
                      e.currentTarget.src = item.fallbackPoster;
                    }
                  }}
                />
                
                {/* Gradient Vignette Overlay */}
                <div className="vhs-media-overlay" />

                {/* Top Badges */}
                <div className="vhs-media-top">
                  <span className="vhs-badge-tag">{item.badge}</span>
                  <span className="vhs-badge-live">
                    <span className="vhs-live-bullet" />
                    LIVE CLIP
                  </span>
                </div>

                {/* Play Button Icon */}
                <div className="vhs-play-btn-circle" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>

                {/* Bottom Meta on Media */}
                <div className="vhs-media-bottom">
                  <span className="vhs-meta-tag">{item.tag}</span>
                  <span className="vhs-rating-tag">{item.rating}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="vhs-card-body">
                <h3 className="vhs-card-title">{item.title}</h3>
                <p className="vhs-card-meta">
                  <span>{item.duration}</span>
                  <span className="vhs-dot-sep">•</span>
                  <span>{item.setup}</span>
                </p>

                {/* Price and CTA Row */}
                <div className="vhs-card-footer">
                  <div className="vhs-price-box">
                    <span className="vhs-price-label">Starts from</span>
                    <span className="vhs-price-val">{item.price}</span>
                  </div>
                  <div className="vhs-actions-group">
                    <button
                      type="button"
                      onClick={() => playVideo(item)}
                      className="vhs-watch-btn"
                      aria-label={`Watch ${item.title}`}
                    >
                      Watch
                    </button>
                    <button
                      type="button"
                      onClick={() => openQuoteModal(item)}
                      className="vhs-quote-btn"
                    >
                      Get Quote
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Video Modal Player */}
      <VideoModal
        isOpen={Boolean(selectedVideo)}
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      <style jsx>{`
        .video-horizontal-section {
          padding: 3.5rem 1.5rem;
          max-width: 1360px;
          margin: 0 auto;
          position: relative;
        }

        .vhs-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2rem;
          gap: 1.5rem;
        }

        .vhs-header-content {
          max-width: 680px;
        }

        .vhs-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(232, 185, 67, 0.1);
          border: 1px solid rgba(232, 185, 67, 0.28);
          color: var(--brand-primary, #e8b943);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
          margin-bottom: 0.85rem;
        }

        .vhs-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e45f60;
          box-shadow: 0 0 8px #e45f60;
          animation: vhsPulse 1.8s infinite;
        }

        @keyframes vhsPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .vhs-heading {
          font-size: clamp(1.85rem, 3.2vw, 2.6rem);
          font-family: var(--font-display, "Cabinet Grotesk", sans-serif);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.2;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .vhs-subheading {
          font-size: clamp(0.95rem, 1.4vw, 1.05rem);
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.5;
          margin: 0;
        }

        .vhs-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .vhs-arrow-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #30272a;
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .vhs-arrow-btn:hover:not(:disabled) {
          background: #3e3337;
          border-color: var(--brand-primary, #e8b943);
          color: var(--brand-primary, #e8b943);
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        }

        .vhs-arrow-btn.is-disabled {
          opacity: 0.35;
          cursor: not-allowed;
          pointer-events: none;
        }

        .vhs-track-wrapper {
          position: relative;
          width: 100%;
        }

        .vhs-track {
          display: flex;
          gap: 1.35rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 1rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(232, 185, 67, 0.35) transparent;
        }

        .vhs-track::-webkit-scrollbar {
          height: 6px;
        }

        .vhs-track::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 999px;
        }

        .vhs-track::-webkit-scrollbar-thumb {
          background: rgba(232, 185, 67, 0.35);
          border-radius: 999px;
        }

        .vhs-track::-webkit-scrollbar-thumb:hover {
          background: rgba(232, 185, 67, 0.6);
        }

        .vhs-card {
          flex: 0 0 350px;
          max-width: 350px;
          scroll-snap-align: start;
          background: #30272a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          display: flex;
          flex-direction: column;
        }

        .vhs-card:hover {
          transform: translateY(-4px);
          border-color: rgba(232, 185, 67, 0.35);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55);
        }

        .vhs-media-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: #181415;
          cursor: pointer;
        }

        .vhs-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .vhs-card:hover .vhs-poster-img {
          transform: scale(1.04);
        }

        .vhs-media-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(33, 27, 29, 0.95) 0%,
            rgba(33, 27, 29, 0.25) 45%,
            rgba(0, 0, 0, 0.4) 100%
          );
          pointer-events: none;
        }

        .vhs-media-top {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          z-index: 2;
          pointer-events: none;
        }

        .vhs-badge-tag {
          background: rgba(16, 13, 14, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(232, 185, 67, 0.4);
          color: var(--brand-primary, #e8b943);
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .vhs-badge-live {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(228, 95, 96, 0.9);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 999px;
        }

        .vhs-live-bullet {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ffffff;
          animation: vhsPulse 1.4s infinite;
        }

        .vhs-play-btn-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(16, 13, 14, 0.7);
          backdrop-filter: blur(8px);
          border: 1.5px solid rgba(232, 185, 67, 0.6);
          color: var(--brand-primary, #e8b943);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
          transition: all 0.25s ease;
          z-index: 2;
        }

        .vhs-play-btn-circle svg {
          margin-left: 3px;
        }

        .vhs-card:hover .vhs-play-btn-circle {
          transform: translate(-50%, -50%) scale(1.12);
          background: var(--brand-primary, #e8b943);
          border-color: #ffffff;
          color: #100d0e;
          box-shadow: 0 0 24px rgba(232, 185, 67, 0.6);
        }

        .vhs-media-bottom {
          position: absolute;
          bottom: 10px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
          pointer-events: none;
        }

        .vhs-meta-tag {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
        }

        .vhs-rating-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--brand-primary, #e8b943);
          background: rgba(16, 13, 14, 0.75);
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid rgba(232, 185, 67, 0.25);
        }

        .vhs-card-body {
          padding: 1.15rem 1.15rem 1.25rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .vhs-card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.35rem 0;
          line-height: 1.35;
          border-left: 3px solid var(--brand-primary, #e8b943);
          padding-left: 9px;
        }

        .vhs-card-meta {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.65);
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .vhs-dot-sep {
          color: rgba(255, 255, 255, 0.35);
        }

        .vhs-card-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 0.85rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .vhs-price-box {
          display: flex;
          flex-direction: column;
        }

        .vhs-price-label {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.55);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .vhs-price-val {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--brand-primary, #e8b943);
          line-height: 1.2;
        }

        .vhs-actions-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .vhs-watch-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .vhs-watch-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .vhs-quote-btn {
          background: var(--brand-primary, #e8b943);
          color: #100d0e;
          border: none;
          font-size: 0.82rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(232, 185, 67, 0.25);
          white-space: nowrap;
        }

        .vhs-quote-btn:hover {
          background: #f0c34a;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(232, 185, 67, 0.4);
        }

        @media (max-width: 768px) {
          .video-horizontal-section {
            padding: 2.25rem 1rem !important;
          }

          .vhs-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 1.25rem;
          }

          .vhs-controls {
            display: none;
          }

          .vhs-card {
            flex: 0 0 calc(85vw - 16px);
            max-width: 320px;
          }

          .vhs-heading {
            font-size: 1.65rem !important;
          }

          .vhs-subheading {
            font-size: 0.9rem !important;
          }
        }

        @media (max-width: 360px) {
          .video-horizontal-section {
            padding: 1.75rem 0.5rem !important;
          }

          .vhs-card {
            flex: 0 0 280px;
            max-width: 280px;
          }

          .vhs-card-title {
            font-size: 0.95rem;
          }

          .vhs-quote-btn {
            padding: 7px 12px;
            font-size: 0.78rem;
          }
        }
      `}</style>
    </section>
  );
}
