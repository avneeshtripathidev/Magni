'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { WEDDING_FAQS } from '../data/weddingFAQs';

export default function WeddingFAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" style={{ padding: '60px 0', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
      <div className="wedding-container" style={{ maxWidth: '840px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="wedding-badge-gold">
            <HelpCircle size={13} /> Common Questions
          </div>
          <h2 className="wedding-title-gold" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', marginTop: '12px' }}>
            Frequently Asked Questions
          </h2>
          <p className="wedding-subtitle">
            Everything you need to know about formats, delivery timelines, customization, and WhatsApp RSVP integration.
          </p>
        </div>

        <div>
          {WEDDING_FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="wedding-faq-item">
                <div 
                  className="wedding-faq-question" 
                  onClick={() => toggle(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(idx); }}
                >
                  <span style={{ paddingRight: '16px' }}>{faq.question}</span>
                  <span style={{ color: '#D4AF37', flexShrink: 0 }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </div>
                {isOpen && (
                  <div className="wedding-faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
