"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import { ArtistProfile } from '../../../types/artist';
import { WhatsAppShareActions } from '../../../components/shared/WhatsAppShareActions';
import { ArtistTierBadge } from '../../../components/shared/ArtistTierBadge';
import { ModalPortal } from '../../../components/shared/ModalPortal';
import { getArtistRankMap } from '../../../lib/artistTiers';
import {
  Users,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Check,
  X,
  Eye,
  ExternalLink,
  Mic2,
  FileText,
  Video,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Music,
  Star,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { artists, updateArtistStatus } = useAdminAuth();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [reviewingArtist, setReviewingArtist] = useState<ArtistProfile | null>(null);
  const [approving, setApproving] = useState(false);

  const pendingArtists = artists.filter(
    (a) => a.verification_status === 'pending' || a.verification_status === 'under_review'
  );
  const rankMap = getArtistRankMap(artists);
  const approvedArtists = artists.filter((a) => a.verification_status === 'approved');
  const rejectedArtists = artists.filter((a) => a.verification_status === 'rejected');

  const handleConfirmApprove = async (artist: ArtistProfile) => {
    setApproving(true);
    try {
      await updateArtistStatus(artist.id, 'approved');
      setReviewingArtist(null);
      setActionMessage(`Approved ${artist.name}! Profile is now live on magnevents.in`);
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setApproving(false);
    }
  };

  const handleRequestChanges = async (artist: ArtistProfile) => {
    await updateArtistStatus(
      artist.id,
      'under_review',
      'Please verify performance reel and KYC proof details.'
    );
    setReviewingArtist(null);
    setActionMessage(`Marked ${artist.name} as under review (changes requested).`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleQuickReject = async (id: string, name: string) => {
    await updateArtistStatus(
      id,
      'rejected',
      'Missing high-definition performance reel or identity proof.'
    );
    setReviewingArtist(null);
    setActionMessage(`Marked ${name} as changes requested.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-bold mb-2 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Dedicated Artist Review Directorate</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Performer Directorate & Metrics
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Authenticating artist identities, stage video reels, and performance readiness for live client bookings.
          </p>
        </div>

        <Link
          href="/admin/verification"
          className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-sky-500/20 inline-flex items-center gap-2 self-start sm:self-auto transition-all active:scale-95"
        >
          <span>Open Full Verification Queue</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 2. Top Metric Cards (admin-portal clean style) */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-5 transition-shadow hover:shadow-md min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Total Performers</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{artists.length}</div>
          <span className="text-xs text-slate-400 mt-1 block">Registered in ecosystem</span>
        </div>

        <div className="bg-white border border-amber-200/80 shadow-sm rounded-2xl p-4 sm:p-5 transition-shadow hover:shadow-md min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs text-amber-700 uppercase tracking-wider font-bold">Pending Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-700 tracking-tight">{pendingArtists.length}</div>
          <span className="text-xs text-amber-600/80 mt-1 block">Action required by director</span>
        </div>

        <div className="bg-white border border-emerald-200/80 shadow-sm rounded-2xl p-4 sm:p-5 transition-shadow hover:shadow-md min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs text-emerald-700 uppercase tracking-wider font-bold">Live & Verified</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 tracking-tight">{approvedArtists.length}</div>
          <span className="text-xs text-emerald-600/80 mt-1 block">Active on magnevents.in</span>
        </div>

        <div className="bg-white border border-rose-200/80 shadow-sm rounded-2xl p-4 sm:p-5 transition-shadow hover:shadow-md min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs text-rose-700 uppercase tracking-wider font-bold">Needs Updates</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-700 tracking-tight">{rejectedArtists.length}</div>
          <span className="text-xs text-rose-600/80 mt-1 block">Changes requested</span>
        </div>
      </div>

      {/* 3. Action Required: Pending Verification Queue */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>Pending Performer Submissions ({pendingArtists.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Click Approve or Dossier to inspect complete artist details, showreels, and KYC proofs before going live.
            </p>
          </div>

          <Link
            href="/admin/verification"
            className="text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline hidden sm:inline-flex items-center gap-1"
          >
            <span>View All Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingArtists.length === 0 ? (
          <div className="p-10 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">All Caught Up!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Zero pending performer submissions in queue. All artists have been verified.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Performer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Submitted City</th>
                  <th className="py-3 px-4">Portfolio Reel</th>
                  <th className="py-3 px-4">KYC Proof</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pendingArtists.map((artist) => (
                  <tr key={artist.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={artist.profile_image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=200'}
                          alt={artist.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{artist.name}</span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px] block">
                            {artist.stage_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                        {artist.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {artist.city}, {artist.state}
                    </td>

                    <td className="py-3.5 px-4">
                      {artist.youtube_links && artist.youtube_links.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          <Video className="w-3 h-3 text-red-500" />
                          <span>{artist.youtube_links.length} Video(s)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No videos</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200/50">
                        <FileText className="w-3 h-3 text-emerald-600" />
                        <span>{artist.verification_documents?.id_type || 'ID Provided'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <WhatsAppShareActions
                          artist={artist}
                          rank={rankMap[artist.id]?.rank}
                          completedEvents={rankMap[artist.id]?.totalCompleted ?? artist.successful_bookings ?? 0}
                          variant="compact"
                        />
                        <button
                          type="button"
                          onClick={() => setReviewingArtist(artist)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold text-xs flex items-center gap-1 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Dossier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReviewingArtist(artist)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
                          title="Inspect artist details before approving"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickReject(artist.id, artist.name)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs flex items-center gap-1"
                          title="Request Updates"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Ecosystem Category Overview */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6">
        <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-indigo-600" />
          <span>Talent Distribution by Category</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { cat: 'Singer', count: artists.filter(a => a.category === 'Singer').length, color: 'text-indigo-600 bg-indigo-50 border-indigo-200/60' },
            { cat: 'Live Band', count: artists.filter(a => a.category === 'Live Band').length, color: 'text-sky-600 bg-sky-50 border-sky-200/60' },
            { cat: 'DJ', count: artists.filter(a => a.category === 'DJ').length, color: 'text-violet-600 bg-violet-50 border-violet-200/60' },
            { cat: 'Instrumentalist', count: artists.filter(a => a.category === 'Instrumentalist').length, color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60' },
            { cat: 'Magician & Other', count: artists.filter(a => a.category === 'Magician' || (a.category !== 'Singer' && a.category !== 'Live Band' && a.category !== 'DJ' && a.category !== 'Instrumentalist')).length, color: 'text-amber-600 bg-amber-50 border-amber-200/60' }
          ].map((item, i) => (
            <div key={i} className={`p-4 rounded-xl border ${item.color} flex flex-col justify-between`}>
              <span className="text-xs font-bold">{item.cat}</span>
              <span className="text-2xl font-black mt-2 text-slate-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Review Artist Details & Confirm Approval Modal (Full-Screen Blur + Scroll Lock) */}
      {reviewingArtist && (() => {
        const rankInfo = rankMap[reviewingArtist.id] || {
          rank: 1,
          totalCompleted: reviewingArtist.successful_bookings || 0,
        };
        const pricing = reviewingArtist.submitted_pricing;
        const docs = reviewingArtist.verification_documents;

        return (
          <ModalPortal isOpen={true} onClose={() => setReviewingArtist(null)}>
            <div className="w-full max-w-4xl max-h-[90vh] bg-[#F8FAFC] rounded-[24px] border border-slate-200 shadow-2xl flex flex-col overflow-hidden font-sans overscroll-contain">
              {/* Header */}
              <div className="sidebar-dark px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={
                      reviewingArtist.profile_image_url ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200'
                    }
                    alt={reviewingArtist.name}
                    className="w-14 h-14 rounded-2xl object-cover object-top ring-2 ring-white/20 flex-shrink-0 bg-slate-800"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-white truncate">
                        {reviewingArtist.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                        Review Before Approval
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 truncate mt-0.5">
                      {reviewingArtist.stage_name || reviewingArtist.name} •{' '}
                      <span className="text-sky-300 font-semibold">{reviewingArtist.category}</span> •{' '}
                      {reviewingArtist.city || 'India'}
                    </p>
                    <div className="mt-1.5">
                      <ArtistTierBadge
                        completedEvents={rankInfo.totalCompleted}
                        rankPosition={rankInfo.rank}
                        size="xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <WhatsAppShareActions
                    artist={reviewingArtist}
                    rank={rankInfo.rank}
                    completedEvents={rankInfo.totalCompleted}
                    variant="header-dark"
                  />
                  <button
                    type="button"
                    onClick={() => setReviewingArtist(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/10"
                    aria-label="Close review modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Details Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-700">
                {/* Quick Stats Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Starting Fee
                    </span>
                    <span className="text-base font-black text-slate-900 mt-1 block">
                      ₹{Number(pricing?.starting_price || reviewingArtist.price_min || 15000).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Events Done
                    </span>
                    <span className="text-base font-black text-slate-900 mt-1 block">
                      {rankInfo.totalCompleted} Events
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Client Rating
                    </span>
                    <span className="text-base font-black text-slate-900 mt-1 inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      {reviewingArtist.rating || 4.9}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Experience
                    </span>
                    <span className="text-base font-black text-slate-900 mt-1 block">
                      {reviewingArtist.experience_years || 3}+ Years
                    </span>
                  </div>
                </div>

                {/* Contact & Artistic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      <span>Contact & Location</span>
                    </h3>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Phone / WhatsApp</span>
                      <a href={`tel:${reviewingArtist.phone_no}`} className="font-bold text-slate-900 hover:text-sky-600 inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {reviewingArtist.phone_no || 'Not provided'}
                      </a>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Email</span>
                      <a href={`mailto:${reviewingArtist.email}`} className="font-bold text-slate-900 hover:text-sky-600 inline-flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {reviewingArtist.email || 'Not provided'}
                      </a>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Base Location</span>
                      <span className="font-bold text-slate-900">
                        {reviewingArtist.city}{reviewingArtist.state ? `, ${reviewingArtist.state}` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Travel Policy</span>
                      <span className="font-semibold text-slate-700 text-right max-w-[60%]">
                        {pricing?.travel_charges_policy || 'Standard outstation travel'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Music className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bio, Genres & Pricing</span>
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {reviewingArtist.bio || 'No biography provided.'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(reviewingArtist.genres || []).map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200/60 text-sky-700 text-[10px] font-bold">
                          {g}
                        </span>
                      ))}
                      {(reviewingArtist.languages || []).map((l) => (
                        <span key={l} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {l}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Solo</span>
                        <span className="font-bold text-slate-900">₹{Number(pricing?.solo_price || reviewingArtist.price_min || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Duo</span>
                        <span className="font-bold text-slate-900">₹{Number(pricing?.duo_price || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Band</span>
                        <span className="font-bold text-slate-900">₹{Number(pricing?.band_price || reviewingArtist.price_max || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KYC Proof & Portfolio Showreels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>KYC & Private Identity Proof</span>
                    </h3>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Legal Name</span>
                      <span className="font-bold text-slate-900">{docs?.legal_name || reviewingArtist.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ID Type & Number</span>
                      <span className="font-bold text-slate-900 uppercase">
                        {docs?.id_type || 'N/A'} {docs?.id_number_masked ? `(${docs.id_number_masked})` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">PAN / Tax ID</span>
                      <span className="font-mono font-bold text-slate-900">{docs?.pan_or_tax_id || 'Not provided'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {docs?.id_document_url ? (
                        <a
                          href={docs.id_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Inspect Govt ID</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-rose-600 font-semibold">No Govt ID file attached</span>
                      )}
                      {docs?.address_proof_url && (
                        <a
                          href={docs.address_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Address Proof</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Video className="w-3.5 h-3.5 text-rose-500" />
                      <span>Portfolio Reels & Audio ({reviewingArtist.youtube_links?.length || 0})</span>
                    </h3>
                    {reviewingArtist.youtube_links && reviewingArtist.youtube_links.length > 0 ? (
                      <div className="space-y-1.5">
                        {reviewingArtist.youtube_links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-200 text-slate-700 hover:text-sky-700 font-semibold"
                          >
                            <span className="truncate">Showreel Video #{idx + 1}</span>
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400">No video showreels uploaded.</p>
                    )}

                    {reviewingArtist.audio_samples && reviewingArtist.audio_samples.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {reviewingArtist.audio_samples.map((audio, idx) => (
                          <a
                            key={idx}
                            href={audio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-700 font-medium"
                          >
                            <span className="truncate">Audio Sample #{idx + 1}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Approval Decision Footer */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                <span className="text-xs text-slate-500 font-medium">
                  Verify KYC &amp; showreel above before approving <strong className="text-slate-900">{reviewingArtist.name}</strong>.
                </span>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => handleQuickReject(reviewingArtist.id, reviewingArtist.name)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestChanges(reviewingArtist)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs"
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    disabled={approving}
                    onClick={() => handleConfirmApprove(reviewingArtist)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{approving ? 'Approving...' : 'Confirm & Approve'}</span>
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
