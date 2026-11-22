'use client';

import React from 'react';
import { Send, Eye, MapPin, Sparkles, Play, Video, Smartphone, Clock, Check } from 'lucide-react';

// Custom visual invitation artwork based on design ID
export function InvitationArtwork({ design }) {
  if (!design) return null;

  switch (design.id) {
    case 'des-01': // Jharokha Heritage Royal Suite
      return (
        <div className="wedding-art-canvas art-jharokha">
          <div className="art-jharokha-arch">
            <div className="art-scallop-top" />
            <div className="art-crest-crown">👑</div>
            <div className="art-heritage-sub">ROYAL VIVAH</div>
            <div className="art-couple-name">Aarav & Meera</div>
            <div className="art-event-date">24 · DECEMBER · 2026</div>
            <div className="art-venue-text">Oberoi Udaivilas · Udaipur</div>
            <div className="art-elephant-procession">
              <span>🐘</span>
              <span className="art-palanquin">🏰</span>
              <span>🐘</span>
            </div>
          </div>
        </div>
      );

    case 'des-02': // Gilded Botanical Rose Garden
      return (
        <div className="wedding-art-canvas art-botanical">
          <div className="art-botanical-border">
            <div className="art-botanical-corner top-left">🌸</div>
            <div className="art-botanical-corner top-right">🌸</div>
            <div className="art-monogram-circle">
              <span className="art-monogram-text">A & M</span>
            </div>
            <div className="art-botanical-script">Together With Their Families</div>
            <div className="art-couple-name dark">Aditi & Rohan</div>
            <div className="art-botanical-leaf">🌿 ✦ 🌿</div>
            <div className="art-event-date dark">SUNDAY · 18 OCTOBER 2026</div>
            <div className="art-venue-text dark">The Rose Garden Estate</div>
            <div className="art-botanical-corner bottom-left">🌸</div>
            <div className="art-botanical-corner bottom-right">🌸</div>
          </div>
        </div>
      );

    case 'des-03': // Vedic Shloka Golden Mandap
      return (
        <div className="wedding-art-canvas art-vedic">
          <div className="art-vedic-frame">
            <div className="art-marigold-toran">🌼 🌼 🌼 🌼 🌼</div>
            <div className="art-ganesha-badge">ॐ</div>
            <div className="art-sanskrit-shloka">॥ श्री गणेशाय नमः ॥</div>
            <div className="art-couple-name">Kavya & Aniket</div>
            <div className="art-shubh-vivah">शुभ विवाह</div>
            <div className="art-event-date">28 · NOVEMBER · 2026</div>
            <div className="art-mandap-base">
              <span>🔔</span>
              <span className="art-kalash">🪔</span>
              <span>🔔</span>
            </div>
          </div>
        </div>
      );

    case 'des-04': // Noor-e-Nikah Arabesque Crest
      return (
        <div className="wedding-art-canvas art-nikah">
          <div className="art-nikah-frame">
            <div className="art-bismillah">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
            <div className="art-crescent-star">🌙</div>
            <div className="art-nikah-title">NIKAH & WALIMA</div>
            <div className="art-couple-name">Zoya & Farhan</div>
            <div className="art-event-date">12 · DECEMBER · 2026</div>
            <div className="art-venue-text">The Taj Palace · New Delhi</div>
            <div className="art-arabesque-base">✦ ⚜ ✦</div>
          </div>
        </div>
      );

    case 'des-05': // Cathedral Arch Grace
      return (
        <div className="wedding-art-canvas art-cathedral">
          <div className="art-cathedral-arch">
            <div className="art-dove-icon">🕊️</div>
            <div className="art-cathedral-sub">HOLY MATRIMONY</div>
            <div className="art-couple-name dark">Grace & David</div>
            <div className="art-scripture">“Two hearts joined in love & faith”</div>
            <div className="art-event-date dark">SATURDAY · 05 DEC 2026</div>
            <div className="art-venue-text dark">St. Paul’s Cathedral & Lawn</div>
            <div className="art-olive-branch">🌿 ✦ 🌿</div>
          </div>
        </div>
      );

    case 'des-06': // Cinematic Royal Symphony Video
      return (
        <div className="wedding-art-canvas art-video-reel">
          <div className="art-video-frame">
            <div className="art-film-header">
              <span className="art-live-indicator">● REC</span>
              <span className="art-timecode">00:01:00</span>
            </div>
            <div className="art-play-pulse">
              <Play size={20} fill="#D4AF37" color="#D4AF37" />
            </div>
            <div className="art-video-title">CINEMATIC STORY INVITE</div>
            <div className="art-couple-name">Rohan & Tanya</div>
            <div className="art-equalizer-bars">
              <span /><span /><span /><span /><span /><span />
            </div>
            <div className="art-audio-note">🎵 With Shehnai & Sitar Audio</div>
          </div>
        </div>
      );

    case 'des-07': // Minimalist Monogram Luxe
      return (
        <div className="wedding-art-canvas art-minimalist">
          <div className="art-minimalist-border">
            <div className="art-minimal-sub">THE WEDDING CELEBRATION OF</div>
            <div className="art-monogram-crest">M ✦ S</div>
            <div className="art-couple-name">Meera & Samir</div>
            <div className="art-minimal-line" />
            <div className="art-event-date">14 · NOVEMBER · 2026</div>
            <div className="art-venue-text">THE LODHI · NEW DELHI</div>
          </div>
        </div>
      );

    case 'des-08': // Genda Phool Haldi Fiesta
      return (
        <div className="wedding-art-canvas art-haldi">
          <div className="art-haldi-frame">
            <div className="art-genda-garlands">🌼 🌺 🌼 🌺 🌼</div>
            <div className="art-haldi-badge">DHOLAK & DHAMAKA</div>
            <div className="art-couple-name dark">Pooja & Varun</div>
            <div className="art-haldi-sub">Auspicious Haldi & Mehendi</div>
            <div className="art-dholak-icon">🪘 🎵 🪘</div>
            <div className="art-event-date dark">11:00 AM · YELLOW ATTIRE</div>
          </div>
        </div>
      );

    case 'des-09': // Starlit Midnight Gala Reception
      return (
        <div className="wedding-art-canvas art-gala">
          <div className="art-gala-frame">
            <div className="art-star-cluster">✨ ★ ✨</div>
            <div className="art-gala-header">RECEPTION GALA</div>
            <div className="art-couple-name">Vikram & Shreya</div>
            <div className="art-champagne-toast">🥂</div>
            <div className="art-gala-sub">Cocktails, Dinner & Dancing</div>
            <div className="art-event-date">08 · DECEMBER · 2026</div>
            <div className="art-venue-text">Grand Hyatt Ballrooms</div>
          </div>
        </div>
      );

    case 'des-10': // Love Story Save The Date Calendar
      return (
        <div className="wedding-art-canvas art-save-date">
          <div className="art-calendar-card">
            <div className="art-paperclip">📎</div>
            <div className="art-std-title">SAVE OUR DATE</div>
            <div className="art-couple-name dark">Rhea & Kabir</div>
            <div className="art-mini-calendar">
              <div className="art-cal-month">DECEMBER 2026</div>
              <div className="art-cal-days">
                <span>21</span><span>22</span><span>23</span>
                <span className="art-cal-circled">24</span>
                <span>25</span><span>26</span>
              </div>
            </div>
            <div className="art-venue-text dark">Formal Invitation to Follow</div>
          </div>
        </div>
      );

    case 'des-11': // Sparkling Solitaire Ring Ceremony
      return (
        <div className="wedding-art-canvas art-engagement">
          <div className="art-ring-frame">
            <div className="art-diamond-flare">💍</div>
            <div className="art-ring-sub">SAGAI & RING CEREMONY</div>
            <div className="art-couple-name">Sneha & Rahul</div>
            <div className="art-ring-quote">“Two Rings · One Eternal Promise”</div>
            <div className="art-event-date">16 · NOVEMBER · 2026</div>
            <div className="art-venue-text">ITC Maurya · New Delhi</div>
          </div>
        </div>
      );

    case 'des-12': // Rajwada Silk Scroll (Patrika)
    default:
      return (
        <div className="wedding-art-canvas art-patrika">
          <div className="art-scroll-roller top">
            <span className="art-finial left">⚜</span>
            <span className="art-scroll-rod" />
            <span className="art-finial right">⚜</span>
          </div>
          <div className="art-scroll-body">
            <div className="art-peacock-icon">🪶</div>
            <div className="art-patrika-sub">॥ शुभ लग्न पत्रिका ॥</div>
            <div className="art-couple-name dark">Suryavansh & Padmini</div>
            <div className="art-patrika-text">पारंपरिक कुलदेवी आशीर्वाद पत्रिका</div>
            <div className="art-event-date dark">मार्गशीर्ष शुक्ल पक्ष · संवत् २०८३</div>
          </div>
          <div className="art-scroll-roller bottom">
            <span className="art-finial left">⚜</span>
            <span className="art-scroll-rod" />
            <span className="art-finial right">⚜</span>
          </div>
        </div>
      );
  }
}

export default function InvitationCard({ design, onSelectDesign, onPreviewDesign }) {
  const isVideo = design.category === 'video-invitations' || design.format.toLowerCase().includes('video');

  const handleCardClick = () => {
    if (onPreviewDesign) {
      onPreviewDesign(design);
    } else if (onSelectDesign) {
      onSelectDesign(design);
    }
  };

  const handleOrderClick = (e) => {
    e.stopPropagation();
    if (onSelectDesign) {
      onSelectDesign(design);
    }
  };

  const handlePreviewClick = (e) => {
    e.stopPropagation();
    if (onPreviewDesign) {
      onPreviewDesign(design);
    } else if (onSelectDesign) {
      onSelectDesign(design);
    }
  };

  return (
    <div className="wedding-card" onClick={handleCardClick} role="button" tabIndex={0}>
      {/* 1. Realistic Invitation Preview Stage */}
      <div className="wedding-card-preview-stage">
        {design.tag && (
          <div className="wedding-card-floating-badge" style={{ borderColor: `${design.accentColor}88` }}>
            <Sparkles size={11} color={design.accentColor || '#D4AF37'} /> {design.tag}
          </div>
        )}

        {/* Hover Quick View Overlay */}
        <div className="wedding-card-hover-overlay">
          <button 
            type="button" 
            onClick={handlePreviewClick}
            className="wedding-hover-view-btn"
          >
            <Eye size={15} /> Quick Preview
          </button>
        </div>

        {/* The Crafted Invitation Card Artwork */}
        <div className="wedding-card-render-wrapper">
          <InvitationArtwork design={design} />
        </div>

        {/* Floating Quick Feature Tag at Preview Bottom */}
        <div className="wedding-card-stage-footer">
          {isVideo ? (
            <span className="wedding-stage-pill video-pill">
              <Video size={11} /> 1080p MP4 Video
            </span>
          ) : (
            <span className="wedding-stage-pill map-pill">
              <MapPin size={11} /> Clickable Venue Map
            </span>
          )}

          <div className="wedding-card-palette-dots" title="Color Palette">
            {design.palette.map((color, idx) => (
              <span key={idx} className="wedding-palette-dot" style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
      </div>

      {/* 2. Clean, Visual Card Body */}
      <div className="wedding-card-info-box">
        <div className="wedding-card-top-row">
          <div className="wedding-card-format-pill">
            {isVideo ? <Video size={12} /> : <Smartphone size={12} />}
            <span>{design.format.split('+')[0].trim()}</span>
          </div>
          <div className="wedding-card-price-tag">
            <span className="price-label">From</span>
            <span className="price-value">{design.startingPrice || '₹1,499'}</span>
          </div>
        </div>

        <h3 className="wedding-card-title">{design.name}</h3>
        <p className="wedding-card-subtitle">{design.subtitle || design.description}</p>

        {/* Visual Feature Micro-Pills */}
        <div className="wedding-card-micro-tags">
          <span className="micro-tag">
            <Clock size={11} /> {design.deliveryTime || '24h Delivery'}
          </span>
          <span className="micro-tag">
            <Smartphone size={11} /> WhatsApp Ready
          </span>
          <span className="micro-tag">
            <Sparkles size={11} /> 100% Custom
          </span>
        </div>

        {/* Dual Actions: Quick Preview & Order Now */}
        <div className="wedding-card-actions-grid">
          <button
            type="button"
            onClick={handlePreviewClick}
            className="wedding-card-btn-secondary"
            title="View Sample Preview"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            type="button"
            onClick={handleOrderClick}
            className="wedding-card-btn-primary"
          >
            Get Design <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
