'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { weddingInquiryService, WeddingInquiryRecord } from '../../../services/weddingInquiryService';
import {
  Sparkles,
  Search,
  Calendar,
  Phone,
  MessageCircle,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
  Check,
  Palette,
  PhoneCall,
  ExternalLink,
  Copy,
  X,
  Send,
  HeartHandshake,
  Heart,
  Globe,
  MapPin,
  Activity,
} from 'lucide-react';

export default function ArtistWeddingInvitationsPage() {
  const { artist } = useArtistAuth();
  const [inquiries, setInquiries] = useState<WeddingInquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Inspection Drawer
  const [selectedInquiry, setSelectedInquiry] = useState<WeddingInquiryRecord | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await weddingInquiryService.getInquiries({
        status: activeTab,
        artistId: artist?.id,
        search,
      });
      setInquiries(data);
    } catch (err) {
      console.error('Failed to load wedding inquiries:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, artist?.id, search]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  };

  const handleStatusChange = async (id: string, newStatus: WeddingInquiryRecord['status']) => {
    setInquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (selectedInquiry?.id === id) {
      setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    const res = await weddingInquiryService.updateStatus(id, newStatus);
    if (res.success) {
      showToast(`Inquiry status updated to ${newStatus}`);
      fetchInquiries();
    } else {
      showToast(res.error || 'Failed to update status');
      fetchInquiries();
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !newNoteText.trim()) return;

    setSavingNote(true);
    const res = await weddingInquiryService.addNote(selectedInquiry.id, newNoteText.trim(), 'artist');
    setSavingNote(false);

    if (res.success) {
      showToast('Artist note saved successfully!');
      setNewNoteText('');
      fetchInquiries();
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      setSelectedInquiry((prev) => {
        if (!prev) return null;
        const currentNotes = prev.artist_notes || '';
        return {
          ...prev,
          artist_notes: `[${timestamp} - ARTIST]: ${newNoteText.trim()}\n${currentNotes}`,
        };
      });
    } else {
      showToast(res.error || 'Failed to save note');
    }
  };

  // Metric counts
  const metrics = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter((i) => i.status === 'NEW').length;
    const contactedCount = inquiries.filter((i) => i.status === 'CONTACTED').length;
    const inProgressCount = inquiries.filter((i) => ['DISCUSSION', 'DESIGNING', 'REVIEW'].includes(i.status)).length;
    const completedCount = inquiries.filter((i) => i.status === 'COMPLETED').length;
    return { total, newCount, contactedCount, inProgressCount, completedCount };
  }, [inquiries]);

  // Unique categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    inquiries.forEach((i) => {
      if (i.design_category) set.add(i.design_category);
    });
    return Array.from(set);
  }, [inquiries]);

  const filteredInquiries = useMemo(() => {
    if (categoryFilter === 'all') return inquiries;
    return inquiries.filter((i) => i.design_category === categoryFilter);
  }, [inquiries, categoryFilter]);

  const getStatusBadge = (status: WeddingInquiryRecord['status']) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            New Request
          </span>
        );
      case 'CONTACTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
            <PhoneCall size={12} className="text-blue-500" />
            Contacted
          </span>
        );
      case 'DISCUSSION':
      case 'DESIGNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs">
            <Palette size={12} className="text-purple-500" />
            Designing
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/80 shadow-xs">
            <Eye size={12} className="text-cyan-500" />
            Under Review
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
            <X size={12} className="text-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 border border-white/10">
          <Check size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black uppercase tracking-wide">
              <Sparkles size={14} className="text-amber-500 fill-amber-500" />
              Artist Studio Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Assigned Wedding Invitations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl">
              View inquiries assigned to you, communicate on WhatsApp with clients, track client IP location, and update draft completion stages.
            </p>
          </div>

          <button
            onClick={fetchInquiries}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm active:scale-95 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: `All Inquiries (${metrics.total})` },
          { id: 'new', label: `New (${metrics.newCount})` },
          { id: 'in_progress', label: `In Designing (${metrics.inProgressCount + metrics.contactedCount})` },
          { id: 'completed', label: `Completed (${metrics.completedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inquiries Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-amber-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Assigned Inquiries...</p>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 shadow-xs max-w-2xl mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <HeartHandshake size={28} />
          </div>
          <h3 className="text-base font-black text-slate-900">No Wedding Inquiries Assigned Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When the director assigns custom digital card orders to your profile, they will appear here with complete details.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInquiries.map((inq) => {
            const cleanPhone = (inq.phone || inq.whatsapp || '').replace(/[^0-9]/g, '');
            const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const waGreeting = encodeURIComponent(
              `Hello ${inq.customer_name}! 💍 Greetings from your Magnevents Wedding Designer. I am working on your wedding card draft [${inq.inquiry_id}]!`
            );

            return (
              <div
                key={inq.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                      {inq.inquiry_id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(inq.status)}
                      {inq.is_followed && (
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                          ★ Star
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 line-clamp-1">{inq.customer_name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{inq.phone}</p>
                  </div>

                  {/* Client IP & Location */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-md font-bold">
                      <Globe size={10} className="text-indigo-500 flex-shrink-0" />
                      {inq.ip || '103.21.244.42'}
                    </span>
                    <span className="truncate max-w-[140px] text-slate-600 font-medium">
                      📍 {inq.locality?.city || inq.location?.split(',')[0] || 'Delhi'}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-400">Wedding Date:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Calendar size={12} className="text-amber-500" />
                        {inq.wedding_date || 'Flexible'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-400">Format:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[150px]">{inq.invitation_type}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-400">Theme:</span>
                      <span className="font-bold text-amber-700 truncate max-w-[150px]">{inq.design_category}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`https://wa.me/${waNumber}?text=${waGreeting}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs"
                    >
                      <MessageCircle size={14} />
                      WhatsApp
                    </a>

                    <button
                      onClick={() => setSelectedInquiry(inq)}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                    >
                      <Eye size={13} /> Details
                    </button>
                  </div>

                  <select
                    value={inq.status}
                    onChange={(e) => handleStatusChange(inq.id, e.target.value as any)}
                    className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="NEW">Status: New</option>
                    <option value="CONTACTED">Status: Contacted</option>
                    <option value="DESIGNING">Status: In Designing</option>
                    <option value="REVIEW">Status: Under Review</option>
                    <option value="COMPLETED">Status: Completed</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details & Notes Drawer Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative space-y-5 border border-slate-200">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
            >
              <X size={18} />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg">
                  {selectedInquiry.inquiry_id}
                </span>
                {getStatusBadge(selectedInquiry.status)}
              </div>
              <h2 className="text-xl font-black text-slate-900">{selectedInquiry.customer_name}</h2>
            </div>

            {/* Client IP & Location Strip */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">User IP Address:</span>
                <span className="font-mono font-bold text-slate-800">{selectedInquiry.ip || '103.21.244.42'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Geo Location:</span>
                <span className="font-bold text-slate-800">
                  📍 {selectedInquiry.locality?.city ? `${selectedInquiry.locality.city}, ${selectedInquiry.locality.region || ''}, ${selectedInquiry.locality.country || 'India'}` : selectedInquiry.location || 'Delhi, India'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Device & Browser:</span>
                <span className="font-semibold text-slate-700">
                  {selectedInquiry.device || 'Desktop'} • {selectedInquiry.browser || 'Chrome'}
                </span>
              </div>
            </div>

            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/60 text-xs text-slate-800 space-y-2">
              <div className="font-bold text-amber-900">
                {selectedInquiry.invitation_type} • {selectedInquiry.design_category}
              </div>
              <div>{selectedInquiry.requirements || 'No custom notes provided.'}</div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Artist Private Notes</h4>
              {selectedInquiry.artist_notes ? (
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {selectedInquiry.artist_notes}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No notes logged yet.</p>
              )}

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Add note (e.g. Sent PDF draft 1 on WhatsApp, waiting for client proofreading)..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingNote || !newNoteText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                  >
                    {savingNote ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Save Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
