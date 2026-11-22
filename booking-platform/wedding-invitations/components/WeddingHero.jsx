'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Heart, ShieldCheck, PhoneCall, Send, Loader2, Check } from 'lucide-react';
import { submitWeddingInquiry } from '../services/weddingInquiryService';

export default function WeddingHero({ onOpenInquiry }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    wedding_date: '',
    invitation_type: 'Digital Wedding Card',
    design_category: 'Royal Wedding Invitations',
  });

  const [loading, setLoading] = useState(false);
  const [submittedInquiryId, setSubmittedInquiryId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const res = await submitWeddingInquiry(formData);
    setLoading(false);

    if (res.success) {
      setSubmittedInquiryId(res.inquiryId);
    } else {
      setErrorMsg(res.error || 'Failed to submit. Please try again.');
    }
  };

  return (
    <section className="wedding-hero">
      <div className="wedding-container">
        {/* Top Trust Capsule */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div className="wedding-badge-gold">
            <Sparkles size={14} /> Bespoke Wedding Invitations & Digital Suites
          </div>
        </div>

        <div className="wedding-hero-grid">
          {/* Left Column: Visual Storytelling & Headline */}
          <div className="wedding-hero-left">
            <h1 className="wedding-title-gold" style={{ fontSize: 'clamp(2.1rem, 4.2vw, 3.2rem)', lineHeight: 1.18, margin: '0 0 16px' }}>
              Beautiful Wedding Invitations, Designed to Make Your Moments Special
            </h1>

            <p className="wedding-subtitle" style={{ margin: '0 0 22px', fontSize: '1.05rem', textAlign: 'left' }}>
              Discover elegant digital and traditional wedding invitations, thoughtfully designed to celebrate your special day. From WhatsApp e-cards to cinematic video invites and royal stationery.
            </p>

            {/* Feature Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
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

            {/* Category Quick Tags */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '0.78rem', color: '#D4AF37', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Popular Design Themes:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { label: '👑 Royal Palace Suites', hash: '#gallery' },
                  { label: '📱 WhatsApp Digital Cards', hash: '#gallery' },
                  { label: '🎬 1080p Video Invites', hash: '#gallery' },
                  { label: '🪔 Traditional Patrika', hash: '#gallery' },
                  { label: '🌸 Floral Botanical', hash: '#gallery' },
                ].map((tag, idx) => (
                  <a
                    key={idx}
                    href={tag.hash}
                    style={{
                      fontSize: '0.82rem',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(212,175,55,0.25)',
                      color: 'rgba(248, 235, 232, 0.9)',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tag.label}
                  </a>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="wedding-hero-actions" style={{ marginTop: '0' }}>
              <a href="#gallery" className="wedding-btn-primary">
                Explore Designs <ArrowRight size={16} />
              </a>
              <button
                type="button"
                onClick={() => onOpenInquiry && onOpenInquiry({ type: 'Custom Wedding Invitation' })}
                className="wedding-btn-secondary"
              >
                Request a Custom Invitation
              </button>
            </div>

            {/* Social Proof Strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(212,175,55,0.18)' }}>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#D4AF37' }}>1,200+</span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(248,235,232,0.65)', display: 'block' }}>Suites Delivered</span>
              </div>
              <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#D4AF37' }}>★ 4.9/5</span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(248,235,232,0.65)', display: 'block' }}>Verified Reviews</span>
              </div>
              <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#25D366' }}>100%</span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(248,235,232,0.65)', display: 'block' }}>Satisfaction Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Converting VIP Booking Card */}
          <div className="wedding-hero-right">
            <div className="wedding-hero-booking-card">
              {submittedInquiryId ? (
                <div style={{ textAlign: 'center', padding: '28px 12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.15)', border: '1px solid #25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Check size={30} style={{ color: '#25D366' }} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: '#FAF7F2', margin: '0 0 6px' }}>
                    Inquiry Received!
                  </h3>
                  <p style={{ color: 'rgba(248, 235, 232, 0.75)', fontSize: '0.86rem', margin: '0 0 16px', lineHeight: 1.4 }}>
                    Thank you <strong style={{ color: '#D4AF37' }}>{formData.customer_name}</strong>. Your reference ID is:
                  </p>
                  <div style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid #D4AF37', borderRadius: '8px', padding: '8px 14px', display: 'inline-block', fontWeight: 'bold', color: '#FAF7F2', fontSize: '1rem', letterSpacing: '1px', marginBottom: '18px' }}>
                    {submittedInquiryId}
                  </div>
                  <p style={{ color: 'rgba(248, 235, 232, 0.7)', fontSize: '0.8rem', margin: '0 0 20px' }}>
                    Our design team will send initial design previews to your WhatsApp ({formData.phone}) within 2 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedInquiryId(null)}
                    className="wedding-btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '10px' }}
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#FAF7F2', fontWeight: '600' }}>
                      FROM <strong style={{ color: '#D4AF37', fontSize: '0.95rem' }}>₹1,499*</strong>
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#D4AF37', color: '#141012', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      BEST VALUE
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', color: '#FAF7F2', margin: '0 0 4px', fontWeight: '700' }}>
                    Get Free Design Samples & Quote
                  </h3>
                  <p style={{ color: 'rgba(248, 235, 232, 0.72)', fontSize: '0.82rem', margin: '0 0 18px', lineHeight: 1.4 }}>
                    Personalized previews sent to your WhatsApp in 2 hours.
                  </p>

                  {errorMsg && (
                    <div style={{ background: 'rgba(255, 107, 107, 0.15)', border: '1px solid #FF6B6B', borderRadius: '8px', padding: '8px 12px', color: '#FF8787', fontSize: '0.8rem', marginBottom: '14px' }}>
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleHeroSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <input
                        type="text"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleChange}
                        placeholder="Your Full Name (e.g. Aarav Sharma)"
                        className="wedding-form-input"
                        required
                      />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#D4AF37', fontSize: '0.82rem', fontWeight: '700', pointerEvents: 'none' }}>
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit WhatsApp number"
                        className="wedding-form-input"
                        style={{ paddingLeft: '64px' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <input
                          type="date"
                          name="wedding_date"
                          value={formData.wedding_date}
                          onChange={handleChange}
                          className="wedding-form-input"
                          title="Wedding Date"
                          required
                        />
                      </div>

                      <div>
                        <select
                          name="invitation_type"
                          value={formData.invitation_type}
                          onChange={handleChange}
                          className="wedding-form-select"
                        >
                          <option value="Digital Wedding Card">Digital WhatsApp Card</option>
                          <option value="Wedding Invitation Video">1080p Video Invite</option>
                          <option value="Traditional Wedding Card">Print Patrika</option>
                          <option value="Animated Invitation">Animated Motion Card</option>
                          <option value="Save The Date Card">Save The Date</option>
                          <option value="Complete Wedding Suite">Full Wedding Suite</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="wedding-btn-primary"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '14px' }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          Get Design Previews on WhatsApp <ArrowRight size={15} />
                        </>
                      )}
                    </button>

                    <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(248, 235, 232, 0.55)', marginTop: '4px' }}>
                      🔒 100% Privacy Assured · No Spam Guarantee
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
