"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/app/styles/components/SEODynamicContent.css';

export default function SEODynamicContent({ category, city, overviewHtml, faqs, relatedLinks }) {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="seo-dynamic-content">
      <div className="seo-dynamic-container">
        
        {/* Overview Section */}
        {overviewHtml && (
          <section className="seo-overview-card">
            <span className="seo-section-tag">
              👑 LOCAL INSIGHTS &amp; GUIDE
            </span>
            <h2 className="seo-overview-title">
              About Hiring a {category} in {city}
            </h2>
            <div 
              className="seo-overview-body"
              dangerouslySetInnerHTML={{ __html: overviewHtml }} 
            />
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
                Frequently Asked Questions
              </h2>
            </div>
            <div className="seo-faqs-list">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className={`seo-faq-item ${openFaq === idx ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="seo-faq-trigger"
                    aria-expanded={openFaq === idx}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={20} className="seo-faq-chevron" />
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="seo-faq-content">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Searches */}
        {relatedLinks && relatedLinks.length > 0 && (
          <section className="seo-related-wrap">
            <h2 className="seo-related-title">
              Related Searches in {city}
            </h2>
            <div className="seo-related-pills">
              {relatedLinks.map((link, idx) => (
                <Link 
                  key={idx} 
                  href={link.url} 
                  className="seo-related-chip"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
