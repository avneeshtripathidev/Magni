'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { WEDDING_SERVICES } from '../data/weddingFAQs';

export default function WeddingServices({ onOpenInquiry }) {
  return (
    <section style={{ padding: '60px 0', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
      <div className="wedding-container">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="wedding-badge-gold">Comprehensive Solutions</div>
          <h2 className="wedding-title-gold" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', marginTop: '12px' }}>
            Our Wedding Invitation Services
          </h2>
          <p className="wedding-subtitle">
            From single-day WhatsApp cards to complete multi-function royal video suites and high-resolution print files.
          </p>
        </div>

        <div className="wedding-services-grid">
          {WEDDING_SERVICES.map((srv) => (
            <div key={srv.id} className="wedding-service-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="wedding-service-icon">{srv.icon}</div>
                {srv.badge && (
                  <span className="wedding-badge-subtle" style={{ borderColor: 'rgba(212, 175, 55, 0.35)', color: '#D4AF37' }}>
                    {srv.badge}
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.12rem', color: '#FAF7F2', margin: '0 0 8px', fontWeight: '700' }}>
                {srv.title}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'rgba(248, 235, 232, 0.72)', lineHeight: 1.5, margin: '0 0 16px', flex: 1 }}>
                {srv.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px' }}>
                {srv.features.map((feat, fIdx) => (
                  <span key={fIdx} className="wedding-feat-pill">
                    ✓ {feat}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onOpenInquiry && onOpenInquiry({ type: srv.title })}
                className="wedding-card-action-btn"
                style={{ marginTop: 'auto' }}
              >
                Inquire Service <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
