"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import { ArtistProfile } from '../../../types/artist';
import { ArtistTierBadge, ArtistTierCard } from '../../../components/shared/ArtistTierBadge';
import { LocationFilter, matchesLocationFilter } from '../../../components/shared/LocationFilter';
import { WhatsAppShareActions } from '../../../components/shared/WhatsAppShareActions';
import { ModalPortal } from '../../../components/shared/ModalPortal';
import { getArtistRankMap, getArtistTierProgress } from '../../../lib/artistTiers';
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Music, 
  Sparkles, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Video, 
  FileText, 
  ShieldCheck, 
  Check, 
  X, 
  ExternalLink, 
  Star, 
  Globe, 
  Volume2, 
  Award,
  IdCard,
  Sliders,
  ChevronRight,
  UserCheck,
  Crown,
  Trophy,
  ArrowUpRight
} from 'lucide-react';

export default function AdminProfileCardsPage() {
  const { artists, updateArtistStatus } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<ArtistProfile | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'pricing' | 'media' | 'kyc'>('overview');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const CARDS_PER_PAGE = 5;

  const categories = ['all', 'Singer', 'Live Band', 'DJ', 'Instrumentalist'];
  const statuses = [
    { id: 'all', label: 'All Statuses' },
    { id: 'approved', label: 'Live & Verified' },
    { id: 'pending', label: 'Pending Review' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'rejected', label: 'Needs Updates' },
  ];

  const rankMap = getArtistRankMap(artists);

  const filteredArtists = artists
    .filter((a) => {
      // 1. Category Filter
      if (categoryFilter !== 'all' && !a.category?.toLowerCase().includes(categoryFilter.toLowerCase())) {
        return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && a.verification_status !== 'pending') return false;
        if (statusFilter === 'approved' && a.verification_status !== 'approved') return false;
        if (statusFilter === 'under_review' && a.verification_status !== 'under_review') return false;
        if (statusFilter === 'rejected' && a.verification_status !== 'rejected') return false;
      }

      // 2B. Location Filter
      if (!matchesLocationFilter(locationFilter, a.city, a.state)) {
        return false;
      }

      // 3. Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          (a.stage_name || '').toLowerCase().includes(q) ||
          (a.email || '').toLowerCase().includes(q) ||
          (a.phone_no || '').toLowerCase().includes(q) ||
          (a.city || '').toLowerCase().includes(q) ||
          (a.category || '').toLowerCase().includes(q) ||
          (a.genres || []).some((g) => g.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => (b.successful_bookings || 0) - (a.successful_bookings || 0));

  const handleQuickApprove = async (artist: ArtistProfile) => {
    await updateArtistStatus(artist.id, 'approved');
    setActionNotice(`Approved ${artist.name}! Profile is live & verified on magnevents.in`);
    setSelectedUser(prev => prev && prev.id === artist.id ? { ...prev, verification_status: 'approved', is_live: true } : prev);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleQuickRequestChanges = async (artist: ArtistProfile) => {
    await updateArtistStatus(artist.id, 'under_review', 'Please upload higher resolution performance videos and KYC proof.');
    setActionNotice(`Marked ${artist.name} as Under Review (Changes Requested).`);
    setSelectedUser(prev => prev && prev.id === artist.id ? { ...prev, verification_status: 'under_review' } : prev);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleConfirmReject = async (artist: ArtistProfile) => {
    await updateArtistStatus(artist.id, 'rejected', rejectionReason || 'Information does not satisfy platform requirements.');
    setActionNotice(`Rejected application for ${artist.name}. Feedback sent.`);
    setSelectedUser(prev => prev && prev.id === artist.id ? { ...prev, verification_status: 'rejected', is_live: false } : prev);
    setRejectionModalOpen(false);
    setRejectionReason('');
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-bold mb-2 shadow-xs">
            <IdCard className="w-3.5 h-3.5 text-sky-600" />
            <span>Performer Profile Explorer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Performer Profiles
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Click any performer card to inspect full credentials, showreels, KYC documents, and pricing.
          </p>
        </div>

        <span className="text-xs font-black uppercase tracking-wider text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-xs self-start sm:self-auto">
          {filteredArtists.length} {filteredArtists.length === 1 ? 'Profile' : 'Profiles'}
        </span>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. Compact Search & Filter Bar */}
      <div className="flex flex-col space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by artist name, stage name, city, or genre..."
              className="w-full pl-11 pr-4 h-11 rounded-2xl border border-slate-200 bg-white shadow-xs text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
            />
          </div>

          <LocationFilter
            value={locationFilter}
            onChange={(city) => {
              setLocationFilter(city);
              setCurrentPage(1);
            }}
            availableCities={artists.map((a) => a.city)}
            className="h-11 px-3.5 rounded-2xl flex-shrink-0"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Status Pills */}
          <div className="flex p-1 bg-slate-200/50 rounded-xl border border-slate-200/60 items-center overflow-x-auto max-w-full">
            {statuses.map((st) => {
              const isSelected = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setStatusFilter(st.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-sky-600 shadow-xs border border-slate-100'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            {categories.map((cat) => {
              const isCatActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                    isCatActive
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat === 'all' ? 'All Acts' : cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Static Compact 5-Cards-Per-Page Grid */}
      {filteredArtists.length === 0 ? (
        <div className="luxe-card p-12 text-center flex flex-col items-center justify-center gap-2">
          <Users className="w-10 h-10 text-slate-200" />
          <h3 className="text-sm font-bold text-slate-500">No Performer Profiles Found</h3>
          <p className="text-xs text-slate-400">Try adjusting your search query or status filters.</p>
        </div>
      ) : (() => {
        const totalPages = Math.max(1, Math.ceil(filteredArtists.length / CARDS_PER_PAGE));
        const safePage = Math.min(currentPage, totalPages);
        const startIdx = (safePage - 1) * CARDS_PER_PAGE;
        const paginatedArtists = filteredArtists.slice(startIdx, startIdx + CARDS_PER_PAGE);

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {paginatedArtists.map((artist) => {
                const isApproved = artist.verification_status === 'approved';
                const isRejected = artist.verification_status === 'rejected';
                const isUnderReview = artist.verification_status === 'under_review';
                const startingFee = artist.submitted_pricing?.starting_price || artist.price_min || 15000;
                const rankInfo = rankMap[artist.id] || { rank: 1, totalCompleted: artist.successful_bookings || 0 };
                const tierProg = getArtistTierProgress(rankInfo.totalCompleted);
                const TierIcon =
                  tierProg.tier.level === 5
                    ? Crown
                    : tierProg.tier.level === 4
                    ? Trophy
                    : tierProg.tier.level === 3
                    ? Award
                    : tierProg.tier.level === 2
                    ? Star
                    : Sparkles;

                return (
                  <div
                    key={artist.id}
                    onClick={() => {
                      setModalTab('overview');
                      setRejectionModalOpen(false);
                      setSelectedUser(artist);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setModalTab('overview');
                        setRejectionModalOpen(false);
                        setSelectedUser(artist);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-3 cursor-pointer flex flex-col justify-between gap-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {/* Top Row: Rank + Status */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700">
                        <span className="text-sky-600">#{rankInfo.rank}</span>
                        <TierIcon className={`w-3 h-3 ${tierProg.tier.iconColor}`} />
                        <span className="truncate max-w-[92px]">{tierProg.tier.name}</span>
                      </span>

                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border flex-shrink-0 ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isRejected
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isUnderReview
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isApproved
                          ? 'Verified'
                          : isRejected
                          ? 'Rejected'
                          : isUnderReview
                          ? 'Review'
                          : 'Pending'}
                      </span>
                    </div>

                    {/* Identity Row: Small Square Avatar + Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={artist.profile_image_url || artist.cover_image_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200'}
                        alt={artist.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop';
                        }}
                        className="w-11 h-11 rounded-lg object-cover object-top border border-slate-200 flex-shrink-0 bg-slate-100"
                      />
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-900 leading-tight truncate">
                          {artist.name}
                        </h3>
                        <p className="text-[10px] font-semibold text-sky-700 truncate mt-0.5">
                          {artist.category}
                        </p>
                        <div className="flex items-center gap-0.5 text-[10px] text-slate-500 truncate">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{artist.city || 'India'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Compact Metrics Row */}
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px]">
                      <span className="font-bold text-slate-800">{rankInfo.totalCompleted} Events</span>
                      <span className="inline-flex items-center gap-0.5 font-bold text-slate-800">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        {artist.rating || 4.9}
                      </span>
                    </div>

                    {/* Price + Live Indicator */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xs font-extrabold text-slate-900">
                          ₹{Number(startingFee).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] text-slate-400">/evt</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold ${
                          artist.is_live ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            artist.is_live ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        {artist.is_live ? 'Live' : 'Offline'}
                      </span>
                    </div>

                    {/* Compact Static Actions: Copy + WP + View */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <WhatsAppShareActions
                        artist={artist}
                        rank={rankInfo.rank}
                        completedEvents={rankInfo.totalCompleted}
                        variant="compact"
                      />
                      <span className="h-7 px-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-[10px] font-semibold inline-flex items-center">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clean Pagination Bar (Strictly 5 Cards per Page) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">
                  Showing {startIdx + 1}–{Math.min(startIdx + CARDS_PER_PAGE, filteredArtists.length)} of {filteredArtists.length} performers
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <span className="px-2.5 py-1.5 font-bold text-slate-700">
                    Page {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* 4. MODERN EXECUTIVE TABBED USER PROFILE INSPECTOR MODAL */}
      {selectedUser && (() => {
        const userRank = rankMap[selectedUser.id] || {
          rank: 1,
          totalCompleted: selectedUser.successful_bookings || 0,
        };
        const userTier = getArtistTierProgress(userRank.totalCompleted);
        const isUserApproved = selectedUser.verification_status === 'approved';
        const isUserRejected = selectedUser.verification_status === 'rejected';
        const isUserReviewing = selectedUser.verification_status === 'under_review';
        const startingRate =
          selectedUser.submitted_pricing?.starting_price ||
          selectedUser.submitted_pricing?.solo_price ||
          selectedUser.price_min ||
          15000;

        return (
          <ModalPortal isOpen={true} onClose={() => setSelectedUser(null)}>
            <div
              className="w-full max-w-5xl max-h-[90vh] bg-[#F8FAFC] rounded-[24px] border border-slate-200/80 shadow-[0_30px_80px_-15px_rgba(15,23,42,0.5)] flex flex-col overflow-hidden font-sans overscroll-contain"
            >
              {/* A. Executive Midnight Navy Header (matches Admin Portal sidebar) */}
              <div className="sidebar-dark px-6 py-5 sm:px-7 sm:py-6 flex-shrink-0 relative overflow-hidden">
                {/* Subtle ambient glow */}
                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
                <div className="absolute left-1/3 -bottom-20 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Portrait + Identity */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          selectedUser.profile_image_url ||
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300'
                        }
                        alt={selectedUser.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop';
                        }}
                        className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl object-cover object-top ring-2 ring-white/20 shadow-xl bg-slate-800"
                      />
                      {isUserApproved && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0F172A] flex items-center justify-center text-white shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none truncate">
                          {selectedUser.name}
                        </h2>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isUserApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : isUserRejected
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                              : isUserReviewing
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          }`}
                        >
                          {selectedUser.verification_status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                        {selectedUser.stage_name || selectedUser.name}
                        <span className="mx-2 text-white/25">•</span>
                        <span className="text-sky-300 font-semibold">{selectedUser.category}</span>
                        <span className="mx-2 text-white/25">•</span>
                        <span>{selectedUser.city || 'India'}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <ArtistTierBadge
                          completedEvents={userRank.totalCompleted}
                          rankPosition={userRank.rank}
                          size="xs"
                        />
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-mono font-semibold">
                          #{selectedUser.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Contact + WhatsApp Copy/Send + Profile Completion + Close */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <WhatsAppShareActions
                        artist={selectedUser}
                        rank={userRank.rank}
                        completedEvents={userRank.totalCompleted}
                        variant="header-dark"
                      />
                      {selectedUser.phone_no && (
                        <a
                          href={`tel:${selectedUser.phone_no}`}
                          className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                          title="Call performer"
                        >
                          <Phone className="w-3.5 h-3.5 text-sky-400" />
                          <span className="hidden xl:inline">Call</span>
                        </a>
                      )}
                      {selectedUser.email && (
                        <a
                          href={`mailto:${selectedUser.email}`}
                          className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                          title="Email performer"
                        >
                          <Mail className="w-3.5 h-3.5 text-sky-400" />
                          <span className="hidden xl:inline">Email</span>
                        </a>
                      )}
                    </div>

                    <div className="hidden md:flex flex-col items-end pl-2 border-l border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                        Profile Setup
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 h-1.5 rounded-full bg-white/15 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${selectedUser.profile_completion || 85}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-emerald-300">
                          {selectedUser.profile_completion || 85}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 transition-colors"
                      aria-label="Close details"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* B. Clean Segmented Navigation Tabs (Zero Endless Scrolling) */}
              <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 flex-shrink-0 overflow-x-auto">
                <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/70 items-center gap-1">
                  {[
                    { id: 'overview', label: 'Overview & Rank', icon: UserCheck },
                    { id: 'pricing', label: 'Pricing & Rider', icon: DollarSign },
                    {
                      id: 'media',
                      label: `Portfolio & Media (${selectedUser.youtube_links?.length || 0})`,
                      icon: Video,
                    },
                    { id: 'kyc', label: 'KYC & Identity', icon: ShieldCheck },
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    const active = modalTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setModalTab(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                          active
                            ? 'bg-white text-sky-600 shadow-sm border border-slate-200/60'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <TabIcon className={`w-3.5 h-3.5 ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 whitespace-nowrap">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedUser.is_live ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                    }`}
                  />
                  {selectedUser.is_live ? 'Visible on magnevents.in' : 'Hidden from public catalog'}
                </span>
              </div>

              {/* C. Airy Tabbed Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F8FAFC]">
                {/* TAB 1: OVERVIEW & RANK */}
                {modalTab === 'overview' && (
                  <div className="space-y-5 animate-in fade-in">
                    {/* 4 Crisp KPI Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Starting Rate
                        </span>
                        <span className="text-xl font-black text-slate-900 block mt-1">
                          ₹{Number(startingRate).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Events Completed
                        </span>
                        <span className="text-xl font-black text-slate-900 block mt-1">
                          {userRank.totalCompleted}
                          <span className="text-xs font-bold text-sky-600 ml-1.5">
                            ({userTier.tier.name})
                          </span>
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Client Rating
                        </span>
                        <span className="text-xl font-black text-slate-900 flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          {selectedUser.rating || 4.9}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Stage Experience
                        </span>
                        <span className="text-xl font-black text-slate-900 block mt-1">
                          {selectedUser.experience_years || 3} Years
                        </span>
                      </div>
                    </div>

                    {/* Two-Column Info Grid: Contact + Bio & Repertoire */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Contact & Identity Card */}
                      <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                          <UserCheck className="w-4 h-4 text-sky-600" />
                          <span>Contact & Location</span>
                        </h3>

                        <div className="space-y-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-semibold">Legal Name</span>
                            <span className="font-bold text-slate-900">{selectedUser.name}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-semibold">Email</span>
                            <a
                              href={`mailto:${selectedUser.email}`}
                              className="font-bold text-sky-600 hover:underline truncate max-w-[210px]"
                            >
                              {selectedUser.email || 'N/A'}
                            </a>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-semibold">Phone / WhatsApp</span>
                            <a
                              href={`tel:${selectedUser.phone_no}`}
                              className="font-bold text-slate-900 hover:text-sky-600"
                            >
                              {selectedUser.phone_no || 'N/A'}
                            </a>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-semibold">Base City</span>
                            <span className="font-bold text-slate-900">
                              {selectedUser.city}, {selectedUser.state || 'India'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-semibold">Specialty</span>
                            <span className="font-bold text-slate-900 text-right">
                              {selectedUser.sub_category || selectedUser.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio, Genres & Languages Card */}
                      <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                          <Music className="w-4 h-4 text-indigo-600" />
                          <span>Artistic Profile & Repertoire</span>
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {selectedUser.bio || 'No detailed biography submitted yet.'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                              Genres
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(selectedUser.genres || []).map((g, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 text-[11px] font-bold"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                              Languages
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(selectedUser.languages || ['Hindi', 'English']).map((lang, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                                >
                                  {lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5-Position Milestone Progression Card */}
                    <ArtistTierCard
                      completedEvents={userRank.totalCompleted}
                      rankPosition={userRank.rank}
                      artistName={selectedUser.name}
                    />
                  </div>
                )}

                {/* TAB 2: PRICING & STAGE RIDER */}
                {modalTab === 'pricing' && (
                  <div className="space-y-5 animate-in fade-in">
                    {/* 4-Tier Pricing Grid */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                        <DollarSign className="w-4 h-4 text-amber-500" />
                        <span>Submitted Performance Packages</span>
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Solo Acoustic</span>
                          <span className="text-xl font-black text-slate-900 block mt-1">
                            ₹{(selectedUser.submitted_pricing?.solo_price || selectedUser.price_min || 15000).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Duo Show</span>
                          <span className="text-xl font-black text-slate-900 block mt-1">
                            ₹{(selectedUser.submitted_pricing?.duo_price || 25000).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Band</span>
                          <span className="text-xl font-black text-slate-900 block mt-1">
                            ₹{(selectedUser.submitted_pricing?.band_price || selectedUser.price_max || 50000).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Hourly Overtime</span>
                          <span className="text-xl font-black text-slate-900 block mt-1">
                            ₹{(selectedUser.submitted_pricing?.hourly_price || 3000).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {selectedUser.submitted_pricing?.travel_charges_policy && (
                        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-slate-700">
                          <strong className="text-sky-900">Travel & Hospitality Policy:</strong>{' '}
                          {selectedUser.submitted_pricing.travel_charges_policy}
                        </div>
                      )}
                    </div>

                    {/* Stage Logistics & Technical Rider */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                        <Volume2 className="w-4 h-4 text-emerald-600" />
                        <span>Stage Logistics & Technical Rider</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Set Duration</span>
                          <span className="text-sm font-black text-slate-900 block mt-1">
                            {selectedUser.performance_details?.min_duration_minutes || 60} –{' '}
                            {selectedUser.performance_details?.max_duration_minutes || 180} mins
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Sound PA Equipment</span>
                          <span className="text-sm font-bold text-slate-900 block mt-1">
                            {selectedUser.performance_details?.sound_system_provided
                              ? '✓ Artist Provides PA'
                              : 'Venue / Host Arranges PA'}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Travel Readiness</span>
                          <span className="text-sm font-black text-slate-900 uppercase block mt-1">
                            {selectedUser.performance_details?.travel_readiness?.replace('_', ' ') || 'Pan-India'}
                          </span>
                        </div>
                      </div>

                      {selectedUser.performance_details?.technical_requirements && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Technical Requirements
                          </span>
                          <p className="text-xs font-medium text-slate-700 leading-relaxed">
                            {selectedUser.performance_details.technical_requirements}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: PORTFOLIO & MEDIA */}
                {modalTab === 'media' && (
                  <div className="space-y-5 animate-in fade-in">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                        <Video className="w-4 h-4 text-rose-500" />
                        <span>Live Performance Video Showreels</span>
                      </h3>

                      {selectedUser.youtube_links && selectedUser.youtube_links.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedUser.youtube_links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 group transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                                  <Video className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-black text-slate-900 block">
                                    Live Showreel #{idx + 1}
                                  </span>
                                  <span className="text-[11px] text-slate-500 truncate block">{link}</span>
                                </div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-600 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-4 text-center">No video showreels submitted yet.</p>
                      )}
                    </div>

                    {/* Audio Samples */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                        <Volume2 className="w-4 h-4 text-indigo-600" />
                        <span>Audio Tracks & Social Channels</span>
                      </h3>

                      {selectedUser.audio_samples && selectedUser.audio_samples.length > 0 ? (
                        <div className="space-y-2">
                          {selectedUser.audio_samples.map((audio, i) => (
                            <a
                              key={i}
                              href={audio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                            >
                              <span className="truncate font-mono">{audio}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No audio samples attached.</p>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        {[
                          { label: 'Instagram', url: selectedUser.instagram_url },
                          { label: 'YouTube', url: selectedUser.youtube_url },
                          { label: 'Spotify', url: selectedUser.spotify_url },
                          { label: 'Website', url: selectedUser.website_url },
                        ]
                          .filter((s) => Boolean(s.url))
                          .map((social) => (
                            <a
                              key={social.label}
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-xs font-bold text-slate-700 hover:text-sky-700 inline-flex items-center gap-1.5 transition-all"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>{social.label}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: KYC & IDENTITY VERIFICATION */}
                {modalTab === 'kyc' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                        <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          <span>Confidential KYC Dossier</span>
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase">
                          Director Eyes Only
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Legal Name on ID</span>
                          <span className={`text-sm block mt-1 ${selectedUser.verification_documents?.legal_name ? 'font-black text-slate-900' : 'font-medium text-slate-400'}`}>
                            {selectedUser.verification_documents?.legal_name || 'Not filled'}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Govt ID &amp; Aadhaar Number</span>
                          <span className={`text-sm block mt-1 ${selectedUser.verification_documents?.id_type || selectedUser.verification_documents?.id_number_masked ? 'font-black text-slate-900 uppercase' : 'font-medium text-slate-400'}`}>
                            {selectedUser.verification_documents?.id_type || selectedUser.verification_documents?.id_number_masked
                              ? [
                                  selectedUser.verification_documents?.id_type,
                                  selectedUser.verification_documents?.id_number_masked,
                                ]
                                  .filter(Boolean)
                                  .join(' • ')
                              : 'Not filled'}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">PAN / Tax ID</span>
                          <span className={`text-sm font-mono block mt-1 ${selectedUser.verification_documents?.pan_or_tax_id ? 'font-black text-slate-900' : 'font-medium text-slate-400'}`}>
                            {selectedUser.verification_documents?.pan_or_tax_id || 'Not filled'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        {selectedUser.verification_documents?.id_document_url ? (
                          <a
                            href={selectedUser.verification_documents.id_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Inspect Uploaded Govt ID</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-rose-700 font-semibold text-xs">No Govt ID attached</span>
                        )}
                        {selectedUser.verification_documents?.address_proof_url && (
                          <a
                            href={selectedUser.verification_documents.address_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all"
                          >
                            <FileText className="w-4 h-4 text-sky-600" />
                            <span>Inspect Address Proof</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Input Box if triggered */}
                {rejectionModalOpen && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5 shadow-xs">
                    <label className="block text-xs font-black text-rose-800">
                      Reason for Rejection / Changes Needed
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Specify what needs to be improved (e.g. Upload a sharper stage video, update travel charges)..."
                      className="w-full p-3 bg-white border border-rose-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 h-20"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setRejectionModalOpen(false)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmReject(selectedUser)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* D. Clean Sticky Director Decision Footer */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Director Action:
                  </span>
                  <span className="font-black text-slate-800 capitalize">
                    {selectedUser.verification_status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setRejectionModalOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition-all"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => handleQuickRequestChanges(selectedUser)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs transition-all"
                  >
                    Request Changes
                  </button>

                  <button
                    onClick={() => handleQuickApprove(selectedUser)}
                    className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 border border-emerald-400 text-white font-black text-xs py-2.5 px-5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Approve & Go Live</span>
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        );
      })()}
    </div>
  );
}
