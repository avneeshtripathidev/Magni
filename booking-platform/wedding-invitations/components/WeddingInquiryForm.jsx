'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Send, Loader2, Sparkles, PhoneCall } from 'lucide-react';
import { submitWeddingInquiry } from '../services/weddingInquiryService';
import { INVITATION_CATEGORIES } from '../data/invitationCategories';

export default function WeddingInquiryForm({ initialData = null, isOpen = false, onClose = null, isEmbedded = false }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    wedding_date: '',
    invitation_type: 'Digital Wedding Card',
    design_category: 'Royal Wedding Invitations',
    budget: '₹1,500 - ₹3,500',
    requirements: '',
    reference_url: '',
    selected_design_name: '',
  });

  const [loading, setLoading] = useState(false);
  const [submittedInquiryId, setSubmittedInquiryId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        invitation_type: initialData.type || prev.invitation_type,
        design_category: initialData.categoryName || prev.design_category,
        budget: initialData.budget || prev.budget,
        selected_design_name: initialData.name || prev.selected_design_name,
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setValidationErrors({});

    const res = await submitWeddingInquiry(formData);
    setLoading(false);

    if (res.success) {
      setSubmittedInquiryId(res.inquiryId);
    } else {
      if (res.validationErrors) {
        setValidationErrors(res.validationErrors);
      }
      setErrorMessage(res.error || 'Failed to submit inquiry. Please try again.');
    }
  };

  const handleReset = () => {
    setSubmittedInquiryId(null);
    setFormData({
      customer_name: '',
      phone: '',
      whatsapp: '',
      email: '',
      wedding_date: '',
      invitation_type: 'Digital Wedding Card',
      design_category: 'Royal Wedding Invitations',
      budget: '₹1,500 - ₹3,500',
      requirements: '',
      reference_url: '',
      selected_design_name: '',
    });
    if (onClose) onClose();
  };

  const formContent = (
    <div className={isEmbedded ? '' : 'wedding-modal-box'}>
      {!isEmbedded && onClose && (
        <button type="button" onClick={onClose} className="wedding-modal-close" aria-label="Close dialog">
          <X size={18} />
        </button>
      )}

      {submittedInquiryId ? (
        <div style={{ textAlign: 'center', padding: '24px 8px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.15)', border: '1px solid #25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={36} style={{ color: '#25D366' }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: '#FAF7F2', margin: '0 0 8px' }}>
            Inquiry Submitted Successfully!
          </h3>
          <p style={{ color: 'rgba(248, 235, 232, 0.78)', fontSize: '0.92rem', lineHeight: 1.5, maxWidth: '420px', margin: '0 auto 18px' }}>
            Thank you, <strong style={{ color: '#D4AF37' }}>{formData.customer_name}</strong>! Your wedding invitation inquiry has been created under reference:
          </p>
          <div style={{ background: 'rgba(212, 175, 55, 0.12)', border: '1px solid #D4AF37', borderRadius: '8px', padding: '10px 16px', display: 'inline-block', fontWeight: 'bold', color: '#FAF7F2', fontSize: '1.1rem', letterSpacing: '1px', marginBottom: '20px' }}>
            {submittedInquiryId}
          </div>
          <p style={{ color: 'rgba(248, 235, 232, 0.7)', fontSize: '0.84rem', margin: '0 0 24px' }}>
            Our wedding design coordinator will reach you directly on WhatsApp ({formData.phone}) within 2 hours with initial sample previews.
          </p>
          <button type="button" onClick={handleReset} className="wedding-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Done / Close
          </button>
        </div>
      ) : (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div className="wedding-badge-gold">
              <Sparkles size={13} /> Instant Design Preview
            </div>
            <h3 style={{ fontSize: '1.3rem', color: '#FAF7F2', margin: '8px 0 6px', fontWeight: '700' }}>
              {formData.selected_design_name ? `Request: ${formData.selected_design_name}` : "Custom Wedding Invitation Suite"}
            </h3>
            <p style={{ color: 'rgba(248, 235, 232, 0.72)', fontSize: '0.84rem', margin: 0, lineHeight: 1.45 }}>
              Enter your WhatsApp number to receive preview drafts, video samples &amp; pricing directly on WhatsApp.
            </p>
          </div>

          {errorMessage && (
            <div style={{ background: 'rgba(255, 107, 107, 0.12)', border: '1px solid #FF6B6B', borderRadius: '8px', padding: '10px 14px', color: '#FF8787', fontSize: '0.84rem', marginBottom: '16px' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Primary Phone Number Field */}
            <div className="wedding-form-group">
              <label className="wedding-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>WhatsApp / Mobile Number *</span>
                <span style={{ color: '#25D366', fontSize: '0.76rem', fontWeight: 'bold' }}>Instant Samples via WhatsApp</span>
              </label>
              <div className="wedding-phone-input-wrap">
                <span className="wedding-phone-prefix">🇮🇳 +91</span>
                <input
                  type="tel"
                  name="phone"
                  autoFocus
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit mobile number"
                  className="wedding-phone-input"
                  required
                  maxLength={10}
                />
              </div>
              {validationErrors.phone && <div className="wedding-form-error">{validationErrors.phone}</div>}
            </div>

            {/* Optional Couple / Host Name Field */}
            <div className="wedding-form-group" style={{ marginBottom: '14px' }}>
              <label className="wedding-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Your Name</span>
                <span style={{ fontSize: '0.74rem', opacity: 0.6, fontWeight: 'normal' }}>Optional</span>
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="e.g. Aarav / Neha"
                className="wedding-form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="wedding-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '14px 20px', fontSize: '0.98rem', fontWeight: '700' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Preparing Previews...
                </>
              ) : (
                <>
                  Get Previews &amp; Pricing on WhatsApp <Send size={15} />
                </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '14px', color: 'rgba(248, 235, 232, 0.55)', fontSize: '0.76rem' }}>
              <span>🔒 100% Privacy</span>
              <span>•</span>
              <span>⚡ Fast 5-Min Response</span>
              <span>•</span>
              <span>✨ No Spam</span>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return formContent;
  }

  if (!isOpen) return null;

  return (
    <div className="wedding-modal-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        {formContent}
      </div>
    </div>
  );
}
