'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { artistService } from '../../../services/artistService';
import { StatusBadge } from '../../../components/dashboard/StatusBadge';
import { MissingDetailsBanner } from '../../../components/dashboard/MissingDetailsBanner';
import { compressImageFile } from '../../../lib/imageCompressor';
import { getMissingProfileSections } from '../../../lib/profileCompletion';
import { getSecureKycUrl } from '../../../lib/security/kycEncryption';
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
  MessageSquare,
  MessageCircle,
  CornerDownRight,
  Reply,
  Mail,
  Check,
} from 'lucide-react';
import { getArtistFollowUps, logArtistReply, FollowUpMessage } from '../../../lib/artistFollowUp';

export default function VerificationPage() {
  const { artist, refreshArtist } = useArtistAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<'id_document_url' | 'address_proof_url' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const existingDocs = artist?.verification_documents || {
    legal_name: '',
    id_type: 'aadhaar',
    id_number_masked: '',
    id_document_url: '',
    address_proof_url: '',
    pan_or_tax_id: '',
  };

  const [formData, setFormData] = useState(existingDocs);
  const [followUps, setFollowUps] = useState<FollowUpMessage[]>([]);
  const [artistDoubtReply, setArtistDoubtReply] = useState('');

  useEffect(() => {
    if (artist?.verification_documents) {
      setFormData(artist.verification_documents);
    }
    if (artist?.id) {
      setFollowUps(getArtistFollowUps(artist.id));
    }
  }, [artist]);

  const handleArtistSubmitReply = (followUpId: string) => {
    if (!artist || !artistDoubtReply.trim()) return;
    const text = artistDoubtReply.trim();
    const updated = logArtistReply(artist.id, followUpId, text);
    setFollowUps(updated);
    setArtistDoubtReply('');
    setMessage({
      type: 'success',
      text: 'Your reply has been saved and shared with the Director and Curation Team.',
    });
    artistService.sendNotification({
      artist_id: artist.id,
      type: 'verification',
      title: 'Artist Reply Logged',
      message: `${artist.stage_name || artist.name} replied: "${text}"`,
    });
  };

  const handlePrivateDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'id_document_url' | 'address_proof_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    setMessage(null);

    try {
      // Auto-compress large phone photos of documents (<= 1920px, < 1.5MB)
      const fileToUpload = file.type.startsWith('image/')
        ? await compressImageFile(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 })
        : file;

      const body = new FormData();
      body.append('file', fileToUpload);
      body.append('folder', 'private');
      body.append('category', field === 'id_document_url' ? formData.id_type || 'aadhaar' : 'address-proof');
      body.append('artistId', artist?.id || formData.legal_name || 'artist-kyc');

      let res: Response;
      try {
        res = await fetch('/api/upload', { method: 'POST', body });
      } catch (netErr: any) {
        if (fileToUpload.type.startsWith('image/') && fileToUpload.size < 3 * 1024 * 1024) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(fileToUpload);
          });
          setFormData((prev) => ({ ...prev, [field]: base64 }));
          setMessage({
            type: 'success',
            text: 'Document loaded securely for verification. Click Save or Submit to confirm.',
          });
          return;
        }
        throw new Error(netErr.message || 'Upload failed due to connection error.');
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (${res.status}). Please choose a smaller photo.` };
      }

      if (!res.ok || !data.url) {
        if (fileToUpload.type.startsWith('image/') && fileToUpload.size < 3 * 1024 * 1024) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(fileToUpload);
          });
          setFormData((prev) => ({ ...prev, [field]: base64 }));
          setMessage({
            type: 'success',
            text: 'Document loaded securely for verification. Click Save or Submit to confirm.',
          });
          return;
        }
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
      const updatedArtist = await artistService.updateProfile(artist.id, {
        verification_documents: formData,
      });
      await refreshArtist();

      const remainingMissing = getMissingProfileSections(updatedArtist);
      if (remainingMissing.length > 0) {
        router.push(`${remainingMissing[0].href}?complete=1`);
        return;
      }

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
          <div className="flex flex-wrap items-center gap-2.5">
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

      <MissingDetailsBanner artist={artist} currentPage="verification" />

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

      {/* Director Follow-Up / Inquiry Banner */}
      {followUps.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                <MessageSquare className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Director Follow-Up &amp; Application Inquiry</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold uppercase">
                    Active Discussion
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Our verification team is reviewing your profile and sent a direct query. (This is not a rejection)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {followUps.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white border border-sky-100/80 shadow-2xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-xs text-sky-950">
                    {item.subject}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>

                <p className="text-xs text-slate-700 whitespace-pre-wrap pl-3 border-l-2 border-sky-400">
                  {item.message}
                </p>

                {item.status === 'replied' && item.reply_note ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800">
                      <span className="flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3 text-emerald-600" />
                        <span>Your Reply:</span>
                      </span>
                      {item.reply_at && (
                        <span className="text-slate-400 font-normal">
                          {new Date(item.reply_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-950 italic pl-4">
                      &ldquo;{item.reply_note}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Reply className="w-3 h-3 text-sky-600" />
                        <span>Have any questions or doubts? Reply to the Director:</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/917992117094?text=${encodeURIComponent(
                            `Hi Magnevents Team, this is ${artist?.stage_name || artist?.name} replying to verification query: "${item.subject}". `
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`mailto:support@magnevents.in?subject=${encodeURIComponent(
                            `Re: ${item.subject} - ${artist?.stage_name || artist?.name}`
                          )}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Mail className="w-3 h-3 text-slate-600" />
                          <span>Email</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <textarea
                        value={artistDoubtReply}
                        onChange={(e) => setArtistDoubtReply(e.target.value)}
                        placeholder="Type your response, clarification, or ask any doubts here..."
                        rows={2}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleArtistSubmitReply(item.id)}
                        disabled={!artistDoubtReply.trim()}
                        className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 self-end flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
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
                value={formData.id_type || 'aadhaar'}
                onChange={(e) => setFormData({ ...formData, id_type: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm font-semibold"
                required
              >
                <option value="aadhaar">Aadhaar Card (UIDAI Verified)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Card Number <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={formData.id_number_masked}
                onChange={(e) => setFormData({ ...formData, id_number_masked: e.target.value })}
                placeholder="Enter 12-digit Aadhaar or masked format (e.g. 5472-XXXX-3978)"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm font-mono"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Aadhaar Card Document (Front &amp; Back) <span className="text-rose-500">*</span>
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
                    href={getSecureKycUrl(formData.id_document_url)}
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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
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
                    href={getSecureKycUrl(formData.address_proof_url)}
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
