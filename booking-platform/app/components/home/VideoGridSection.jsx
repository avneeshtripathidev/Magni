"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import VideoModal from './VideoModal';
import '@/app/styles/components/VideoGridSection.css';

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

function VibeVideoCard({ item, onPlayModal, onQuoteModal }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;

    // Use IntersectionObserver to autoplay when visible in viewport
    let observer;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const p = video.play();
              if (p !== undefined) {
                p.then(() => setIsPlaying(true))
                  .catch(() => {
                    video.muted = true;
                    video.play().catch(() => {});
                  });
              }
            } else {
              video.pause();
              setIsPlaying(false);
            }
          });
        },
        { threshold: 0.25 }
      );
      observer.observe(video);
    } else {
      video.play().catch(() => {});
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  const toggleSound = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  return (
    <article className="vhs-card">
      {/* Dominant Video Frame with Autoplay Preview */}
      <div
        className="vhs-media-wrap"
        onClick={() => onPlayModal(item)}
        role="button"
        tabIndex={0}
        aria-label={`Watch full video of ${item.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPlayModal(item);
          }
        }}
      >
        <video
          ref={videoRef}
          src={item.videoUrl}
          poster={item.fallbackPoster || item.poster}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          className="vhs-video-elem"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Cinematic Vignette Overlay */}
        <div className="vhs-media-overlay" />

        {/* Top Floating Badges & Audio Control */}
        <div className="vhs-media-top">
          <div className="vhs-top-badges-left">
            <span className="vhs-badge-tag">{item.badge}</span>
          </div>

          <div className="vhs-top-controls-right">
            <button
              type="button"
              onClick={toggleSound}
              className={`vhs-sound-btn ${!isMuted ? 'is-unmuted' : ''}`}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              title={isMuted ? "Tap for Sound" : "Mute Sound"}
            >
              {!isMuted ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Play Icon shown when paused */}
        {!isPlaying && (
          <div className="vhs-play-btn-circle" aria-hidden="true" onClick={togglePlay}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}

        {/* Sleek Floating Bottom Bar: Live Setup & Get Quote (No Price) */}
        <div className="vhs-card-overlay-bottom">
          <div className="vhs-card-footer">
            <div className="vhs-info-box">
              <span className="vhs-info-tag">{item.tag}</span>
              <span className="vhs-info-setup">{item.setup}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuoteModal(item);
              }}
              className="vhs-quote-btn"
            >
              <span>Get Quote</span>
              <span className="vhs-arrow-icon">→</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function VideoGridSection({ city, category, className = "" } = {}) {
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
    window.addEventListener('resize', checkScroll, { passive: true });
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
      const minP = parseInt(item.price.replace(/\D/g, '') || '6999', 10);
      const maxP = parseInt(item.regularPrice?.replace(/\D/g, '') || '', 10) || null;
      window.dispatchEvent(
        new CustomEvent('open-contact-modal', {
          detail: {
            type: 'booking',
            artist: {
              name: item.title,
              category: item.category,
              price_min: minP,
              price_max: maxP
            }
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
    <section className={`video-horizontal-section hp-shell hp-block ${className}`} aria-label="Experience the Vibe">
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
            {city 
              ? `Watch real live clips from house parties, birthdays, and luxury celebrations in ${city} & across India.`
              : `Watch real live clips from house parties, birthdays, and luxury celebrations across Delhi & NCR.`}
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
            <VibeVideoCard
              key={item.id}
              item={item}
              onPlayModal={playVideo}
              onQuoteModal={openQuoteModal}
            />
          ))}
        </div>
      </div>

      {/* Video Modal Player */}
      <VideoModal
        isOpen={Boolean(selectedVideo)}
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </section>
  );
}
