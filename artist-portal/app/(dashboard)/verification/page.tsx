'use client';

import React, { useState, useEffect } from 'react';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { artistService } from '../../../services/artistService';
import { StatusBadge } from '../../../components/dashboard/StatusBadge';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Loader2,
  Save,
  Send,
  Upload,
} from 'lucide-react';

export default function VerificationPage() {
  const { artist, refreshArtist } = useArtistAuth();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<'id_document_url' | 'address_proof_url' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const existingDocs = artist?.verification_documents || {
    legal_name: '',
    id_type: '',
    id_number_masked: '',
    id_document_url: '',
    address_proof_url: '',
    pan_or_tax_id: '',
  };

  const [formData, setFormData] = useState(existingDocs);

  useEffect(() => {
    if (artist?.verification_documents) {
      setFormData(artist.verification_documents);
    }
  }, [artist]);

  const handlePrivateDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'id_document_url' | 'address_proof_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    setMessage(null);

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'private');
      body.append('category', field === 'id_document_url' ? formData.id_type || 'aadhaar' : 'address-proof');
      body.append('artistId', artist?.id || formData.legal_name || 'artist-kyc');

      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Private document upload failed.');
      }

      setFormData((prev) => ({ ...prev, [field]: data.url }));
      setMessage({
        type: 'success',
        text: `Uploaded securely to Cloudflare R2 (${data.folder || 'artist-private-kyc'}). Click Save or Submit to confirm.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not upload private document.' });
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!artist) return;
    setSaving(true);
    setMessage(null);

    try {
      await artistService.updateProfile(artist.id, {
        verification_documents: formData,
      });
      await refreshArtist();
      setMessage({ type: 'success', text: 'Verification details saved as draft.' });
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save documents.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!artist) return;
    if (!formData.legal_name || !formData.id_type || !formData.id_document_url) {
      setMessage({
        type: 'error',
        text: 'Please provide Legal Name, ID Type, and a valid Government ID Link before submitting.',
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await artistService.updateProfile(artist.id, {
        verification_documents: formData,
      });
      await artistService.submitForVerification(artist.id);
      await refreshArtist();
      setMessage({
        type: 'success',
        text: 'Verification application submitted for review.',
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit application.' });
    } finally {
      setSubmitting(false);
    }
  };

  const status = artist?.verification_status || 'pending';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Identity Verification</h1>
            <StatusBadge status={status} size="sm" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit verified credentials to activate your live listing and booking calendar.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || submitting}
          className="btn-secondary self-start sm:self-auto py-2 px-3.5 text-xs flex items-center gap-1.5 min-h-[38px]"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save Draft</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs border flex items-center justify-between shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100 font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Review Feedback Alert */}
      {status === 'rejected' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Updates Required</span>
          </div>
          <p className="text-xs text-rose-700">
            {artist?.rejection_reason || 'Please provide clear identity proof and valid showreel links before resubmitting.'}
          </p>
        </div>
      )}

      {/* Verification Steps Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className={`p-3.5 rounded-xl border text-xs shadow-xs ${artist?.name && artist?.category ? 'bg-sky-50/70 border-sky-200 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step 1</span>
            {artist?.name && artist?.category && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </div>
          <span className="font-bold block truncate">Profile & Bio</span>
        </div>

        <div className={`p-3.5 rounded-xl border text-xs shadow-xs ${artist?.submitted_pricing?.starting_price ? 'bg-sky-50/70 border-sky-200 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step 2</span>
            {artist?.submitted_pricing?.starting_price && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </div>
          <span className="font-bold block truncate">Rates & Logistics</span>
        </div>

        <div className={`p-3.5 rounded-xl border text-xs shadow-xs ${formData.id_document_url ? 'bg-sky-50/70 border-sky-200 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step 3</span>
            {formData.id_document_url && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </div>
          <span className="font-bold block truncate">Identity Proof</span>
        </div>

        <div className={`p-3.5 rounded-xl border text-xs shadow-xs ${status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step 4</span>
            {status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-500" />}
          </div>
          <span className="font-bold block truncate">Live Approval</span>
        </div>
      </div>

      {/* Verification Form */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Identity Details</h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">Private & Confidential</span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Legal Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="Full name as printed on ID"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Identity Document Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.id_type}
                onChange={(e) => setFormData({ ...formData, id_type: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
                required
              >
                <option value="">Select ID Type</option>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="passport">Passport</option>
                <option value="voter_id">Voter ID</option>
                <option value="driving_license">Driving License</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ID Number (Masked)</label>
              <input
                type="text"
                value={formData.id_number_masked}
                onChange={(e) => setFormData({ ...formData, id_number_masked: e.target.value })}
                placeholder="XXXX-XXXX-4589"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PAN / Tax ID</label>
              <input
                type="text"
                value={formData.pan_or_tax_id}
                onChange={(e) => setFormData({ ...formData, pan_or_tax_id: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm uppercase font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Govt ID (Aadhaar / PAN / Passport) <span className="text-rose-500">*</span>
                </label>
                <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-bold cursor-pointer">
                  {uploadingField === 'id_document_url' ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Upload to R2 Private</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handlePrivateDocUpload(e, 'id_document_url')}
                    className="hidden"
                    disabled={uploadingField !== null}
                  />
                </label>
              </div>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={formData.id_document_url}
                  onChange={(e) => setFormData({ ...formData, id_document_url: e.target.value })}
                  placeholder="Upload file above or paste document link..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm pr-9"
                />
                {formData.id_document_url && (
                  <a
                    href={formData.id_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-bold text-slate-700">Address Proof (Optional)</label>
                <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer">
                  {uploadingField === 'address_proof_url' ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>Upload to R2 Private</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handlePrivateDocUpload(e, 'address_proof_url')}
                    className="hidden"
                    disabled={uploadingField !== null}
                  />
                </label>
              </div>
              <div className="relative">
                <input
                  type="url"
                  value={formData.address_proof_url}
                  onChange={(e) => setFormData({ ...formData, address_proof_url: e.target.value })}
                  placeholder="Upload file above or paste document link..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm pr-9"
                />
                {formData.address_proof_url && (
                  <a
                    href={formData.address_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              All credentials are encrypted and used solely for performer verification.
            </span>

            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submitting || status === 'approved'}
              className="btn-primary w-full sm:w-auto py-2.5 px-5 text-xs flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : status === 'approved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified & Live</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
