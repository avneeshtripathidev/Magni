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
              <Sparkles size={13} /> Custom Design Request
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#FAF7F2', margin: '8px 0 4px', fontWeight: '700' }}>
              {formData.selected_design_name ? `Request: ${formData.selected_design_name}` : "Let's Create an Invitation Worth Remembering"}
            </h3>
            <p style={{ color: 'rgba(248, 235, 232, 0.7)', fontSize: '0.82rem', margin: 0 }}>
              Tell us your celebration details and we will craft a bespoke invitation suite.
            </p>
          </div>

          {errorMessage && (
            <div style={{ background: 'rgba(255, 107, 107, 0.12)', border: '1px solid #FF6B6B', borderRadius: '8px', padding: '10px 14px', color: '#FF8787', fontSize: '0.84rem', marginBottom: '16px' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="wedding-form-group">
              <label className="wedding-form-label">Full Name *</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="e.g. Aarav Sharma"
                className="wedding-form-input"
                required
              />
              {validationErrors.customer_name && <div className="wedding-form-error">{validationErrors.customer_name}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="wedding-form-group">
                <label className="wedding-form-label">Phone / WhatsApp Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile"
                  className="wedding-form-input"
                  required
                />
                {validationErrors.phone && <div className="wedding-form-error">{validationErrors.phone}</div>}
              </div>

              <div className="wedding-form-group">
                <label className="wedding-form-label">Wedding Date *</label>
                <input
                  type="date"
                  name="wedding_date"
                  value={formData.wedding_date}
                  onChange={handleChange}
                  className="wedding-form-input"
                  required
                />
                {validationErrors.wedding_date && <div className="wedding-form-error">{validationErrors.wedding_date}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="wedding-form-group">
                <label className="wedding-form-label">Invitation Type *</label>
                <select
                  name="invitation_type"
                  value={formData.invitation_type}
                  onChange={handleChange}
                  className="wedding-form-select"
                >
                  <option value="Digital Wedding Card">Digital Wedding Card (WhatsApp)</option>
                  <option value="Traditional Wedding Card">Traditional Wedding Card (Print)</option>
                  <option value="Animated Invitation">Animated Invitation (GIF / Motion)</option>
                  <option value="Wedding Invitation Video">Wedding Invitation Video (1080p MP4)</option>
                  <option value="Save The Date Card">Save The Date Announcement</option>
                  <option value="Complete Wedding Suite">Complete Wedding Suite (All-In-One)</option>
                </select>
              </div>

              <div className="wedding-form-group">
                <label className="wedding-form-label">Design Category</label>
                <select
                  name="design_category"
                  value={formData.design_category}
                  onChange={handleChange}
                  className="wedding-form-select"
                >
                  {INVITATION_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="wedding-form-group">
                <label className="wedding-form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. couple@gmail.com"
                  className="wedding-form-input"
                />
              </div>

              <div className="wedding-form-group">
                <label className="wedding-form-label">Estimated Budget</label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="wedding-form-select"
                >
                  <option value="₹1,499 - ₹2,499">₹1,499 - ₹2,499 (Essential Digital)</option>
                  <option value="₹2,500 - ₹4,999">₹2,500 - ₹4,999 (Royal Video Suite)</option>
                  <option value="₹5,000 - ₹9,999">₹5,000 - ₹9,999 (Custom Bespoke Suite)</option>
                  <option value="₹10,000+">₹10,000+ (Full Luxury Print & Video)</option>
                </select>
              </div>
            </div>

            <div className="wedding-form-group">
              <label className="wedding-form-label">Reference Link / Instagram Design URL (Optional)</label>
              <input
                type="url"
                name="reference_url"
                value={formData.reference_url}
                onChange={handleChange}
                placeholder="https://... (Pinterest, Instagram or drive link)"
                className="wedding-form-input"
              />
            </div>

            <div className="wedding-form-group">
              <label className="wedding-form-label">Special Requirements / Couple Names / Venue Details</label>
              <textarea
                name="requirements"
                rows={3}
                value={formData.requirements}
                onChange={handleChange}
                placeholder="Share bride & groom names, specific cultural ceremonies (Mehendi, Sangeet, Reception), preferred colors or custom shlokas..."
                className="wedding-form-textarea"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="wedding-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting Inquiry...
                </>
              ) : (
                <>
                  Get Your Custom Wedding Invitation <Send size={15} />
                </>
              )}
            </button>
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
