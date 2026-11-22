'use client';

import React from 'react';
import { Search, FileText, MessagesSquare, Sparkles } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: 1,
      icon: <Search size={22} style={{ color: '#D4AF37' }} />,
      title: 'Explore Designs',
      desc: 'Browse our curated portfolio of royal, traditional, floral, and modern digital invitation cards & animated video suites.'
    },
    {
      num: 2,
      icon: <FileText size={22} style={{ color: '#D4AF37' }} />,
      title: 'Submit Requirements',
      desc: 'Select your preferred style, provide couple names, wedding dates, functions, venue locations, and custom preferences.'
    },
    {
      num: 3,
      icon: <MessagesSquare size={22} style={{ color: '#D4AF37' }} />,
      title: 'Discuss With Designers',
      desc: 'Our dedicated wedding design concierge connects on WhatsApp to refine colors, fonts, wording, and event timeline.'
    },
    {
      num: 4,
      icon: <Sparkles size={22} style={{ color: '#D4AF37' }} />,
      title: 'Receive Final Invitation',
      desc: 'Get your WhatsApp-ready mobile invites, clickable venue map links, Full HD MP4 video, and print-ready files.'
    }
  ];

  return (
    <section style={{ padding: '60px 0', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
      <div className="wedding-container">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="wedding-badge-gold">Seamless 4-Step Process</div>
          <h2 className="wedding-title-gold" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', marginTop: '12px' }}>
            How It Works
          </h2>
          <p className="wedding-subtitle">
            From your first design idea to a grand digital reveal for all your guests in four effortless steps.
          </p>
        </div>

        <div className="wedding-flow-row">
          {steps.map((step) => (
            <div key={step.num} className="wedding-flow-step">
              <span className="wedding-step-num">{step.num}</span>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                {step.icon}
              </div>
              <h3 style={{ fontSize: '1.08rem', color: '#FAF7F2', margin: '0 0 8px', fontWeight: '700' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'rgba(248, 235, 232, 0.72)', lineHeight: 1.5, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
