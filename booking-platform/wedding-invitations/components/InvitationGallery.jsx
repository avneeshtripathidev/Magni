'use client';

import React, { useState, useMemo } from 'react';
import { X, Send, MapPin, Sparkles, Video, Smartphone, Clock, Check, Eye } from 'lucide-react';
import DesignCategories from './DesignCategories';
import InvitationCard, { InvitationArtwork } from './InvitationCard';
import { INVITATION_DESIGNS } from '../data/invitationDesigns';

export default function InvitationGallery({ onSelectDesign, initialCategory = 'all' }) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [previewDesign, setPreviewDesign] = useState(null);

  const filteredDesigns = useMemo(() => {
    if (activeCategory === 'all') return INVITATION_DESIGNS;
    return INVITATION_DESIGNS.filter(
      (d) => d.category === activeCategory || d.categoryName.toLowerCase().includes(activeCategory.replace(/-/g, ' '))
    );
  }, [activeCategory]);

  const handleOrderFromPreview = () => {
    if (previewDesign && onSelectDesign) {
      onSelectDesign(previewDesign);
      setPreviewDesign(null);
    }
  };

  return (
    <section id="gallery" style={{ padding: '40px 0 60px' }}>
      <div className="wedding-container">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="wedding-badge-gold">Curated Collection</div>
          <h2 className="wedding-title-gold" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', marginTop: '12px' }}>
            Invitation Design Gallery
          </h2>
          <p className="wedding-subtitle">
            Explore bespoke invitation cards, animated WhatsApp reels, and royal wedding suites tailored to every culture and ceremony.
          </p>
        </div>

        <DesignCategories 
          activeCategory={activeCategory} 
          onSelectCategory={setActiveCategory} 
        />

        <div className="wedding-gallery-grid">
          {filteredDesigns.map((design) => (
            <InvitationCard
              key={design.id}
              design={design}
              onSelectDesign={onSelectDesign}
              onPreviewDesign={setPreviewDesign}
            />
          ))}
        </div>

        {filteredDesigns.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
            <p style={{ color: 'rgba(248, 235, 232, 0.7)' }}>No designs found in this category yet. Custom designs are crafted on demand!</p>
            <button 
              type="button" 
              onClick={() => onSelectDesign && onSelectDesign({ name: 'Custom Design', categoryName: 'Custom' })}
              className="wedding-btn-primary" 
              style={{ marginTop: '14px' }}
            >
              Request Custom Design
            </button>
          </div>
        )}
      </div>

      {/* High-Resolution Sample Preview Lightbox Modal */}
      {previewDesign && (
        <div className="wedding-modal-backdrop" onClick={() => setPreviewDesign(null)}>
          <div 
            className="wedding-modal-box wedding-preview-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px' }}
          >
            <button 
              type="button" 
              className="wedding-modal-close" 
              onClick={() => setPreviewDesign(null)}
              aria-label="Close preview"
            >
              <X size={20} />
            </button>

            <div className="wedding-preview-modal-grid">
              {/* Left / Top: Enlarged Card Canvas */}
              <div className="wedding-preview-art-col">
                <div className="wedding-card-render-wrapper modal-scale">
                  <InvitationArtwork design={previewDesign} />
                </div>
              </div>

              {/* Right / Bottom: Specifications & Quick Order */}
              <div className="wedding-preview-details-col">
                <div className="wedding-preview-badge">
                  <Sparkles size={12} color="#D4AF37" /> {previewDesign.tag || 'Luxury Invitation'}
                </div>
                <h3 className="wedding-preview-title">{previewDesign.name}</h3>
                <div className="wedding-preview-cat">{previewDesign.categoryName}</div>

                <div className="wedding-preview-price-box">
                  <span className="price-lbl">Starting from</span>
                  <span className="price-val">{previewDesign.startingPrice || '₹1,499'}</span>
                  <span className="price-note">· Unlimited revisions</span>
                </div>

                <div className="wedding-preview-specs">
                  <div className="spec-row">
                    <span className="spec-icon"><Clock size={14} /></span>
                    <div>
                      <div className="spec-name">Delivery Speed</div>
                      <div className="spec-val">{previewDesign.deliveryTime || '24 Hours Express'}</div>
                    </div>
                  </div>
                  <div className="spec-row">
                    <span className="spec-icon"><Smartphone size={14} /></span>
                    <div>
                      <div className="spec-name">Formats Provided</div>
                      <div className="spec-val">WhatsApp JPG, Interactive PDF, 300 DPI Vector</div>
                    </div>
                  </div>
                  <div className="spec-row">
                    <span className="spec-icon"><MapPin size={14} /></span>
                    <div>
                      <div className="spec-name">Google Maps Venue Link</div>
                      <div className="spec-val">1-Click navigation link integrated for guests</div>
                    </div>
                  </div>
                </div>

                <div className="wedding-preview-palette-section">
                  <span className="palette-label">Color Palette:</span>
                  <div className="palette-swatches">
                    {previewDesign.palette.map((c, i) => (
                      <span key={i} className="preview-swatch" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOrderFromPreview}
                  className="wedding-btn-primary"
                  style={{ width: '100%', marginTop: '18px', padding: '13px', fontSize: '1rem' }}
                >
                  Customize This Design <Send size={15} />
                </button>
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(248,235,232,0.6)', marginTop: '8px' }}>
                  ⚡ Free consultation on WhatsApp · 100% money-back guarantee
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
