"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import { ArtistProfile } from '../../../types/artist';
import { ArtistTierBadge } from '../../../components/shared/ArtistTierBadge';
import { LocationFilter, matchesLocationFilter } from '../../../components/shared/LocationFilter';
import { WhatsAppShareActions } from '../../../components/shared/WhatsAppShareActions';
import { ModalPortal } from '../../../components/shared/ModalPortal';
import { getArtistRankMap } from '../../../lib/artistTiers';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  X, 
  Eye, 
  Check, 
  ExternalLink, 
  FileText, 
  Video, 
  Music, 
  DollarSign, 
  User, 
  MapPin, 
  Sparkles,
  Phone,
  Mail,
  Award
} from 'lucide-react';

function AdminVerificationQueueContent() {
  const { artists, updateArtistStatus } = useAdminAuth();
  const searchParams = useSearchParams();
  const reviewIdParam = searchParams.get('reviewId');

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedArtist, setSelectedArtist] = useState<ArtistProfile | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Auto-open dossier if reviewId is passed via URL query
  useEffect(() => {
    if (reviewIdParam) {
      const target = artists.find((a) => a.id === reviewIdParam);
      if (target) {
        setSelectedArtist(target);
      }
    }
  }, [reviewIdParam, artists]);

  const rankMap = getArtistRankMap(artists);

  const filteredArtists = artists.filter((artist) => {
    // 1. Tab filter
    if (activeTab === 'pending' && !(artist.verification_status === 'pending' || artist.verification_status === 'under_review')) {
      return false;
    }
    if (activeTab === 'approved' && artist.verification_status !== 'approved') {
      return false;
    }
    if (activeTab === 'rejected' && artist.verification_status !== 'rejected') {
      return false;
    }

    // 1B. Location filter
    if (!matchesLocationFilter(locationFilter, artist.city, artist.state)) {
      return false;
    }

    // 2. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = artist.name.toLowerCase().includes(q);
      const matchStage = (artist.stage_name || '').toLowerCase().includes(q);
      const matchCity = (artist.city || '').toLowerCase().includes(q);
      const matchCategory = (artist.category || '').toLowerCase().includes(q);
      return matchName || matchStage || matchCity || matchCategory;
    }

    return true;
  });

  const handleApprove = async (artist: ArtistProfile) => {
    await updateArtistStatus(artist.id, 'approved');
    setNotification(`Successfully approved ${artist.name}! Profile is now live & verified.`);
    setSelectedArtist((prev) => (prev ? { ...prev, verification_status: 'approved', is_live: true } : null));
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRequestChanges = async (artist: ArtistProfile) => {
    await updateArtistStatus(artist.id, 'under_review', 'Please upload a clearer performance reel and update event pricing.');
    setNotification(`Marked ${artist.name} as Under Review (Changes Requested).`);
    setSelectedArtist((prev) => (prev ? { ...prev, verification_status: 'under_review' } : null));
    setTimeout(() => setNotification(null), 4000);
  };

  const handleConfirmReject = async (artist: ArtistProfile) => {
    await updateArtistStatus(artist.id, 'rejected', rejectionNote || 'Incomplete profile or does not meet luxury verification standards.');
    setNotification(`Rejected ${artist.name}. Feedback sent.`);
    setSelectedArtist((prev) => (prev ? { ...prev, verification_status: 'rejected', is_live: false } : null));
    setShowRejectInput(false);
    setRejectionNote('');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header (admin-portal theme) */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-bold mb-2 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Manual Verification Dossier Review</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Performer Verification Queue
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Inspect artist identity proofs, audio recordings, YouTube live video reels, and submitted pricing before activating live booking status.
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 2. Filters & Search Bar (admin-portal theme) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tab Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs overflow-x-auto max-w-full shadow-xs">
          {[
            { id: 'pending', label: 'Action Required', count: artists.filter(a => a.verification_status === 'pending' || a.verification_status === 'under_review').length },
            { id: 'approved', label: 'Verified & Live', count: artists.filter(a => a.verification_status === 'approved').length },
            { id: 'rejected', label: 'Rejected', count: artists.filter(a => a.verification_status === 'rejected').length },
            { id: 'all', label: 'All Performers', count: artists.length },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap min-h-[36px] ${
                  isTabActive
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isTabActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Location Filter + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <LocationFilter
            value={locationFilter}
            onChange={setLocationFilter}
            availableCities={artists.map((a) => a.city)}
          />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artist name, genre, city..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-xs min-h-[40px]"
            />
          </div>
        </div>
      </div>

      {/* 3. Artists Table (clean white admin-portal theme) */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        {filteredArtists.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">No performers match this filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try switching tabs or clearing your search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5">Performer</th>
                  <th className="py-3.5 px-5">Position & Events</th>
                  <th className="py-3.5 px-5">Category & City</th>
                  <th className="py-3.5 px-5">Media & Docs</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArtists.map((artist) => {
                  const isPending = artist.verification_status === 'pending' || artist.verification_status === 'under_review';
                  const isApproved = artist.verification_status === 'approved';
                  const isRejected = artist.verification_status === 'rejected';
                  const rankInfo = rankMap[artist.id] || { rank: 1, totalCompleted: artist.successful_bookings || 0 };

                  return (
                    <tr key={artist.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Performer Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={artist.profile_image_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200'}
                            alt={artist.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 flex-shrink-0 bg-slate-100"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">{artist.name}</span>
                            <span className="text-xs font-semibold text-indigo-600 truncate max-w-[220px] block">
                              {artist.stage_name || 'Solo Performer'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Position Rank & Completed Events Count */}
                      <td className="py-4 px-5">
                        <ArtistTierBadge
                          completedEvents={rankInfo.totalCompleted}
                          rankPosition={rankInfo.rank}
                          size="sm"
                        />
                      </td>

                      {/* Category & City */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                          {artist.category}
                        </span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{artist.city || 'India'}</span>
                        </div>
                      </td>

                      {/* Media & Docs checklist */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                            artist.youtube_links?.length 
                              ? 'bg-slate-100 text-slate-700 border border-slate-200/60' 
                              : 'bg-slate-50 text-slate-400'
                          }`}>
                            <Video className="w-3 h-3 text-red-500" />
                            <span>{artist.youtube_links?.length || 0} Reels</span>
                          </span>

                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                            artist.verification_documents?.id_type 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                              : 'bg-rose-50 text-rose-700 border-rose-200/60'
                          }`}>
                            <FileText className="w-3 h-3 text-emerald-600" />
                            <span>{artist.verification_documents?.id_type ? 'ID Attached' : 'No ID'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isRejected
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          <span>{artist.verification_status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Review & WhatsApp Share Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <WhatsAppShareActions
                            artist={artist}
                            rank={rankInfo.rank}
                            completedEvents={rankInfo.totalCompleted}
                            variant="compact"
                          />
                          <button
                            onClick={() => setSelectedArtist(artist)}
                            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 font-semibold text-xs shadow-xs transition-all inline-flex items-center gap-1.5 min-h-[36px]"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Inspect</span>
                          </button>
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

      {/* 4. Interactive Dossier Review Modal (Full-Area 2-Card Layout, Blurred & Scroll-Locked) */}
      {selectedArtist && (() => {
        const selectedRank = rankMap[selectedArtist.id] || {
          rank: 1,
          totalCompleted: selectedArtist.successful_bookings || 0,
        };
        const docs = selectedArtist.verification_documents;
        const pricing = selectedArtist.submitted_pricing;
        const perf = selectedArtist.performance_details;

        return (
          <ModalPortal isOpen={true} onClose={() => setSelectedArtist(null)}>
            <div className="w-full max-w-6xl max-h-[92vh] bg-[#F8FAFC] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden font-sans overscroll-contain">
              {/* Top Executive Header (Zero Awkward Wrapping) */}
              <div className="sidebar-dark px-4 py-4 sm:px-6 sm:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <img
                    src={selectedArtist.profile_image_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200'}
                    alt={selectedArtist.name}
                    className="w-14 h-14 rounded-xl object-cover object-top ring-2 ring-white/20 flex-shrink-0 bg-slate-800"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight break-words">
                        {selectedArtist.name}
                      </h2>
                      <span className="text-xs font-semibold text-sky-300 truncate max-w-full sm:max-w-[280px]">
                        {selectedArtist.stage_name || selectedArtist.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          selectedArtist.verification_status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                            : selectedArtist.verification_status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                        }`}
                      >
                        {selectedArtist.verification_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                      <span className="inline-flex items-center gap-1 break-all sm:whitespace-nowrap">
                        <Mail className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        {selectedArtist.email || 'No email'}
                      </span>
                      <span className="text-white/25 hidden sm:inline">•</span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Phone className="w-3.5 h-3.5 text-sky-400" />
                        {selectedArtist.phone_no || 'No phone'}
                      </span>
                      <span className="text-white/25 hidden sm:inline">•</span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        {selectedArtist.city || 'India'}{selectedArtist.state ? `, ${selectedArtist.state}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-3 flex-shrink-0">
                  <div className="hidden xl:flex flex-col items-end pr-3 border-r border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                      Profile Completion
                    </span>
                    <span className="text-sm font-black text-emerald-300">
                      {selectedArtist.profile_completion || 85}%
                    </span>
                  </div>

                  <WhatsAppShareActions
                    artist={selectedArtist}
                    rank={selectedRank.rank}
                    completedEvents={selectedRank.totalCompleted}
                    variant="header-dark"
                  />

                  <button
                    onClick={() => setSelectedArtist(null)}
                    className="p-2 text-white/75 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
                    aria-label="Close Dossier"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Full-Width 2-Card Side-by-Side Layout */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* CARD 1 (Left — 7 cols): Artist Full Details & Portfolio */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/70 flex items-center justify-center text-sky-600">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">Artist Details &amp; Portfolio</h3>
                          <p className="text-[11px] text-slate-500">Background, performance media &amp; stage logistics</p>
                        </div>
                      </div>

                      <ArtistTierBadge
                        completedEvents={selectedRank.totalCompleted}
                        rankPosition={selectedRank.rank}
                        size="sm"
                      />
                    </div>

                    {/* Bio & Artistic Background */}
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        Bio &amp; Artistic Background
                      </h4>
                      <p className="leading-relaxed text-slate-700 text-xs">
                        {selectedArtist.bio || 'No artist biography provided yet.'}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Category</span>
                          <span className="font-bold text-slate-900">{selectedArtist.category}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Experience</span>
                          <span className="font-bold text-slate-900">{selectedArtist.experience_years || 1} Years</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Events Done</span>
                          <span className="font-bold text-slate-900">{selectedRank.totalCompleted} Completed</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(selectedArtist.genres || ['Bollywood']).map((g) => (
                          <span key={g} className="px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200/60 text-sky-700 text-[11px] font-semibold">
                            {g}
                          </span>
                        ))}
                        {(selectedArtist.languages || ['Hindi', 'English']).map((lang) => (
                          <span key={lang} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Performance Video Reels & Audio */}
                    <div className="pt-4 border-t border-slate-100 space-y-2.5">
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-rose-500" />
                        <span>Performance Video Reels &amp; Audio ({selectedArtist.youtube_links?.length || 0})</span>
                      </h4>
                      {selectedArtist.youtube_links && selectedArtist.youtube_links.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedArtist.youtube_links.map((link, i) => (
                            <a
                              key={i}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 text-slate-800 hover:text-sky-700 text-xs transition-colors"
                            >
                              <span className="truncate font-semibold">Video Reel #{i + 1}: {link}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs">No performance video links submitted.</p>
                      )}

                      {selectedArtist.audio_samples && selectedArtist.audio_samples.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {selectedArtist.audio_samples.map((audio, i) => (
                            <a
                              key={i}
                              href={audio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700 text-xs transition-colors"
                            >
                              <span className="truncate font-medium flex items-center gap-1.5">
                                <Music className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                Audio Sample #{i + 1}: {audio}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stage & Technical Logistics */}
                    {perf && (
                      <div className="pt-4 border-t border-slate-100 space-y-2">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                          Stage &amp; Technical Requirements
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Set Duration</span>
                            <span className="font-bold text-slate-900">
                              {perf.min_duration_minutes || 60} – {perf.max_duration_minutes || 180} mins
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Travel Readiness</span>
                            <span className="font-bold text-slate-900 uppercase">
                              {(perf.travel_readiness || 'pan_india').replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        {perf.technical_requirements && (
                          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                            <strong className="text-slate-800">Tech Rider:</strong> {perf.technical_requirements}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CARD 2 (Right — 5 cols): Main Verification Details (Pricing + Private KYC) */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 text-xs text-slate-600">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900">Main Verification Details</h3>
                          <p className="text-[11px] text-slate-500">Pricing proposal &amp; private KYC documents</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        {selectedArtist.profile_completion || 85}% Complete
                      </span>
                    </div>

                    {/* Submitted Event Pricing */}
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Submitted Event Pricing</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Solo Show</span>
                          <span className="font-black text-slate-900 text-sm">
                            ₹{(pricing?.solo_price || selectedArtist.price_min || 15000).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Duo Show</span>
                          <span className="font-black text-slate-900 text-sm">
                            ₹{(pricing?.duo_price || 25000).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Full Band</span>
                          <span className="font-black text-slate-900 text-sm">
                            ₹{(pricing?.band_price || selectedArtist.price_max || 50000).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Hourly Rate</span>
                          <span className="font-black text-slate-900 text-sm">
                            ₹{(pricing?.hourly_price || 3000).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      {pricing?.travel_charges_policy && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                          <strong className="text-slate-800">Travel Policy:</strong> {pricing.travel_charges_policy}
                        </p>
                      )}
                    </div>

                    {/* Confidential Identity Verification (KYC) */}
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                      <h4 className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                        <ShieldCheck className="w-4 h-4 text-amber-700" />
                        <span>Private KYC &amp; ID Proof (Admin Only)</span>
                      </h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-amber-200/60">
                          <span className="text-amber-900/70 font-medium">Legal Name on ID</span>
                          <span className="font-bold text-slate-900">{docs?.legal_name || selectedArtist.name}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-amber-200/60">
                          <span className="text-amber-900/70 font-medium">Govt ID Type</span>
                          <span className="font-bold text-slate-900 uppercase">{docs?.id_type || 'Aadhaar'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-amber-200/60">
                          <span className="text-amber-900/70 font-medium">Masked ID Number</span>
                          <span className="font-mono font-bold text-slate-900">
                            {docs?.id_number_masked || 'XXXX-XXXX-8921'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-amber-900/70 font-medium">PAN / Tax ID</span>
                          <span className="font-mono font-bold text-slate-900">
                            {docs?.pan_or_tax_id || 'Not provided'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {docs?.id_document_url ? (
                          <a
                            href={docs.id_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 rounded-lg bg-white hover:bg-emerald-50 border border-amber-300 text-slate-900 hover:text-emerald-800 font-bold text-xs inline-flex items-center justify-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Inspect Govt ID</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-rose-700 font-semibold text-[11px]">No Govt ID attached</span>
                        )}

                        {docs?.address_proof_url && (
                          <a
                            href={docs.address_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-amber-300 text-slate-800 font-bold text-xs inline-flex items-center justify-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span>Address Proof</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Rejection Note Form if open */}
                    {showRejectInput && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                        <label className="block text-xs font-bold text-rose-800">
                          Reason for Rejection / Missing Information:
                        </label>
                        <textarea
                          value={rejectionNote}
                          onChange={(e) => setRejectionNote(e.target.value)}
                          placeholder="Specify what needs to be corrected..."
                          className="w-full p-2.5 bg-white border border-rose-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 h-20"
                        />
                        <div className="flex items-center gap-2 justify-end pt-1">
                          <button
                            onClick={() => setShowRejectInput(false)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleConfirmReject(selectedArtist)}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Modal Actions Footer */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold">
                  <span>Director Decision:</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {selectedArtist.verification_status.replace('_', ' ')}
                  </span>
                  {selectedArtist.is_live && (
                    <span className="text-emerald-600 font-bold">• Live on Public Platform</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs min-h-[40px]"
                  >
                    Reject Application
                  </button>

                  <button
                    onClick={() => handleRequestChanges(selectedArtist)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold text-xs min-h-[40px]"
                  >
                    Request Changes
                  </button>

                  <button
                    onClick={() => handleApprove(selectedArtist)}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 min-h-[40px]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve &amp; Go Live</span>
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

export default function AdminVerificationQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-bold text-slate-400">
          Loading Verification Queue...
        </div>
      }
    >
      <AdminVerificationQueueContent />
    </Suspense>
  );
}
