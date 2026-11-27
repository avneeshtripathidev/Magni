"use client";

import React, { useState } from 'react';
import { ArtistProfile } from '../../types/artist';
import { useAdminAuth } from '../../lib/auth/adminAuthContext';
import { ArtistTierBadge, ArtistTierCard } from '../shared/ArtistTierBadge';
import { WhatsAppShareActions } from '../shared/WhatsAppShareActions';
import { ModalPortal } from '../shared/ModalPortal';
import { getArtistRankMap, getArtistTierProgress } from '../../lib/artistTiers';
import { getLiveArtistProfileUrl } from '../../lib/utils';
import { getSecureKycUrl } from '../../lib/security/kycEncryption';
import {
  Users,
  Search,
  Filter,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
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
  ArrowUpRight,
  Trash2,
  Loader2,
  Database,
  Copy,
  CheckCheck,
  Hash,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  Wrench,
  Shield,
  FileCode,
  Info,
} from 'lucide-react';

interface ArtistDetailModalProps {
  artist: ArtistProfile | null;
  onClose: () => void;
}

export function ArtistDetailModal({ artist, onClose }: ArtistDetailModalProps) {
  const { artists, updateArtistStatus, deleteArtist, toggleArtistLive } = useAdminAuth();
  const [modalTab, setModalTab] = useState<'overview' | 'all-details' | 'pricing' | 'media' | 'kyc'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  };
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!artist) return null;

  const currentArtist = artists.find((a) => a.id === artist.id) || artist;

  const rankMap = getArtistRankMap(artists);
  const userRank = rankMap[currentArtist.id] || {
    rank: 1,
    totalCompleted: currentArtist.successful_bookings || 0,
  };
  const userTier = getArtistTierProgress(userRank.totalCompleted);
  const isUserApproved = currentArtist.verification_status === 'approved';
  const isUserRejected = currentArtist.verification_status === 'rejected';
  const isUserReviewing = currentArtist.verification_status === 'under_review';
  const startingRate =
    currentArtist.submitted_pricing?.starting_price ||
    currentArtist.submitted_pricing?.solo_price ||
    currentArtist.price_min ||
    15000;

  const handleTakeOffLive = async () => {
    await toggleArtistLive(currentArtist.id, false);
    setActionNotice(`"${currentArtist.stage_name || currentArtist.name}" has been taken off live from main website.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleMakeLive = async () => {
    await toggleArtistLive(currentArtist.id, true);
    setActionNotice(`"${currentArtist.stage_name || currentArtist.name}" is now live on main website!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleQuickApprove = async () => {
    await toggleArtistLive(currentArtist.id, true);
    setActionNotice(`Approved ${currentArtist.name}! Profile is now live on main website.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleQuickRequestChanges = async () => {
    await updateArtistStatus(
      currentArtist.id,
      'under_review',
      'Please upload higher resolution performance videos and KYC proof.'
    );
    setActionNotice(`Marked ${currentArtist.name} as Under Review.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleConfirmReject = async () => {
    await updateArtistStatus(
      currentArtist.id,
      'rejected',
      rejectionReason || 'Information does not satisfy platform requirements.'
    );
    setActionNotice(`Rejected application for ${currentArtist.name}. Feedback sent.`);
    setRejectionModalOpen(false);
    setRejectionReason('');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDeleteProfile = async () => {
    setDeleting(true);
    try {
      await deleteArtist(currentArtist.id);
      setDeleteConfirmOpen(false);
      onClose();
    } catch (err) {
      console.error('Failed to remove profile:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div className="w-full max-w-5xl max-h-[90vh] bg-[#F8FAFC] rounded-[24px] border border-slate-200/80 shadow-[0_30px_80px_-15px_rgba(15,23,42,0.5)] flex flex-col overflow-hidden font-sans overscroll-contain animate-in fade-in zoom-in-95 duration-200">
        {/* A. Executive Header */}
        <div className="sidebar-dark px-5 py-4 sm:px-7 sm:py-6 flex-shrink-0 relative overflow-hidden bg-slate-900 text-white">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-20 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Portrait + Identity */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src={
                    artist.profile_image_url ||
                    '/logo.webp'
                  }
                  alt={artist.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      '/logo.webp';
                  }}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ring-2 ring-white/20 shadow-xl ${
                    artist.profile_image_url && artist.profile_image_url !== '/logo.webp'
                      ? 'object-cover object-top bg-slate-800'
                      : 'object-contain p-2 bg-slate-950'
                  }`}
                />
                {isUserApproved && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none truncate">
                    {currentArtist.name}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isUserApproved
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : isUserRejected
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                        : isUserReviewing
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {currentArtist.verification_status?.replace('_', ' ') || 'Pending'}
                  </span>

                  {currentArtist.is_live ? (
                    <a
                      href={getLiveArtistProfileUrl(currentArtist)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-400/40 transition-all hover:scale-105 shadow-xs cursor-pointer group"
                      title="Click to view live public page on magnevents.in"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live on Website</span>
                      <ArrowUpRight className="w-3 h-3 text-emerald-300 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-white/10 text-slate-300 border border-white/20">
                      <EyeOff className="w-3 h-3 text-slate-400" />
                      <span>Not Live</span>
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  {artist.stage_name || artist.name}
                  <span className="mx-2 text-white/25">•</span>
                  <span className="text-sky-300 font-semibold">{artist.category || 'Performer'}</span>
                  <span className="mx-2 text-white/25">•</span>
                  <span>{artist.city || 'India'}</span>
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <ArtistTierBadge
                    completedEvents={userRank.totalCompleted}
                    rankPosition={userRank.rank}
                    size="xs"
                  />
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-mono font-semibold">
                    #{artist.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5">
                <a
                  href={getLiveArtistProfileUrl(currentArtist)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/40 text-white text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95 group"
                  title="Open live public profile on magnevents.in in a new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200 group-hover:scale-110 transition-transform" />
                  <span>Live Website Page</span>
                </a>
                <WhatsAppShareActions
                  artist={artist}
                  rank={userRank.rank}
                  completedEvents={userRank.totalCompleted}
                  variant="header-dark"
                />
                {artist.phone_no && (
                  <a
                    href={`tel:${artist.phone_no}`}
                    className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                    title="Call performer"
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden xl:inline">Call</span>
                  </a>
                )}
                {artist.email && (
                  <a
                    href={`mailto:${artist.email}`}
                    className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                    title="Email performer"
                  >
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden xl:inline">Email</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/25 text-white/70 hover:text-rose-300 border border-white/10 transition-colors"
                  title="Remove profile permanently"
                  aria-label="Remove Profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 transition-colors"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="bg-sky-500 text-white px-5 py-2.5 text-xs font-bold flex items-center justify-between shadow-inner">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {actionNotice}
            </span>
            <button onClick={() => setActionNotice(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* B. Segmented Navigation Tabs */}
        <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 flex-shrink-0 overflow-x-auto">
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/70 items-center gap-1">
            {[
              { id: 'overview', label: 'Overview & Rank', icon: UserCheck },
              { id: 'all-details', label: 'All Details (DB)', icon: Database },
              { id: 'pricing', label: 'Pricing & Rider', icon: DollarSign },
              {
                id: 'media',
                label: `Portfolio & Media (${artist.youtube_links?.length || 0})`,
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
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    active
                      ? 'bg-white text-sky-600 shadow-xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <a
            href={getLiveArtistProfileUrl(currentArtist)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all whitespace-nowrap shadow-2xs group"
            title="Open live public profile on magnevents.in in a new tab"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                artist.is_live ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
            />
            <span>{artist.is_live ? 'Visible on magnevents.in' : 'View on magnevents.in'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* C. Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#F8FAFC]">
          {/* TAB 1: OVERVIEW & RANK */}
          {modalTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in">
              {/* KPI Cards */}
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
                    {artist.rating || 4.9}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Stage Experience
                  </span>
                  <span className="text-xl font-black text-slate-900 block mt-1">
                    {artist.experience_years || 3} Years
                  </span>
                </div>
              </div>

              {/* Contact + Repertoire */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <UserCheck className="w-4 h-4 text-sky-600" />
                    <span>Contact &amp; Location</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-semibold">Legal Name</span>
                      <span className="font-bold text-slate-900">{artist.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-semibold">Email</span>
                      <a
                        href={`mailto:${artist.email}`}
                        className="font-bold text-sky-600 hover:underline truncate max-w-[210px]"
                      >
                        {artist.email || 'N/A'}
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-semibold">Phone / WhatsApp</span>
                      <a
                        href={`tel:${artist.phone_no}`}
                        className="font-bold text-slate-900 hover:text-sky-600"
                      >
                        {artist.phone_no || 'N/A'}
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-semibold">Base City</span>
                      <span className="font-bold text-slate-900">
                        {artist.city}, {artist.state || 'India'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-semibold">Specialty</span>
                      <span className="font-bold text-slate-900 text-right">
                        {artist.sub_category || artist.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <Music className="w-4 h-4 text-indigo-600" />
                    <span>Artistic Profile &amp; Repertoire</span>
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {artist.bio || 'No detailed biography submitted yet.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Genres
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(artist.genres || []).map((g, i) => (
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
                        {(artist.languages || ['Hindi', 'English']).map((lang, i) => (
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

              {/* Milestone Card */}
              <ArtistTierCard
                completedEvents={userRank.totalCompleted}
                rankPosition={userRank.rank}
                artistName={artist.name}
              />

              {/* Quick All Details & DB Dossier Preview Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Complete Database Dossier (All Fields Stored in DB)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        All system attributes, technical rider specifications, pricing tiers, and compliance records.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalTab('all-details')}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-xs self-start sm:self-auto cursor-pointer"
                  >
                    <span>View All Details (Cards of 3-4)</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Database UUID</span>
                    <span className="text-xs font-mono font-bold text-slate-900 block truncate mt-0.5" title={currentArtist.id}>
                      {currentArtist.id}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pricing Range</span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      ₹{Number(currentArtist.price_min || 0).toLocaleString('en-IN')} – ₹{Number(currentArtist.price_max || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Logistics &amp; PA</span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {currentArtist.performance_details?.sound_system_provided ? 'Artist Provides PA' : 'Venue Provides PA'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Govt KYC Status</span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {currentArtist.verification_documents?.id_type ? `${currentArtist.verification_documents.id_type.toUpperCase()} Attached` : 'No KYC Document'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & RIDER */}
          {modalTab === 'pricing' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span>Submitted Performance Packages</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Solo Acoustic</span>
                    <span className="text-xl font-black text-slate-900 block mt-1">
                      ₹{(artist.submitted_pricing?.solo_price || artist.price_min || 15000).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Duo Show</span>
                    <span className="text-xl font-black text-slate-900 block mt-1">
                      ₹{(artist.submitted_pricing?.duo_price || 25000).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Band</span>
                    <span className="text-xl font-black text-slate-900 block mt-1">
                      ₹{(artist.submitted_pricing?.band_price || artist.price_max || 50000).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Hourly Overtime</span>
                    <span className="text-xl font-black text-slate-900 block mt-1">
                      ₹{(artist.submitted_pricing?.hourly_price || 3000).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {artist.submitted_pricing?.travel_charges_policy && (
                  <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-slate-700">
                    <strong className="text-sky-900">Travel &amp; Hospitality Policy:</strong>{' '}
                    {artist.submitted_pricing.travel_charges_policy}
                  </div>
                )}
              </div>

              {/* Rider */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>Stage Logistics &amp; Technical Rider</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Set Duration</span>
                    <span className="text-sm font-black text-slate-900 block mt-1">
                      {artist.performance_details?.min_duration_minutes || 60} –{' '}
                      {artist.performance_details?.max_duration_minutes || 180} mins
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sound PA Equipment</span>
                    <span className="text-sm font-bold text-slate-900 block mt-1">
                      {artist.performance_details?.sound_system_provided
                        ? '✓ Artist Provides PA'
                        : 'Venue / Host Arranges PA'}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Travel Readiness</span>
                    <span className="text-sm font-black text-slate-900 uppercase block mt-1">
                      {artist.performance_details?.travel_readiness?.replace('_', ' ') || 'Pan-India'}
                    </span>
                  </div>
                </div>

                {artist.performance_details?.technical_requirements && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Technical Requirements
                    </span>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                      {artist.performance_details.technical_requirements}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA */}
          {modalTab === 'media' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Video className="w-4 h-4 text-rose-500" />
                  <span>Live Performance Video Showreels</span>
                </h3>

                {artist.youtube_links && artist.youtube_links.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {artist.youtube_links.map((link, idx) => (
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

              {/* Audio & Social Links */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Volume2 className="w-4 h-4 text-indigo-600" />
                  <span>Social &amp; Streaming Channels</span>
                </h3>

                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { label: 'Instagram', url: artist.instagram_url },
                    { label: 'YouTube', url: artist.youtube_url },
                    { label: 'Spotify', url: artist.spotify_url },
                    { label: 'Website', url: artist.website_url },
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

          {/* TAB 4: KYC & IDENTITY */}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Legal Name on ID</span>
                    <span className={`text-sm block mt-1 ${artist.verification_documents?.legal_name ? 'font-black text-slate-900' : 'font-medium text-slate-400'}`}>
                      {artist.verification_documents?.legal_name || 'Not filled'}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Aadhaar / Govt ID &amp; Number</span>
                    <span className={`text-sm block mt-1 ${artist.verification_documents?.id_type || artist.verification_documents?.id_number_masked ? 'font-black text-slate-900 uppercase' : 'font-medium text-slate-400'}`}>
                      {artist.verification_documents?.id_type || artist.verification_documents?.id_number_masked
                        ? [
                            artist.verification_documents?.id_type || 'AADHAAR',
                            artist.verification_documents?.id_number_masked,
                          ]
                            .filter(Boolean)
                            .join(' • ')
                        : 'Not filled'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  {artist.verification_documents?.id_document_url ? (
                    <a
                      href={getSecureKycUrl(artist.verification_documents.id_document_url)}
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
                  {artist.verification_documents?.address_proof_url && (
                    <a
                      href={getSecureKycUrl(artist.verification_documents.address_proof_url)}
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

          {/* TAB 5: ALL DETAILS (COMPLETE DB DOSSIER) */}
          {modalTab === 'all-details' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Executive Header Banner */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-sky-400" />
                      Supabase DB Record
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                      Table: public.artists
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      UUID: {currentArtist.id}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Complete Database Dossier — {currentArtist.name}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Every field, relational array, and JSON specification stored in the database for this performer, rendered in modern modular cards.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(JSON.stringify(currentArtist, null, 2), 'raw-json')}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    {copiedField === 'raw-json' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                    )}
                    <span>{copiedField === 'raw-json' ? 'Copied Full JSON!' : 'Copy Raw JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{showRawJson ? 'Hide JSON View' : 'Raw JSON View'}</span>
                    {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Optional Collapsible Raw JSON Viewer */}
              {showRawJson && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 shadow-xl overflow-hidden space-y-2 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[11px] font-mono font-bold text-sky-400 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5" />
                      raw_record.json ({Object.keys(currentArtist).length} root keys)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(currentArtist, null, 2), 'raw-json-viewer')}
                      className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedField === 'raw-json-viewer' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-96 p-3 bg-black/60 rounded-xl leading-relaxed">
                    {JSON.stringify(currentArtist, null, 2)}
                  </pre>
                </div>
              )}

              {/* MODERN 3-4 COLUMN CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* CARD 1: Database & System Keys */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-600" />
                        <span>1. System &amp; DB Keys</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold">
                        SQL Keys
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Database UUID</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentArtist.id, 'id')}
                            className="text-[10px] text-sky-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>{copiedField === 'id' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-slate-800 break-all block mt-0.5">
                          {currentArtist.id}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Auth User ID</span>
                          {currentArtist.user_id && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(currentArtist.user_id || '', 'user_id')}
                              className="text-[10px] text-sky-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>{copiedField === 'user_id' ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-slate-700 break-all block mt-0.5">
                          {currentArtist.user_id || 'Direct Platform Profile (No User Link)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                        <span className="text-slate-500 font-medium">Serial No</span>
                        <span className="font-mono font-bold text-slate-900">
                          {(currentArtist as any).artist_no || '#' + currentArtist.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">URL Slug</span>
                        <span className="font-mono font-bold text-sky-700 truncate max-w-[150px]">
                          /{currentArtist.slug}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Spotlight Tier</span>
                        <span className="font-bold text-slate-900 capitalize">
                          {(currentArtist as any).spotlight_status || 'Standard'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Artist of Month</span>
                        <span className={`font-bold ${(currentArtist as any).is_artist_of_month ? 'text-amber-600 font-black' : 'text-slate-600'}`}>
                          {(currentArtist as any).is_artist_of_month ? '★ Featured' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-mono text-slate-600">
                        {currentArtist.created_at ? new Date(currentArtist.created_at).toLocaleDateString('en-IN') : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span className="font-mono text-slate-600">
                        {currentArtist.updated_at ? new Date(currentArtist.updated_at).toLocaleDateString('en-IN') : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Contact, Location & Outreach */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-sky-600" />
                        <span>2. Contact &amp; Territory</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-bold">
                        Outreach
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Legal Registered Name</span>
                        <span className="font-bold text-slate-900 text-sm block mt-0.5">
                          {currentArtist.name}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Stage / Act Name</span>
                        <span className="font-bold text-sky-600 block mt-0.5">
                          {currentArtist.stage_name || currentArtist.name}
                        </span>
                      </div>

                      <div className="pt-1 border-t border-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Primary Phone</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentArtist.phone_no, 'phone')}
                            className="text-[10px] text-sky-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>{copiedField === 'phone' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <a
                          href={`tel:${currentArtist.phone_no}`}
                          className="font-bold text-slate-900 hover:text-sky-600 block mt-0.5"
                        >
                          {currentArtist.phone_no || 'N/A'}
                        </a>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Official Email</span>
                          {currentArtist.email && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(currentArtist.email || '', 'email')}
                              className="text-[10px] text-sky-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>{copiedField === 'email' ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </div>
                        <a
                          href={`mailto:${currentArtist.email}`}
                          className="font-bold text-sky-600 hover:underline block truncate mt-0.5"
                        >
                          {currentArtist.email || 'N/A'}
                        </a>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                        <span className="text-slate-500 font-medium">Base City</span>
                        <span className="font-bold text-slate-900">{currentArtist.city}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">State / Region</span>
                        <span className="font-bold text-slate-900">{currentArtist.state || 'India'}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Country</span>
                        <span className="font-bold text-slate-900">{currentArtist.country || 'India'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">WhatsApp Ready:</span>
                    <a
                      href={`https://wa.me/91${currentArtist.phone_no.replace(/\D/g, '').slice(-10)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <span>Direct Chat</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* CARD 3: Artistic Classification & Repertoire */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-violet-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Music className="w-4 h-4 text-violet-600" />
                        <span>3. Artistry &amp; Act</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-bold">
                        Repertoire
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Primary Category</span>
                        <span className="font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                          {currentArtist.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Sub-Category</span>
                        <span className="font-bold text-slate-800 text-right">
                          {currentArtist.sub_category || '—'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Primary Genre</span>
                        <span className="font-bold text-slate-800 text-right truncate max-w-[160px]">
                          {(currentArtist as any).genre || currentArtist.genres?.[0] || '—'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Stage Experience</span>
                        <span className="font-bold text-slate-900">
                          {currentArtist.experience_years || 1} Years
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Members Count</span>
                        <span className="font-bold text-slate-900">
                          {(currentArtist as any).members_min || 1} to {(currentArtist as any).members_max || 1} Performer(s)
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-50">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Genres &amp; Styles ({currentArtist.genres?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {(currentArtist.genres || []).map((g, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-bold"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Languages Performed
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(currentArtist.languages || ['Hindi', 'English']).map((lang, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Bio Summary</span>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {currentArtist.bio || 'No artist pitch submitted.'}
                    </p>
                  </div>
                </div>

                {/* CARD 4: Commercial Fees & Pricing Packages */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-500" />
                        <span>4. Commercial Pricing</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                        Packages
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
                        <span className="font-bold text-amber-900 text-xs">Starting Base Rate</span>
                        <span className="text-base font-black text-amber-900">
                          ₹{Number(startingRate).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Solo Acoustic Show</span>
                        <span className="font-bold text-slate-900">
                          ₹{Number(currentArtist.submitted_pricing?.solo_price || currentArtist.price_min || 15000).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Duo Performance</span>
                        <span className="font-bold text-slate-900">
                          ₹{Number(currentArtist.submitted_pricing?.duo_price || 25000).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Full Band Performance</span>
                        <span className="font-bold text-slate-900">
                          ₹{Number(currentArtist.submitted_pricing?.band_price || currentArtist.price_max || 50000).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Hourly Overtime Fee</span>
                        <span className="font-bold text-slate-900">
                          ₹{Number(currentArtist.submitted_pricing?.hourly_price || 3000).toLocaleString('en-IN')} / hr
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                        <span className="text-slate-500 font-medium">Budget Min – Max</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          ₹{Number(currentArtist.price_min || 0).toLocaleString('en-IN')} – ₹{Number(currentArtist.price_max || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {(currentArtist as any).original_price && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-medium">Original List Price</span>
                          <span className="font-bold text-slate-400 line-through">
                            ₹{Number((currentArtist as any).original_price).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Travel &amp; Hospitality Policy
                    </span>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {currentArtist.submitted_pricing?.travel_charges_policy || 'Outstation travel, stay, and food arranged by host.'}
                    </p>
                  </div>
                </div>

                {/* CARD 5: Stage Logistics & Technical Rider */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-emerald-600" />
                        <span>5. Logistics &amp; Rider</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        Stage Ops
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Performance Duration</span>
                        <span className="text-sm font-black text-slate-900 block mt-0.5">
                          {currentArtist.performance_details?.min_duration_minutes || 60} – {currentArtist.performance_details?.max_duration_minutes || 180} minutes
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Sound PA System</span>
                        <span className="font-bold text-slate-900 block mt-0.5">
                          {currentArtist.performance_details?.sound_system_provided
                            ? '✓ Artist Provides Complete PA'
                            : 'Host / Venue Arranges PA System'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Travel Readiness</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase">
                          {(currentArtist.performance_details?.travel_readiness || 'pan_india').replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Blocked Dates</span>
                        <span className="font-bold text-slate-900">
                          {currentArtist.performance_details?.blocked_dates?.length
                            ? `${currentArtist.performance_details.blocked_dates.length} Dates Blocked`
                            : 'Open Availability'}
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-50">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Serviceable Target Cities
                        </span>
                        <span className="font-semibold text-slate-800 text-[11px] block">
                          {currentArtist.performance_details?.serviceable_cities?.length
                            ? currentArtist.performance_details.serviceable_cities.join(', ')
                            : 'Pan-India / All Metros & Cities'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Technical Requirements</span>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {currentArtist.performance_details?.technical_requirements || 'Standard line-in / stage mic inputs required.'}
                    </p>
                  </div>
                </div>

                {/* CARD 6: Platform Standing & Verification */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Award className="w-4 h-4 text-rose-500" />
                        <span>6. Platform Standing</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold">
                        Verification
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Verification Status</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            currentArtist.verification_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentArtist.verification_status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {currentArtist.verification_status?.replace('_', ' ') || 'Pending'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Website Live</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            currentArtist.is_live
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {currentArtist.is_live ? '✓ Live on magnevents.in' : 'Hidden / Offline'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Platform Rank</span>
                        <span className="font-black text-slate-900">
                          #{userRank.rank} ({userTier.tier.name})
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Completed Events</span>
                        <span className="font-black text-slate-900">
                          {userRank.totalCompleted} Successful Bookings
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Client Rating</span>
                        <span className="font-black text-amber-600 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{currentArtist.rating || 4.9} / 5.0</span>
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-50 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Profile Completion</span>
                          <span className="font-black text-sky-600">{currentArtist.profile_completion || 100}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                            style={{ width: `${currentArtist.profile_completion || 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Submitted:</span>
                      <span className="font-mono text-slate-600">
                        {currentArtist.profile_submitted_at ? new Date(currentArtist.profile_submitted_at).toLocaleDateString('en-IN') : 'Direct Setup'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified:</span>
                      <span className="font-mono text-slate-600">
                        {currentArtist.verified_at ? new Date(currentArtist.verified_at).toLocaleDateString('en-IN') : 'Pending Review'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD 7: Media, Video Reels & Social Assets */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Video className="w-4 h-4 text-purple-600" />
                        <span>7. Media &amp; Social Assets</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                        Reels &amp; URLs
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Profile Avatar Image</span>
                        <div className="flex items-center gap-2 mt-1">
                          <img
                            src={currentArtist.profile_image_url || '/logo.webp'}
                            alt={currentArtist.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/logo.webp';
                            }}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                          <span className="text-[11px] font-mono text-slate-600 truncate flex-1" title={currentArtist.profile_image_url || '/logo.webp'}>
                            {currentArtist.profile_image_url ? 'Custom Photo' : 'Magnevents Logo Fallback'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                        <span className="text-slate-500 font-medium">Cover Banner Hero</span>
                        {currentArtist.cover_image_url ? (
                          <a
                            href={currentArtist.cover_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1"
                          >
                            <span>View Cover</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Cover</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Cloudflare R2 Video</span>
                        {currentArtist.cloudflare_video_url ? (
                          <a
                            href={currentArtist.cloudflare_video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1"
                          >
                            <span>Open Stream</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No R2 Stream</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">YouTube Showreels</span>
                        <span className="font-bold text-slate-900">
                          {currentArtist.youtube_links?.length || 0} Video(s)
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Audio Samples</span>
                        <span className="font-bold text-slate-900">
                          {currentArtist.audio_samples?.length || 0} Track(s)
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-50">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Social Channels Attached
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'Instagram', url: currentArtist.instagram_url },
                            { label: 'YouTube', url: currentArtist.youtube_url },
                            { label: 'Spotify', url: currentArtist.spotify_url },
                            { label: 'Website', url: currentArtist.website_url },
                          ]
                            .filter((s) => Boolean(s.url))
                            .map((s, i) => (
                              <a
                                key={i}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold inline-flex items-center gap-1"
                              >
                                <span>{s.label}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Gallery Photos Count:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {(currentArtist as any).gallery_images?.length || 0} Photo(s)
                    </span>
                  </div>
                </div>

                {/* CARD 8: Confidential KYC & Regulatory */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-600" />
                        <span>8. KYC &amp; Regulatory</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold uppercase">
                        Confidential
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Legal Name on ID</span>
                        <span className="font-bold text-slate-900 block mt-0.5">
                          {currentArtist.verification_documents?.legal_name || currentArtist.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Govt ID Proof Type</span>
                        <span className="font-bold text-slate-900 uppercase">
                          {currentArtist.verification_documents?.id_type || 'AADHAAR'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Masked ID Number</span>
                        <span className="font-mono font-semibold text-slate-800 block mt-0.5">
                          {currentArtist.verification_documents?.id_number_masked || 'Not Provided'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">PAN or Tax ID</span>
                        <span className="font-mono font-bold text-slate-800">
                          {currentArtist.verification_documents?.pan_or_tax_id || '—'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-50 space-y-2">
                        {currentArtist.verification_documents?.id_document_url ? (
                          <a
                            href={getSecureKycUrl(currentArtist.verification_documents.id_document_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Inspect Govt ID Proof</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-rose-600 font-semibold text-xs block py-1">
                            No Govt ID attached
                          </span>
                        )}

                        {currentArtist.verification_documents?.address_proof_url && (
                          <a
                            href={getSecureKycUrl(currentArtist.verification_documents.address_proof_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>Inspect Address Proof</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span className="block">Aadhaar Vault / Storage Encryption: AES-256</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Input Box */}
          {rejectionModalOpen && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5 shadow-xs">
              <label className="block text-xs font-black text-rose-800">
                Reason for Rejection / Changes Needed
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify what needs to be improved..."
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
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {/* Delete Confirmation Box */}
          {deleteConfirmOpen && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-rose-950 truncate">
                    Permanently remove &ldquo;{artist.name}&rdquo;?
                  </h4>
                  <p className="text-[11px] sm:text-xs text-rose-800">
                    This will delete this performer from the directory and database. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteProfile}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Remove Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* D. Sticky Action Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Status:
              </span>
              <span className="font-black text-slate-800 capitalize">
                {currentArtist.verification_status?.replace('_', ' ') || 'Pending'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Website:
              </span>
              <span className={`font-bold text-xs flex items-center gap-1 ${currentArtist.is_live ? 'text-emerald-600' : 'text-slate-500'}`}>
                {currentArtist.is_live ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 text-slate-400" />
                    <span>Not Live</span>
                  </>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all active:scale-95"
              title="Permanently remove performer from database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Profile</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <a
              href={getLiveArtistProfileUrl(currentArtist)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
              title="Open public profile on magnevents.in in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Live Website Page</span>
            </a>

            <button
              onClick={() => setRejectionModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition-all"
            >
              Reject
            </button>

            <button
              onClick={handleQuickRequestChanges}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs transition-all"
            >
              Request Changes
            </button>

            {currentArtist.is_live ? (
              <button
                type="button"
                onClick={handleTakeOffLive}
                className="flex-1 sm:flex-none bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                title="Click to take this artist off live from the main website (magnevents.in)"
              >
                <EyeOff className="w-4 h-4 text-rose-600" />
                <span>Take Off Live (Hide from Website)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMakeLive}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white font-black text-xs py-2.5 px-5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                title="Click to publish this artist live to the main website (magnevents.in)"
              >
                <Globe className="w-4 h-4 text-white" />
                <span>Make Live on Website</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
