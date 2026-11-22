'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
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
  RefreshCw,
  Loader2,
  UserCheck,
  X,
  Send,
  User,
  Check,
  ExternalLink,
  Plus,
  Palette,
  PhoneCall,
  Mail,
  Copy,
  ChevronRight,
  LayoutGrid,
  List,
  AlertCircle,
  FileText,
  HeartHandshake
} from 'lucide-react';

export default function AdminWeddingInvitationsPage() {
  const { artists } = useAdminAuth();
  const [inquiries, setInquiries] = useState<WeddingInquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [creatingSample, setCreatingSample] = useState(false);

  // Inspection Drawer/Modal
  const [selectedInquiry, setSelectedInquiry] = useState<WeddingInquiryRecord | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Assign Artist Modal
  const [assigningInquiry, setAssigningInquiry] = useState<WeddingInquiryRecord | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await weddingInquiryService.getInquiries({
        status: activeTab,
        search,
      });
      setInquiries(data);
    } catch (err) {
      console.error('Failed to load wedding inquiries:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

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
    // Optimistic update
    setInquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (selectedInquiry?.id === id) {
      setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    const res = await weddingInquiryService.updateStatus(id, newStatus);
    if (res.success) {
      showToast(`Lead status updated to ${newStatus}`);
      fetchInquiries();
    } else {
      showToast(res.error || 'Failed to update status');
      fetchInquiries();
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningInquiry || !selectedArtistId) return;

    const matchedArtist = artists.find((a) => a.id === selectedArtistId);
    const artistName = matchedArtist?.name || 'Assigned Designer';

    setIsAssigning(true);
    const res = await weddingInquiryService.assignArtist(assigningInquiry.id, selectedArtistId, artistName);
    setIsAssigning(false);

    if (res.success) {
      showToast(`Inquiry assigned to ${artistName}`);
      setAssigningInquiry(null);
      setSelectedArtistId('');
      fetchInquiries();
    } else {
      showToast(res.error || 'Failed to assign artist');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !newNoteText.trim()) return;

    setSavingNote(true);
    const res = await weddingInquiryService.addNote(selectedInquiry.id, newNoteText.trim(), 'admin');
    setSavingNote(false);

    if (res.success) {
      showToast('Admin note saved successfully!');
      setNewNoteText('');
      fetchInquiries();
      // Update selected inquiry locally
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      setSelectedInquiry((prev) => {
        if (!prev) return null;
        const currentNotes = prev.admin_notes || '';
        return {
          ...prev,
          admin_notes: `[${timestamp} - ADMIN]: ${newNoteText.trim()}\n${currentNotes}`,
        };
      });
    } else {
      showToast(res.error || 'Failed to save note');
    }
  };

  // Helper to send a sample test lead
  const handleCreateSampleLead = async () => {
    setCreatingSample(true);
    try {
      const coupleNames = [
        'Radhika & Anshul Singhal',
        'Meera & Arjun Somani',
        'Tanvi & Kabir Oberoi',
        'Isha & Devrat Chauhan',
        'Pooja & Rohan Kapoor',
      ];
      const selectedCouple = coupleNames[Math.floor(Math.random() * coupleNames.length)];
      const randomPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

      const res = await fetch('/api/wedding-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: selectedCouple,
          phone: randomPhone,
          whatsapp: randomPhone,
          email: `${selectedCouple.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
          wedding_date: '2026-12-28',
          invitation_type: 'Digital WhatsApp Card + PDF',
          design_category: 'Royal Palace Suites',
          budget: '₹2,500 - ₹5,000',
          requirements: 'Palace floral botanical frame with custom couple initials crest and clickable venue Google Map link.',
          selected_design_name: 'Jharokha Heritage Royal Suite',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Sample lead generated: ${selectedCouple}!`);
        fetchInquiries();
      } else {
        showToast(data.error || 'Failed to create sample lead');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating test lead');
    } finally {
      setCreatingSample(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter((i) => i.status === 'NEW').length;
    const contactedCount = inquiries.filter((i) => i.status === 'CONTACTED').length;
    const inProgressCount = inquiries.filter((i) => ['DISCUSSION', 'DESIGNING', 'REVIEW'].includes(i.status)).length;
    const completedCount = inquiries.filter((i) => i.status === 'COMPLETED').length;
    return { total, newCount, contactedCount, inProgressCount, completedCount };
  }, [inquiries]);

  // Filtered categories
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

      {/* 1. Header Card with Gold & Champagne Accent */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-100/40 via-rose-100/20 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 text-amber-800 text-xs font-black tracking-wide uppercase shadow-2xs">
              <Sparkles size={14} className="text-amber-500 fill-amber-500" />
              Magnevents Wedding Studio • Super Admin Oversight
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Wedding Studio Leads & Custom Orders
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl font-medium">
              Super admin concierge: monitor incoming wedding invitation inquiries, launch one-click WhatsApp chats, assign designers, and track card fulfillment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCreateSampleLead}
              disabled={creatingSample}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all shadow-xs border border-slate-200/80 active:scale-95 disabled:opacity-50"
              title="Add a sample lead to test the UI"
            >
              {creatingSample ? <Loader2 size={14} className="animate-spin text-slate-600" /> : <Plus size={14} className="text-slate-700" />}
              Create Sample Lead
            </button>

            <a
              href="https://www.magnevents.in/wedding-invitations"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 font-bold text-xs transition-all shadow-xs border border-amber-200/80 active:scale-95"
            >
              <ExternalLink size={14} className="text-amber-700" />
              Live Studio Page
            </a>

            <button
              onClick={fetchInquiries}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh Leads
            </button>
          </div>
        </div>
      </div>

      {/* 2. Modern 5-KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Total Leads */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Leads</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Layers size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{metrics.total}</div>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">All incoming inquiries</p>
        </div>

        {/* New Requests */}
        <div className="bg-gradient-to-br from-amber-50/50 to-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.08)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">New Requests</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">{metrics.newCount}</div>
          <p className="text-[11px] font-semibold text-amber-700/80 mt-1">Requires WhatsApp reply</p>
        </div>

        {/* Contacted */}
        <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.08)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-800">Contacted</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-xs">
              <MessageCircle size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">{metrics.contactedCount}</div>
          <p className="text-[11px] font-semibold text-blue-700/80 mt-1">Discussion ongoing</p>
        </div>

        {/* Designing */}
        <div className="bg-gradient-to-br from-purple-50/50 to-white rounded-2xl p-4 sm:p-5 border border-purple-200/80 shadow-[0_2px_8px_-2px_rgba(168,85,247,0.08)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-800">Designing</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Palette size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">{metrics.inProgressCount}</div>
          <p className="text-[11px] font-semibold text-purple-700/80 mt-1">In drafting & review</p>
        </div>

        {/* Completed */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.08)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">{metrics.completedCount}</div>
          <p className="text-[11px] font-semibold text-emerald-700/80 mt-1">Delivered to host</p>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: `All (${metrics.total})` },
            { id: 'new', label: `New (${metrics.newCount})` },
            { id: 'in_progress', label: `In Progress (${metrics.inProgressCount + metrics.contactedCount})` },
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

        {/* Search, Category & View Switcher */}
        <div className="flex items-center gap-2.5 flex-1 md:flex-initial justify-end">
          <div className="relative flex-1 md:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by couple, phone, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
            />
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
            >
              <option value="all">All Themes</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Compact Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Content Area: Grid Cards View or Compact Table View */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-amber-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Wedding Inquiries...</p>
        </div>
      ) : filteredInquiries.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-dashed border-slate-300 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <HeartHandshake size={30} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">No Wedding Inquiries Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Any client booking or custom wedding invitation request submitted on the website will instantly appear here with WhatsApp action buttons.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleCreateSampleLead}
              disabled={creatingSample}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Plus size={14} />
              Create Test Wedding Lead
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInquiries.map((inq) => {
            const cleanPhone = (inq.phone || inq.whatsapp || '').replace(/[^0-9]/g, '');
            const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const waGreeting = encodeURIComponent(
              `Hello ${inq.customer_name}! 💍 Warm greetings from Magnevents Wedding Studio.\n\nWe received your inquiry [${inq.inquiry_id}] for "${inq.invitation_type}" (${inq.design_category}). We would love to share sample designs & discuss custom wedding card drafts with you!`
            );
            const waUrl = `https://wa.me/${waNumber}?text=${waGreeting}`;

            return (
              <div
                key={inq.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-amber-200/80 transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top: ID, Status & Quick Action Menu */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                      {inq.inquiry_id}
                    </span>
                    {getStatusBadge(inq.status)}
                  </div>

                  {/* Customer Identity */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                      {inq.customer_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium font-mono text-slate-600">{inq.phone}</span>
                      {inq.email && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{inq.email}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Design & Event Details Box */}
                  <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-400">Wedding Date:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Calendar size={12} className="text-amber-500" />
                        {inq.wedding_date || 'Flexible / TBD'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-400">Format:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[160px] text-right">
                        {inq.invitation_type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-400">Theme / Style:</span>
                      <span className="font-bold text-amber-700 truncate max-w-[160px] text-right">
                        {inq.design_category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-400">Budget:</span>
                      <span className="font-bold text-emerald-700">
                        {inq.budget || 'Standard Package'}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Designer */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-semibold text-slate-400">Assigned Designer:</span>
                    {inq.assigned_artist_name ? (
                      <button
                        onClick={() => {
                          setAssigningInquiry(inq);
                          setSelectedArtistId(inq.assigned_artist_id || '');
                        }}
                        className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <UserCheck size={12} /> {inq.assigned_artist_name}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setAssigningInquiry(inq);
                          setSelectedArtistId('');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Plus size={11} /> Assign Designer
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp Direct */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <MessageCircle size={14} />
                      WhatsApp Chat
                    </a>

                    {/* Quick Call */}
                    <a
                      href={`tel:${cleanPhone}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                    >
                      <Phone size={14} className="text-slate-600" />
                      Direct Call
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Inline Status Dropdown */}
                    <select
                      value={inq.status}
                      onChange={(e) => handleStatusChange(inq.id, e.target.value as any)}
                      className="w-1/2 py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="NEW">Status: New</option>
                      <option value="CONTACTED">Status: Contacted</option>
                      <option value="DESIGNING">Status: Designing</option>
                      <option value="COMPLETED">Status: Completed</option>
                      <option value="CANCELLED">Status: Cancelled</option>
                    </select>

                    {/* View Details Drawer */}
                    <button
                      onClick={() => setSelectedInquiry(inq)}
                      className="w-1/2 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                    >
                      <Eye size={13} /> Details & Notes
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Inquiry ID</th>
                  <th className="py-3.5 px-5">Couple / Customer</th>
                  <th className="py-3.5 px-5">Contact</th>
                  <th className="py-3.5 px-5">Wedding Date</th>
                  <th className="py-3.5 px-5">Theme & Category</th>
                  <th className="py-3.5 px-5">Assigned Designer</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredInquiries.map((inq) => {
                  const cleanPhone = (inq.phone || inq.whatsapp || '').replace(/[^0-9]/g, '');
                  const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  const waGreeting = encodeURIComponent(
                    `Hello ${inq.customer_name}! This is Magnevents Wedding Studio regarding your wedding card inquiry [${inq.inquiry_id}].`
                  );

                  return (
                    <tr key={inq.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5 font-mono text-xs font-black text-amber-700">
                        {inq.inquiry_id}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-black text-slate-900">{inq.customer_name}</div>
                        {inq.email && <div className="text-xs text-slate-400">{inq.email}</div>}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-slate-600">{inq.phone}</span>
                          <a
                            href={`https://wa.me/${waNumber}?text=${waGreeting}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </a>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Call Customer"
                          >
                            <Phone size={14} />
                          </a>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-xs font-semibold text-slate-700">
                        {inq.wedding_date || 'Flexible / TBD'}
                      </td>
                      <td className="py-4 px-5 text-xs">
                        <div className="font-bold text-slate-800">{inq.invitation_type}</div>
                        <div className="text-slate-400">{inq.design_category}</div>
                      </td>
                      <td className="py-4 px-5 text-xs">
                        {inq.assigned_artist_name ? (
                          <span className="font-bold text-purple-700 flex items-center gap-1">
                            <UserCheck size={13} /> {inq.assigned_artist_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {getStatusBadge(inq.status)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedInquiry(inq)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Detail & Notes Slide-Over / Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative space-y-6 border border-slate-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg">
                  {selectedInquiry.inquiry_id}
                </span>
                {getStatusBadge(selectedInquiry.status)}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{selectedInquiry.customer_name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Received on {new Date(selectedInquiry.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p>
            </div>

            {/* Client Contact Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Phone / WhatsApp</span>
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="font-mono">{selectedInquiry.phone}</span>
                  <button
                    onClick={() => copyToClipboard(selectedInquiry.phone, 'Phone number')}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                    title="Copy Phone"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Email Address</span>
                <div className="flex items-center gap-2 font-bold text-slate-900 truncate">
                  <span className="truncate">{selectedInquiry.email || 'None provided'}</span>
                  {selectedInquiry.email && (
                    <button
                      onClick={() => copyToClipboard(selectedInquiry.email || '', 'Email address')}
                      className="p-1 rounded text-slate-400 hover:text-slate-700"
                      title="Copy Email"
                    >
                      <Copy size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Event / Wedding Date</span>
                <span className="font-bold text-amber-800 flex items-center gap-1">
                  <Calendar size={13} className="text-amber-600" />
                  {selectedInquiry.wedding_date || 'Flexible / TBD'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Estimated Budget</span>
                <span className="font-bold text-emerald-700">
                  {selectedInquiry.budget || 'Standard Package'}
                </span>
              </div>
            </div>

            {/* Quick Contact & WhatsApp Launchers */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">1-Click WhatsApp Concierge</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${(selectedInquiry.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${selectedInquiry.customer_name}! 💍 Magnevents Wedding Studio here. We received your wedding invitation request for ${selectedInquiry.invitation_type}. How can we assist you today?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-2 border border-emerald-200/80 transition-colors"
                >
                  <MessageCircle size={15} className="text-emerald-600" />
                  <span>Send Welcome & Catalog</span>
                </a>

                <a
                  href={`https://wa.me/${(selectedInquiry.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hi ${selectedInquiry.customer_name}! 🎨 Your wedding card draft preview is ready for review! Please take a look and let us know your feedback.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center gap-2 border border-purple-200/80 transition-colors"
                >
                  <Palette size={15} className="text-purple-600" />
                  <span>Send Design Draft Ready</span>
                </a>
              </div>
            </div>

            {/* Requirements & Custom Notes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Client Requirements & Chosen Theme</h4>
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/60 text-xs text-slate-800 space-y-1.5 whitespace-pre-wrap font-medium">
                <div className="font-bold text-amber-900">
                  {selectedInquiry.invitation_type} • {selectedInquiry.design_category}
                </div>
                <div>{selectedInquiry.requirements || 'No custom notes provided by client.'}</div>
                {selectedInquiry.reference_url && (
                  <div className="pt-1">
                    <span className="font-semibold text-slate-500">Reference: </span>
                    <a
                      href={selectedInquiry.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {selectedInquiry.reference_url}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Status Change Strip */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Change Status</h4>
              <div className="flex flex-wrap gap-2">
                {(['NEW', 'CONTACTED', 'DESIGNING', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedInquiry.id, st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedInquiry.status === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Notes Log */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Internal Admin Notes History</h4>
              {selectedInquiry.admin_notes ? (
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedInquiry.admin_notes}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No admin notes logged yet.</p>
              )}

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Add private note (e.g., Client requested golden peacock motif, revision 1 delivered via WhatsApp)..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingNote || !newNoteText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    {savingNote ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Append Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. Assign Designer Modal */}
      {assigningInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5 border border-slate-200">
            <button
              onClick={() => setAssigningInquiry(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900">Assign Wedding Inquiry</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lead: <strong className="text-amber-800 font-mono">{assigningInquiry.inquiry_id}</strong> ({assigningInquiry.customer_name})
              </p>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Artist / Designer</label>
                <select
                  value={selectedArtistId}
                  onChange={(e) => setSelectedArtistId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                  required
                >
                  <option value="">-- Choose an Artist from Directory --</option>
                  {artists.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.name} ({art.category || 'Performer'}) - {art.city || 'India'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningInquiry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !selectedArtistId}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
