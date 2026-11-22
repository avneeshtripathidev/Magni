'use client';

import React, { useState, useMemo } from 'react';
import DesignCategories from './DesignCategories';
import InvitationCard from './InvitationCard';
import { INVITATION_DESIGNS } from '../data/invitationDesigns';

export default function InvitationGallery({ onSelectDesign, initialCategory = 'all' }) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const filteredDesigns = useMemo(() => {
    if (activeCategory === 'all') return INVITATION_DESIGNS;
    return INVITATION_DESIGNS.filter(
      (d) => d.category === activeCategory || d.categoryName.toLowerCase().includes(activeCategory.replace(/-/g, ' '))
    );
  }, [activeCategory]);

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
    </section>
  );
}
