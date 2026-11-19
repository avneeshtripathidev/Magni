"use client"
import React from 'react'

function PricingCard({ plan, index }) {
  const isPopular = Boolean(plan.popular);

  return (
    <div
      id={typeof index === 'number' ? `pricing-plan-${index}` : undefined}
      className={`pricing-card ${isPopular ? 'is-popular' : ''}`}
    >
      {isPopular && (
        <div className="popular-badge">
          <span className="badge-star">★</span>
          <span>MOST POPULAR CHOICE</span>
        </div>
      )}

      <div className="card-head">
        <div className="card-head-top">
          <span className="card-badge">
            {isPopular ? 'Recommended Package' : 'Verified Magnevents Standard'}
          </span>
        </div>
        <h3 className="card-title">{plan.name}</h3>
        <p className="plan-tagline">{plan.tagline}</p>
      </div>

      <div className="card-price-container">
        <div className="price-top-row">
          <span className="price-status-dot" />
          <span className="price-status-text">All-Inclusive Standard Rate</span>
        </div>
        <div className="price-main-row">
          <span className="price-amount">{plan.price}</span>
          <span className="price-period">/ Event</span>
        </div>
        <p className="price-subtext">Includes verified artist, technical sound setup &amp; soundcheck</p>
      </div>

      <div className="card-features-wrapper">
        <span className="features-label">PACKAGE INCLUSIONS</span>
        <ul className="card-features">
          {plan.features.map((f, i) => (
            <li key={i}>
              <span className="check-icon-circle">
                <svg viewBox="0 0 16 16" fill="none" className="check-svg" aria-hidden="true">
                  <path
                    d="M13.3334 4L6.00008 11.3333L2.66675 8"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="feature-text">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <button 
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('open-contact-modal', { 
          detail: { 
            type: 'booking', 
            pricingPlan: {
              name: plan.name,
              price: plan.price,
              tagline: plan.tagline,
              features: plan.features
            } 
          } 
        }))} 
        className={`card-btn ${isPopular ? 'btn-popular' : 'btn-standard'}`}
      >
        <span>Book Package Now</span>
        <span className="btn-arrow">→</span>
      </button>
    </div>
  )
}

export default React.memo(PricingCard)
