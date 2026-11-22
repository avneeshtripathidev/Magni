'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2, Heart, ShieldCheck, PhoneCall } from 'lucide-react';

export default function WeddingHero({ onOpenInquiry }) {
  return (
    <section className="wedding-hero">
      <div className="wedding-container">
        <div className="wedding-badge-gold">
          <Sparkles size={14} /> Bespoke Wedding Invitations & Digital Suites
        </div>

        <div className="wedding-hero-grid">
          <div className="wedding-hero-left">
            <h1 className="wedding-title-gold" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', lineHeight: 1.18, marginTop: '16px', marginBottom: '16px' }}>
              Beautiful Wedding Invitations, Designed to Make Your Moments Special
            </h1>

            <p className="wedding-subtitle" style={{ margin: '0 0 24px', fontSize: '1.08rem' }}>
              Discover elegant digital and traditional wedding invitations, thoughtfully designed to celebrate your special day. From WhatsApp e-cards to cinematic video invites and royal stationery.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
              <span className="wedding-badge-subtle">
                <CheckCircle2 size={13} style={{ color: '#D4AF37' }} /> 24-48h Express Delivery
              </span>
              <span className="wedding-badge-subtle">
                <CheckCircle2 size={13} style={{ color: '#D4AF37' }} /> Clickable Venue Maps & RSVP
              </span>
              <span className="wedding-badge-subtle">
                <CheckCircle2 size={13} style={{ color: '#D4AF37' }} /> Print-Ready 300 DPI Vector PDF
              </span>
            </div>

            <div className="wedding-hero-actions">
              <a href="#gallery" className="wedding-btn-primary">
                Explore Designs <ArrowRight size={16} />
              </a>
              <button 
                type="button" 
                onClick={() => onOpenInquiry && onOpenInquiry({ type: 'Custom Invitation' })}
                className="wedding-btn-secondary"
              >
                Request a Custom Invitation
              </button>
            </div>
          </div>

          <div className="wedding-hero-right">
            <div className="wedding-hero-mockup-wrapper">
              {/* Floating Pill Top Right */}
              <div className="wedding-hero-floating-pill wedding-floating-top-right">
                <Heart size={15} style={{ color: '#E88943' }} />
                <span>Over 1,200+ Happy Couples</span>
              </div>

              {/* Central Phone Mockup */}
              <div className="wedding-hero-phone-mockup">
                <div className="wedding-mockup-screen">
                  <div className="wedding-mockup-crest">⚜️</div>
                  <div style={{ fontSize: '11px', color: '#D4AF37', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    TOGETHER WITH OUR FAMILIES
                  </div>
                  <h3 className="wedding-mockup-names">Aarav & Meera</h3>
                  <div className="wedding-mockup-date">24 · DECEMBER · 2026</div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(248, 235, 232, 0.75)', lineHeight: 1.4 }}>
                    Taj Palace, New Delhi<br />
                    Cocktails & Royal Sangeet
                  </div>
                  <div className="wedding-mockup-btn">
                    📍 View Google Maps Venue
                  </div>
                </div>
              </div>

              {/* Floating Pill Bottom Left */}
              <div className="wedding-hero-floating-pill wedding-floating-bottom-left">
                <ShieldCheck size={16} style={{ color: '#25D366' }} />
                <span>WhatsApp Ready HD Video & PDF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
