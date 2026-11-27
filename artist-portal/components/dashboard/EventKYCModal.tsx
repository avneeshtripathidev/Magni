"use client";

import React, { useState, useEffect } from 'react';
import { ModalPortal } from '../shared/ModalPortal';
import { useArtistAuth } from '../../lib/auth/authContext';
import { artistService } from '../../services/artistService';
import { EventVerificationRecord } from '../../types/eventVerification';
import { compressImageFile } from '../../lib/imageCompressor';
import {
  ShieldCheck,
  Building,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Lock,
} from 'lucide-react';

interface EventKYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: EventVerificationRecord | null;
  onSuccess?: () => void;
}

export function EventKYCModal({
  isOpen,
  onClose,
  event,
  onSuccess,
}: EventKYCModalProps) {
  const { artist, refreshArtist, updateLocalArtist } = useArtistAuth();

  const [formData, setFormData] = useState({
    legal_name: '',
    id_type: 'aadhaar',
    id_number_masked: '',
    pan_or_tax_id: '',
    id_document_url: '',
    address_proof_url: '',
    bank_holder: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
  });

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill existing KYC & Bank details
  useEffect(() => {
    if (!isOpen) return;

    let bankData: any = {};
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('magnevents_artist_bank_details');
        if (raw) bankData = JSON.parse(raw);
      } catch {}
    }

    const docs = artist?.verification_documents;
    setFormData({
      legal_name: docs?.legal_name || artist?.name || '',
      id_type: (docs?.id_type as string) || 'aadhaar',
      id_number_masked: docs?.id_number_masked || '',
      pan_or_tax_id: docs?.pan_or_tax_id || '',
      id_document_url: docs?.id_document_url || '',
      address_proof_url: docs?.address_proof_url || '',
      bank_holder: bankData.account_holder || artist?.name || '',
      bank_name: bankData.bank_name || '',
      account_number: bankData.account_number || '',
      ifsc_code: bankData.ifsc_code || '',
      upi_id: bankData.upi_id || '',
    });
    setError(null);
    setSuccess(false);
  }, [isOpen, artist]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'id_document_url' | 'address_proof_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    setError(null);

    try {
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
      } catch {
        if (fileToUpload.size < 3 * 1024 * 1024) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(fileToUpload);
          });
          setFormData((prev) => ({ ...prev, [field]: base64 }));
          return;
        }
        throw new Error('Upload failed due to network error.');
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (${res.status}).` };
      }

      if (!res.ok || !data.url) {
        if (fileToUpload.size < 3 * 1024 * 1024) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(fileToUpload);
          });
          setFormData((prev) => ({ ...prev, [field]: base64 }));
          return;
        }
        throw new Error(data.error || 'Private document upload failed.');
      }

      setFormData((prev) => ({ ...prev, [field]: data.url }));
    } catch (err: any) {
      setError(err.message || 'Could not upload document.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.legal_name.trim()) {
      setError('Please provide your legal name as printed on your government ID.');
      return;
    }
    if (!formData.id_number_masked.trim()) {
      setError('Please provide your masked ID number (e.g. XXXX-XXXX-4589).');
      return;
    }

    setSubmitting(true);

    try {
      const verification_documents = {
        legal_name: formData.legal_name.trim(),
        id_type: formData.id_type as any,
        id_number_masked: formData.id_number_masked.trim(),
        pan_or_tax_id: formData.pan_or_tax_id.trim().toUpperCase(),
        id_document_url: formData.id_document_url.trim(),
        address_proof_url: formData.address_proof_url.trim(),
      };

      // Save bank details locally
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'magnevents_artist_bank_details',
          JSON.stringify({
            account_holder: formData.bank_holder || formData.legal_name,
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            ifsc_code: formData.ifsc_code.toUpperCase(),
            upi_id: formData.upi_id,
          })
        );
      }

      if (artist?.id) {
        await artistService.updateProfile(artist.id, {
          verification_documents,
        });
        updateLocalArtist({ verification_documents });
        await refreshArtist();
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save KYC documents.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                Event Assigned by Admin
              </span>
              {event && <span className="text-xs font-mono text-white/60">#{event.booking_id}</span>}
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              Identity Verification (KYC) & Payouts
            </h3>
            {event && (
              <p className="text-xs text-sky-200 font-medium">
                For: {event.event_title} ({event.city} • {event.event_date})
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Informational Banner */}
          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-0.5">
              <p className="font-bold text-sky-950">Why is KYC required now?</p>
              <p className="text-slate-600">
                You have been assigned to perform at an official Magnevents booking. To verify performer identity at the venue and process direct bank payouts, government ID details are mandatory.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>KYC & Settlement details saved successfully! You are ready for this event.</span>
            </div>
          )}

          <form id="kyc-modal-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Government KYC */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Identity Verification (KYC)
                  </h4>
                  <p className="text-[11px] text-slate-500">Encrypted & used strictly to verify your performer badge</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Legal Name on ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    placeholder="Exact name printed on ID"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Government ID Type *</label>
                  <select
                    value={formData.id_type || 'aadhaar'}
                    onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                    className="form-input font-semibold"
                  >
                    <option value="aadhaar">Aadhaar Card (UIDAI Verified)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Aadhaar Card Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.id_number_masked}
                    onChange={(e) => setFormData({ ...formData, id_number_masked: e.target.value })}
                    placeholder="XXXX-XXXX-4589 or 12-digit Aadhaar"
                    className="form-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Aadhaar Card Document</label>
                    <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline">
                      {uploadingField === 'id_document_url' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'id_document_url')}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={formData.id_document_url}
                    onChange={(e) => setFormData({ ...formData, id_document_url: e.target.value })}
                    placeholder="https://... or upload file"
                    className="form-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Address Proof (Optional)</label>
                    <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline">
                      {uploadingField === 'address_proof_url' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'address_proof_url')}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={formData.address_proof_url}
                    onChange={(e) => setFormData({ ...formData, address_proof_url: e.target.value })}
                    placeholder="https://... or upload file"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Payout Bank Details */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Bank & UPI Payout Details
                  </h4>
                  <p className="text-[11px] text-slate-500">Where you want direct event payouts settled</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.bank_holder}
                    onChange={(e) => setFormData({ ...formData, bank_holder: e.target.value })}
                    placeholder="Name on bank account"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="e.g. HDFC Bank, ICICI Bank"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="Bank account number"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001024"
                    className="form-input uppercase font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">UPI ID (Optional — for instant settlements)</label>
                  <input
                    type="text"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    placeholder="e.g. performer@okhdfcbank"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-2 text-xs"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="kyc-modal-form"
            disabled={submitting || success}
            className="h-10 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving KYC Details...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Identity & Accept Event</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
