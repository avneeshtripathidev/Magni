'use client';

import React from 'react';
import { Send, MapPin, Sparkles, Play, Video, Smartphone, Printer, Check } from 'lucide-react';

export default function InvitationCard({ design, onSelectDesign }) {
  const isVideo = design.category === 'video-invitations' || design.format.toLowerCase().includes('video');

  return (
    <div className="wedding-card">
      <div className="wedding-card-preview" style={{ background: `radial-gradient(circle at 50% 30%, ${design.accentColor}22 0%, #161013 90%)` }}>
        {design.tag && (
          <span className="wedding-card-badge" style={{ borderColor: `${design.accentColor}66` }}>
            {design.tag}
          </span>
        )}

        {/* Realistic Luxury Invitation Mockup Surface */}
        <div 
          className="wedding-card-inner-art" 
          style={{ 
            borderColor: `${design.accentColor}77`,
            background: `linear-gradient(150deg, #1F171B 0%, #140E11 100%)`
          }}
        >
          {/* Ornate Top Emblem */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: design.accentColor || '#D4AF37' }}>✦</span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(212,175,55,0.15)',
              border: `1px solid ${design.accentColor || '#D4AF37'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px'
            }}>
              ⚜
            </div>
            <span style={{ fontSize: '10px', color: design.accentColor || '#D4AF37' }}>✦</span>
          </div>

          <div style={{ fontSize: '9px', color: design.accentColor || '#D4AF37', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px', fontWeight: '600' }}>
            {design.categoryName.replace('Invitations', '')}
          </div>

          <div style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '1.12rem', color: '#FAF7F2', fontWeight: '700', lineHeight: 1.25 }}>
            {design.name.split(' ').slice(0, 2).join(' ')}
          </div>

          <div style={{ fontSize: '9px', color: 'rgba(248, 235, 232, 0.65)', marginTop: '4px', letterSpacing: '0.05em' }}>
            24 · DECEMBER · 2026
          </div>

          {isVideo ? (
            <div style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: '#D4AF37',
              color: '#141012',
              fontSize: '10px',
              fontWeight: '800'
            }}>
              <Play size={10} fill="#141012" /> Watch Video Reel
            </div>
          ) : (
            <div style={{
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 9px',
              borderRadius: '999px',
              background: 'rgba(212,175,55,0.15)',
              border: `1px solid ${design.accentColor || '#D4AF37'}55`,
              color: '#F5E6CA',
              fontSize: '9.5px',
              fontWeight: '600'
            }}>
              📍 Clickable Maps & RSVP
            </div>
          )}
        </div>

        {/* Color Palette Indicators */}
        <div className="wedding-card-palette" title="Design Color Palette">
          {design.palette.map((color, idx) => (
            <span key={idx} className="wedding-color-dot" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>

      <div className="wedding-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span className="wedding-card-format" style={{ color: design.accentColor || '#D4AF37' }}>
            {design.format}
          </span>
          {isVideo && (
            <span style={{ fontSize: '10px', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
              <Video size={11} /> 1080p
            </span>
          )}
        </div>

        <h3 className="wedding-card-title">{design.name}</h3>
        <p className="wedding-card-desc">{design.description}</p>

        <div className="wedding-card-features-list">
          {design.features.slice(0, 3).map((feat, fIdx) => (
            <span key={fIdx} className="wedding-feat-pill">
              ✓ {feat}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onSelectDesign && onSelectDesign(design)}
          className="wedding-card-action-btn"
        >
          Request This Design <Send size={14} />
        </button>
      </div>
    </div>
  );
}
