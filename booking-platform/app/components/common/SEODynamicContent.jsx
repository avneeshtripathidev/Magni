"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Sparkles, ShieldCheck, Music, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/app/styles/components/SEODynamicContent.css';

export default function SEODynamicContent({ category, city, overviewHtml, faqs, relatedLinks }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  return (
    <div className="seo-dynamic-content">
      <div className="seo-dynamic-container">
        
        {/* Overview Section */}
        {overviewHtml && (
          <section className="seo-overview-card">
            <div className="seo-overview-header-group">
              <span className="seo-section-tag">
                👑 LOCAL INSIGHTS &amp; GUIDE
              </span>
              <h2 className="seo-overview-title">
                About Hiring a <span className="lux-gold-gradient">{category}</span> in {city}
              </h2>
            </div>

            {/* Visual Highlights Grid (Transforming Text into Visual-First Cards) */}
            <div className="seo-visual-highlights-grid">
              <div className="seo-v-pill">
                <div className="seo-v-icon-wrap">
                  <Music size={20} className="seo-v-icon" />
                </div>
                <div className="seo-v-text">
                  <strong>Top Verified Talent</strong>
                  <span>Authentic stage photos, genuine client ratings &amp; live showreels</span>
                </div>
              </div>

              <div className="seo-v-pill">
                <div className="seo-v-icon-wrap">
                  <Sparkles size={20} className="seo-v-icon" />
                </div>
                <div className="seo-v-text">
                  <strong>Complete Sound &amp; Rider</strong>
                  <span>Club-standard JBL/RCF sound, Pioneer consoles &amp; stage mics</span>
                </div>
              </div>

              <div className="seo-v-pill">
                <div className="seo-v-icon-wrap">
                  <ShieldCheck size={20} className="seo-v-icon" />
                </div>
                <div className="seo-v-text">
                  <strong>100% Arrival Guarantee</strong>
                  <span>Direct artist booking lock with verified standby backup coverage</span>
                </div>
              </div>

              <div className="seo-v-pill">
                <div className="seo-v-icon-wrap">
                  <Zap size={20} className="seo-v-icon" />
                </div>
                <div className="seo-v-text">
                  <strong>Direct Rates on WhatsApp</strong>
                  <span>Zero middleman commission, transparent quotes sent in 5 minutes</span>
                </div>
              </div>
            </div>

            {/* 3-Step Visual Booking Flow Diagram */}
            <div className="seo-visual-flow-card">
              <div className="seo-flow-header">
                <span className="seo-flow-badge">✨ 3-STEP EASY BOOKING</span>
                <h3>How Booking a {category} in {city} Works</h3>
              </div>
              <div className="seo-how-it-works-flow">
                <div className="seo-flow-step">
                  <div className="seo-flow-step-top">
                    <span className="seo-flow-num">1</span>
                    <span className="seo-flow-title">Select Vibe &amp; Date</span>
                  </div>
                  <p>Choose your performer category, event date, and party type in {city}.</p>
                </div>
                <div className="seo-flow-divider">
                  <ArrowRight size={18} />
                </div>
                <div className="seo-flow-step">
                  <div className="seo-flow-step-top">
                    <span className="seo-flow-num">2</span>
                    <span className="seo-flow-title">Instant WhatsApp Quote</span>
                  </div>
                  <p>Receive direct rates, live artist availability, and videos in 5 minutes.</p>
                </div>
                <div className="seo-flow-divider">
                  <ArrowRight size={18} />
                </div>
                <div className="seo-flow-step">
                  <div className="seo-flow-step-top">
                    <span className="seo-flow-num">3</span>
                    <span className="seo-flow-title">Guaranteed Live Show</span>
                  </div>
                  <p>Lock your date with official booking pass, 100% soundcheck &amp; arrival protection.</p>
                </div>
              </div>
            </div>

            {/* Guide Narrative (With Clean Magazine Layout) */}
            <div className="seo-overview-body-container">
              <div className={`seo-overview-body-wrap ${isOverviewExpanded ? 'is-expanded' : ''}`}>
                <div 
                  className="seo-overview-body"
                  dangerouslySetInnerHTML={{ __html: overviewHtml }} 
                />
              </div>
              <button
                type="button"
                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                className="seo-overview-toggle-btn"
              >
                <span>{isOverviewExpanded ? 'Show Less Guide' : 'Read Full Local City Guide'}</span>
                <ChevronDown size={16} className={`seo-toggle-chevron ${isOverviewExpanded ? 'is-rotated' : ''}`} />
              </button>
            </div>
          </section>
        )}

        {/* FAQs Section */}
        {faqs && faqs.length > 0 && (
          <section className="seo-faqs-wrap">
            <div className="seo-faqs-head">
              <span className="seo-section-tag">
                💡 ANSWERS &amp; INFORMATION
              </span>
              <h2 className="seo-faqs-title">
                Frequently Asked Questions about {category}s in {city}
              </h2>
            </div>
            <div className="seo-faqs-list" itemScope itemType="https://schema.org/FAQPage">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className={`seo-faq-item ${openFaq === idx ? 'is-open' : ''}`}
                  itemScope 
                  itemProp="mainEntity" 
                  itemType="https://schema.org/Question"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="seo-faq-trigger"
                    aria-expanded={openFaq === idx}
                  >
                    <span itemProp="name">{faq.question}</span>
                    <ChevronDown size={20} className="seo-faq-chevron" />
                  </button>
                  <div 
                    itemScope 
                    itemProp="acceptedAnswer" 
                    itemType="https://schema.org/Answer"
                    style={{ display: openFaq === idx ? 'block' : 'none' }}
                  >
                    <div className="seo-faq-content" itemProp="text">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Searches */}
        {relatedLinks && relatedLinks.length > 0 && (
          <section className="seo-related-wrap">
            <h2 className="seo-related-title">
              Popular Entertainment Searches in {city}
            </h2>
            <div className="seo-related-pills">
              {relatedLinks.map((link, idx) => (
                <Link 
                  key={idx} 
                  href={link.url} 
                  className="seo-related-chip"
                >
                  <span className="seo-chip-dot" />
                  <span>{link.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
