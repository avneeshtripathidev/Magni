'use client';

import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { WEDDING_PRICING } from '../data/weddingFAQs';

export default function PricingSection({ onOpenInquiry }) {
  return (
    <section id="pricing" style={{ padding: '60px 0', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
      <div className="wedding-container">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="wedding-badge-gold">Transparent Packages</div>
          <h2 className="wedding-title-gold" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', marginTop: '12px' }}>
            Wedding Invitation Pricing
          </h2>
          <p className="wedding-subtitle">
            All-inclusive transparent pricing with zero hidden charges. Select a package to start your bespoke invitation suite.
          </p>
        </div>

        <div className="wedding-pricing-grid">
          {WEDDING_PRICING.map((pkg) => (
            <div key={pkg.id} className={`wedding-pricing-card ${pkg.isPopular ? 'featured' : ''}`}>
              {pkg.isPopular && (
                <div className="wedding-featured-tag">
                  ★ {pkg.tag}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {pkg.tag}
                </span>
                <h3 style={{ fontSize: '1.25rem', color: '#FAF7F2', margin: '4px 0 10px', fontWeight: '700' }}>
                  {pkg.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: '#FAF7F2' }}>
                    {pkg.price}
                  </span>
                  <span style={{ fontSize: '1.05rem', color: 'rgba(248, 235, 232, 0.45)', textDecoration: 'line-through' }}>
                    {pkg.originalPrice}
                  </span>
                  <span style={{ fontSize: '0.78rem', background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                    {pkg.discount}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'rgba(248, 235, 232, 0.72)', lineHeight: 1.45, marginTop: '8px' }}>
                  {pkg.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)', paddingTop: '16px', marginBottom: '24px', flex: 1 }}>
                <div style={{ fontSize: '0.78rem', color: '#D4AF37', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>
                  What's Included:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.84rem', color: 'rgba(248, 235, 232, 0.88)' }}>
                      <Check size={14} style={{ color: '#D4AF37', flexShrink: 0, marginTop: '3px' }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onOpenInquiry && onOpenInquiry({ type: pkg.title, budget: pkg.price })}
                className={pkg.isPopular ? 'wedding-btn-primary' : 'wedding-card-action-btn'}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {pkg.ctaText} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
