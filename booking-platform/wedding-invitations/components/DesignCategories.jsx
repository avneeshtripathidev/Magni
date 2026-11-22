'use client';

import React from 'react';
import { INVITATION_CATEGORIES } from '../data/invitationCategories';

export default function DesignCategories({ activeCategory, onSelectCategory }) {
  return (
    <div className="wedding-cat-nav-wrapper">
      <div className="wedding-cat-nav" role="tablist" aria-label="Wedding Invitation Categories">
        {INVITATION_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectCategory(cat.id)}
              className={`wedding-cat-btn ${isActive ? 'active' : ''}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              {cat.badge && (
                <span style={{
                  fontSize: '9.5px',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  background: isActive ? '#141012' : 'rgba(212, 175, 55, 0.2)',
                  color: isActive ? '#D4AF37' : '#FAF7F2',
                  fontWeight: '700',
                  marginLeft: '4px'
                }}>
                  {cat.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
