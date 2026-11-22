'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import WeddingHero from '../components/WeddingHero';
import InvitationGallery from '../components/InvitationGallery';
import WeddingServices from '../components/WeddingServices';
import HowItWorks from '../components/HowItWorks';
import WhyChooseUs from '../components/WhyChooseUs';
import PricingSection from '../components/PricingSection';
import WeddingFAQ from '../components/WeddingFAQ';
import WeddingInquiryForm from '../components/WeddingInquiryForm';
import { ArrowRight, Sparkles, MessageCircle, PhoneCall } from 'lucide-react';
import '../styles/wedding-invitations.css';

export default function WeddingInvitationsView({
  h1Title,
  subtitle,
  initialCategory = 'all',
  pageSlug = 'wedding-invitations',
  customFaq = null,
  structuredData = null,
}) {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryModalData, setInquiryModalData] = useState(null);

  const handleOpenInquiry = (data = null) => {
    setInquiryModalData(data);
    setInquiryModalOpen(true);
  };

  const handleCloseInquiry = () => {
    setInquiryModalOpen(false);
    setInquiryModalData(null);
  };

  return (
    <div className="wedding-suite-root">
      {/* Background ambient lighting */}
      <div className="wedding-bg-radial" aria-hidden="true" />

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      {/* Hero Section */}
      <WeddingHero onOpenInquiry={handleOpenInquiry} />

      {/* Secondary Custom Headline if provided for sub-routes */}
      {h1Title && (
        <div className="wedding-container" style={{ textAlign: 'center', marginTop: '10px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '16px', padding: '18px 20px', maxWidth: '820px', margin: '0 auto' }}>
            <h2 className="wedding-title-gold" style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2rem)', margin: '0 0 6px' }}>
              {h1Title}
            </h2>
            {subtitle && (
              <p style={{ color: 'rgba(248, 235, 232, 0.78)', fontSize: '0.92rem', margin: 0 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Invitation Gallery */}
      <InvitationGallery 
        onSelectDesign={handleOpenInquiry} 
        initialCategory={initialCategory} 
      />

      {/* Our Services */}
      <WeddingServices onOpenInquiry={handleOpenInquiry} />

      {/* How It Works */}
      <HowItWorks />

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Pricing Section */}
      <PricingSection onOpenInquiry={handleOpenInquiry} />

      {/* Mid-Page Call To Action Section */}
      <section style={{ padding: '60px 0', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
        <div className="wedding-container" style={{ textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(38, 26, 31, 0.9) 0%, rgba(20, 15, 18, 0.95) 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.45)',
            borderRadius: '24px',
            padding: '48px 24px',
            maxWidth: '920px',
            margin: '0 auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(212,175,55,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div className="wedding-badge-gold" style={{ marginBottom: '14px' }}>
              <Sparkles size={14} /> Bespoke Wedding Design Service
            </div>
            <h2 className="wedding-title-gold" style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.8rem)', margin: '0 0 14px' }}>
              Let's Create an Invitation Worth Remembering
            </h2>
            <p className="wedding-subtitle" style={{ marginBottom: '28px', maxWidth: '620px' }}>
              Whether you need an instant WhatsApp Save The Date or a grand royal video invitation suite, our artists are ready to bring your dream wedding announcement to life.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleOpenInquiry({ type: 'Custom Wedding Invitation' })}
                className="wedding-btn-primary"
                style={{ fontSize: '1rem', padding: '16px 32px' }}
              >
                Get Your Custom Wedding Invitation <ArrowRight size={16} />
              </button>
              <a
                href="https://wa.me/918076515257?text=Hello%20Magnevents!%20I%20would%20like%20to%20inquire%20about%20custom%20wedding%20invitation%20card%20design."
                target="_blank"
                rel="noopener noreferrer"
                className="wedding-btn-secondary"
                style={{ fontSize: '1rem', padding: '16px 24px', borderColor: '#25D366', color: '#FAF7F2' }}
              >
                <MessageCircle size={18} style={{ color: '#25D366' }} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <WeddingFAQ />

      {/* Interactive Modal Form */}
      <WeddingInquiryForm
        isOpen={inquiryModalOpen}
        onClose={handleCloseInquiry}
        initialData={inquiryModalData}
      />
    </div>
  );
}
