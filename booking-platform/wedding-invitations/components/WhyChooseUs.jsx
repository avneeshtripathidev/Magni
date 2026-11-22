'use client';

import React from 'react';
import { Palette, Award, Layers, UserCheck, MessageSquareQuote, ShieldCheck } from 'lucide-react';

export default function WhyChooseUs() {
  const perks = [
    {
      icon: <Palette size={22} style={{ color: '#D4AF37' }} />,
      title: 'Bespoke Custom Designs',
      desc: 'Each card is tailored to your couple story, wedding theme colors, and exact ceremony traditions.'
    },
    {
      icon: <Award size={22} style={{ color: '#D4AF37' }} />,
      title: 'Professional Graphic Artists',
      desc: 'Crafted by experienced designers specializing in luxury Indian wedding stationery and typography.'
    },
    {
      icon: <Layers size={22} style={{ color: '#D4AF37' }} />,
      title: 'Multiple Design Styles',
      desc: 'From royal palace aesthetics and Vedic shlokas to modern chic minimalist and floral garden themes.'
    },
    {
      icon: <UserCheck size={22} style={{ color: '#D4AF37' }} />,
      title: 'Personalized Invitations',
      desc: 'Integrate family names, couple portraits, personalized dress codes, and custom cultural blessings.'
    },
    {
      icon: <MessageSquareQuote size={22} style={{ color: '#D4AF37' }} />,
      title: 'Easy WhatsApp Communication',
      desc: 'Direct, fast communication with your dedicated design coordinator for quick revisions and approvals.'
    },
    {
      icon: <ShieldCheck size={22} style={{ color: '#D4AF37' }} />,
      title: 'Quality Deliverables',
      desc: 'Ultra-crisp WhatsApp images, interactive PDF with Google Maps, 1080p MP4 videos, and 300 DPI print files.'
    }
  ];

  return (
    <section style={{ padding: '60px 0', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
      <div className="wedding-container">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="wedding-badge-gold">Our Excellence Guarantee</div>
          <h2 className="wedding-title-gold" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', marginTop: '12px' }}>
            Why Choose Magnevents Wedding Studio
          </h2>
          <p className="wedding-subtitle">
            Reliable timelines, premium visual standards, and personalized service you can genuinely count on.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '28px' }}>
          {perks.map((p, idx) => (
            <div key={idx} style={{
              background: 'rgba(28, 22, 25, 0.65)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: '16px',
              padding: '22px 20px',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {p.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: '#FAF7F2', margin: '0 0 6px', fontWeight: '700' }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'rgba(248, 235, 232, 0.72)', lineHeight: 1.5, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
