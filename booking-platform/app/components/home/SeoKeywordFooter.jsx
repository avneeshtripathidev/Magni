"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { footerSeoCategories, footerSeoKeywords } from '@/app/constants/seoKeywords';

export default function SeoKeywordFooter() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer className="seo-keyword-footer" aria-label="Popular Search Queries & Event Entertainment Hubs">
      {/* Collapsed state: quick inline preview bar */}
      {!isExpanded && (
        <div 
          className="seo-keyword-container is-collapsed"
          id="seo-keyword-list-collapsed"
        >
          {footerSeoKeywords.slice(0, 20).map((keyword, index) => (
            <React.Fragment key={index}>
              <Link href={`/${keyword.replace(/ /g, '-')}`} className="seo-keyword">
                {keyword}
              </Link>
              {index < 19 && <span className="seo-separator">|</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Expanded state: structured semantic pillars */}
      {isExpanded && (
        <div 
          className="seo-keyword-container is-expanded"
          id="seo-keyword-list-expanded"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '24px 16px', 
            textAlign: 'left', 
            width: '100%', 
            maxWidth: '1360px', 
            padding: '16px 8px 12px' 
          }}
        >
          {footerSeoCategories.map((col, idx) => (
            <div key={idx} className="seo-footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ color: 'var(--color-marigold, #E8B943)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {col.title}
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link href={link.href} className="seo-keyword" style={{ fontSize: '12px', display: 'inline-block' }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="seo-toggle-btn"
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? "seo-keyword-list-expanded" : "seo-keyword-list-collapsed"}
        aria-label={isExpanded ? "Collapse popular searches" : "Expand all popular searches"}
      >
        <span className="seo-toggle-text">
          {isExpanded ? "Show Less" : "Explore Popular Searches & Categories"}
        </span>
        <svg
          className={`seo-toggle-icon ${isExpanded ? 'is-rotated' : ''}`}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </footer>
  );
}
