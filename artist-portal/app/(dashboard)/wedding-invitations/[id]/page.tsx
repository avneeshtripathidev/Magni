'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { weddingInquiryService, WeddingInquiryRecord } from '../../../../services/weddingInquiryService';
import {
  ArrowLeft,
  Calendar,
  Phone,
  MessageCircle,
  Mail,
  ExternalLink,
  Send,
  Loader2,
  Check,
  Clock,
  Sparkles,
  User,
  Tag,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function WeddingInquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [inquiry, setInquiry] = useState<WeddingInquiryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchInquiry = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await weddingInquiryService.getInquiryById(id);
      setInquiry(data);
    } catch (err) {
      console.error('Error fetching inquiry:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInquiry();
  }, [fetchInquiry]);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleStatusChange = async (newStatus: WeddingInquiryRecord['status']) => {
    if (!inquiry) return;
    setUpdatingStatus(true);
    const res = await weddingInquiryService.updateStatus(inquiry.id, newStatus);
    setUpdatingStatus(false);
    if (res.success) {
      showToast(`Status updated to ${newStatus}`);
      setInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !inquiry) return;
    setSavingNote(true);
    const res = await weddingInquiryService.addNote(inquiry.id, newNote.trim(), 'artist');
    setSavingNote(false);
    if (res.success) {
      showToast('Note added successfully');
      setNewNote('');
      fetchInquiry();
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <Loader2 size={24} className="animate-spin text-amber-500" />
        <span>Loading inquiry details...</span>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="p-12 text-center text-slate-400">
        <h2 className="text-xl font-bold text-white mb-2">Inquiry Not Found</h2>
        <p className="text-sm text-slate-500 mb-4">The requested wedding inquiry could not be found.</p>
        <Link
          href="/wedding-invitations"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-sm"
        >
          <ArrowLeft size={16} /> Back to Inquiries
        </Link>
      </div>
    );
  }

  const cleanPhone = (inquiry.phone || '').replace(/[^0-9]/g, '');
  const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check size={16} /> {toastMsg}
        </div>
      )}

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/wedding-invitations"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to All Inquiries
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">ID: {inquiry.inquiry_id}</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {inquiry.status}
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/25 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <Sparkles size={14} /> Wedding Invitation Design Request
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{inquiry.customer_name}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Submitted on {new Date(inquiry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            {cleanPhone && (
              <>
                <a
                  href={`https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(inquiry.customer_name)}!%20I%20am%20reaching%20out%20from%20Magnevents%20regarding%20your%20wedding%20invitation%20inquiry%20[${inquiry.inquiry_id}].`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-950 transition-colors"
                >
                  <MessageCircle size={16} /> WhatsApp Client
                </a>

                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium border border-white/10 transition-colors"
                >
                  <Phone size={15} /> Call
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Requirements & Notes */}
        <div className="md:col-span-2 space-y-6">
          {/* Design Details Card */}
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText size={17} className="text-amber-400" /> Invitation Requirements
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Invitation Type</span>
                <span className="font-semibold text-white">{inquiry.invitation_type}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Design Category</span>
                <span className="font-semibold text-amber-300">{inquiry.design_category}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Wedding Date</span>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  {inquiry.wedding_date || 'Flexible / TBD'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Budget Range</span>
                <span className="font-semibold text-white">{inquiry.budget || 'Standard Package'}</span>
              </div>
            </div>

            {/* Special Requirements */}
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-2">Customer Requirements & Notes:</span>
              <div className="bg-slate-950/70 border border-white/10 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {inquiry.requirements || 'No additional requirements provided by customer.'}
              </div>
            </div>

            {/* Reference URL */}
            {inquiry.reference_url && (
              <div>
                <span className="text-xs text-slate-400 font-medium block mb-2">Design Reference Link:</span>
                <a
                  href={inquiry.reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 rounded-lg text-xs font-medium transition-colors break-all"
                >
                  <ExternalLink size={14} /> {inquiry.reference_url}
                </a>
              </div>
            )}
          </div>

          {/* Internal Notes Timeline */}
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock size={17} className="text-amber-400" /> Internal Notes & Activity
            </h2>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a progress update, draft preview link, or client call summary..."
                rows={3}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={savingNote || !newNote.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                {savingNote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Add Note
              </button>
            </form>

            {/* Existing Notes Display */}
            <div className="space-y-3 pt-2">
              {inquiry.artist_notes ? (
                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-4 text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed">
                  {inquiry.artist_notes}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No artist notes logged yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Status & Client Details */}
        <div className="space-y-6">
          {/* Status Updater Card */}
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Update Status</h2>
            <div className="space-y-2">
              {[
                { status: 'NEW', label: 'New Request', color: 'hover:border-amber-500' },
                { status: 'CONTACTED', label: 'Client Contacted', color: 'hover:border-blue-500' },
                { status: 'DISCUSSION', label: 'In Discussion', color: 'hover:border-indigo-500' },
                { status: 'DESIGNING', label: 'Designing Drafts', color: 'hover:border-purple-500' },
                { status: 'REVIEW', label: 'Under Review', color: 'hover:border-cyan-500' },
                { status: 'COMPLETED', label: 'Completed & Delivered', color: 'hover:border-emerald-500' },
                { status: 'CANCELLED', label: 'Cancelled', color: 'hover:border-rose-500' },
              ].map((item) => (
                <button
                  key={item.status}
                  onClick={() => handleStatusChange(item.status as any)}
                  disabled={updatingStatus}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                    inquiry.status === item.status
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : `bg-slate-950/50 border-white/5 text-slate-400 ${item.color}`
                  }`}
                >
                  <span>{item.label}</span>
                  {inquiry.status === item.status && <Check size={14} className="text-amber-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Client Details Card */}
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <User size={17} className="text-amber-400" /> Client Contact
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Full Name</span>
                <span className="font-semibold text-white text-sm">{inquiry.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Phone / WhatsApp</span>
                <span className="font-mono text-slate-200">{inquiry.phone}</span>
              </div>
              {inquiry.email && (
                <div>
                  <span className="text-slate-500 block mb-0.5">Email</span>
                  <a href={`mailto:${inquiry.email}`} className="text-blue-400 hover:underline">
                    {inquiry.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
