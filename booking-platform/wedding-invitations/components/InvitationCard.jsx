'use client';

import React from 'react';
import { Send, MapPin, Sparkles } from 'lucide-react';

export default function InvitationCard({ design, onSelectDesign }) {
  return (
    <div className="wedding-card">
      <div className="wedding-card-preview">
        {design.tag && (
          <span className="wedding-card-badge">
            {design.tag}
          </span>
        )}

        <div className="wedding-card-inner-art" style={{ borderColor: `${design.accentColor}55` }}>
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚜️</div>
          <div style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '1.05rem', color: '#FAF7F2', fontWeight: 'bold' }}>
            {design.name.split(' ')[0]} & {design.name.split(' ')[1] || 'Suite'}
          </div>
          <div style={{ fontSize: '10px', color: design.accentColor || '#D4AF37', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px' }}>
            {design.categoryName}
          </div>
        </div>

        {/* Color Palette Indicators */}
        <div className="wedding-card-palette" title="Color Palette">
          {design.palette.map((color, idx) => (
            <span key={idx} className="wedding-color-dot" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>

      <div className="wedding-card-body">
        <div className="wedding-card-format">{design.format}</div>
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
