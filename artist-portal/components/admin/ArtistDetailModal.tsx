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
} from 'lucide-react';

interface ArtistDetailModalProps {
  artist: ArtistProfile | null;
  onClose: () => void;
}

export function ArtistDetailModal({ artist, onClose }: ArtistDetailModalProps) {
  const { artists, updateArtistStatus, deleteArtist, toggleArtistLive } = useAdminAuth();
  const [modalTab, setModalTab] = useState<'overview' | 'pricing' | 'media' | 'kyc'>('overview');
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
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300'
                  }
                  alt={artist.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop';
                  }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover object-top ring-2 ring-white/20 shadow-xl bg-slate-800"
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
