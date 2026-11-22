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
} from 'lucide-react';

export default function AdminWeddingInvitationsPage() {
  const { artists } = useAdminAuth();
  const [inquiries, setInquiries] = useState<WeddingInquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleStatusChange = async (id: string, newStatus: WeddingInquiryRecord['status']) => {
    const res = await weddingInquiryService.updateStatus(id, newStatus);
    if (res.success) {
      showToast(`Inquiry status updated to ${newStatus}`);
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
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">New Request</span>;
      case 'CONTACTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">Contacted</span>;
      case 'DISCUSSION':
      case 'DESIGNING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">Designing</span>;
      case 'REVIEW':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">Under Review</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check size={16} /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/15 text-amber-400 rounded-lg border border-amber-500/30">
              <Sparkles size={20} />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Wedding Studio Oversight</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Super admin controls: view all wedding inquiries, assign to artists, change statuses, and track fulfillment.
          </p>
        </div>

        <button
          onClick={fetchInquiries}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-sm border border-white/10 transition-colors w-fit"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Leads
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400">Total Leads</div>
          <div className="text-2xl font-bold text-white mt-1">{metrics.total}</div>
        </div>
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-4">
          <div className="text-xs font-medium text-amber-400">New Requests</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{metrics.newCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-blue-500/20 rounded-xl p-4">
          <div className="text-xs font-medium text-blue-400">Contacted</div>
          <div className="text-2xl font-bold text-blue-300 mt-1">{metrics.contactedCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-purple-500/20 rounded-xl p-4">
          <div className="text-xs font-medium text-purple-400">Designing</div>
          <div className="text-2xl font-bold text-purple-300 mt-1">{metrics.inProgressCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4">
          <div className="text-xs font-medium text-emerald-400">Completed</div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{metrics.completedCount}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Inquiries' },
            { id: 'new', label: 'New Requests' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-slate-900/60 border border-white/5 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-amber-500" />
            <span>Loading inquiries...</span>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <Layers size={22} />
            </div>
            <p className="font-medium text-white">No wedding inquiries found</p>
            <p className="text-xs text-slate-500 mt-1">
              New customer inquiries submitted through the website will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Inquiry ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Wedding Date</th>
                  <th className="py-3 px-4">Type & Category</th>
                  <th className="py-3 px-4">Assigned Artist</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredInquiries.map((inq) => {
                  const cleanPhone = (inq.phone || '').replace(/[^0-9]/g, '');
                  const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

                  return (
                    <tr key={inq.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-amber-400">
                        {inq.inquiry_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{inq.customer_name}</div>
                        {inq.email && <div className="text-xs text-slate-500">{inq.email}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-300 font-mono">{inq.phone}</span>
                          {cleanPhone && (
                            <>
                              <a
                                href={`https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(inq.customer_name)}!%20This%20is%20Magnevents%20Admin%20regarding%20your%20wedding%20invitation%20inquiry%20[${inq.inquiry_id}].`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat on WhatsApp"
                                className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              >
                                <MessageCircle size={14} />
                              </a>
                              <a
                                href={`tel:${cleanPhone}`}
                                title="Call customer"
                                className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                              >
                                <Phone size={14} />
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-500" />
                          <span>{inq.wedding_date || 'Flexible / TBD'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-slate-200">{inq.invitation_type}</div>
                        <div className="text-slate-400">{inq.design_category}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {inq.assigned_artist_name ? (
                          <span className="font-medium text-purple-300 flex items-center gap-1">
                            <UserCheck size={13} /> {inq.assigned_artist_name}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(inq.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setAssigningInquiry(inq);
                              setSelectedArtistId(inq.assigned_artist_id || '');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition-colors"
                            title="Assign to Artist"
                          >
                            <UserCheck size={13} className="inline mr-1" />
                            {inq.assigned_artist_name ? 'Reassign' : 'Assign'}
                          </button>

                          <Link
                            href={`/wedding-invitations/${inq.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                          >
                            <Eye size={13} /> Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Artist Modal */}
      {assigningInquiry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setAssigningInquiry(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white bg-white/5"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Assign Inquiry to Artist</h3>
            <p className="text-xs text-slate-400 mb-4">
              Lead: <strong className="text-amber-400">{assigningInquiry.inquiry_id}</strong> ({assigningInquiry.customer_name})
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Select Artist / Designer</label>
                <select
                  value={selectedArtistId}
                  onChange={(e) => setSelectedArtistId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Choose an Artist --</option>
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
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !selectedArtistId}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors"
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
