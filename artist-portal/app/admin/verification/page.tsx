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
import { getLiveArtistProfileUrl } from '../../../lib/utils';
import { getSecureKycUrl } from '../../../lib/security/kycEncryption';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  calculateStrictCompletion,
} from '../../../lib/onboardingValidation';
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
  Award,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Film,
  Globe,
  Instagram,
  Youtube,
  Radio,
  Layers,
  Building,
  Image as ImageIcon,
  MessageSquare,
  MessageCircle,
  Send,
  MessageSquareQuote,
  CornerDownRight,
  Reply
} from 'lucide-react';
import {
  FOLLOW_UP_PRESETS,
  FollowUpMessage,
  getArtistFollowUps,
  saveArtistFollowUp,
  logArtistReply,
  buildArtistFollowUpWhatsAppUrl,
  buildArtistFollowUpEmailUrl
} from '../../../lib/artistFollowUp';
import { artistService } from '../../../services/artistService';

function AdminVerificationQueueContent() {
  const { artists, updateArtistStatus, deleteArtist } = useAdminAuth();
  const searchParams = useSearchParams();
  const reviewIdParam = searchParams.get('reviewId');

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedArtist, setSelectedArtist] = useState<ArtistProfile | null>(null);
  const [modalStepTab, setModalStepTab] = useState<'all' | 'step1' | 'step2' | 'step3' | 'step4' | 'kyc'>('all');
  const [rejectionNote, setRejectionNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Director Follow-up & 2-way Artist Conversation state
  const [showFollowUpInput, setShowFollowUpInput] = useState(false);
  const [followUpSubject, setFollowUpSubject] = useState(FOLLOW_UP_PRESETS[0].subject);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [followUpChannels, setFollowUpChannels] = useState<{ email: boolean; whatsapp: boolean; portal: boolean }>({
    email: true,
    whatsapp: true,
    portal: true,
  });
  const [followUpSending, setFollowUpSending] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState<FollowUpMessage[]>([]);
  const [recordingReplyId, setRecordingReplyId] = useState<string | null>(null);
  const [artistReplyText, setArtistReplyText] = useState('');

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

  const handleDeleteApplication = async (artist: ArtistProfile) => {
    setDeleting(true);
    try {
      await deleteArtist(artist.id);
      setSelectedArtist(null);
      setDeleteConfirmOpen(false);
      setShowRejectInput(false);
      setShowFollowUpInput(false);
      setNotification(`Permanently deleted application query for "${artist.name}".`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to delete application query:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Sync follow-up history whenever selectedArtist changes
  useEffect(() => {
    if (selectedArtist) {
      const history = getArtistFollowUps(selectedArtist.id);
      setFollowUpHistory(history);
      const defaultPreset = FOLLOW_UP_PRESETS[0];
      setFollowUpSubject(defaultPreset.subject);
      setFollowUpMessage(defaultPreset.message(selectedArtist));
      setShowFollowUpInput(false);
      setRecordingReplyId(null);
      setArtistReplyText('');
    }
  }, [selectedArtist?.id]);

  const handleSendFollowUp = async () => {
    if (!selectedArtist || !followUpMessage.trim()) return;
    setFollowUpSending(true);

    const channelsUsed: ('email' | 'whatsapp' | 'portal')[] = [];
    if (followUpChannels.email && selectedArtist.email) channelsUsed.push('email');
    if (followUpChannels.whatsapp && selectedArtist.phone_no) channelsUsed.push('whatsapp');
    if (followUpChannels.portal) channelsUsed.push('portal');

    const newMsg: FollowUpMessage = {
      id: `fu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      artist_id: selectedArtist.id,
      sender: 'director',
      sender_name: 'Magnevents Director',
      subject: followUpSubject || 'Artist Application Follow-Up',
      message: followUpMessage.trim(),
      channels: channelsUsed.length ? channelsUsed : ['portal'],
      created_at: new Date().toISOString(),
      status: 'sent',
    };

    const updated = saveArtistFollowUp(newMsg);
    setFollowUpHistory(updated);

    // Dispatch in-portal notification
    if (followUpChannels.portal) {
      await artistService.sendNotification({
        artist_id: selectedArtist.id,
        title: `Director Query: ${newMsg.subject}`,
        message: newMsg.message,
        type: 'info',
        action_url: '/verification',
      });
    }

    // Keep artist status under_review (NOT rejected)
    if (selectedArtist.verification_status === 'pending') {
      await updateArtistStatus(selectedArtist.id, 'under_review', `Director Follow-Up: ${newMsg.subject}`);
      setSelectedArtist((prev) => (prev ? { ...prev, verification_status: 'under_review' } : null));
    }

    setNotification(`Follow-up sent to ${selectedArtist.name}. Conversation is active.`);
    setTimeout(() => setNotification(null), 4500);

    // Launch WhatsApp if selected and phone exists
    if (followUpChannels.whatsapp && selectedArtist.phone_no) {
      const waUrl = buildArtistFollowUpWhatsAppUrl(selectedArtist, followUpMessage);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    setFollowUpSending(false);
  };

  const handleSaveArtistReply = (followUpId: string) => {
    if (!selectedArtist || !artistReplyText.trim()) return;
    const updated = logArtistReply(selectedArtist.id, followUpId, artistReplyText.trim());
    setFollowUpHistory(updated);
    setRecordingReplyId(null);
    setArtistReplyText('');
    setNotification(`Logged artist reply note for ${selectedArtist.name}.`);
    setTimeout(() => setNotification(null), 3500);
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

                          {(() => {
                            const hasDoc = Boolean(artist.verification_documents?.id_document_url?.trim() || artist.verification_documents?.id_number_masked?.trim());
                            return (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                hasDoc 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}>
                                <FileText className={`w-3 h-3 ${hasDoc ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{hasDoc ? 'ID Attached' : 'No ID'}</span>
                              </span>
                            );
                          })()}
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
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <WhatsAppShareActions
                            artist={artist}
                            rank={rankInfo.rank}
                            completedEvents={rankInfo.totalCompleted}
                            variant="compact"
                          />
                          <button
                            onClick={() => {
                              setSelectedArtist(artist);
                              setDeleteConfirmOpen(false);
                              setShowRejectInput(false);
                            }}
                            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 font-semibold text-xs shadow-xs transition-all inline-flex items-center gap-1.5 min-h-[36px]"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedArtist(artist);
                              setDeleteConfirmOpen(true);
                              setShowRejectInput(false);
                            }}
                            className="p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center shadow-xs"
                            title="Delete this application query"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        // Dynamic validation across all 4 mandatory steps
        const s1Val = validateStep1(selectedArtist);
        const s2Val = validateStep2(selectedArtist);
        const s3Val = validateStep3(selectedArtist);
        const s4Val = validateStep4(selectedArtist);
        const strictCompletion = calculateStrictCompletion(selectedArtist);

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
                    <span className={`text-sm font-black ${
                      strictCompletion === 100
                        ? 'text-emerald-400'
                        : strictCompletion >= 50
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}>
                      {strictCompletion}%
                    </span>
                  </div>

                  <a
                    href={getLiveArtistProfileUrl(selectedArtist)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/40 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95 group"
                    title="Open live public profile on magnevents.in in a new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-200 group-hover:scale-110 transition-transform" />
                    <span>Live Website Page</span>
                  </a>

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

              {/* 4-Step User Onboarding Progress & Step Navigator Bar */}
              <div className="bg-slate-100/90 border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto shadow-xs flex-shrink-0">
                <div className="flex items-center gap-1.5 min-w-max">
                  <button
                    type="button"
                    onClick={() => setModalStepTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      modalStepTab === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>All 4 Steps (Overview)</span>
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  {/* Step 1: Identity & Act */}
                  <button
                    type="button"
                    onClick={() => setModalStepTab('step1')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      modalStepTab === 'step1'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-sky-700 border border-slate-200/80 hover:bg-sky-50'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-black">1</span>
                    <span>Step 1: Identity &amp; Act</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${s1Val.isValid ? 'bg-emerald-500' : 'bg-amber-400'}`} title={s1Val.isValid ? 'Step 1 Complete' : `Missing: ${s1Val.missing.join(', ')}`} />
                  </button>

                  {/* Step 2: Repertoire & Bio */}
                  <button
                    type="button"
                    onClick={() => setModalStepTab('step2')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      modalStepTab === 'step2'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-sky-700 border border-slate-200/80 hover:bg-sky-50'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-black">2</span>
                    <span>Step 2: Repertoire &amp; Bio</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${s2Val.isValid ? 'bg-emerald-500' : 'bg-amber-400'}`} title={s2Val.isValid ? 'Step 2 Complete' : `Missing: ${s2Val.missing.join(', ')}`} />
                  </button>

                  {/* Step 3: Pricing & Logistics */}
                  <button
                    type="button"
                    onClick={() => setModalStepTab('step3')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      modalStepTab === 'step3'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-sky-700 border border-slate-200/80 hover:bg-sky-50'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-black">3</span>
                    <span>Step 3: Pricing &amp; Logistics</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${s3Val.isValid ? 'bg-emerald-500' : 'bg-amber-400'}`} title={s3Val.isValid ? 'Step 3 Complete' : `Missing: ${s3Val.missing.join(', ')}`} />
                  </button>

                  {/* Step 4: Portfolio & Media */}
                  <button
                    type="button"
                    onClick={() => setModalStepTab('step4')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      modalStepTab === 'step4'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:text-sky-700 border border-slate-200/80 hover:bg-sky-50'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-black">4</span>
                    <span>Step 4: Portfolio &amp; Media</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${s4Val.isValid ? 'bg-emerald-500' : 'bg-rose-500'}`} title={s4Val.isValid ? 'Media Assets Complete' : `Missing: ${s4Val.missing.join(', ')}`} />
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  {/* Private KYC & ID Proof */}
                  <button
                    type="button"
                    onClick={() => setModalStepTab('kyc')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      modalStepTab === 'kyc'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-800 hover:text-amber-900 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Private KYC Proofs</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${docs?.id_document_url ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold hidden md:flex">
                  <span className="inline-block w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  <span>Interactive 4-Step Dossier Review</span>
                </div>
              </div>

              {/* Modal Body: Dynamic Step-Wise View */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* 1. ALL STEPS OVERVIEW VIEW */}
                {modalStepTab === 'all' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column (7 cols): Step 1, Step 2 & Step 4 */}
                    <div className="lg:col-span-7 space-y-5">
                      {/* STEP 1 CARD: Identity & Act */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs text-slate-600">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 font-black text-xs flex items-center justify-center">1</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-extrabold text-slate-900">Step 1: Identity &amp; Act</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s1Val.isValid 
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                                }`}>
                                  {s1Val.isValid ? 'Verified Input' : 'Incomplete Input'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">Legal credentials, stage name &amp; performance categorization</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArtistTierBadge
                              completedEvents={selectedRank.totalCompleted}
                              rankPosition={selectedRank.rank}
                              size="sm"
                            />
                            <button
                              type="button"
                              onClick={() => setModalStepTab('step1')}
                              className="text-[11px] font-bold text-sky-600 hover:text-sky-800 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Inspect Step 1</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Legal Name</span>
                            <span className="font-bold text-slate-900">{selectedArtist.name}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Stage / Act Name</span>
                            <span className="font-bold text-slate-900">{selectedArtist.stage_name || selectedArtist.name}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Primary Category</span>
                            <span className="font-bold text-sky-700">{selectedArtist.category}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Base City &amp; State</span>
                            <span className="font-bold text-slate-900">{selectedArtist.city}{selectedArtist.state ? `, ${selectedArtist.state}` : ''}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Industry Experience</span>
                            <span className="font-bold text-slate-900">{selectedArtist.experience_years || 1} Years</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Events Completed</span>
                            <span className="font-bold text-slate-900">{selectedRank.totalCompleted} Completed</span>
                          </div>
                        </div>
                      </div>

                      {/* STEP 2 CARD: Repertoire, Coverage & Bio */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs text-slate-600">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 font-black text-xs flex items-center justify-center">2</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-extrabold text-slate-900">Step 2: Repertoire, Coverage &amp; Bio</h3>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                                  {selectedArtist.genres?.length || 1} Genres
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">Artistic biography, performance genres, languages &amp; cities</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setModalStepTab('step2')}
                            className="text-[11px] font-bold text-sky-600 hover:text-sky-800 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Inspect Step 2</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bio */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Artist Bio / About</span>
                          <p className="leading-relaxed text-slate-700 text-xs bg-slate-50 border border-slate-100 rounded-xl p-3">
                            {selectedArtist.bio || 'No artist biography provided yet.'}
                          </p>
                        </div>

                        {/* Genres & Languages */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Musical Genres</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedArtist.genres || ['Bollywood']).map((g) => (
                              <span key={g} className="px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200/60 text-sky-700 text-[11px] font-semibold">
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Performance Languages</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedArtist.languages || ['Hindi', 'English']).map((lang) => (
                              <span key={lang} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Serviceable Cities / Coverage */}
                        {perf?.serviceable_cities && perf.serviceable_cities.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Coverage / Serviceable Cities</span>
                            <div className="flex flex-wrap gap-1.5">
                              {perf.serviceable_cities.map((city, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  <span>{city}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* STEP 4 CARD: Portfolio, Media & Socials */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs text-slate-600">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 font-black text-xs flex items-center justify-center">4</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-extrabold text-slate-900">Step 4: Portfolio, Media &amp; Socials</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s4Val.isValid
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                                }`}>
                                  {s4Val.isValid ? `${selectedArtist.youtube_links?.length || 0} Video Reels` : 'Media Incomplete'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">Live stage footage, studio audio tracks &amp; streaming handles</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setModalStepTab('step4')}
                            className="text-[11px] font-bold text-sky-600 hover:text-sky-800 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Inspect Step 4</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Performance Video Reels */}
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-rose-500" />
                            <span>Performance Video Reels ({selectedArtist.youtube_links?.length || 0})</span>
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
                        </div>

                        {/* Audio Samples */}
                        {selectedArtist.audio_samples && selectedArtist.audio_samples.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <Music className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Audio Recordings &amp; Samples ({selectedArtist.audio_samples.length})</span>
                            </h4>
                            <div className="space-y-1.5">
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
                          </div>
                        )}

                        {/* Social Links */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                          {selectedArtist.instagram_url && (
                            <a
                              href={selectedArtist.instagram_url.startsWith('http') ? selectedArtist.instagram_url : `https://instagram.com/${selectedArtist.instagram_url.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-pink-100"
                            >
                              <Instagram className="w-3.5 h-3.5" />
                              <span>Instagram</span>
                              <ExternalLink className="w-3 h-3 text-pink-400" />
                            </a>
                          )}
                          {selectedArtist.youtube_url && (
                            <a
                              href={selectedArtist.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-red-100"
                            >
                              <Youtube className="w-3.5 h-3.5" />
                              <span>YouTube</span>
                              <ExternalLink className="w-3 h-3 text-red-400" />
                            </a>
                          )}
                          {selectedArtist.website_url && (
                            <a
                              href={selectedArtist.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-slate-200"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>Website</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column (5 cols): Step 3 & Private KYC */}
                    <div className="lg:col-span-5 space-y-5">
                      {/* STEP 3 CARD: Pricing & Event Logistics */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs text-slate-600">
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 font-black text-xs flex items-center justify-center">3</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-extrabold text-slate-900">Step 3: Pricing &amp; Logistics</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s3Val.isValid
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                                }`}>
                                  {s3Val.isValid ? `₹${(pricing?.solo_price || selectedArtist.price_min || 15000).toLocaleString('en-IN')} Base` : 'Pricing Incomplete'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">Live booking quotes, set times &amp; technical logistics</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setModalStepTab('step3')}
                            className="text-[11px] font-bold text-sky-600 hover:text-sky-800 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Inspect Step 3</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
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

                        {/* Stage Logistics */}
                        {perf && (
                          <div className="pt-3 border-t border-slate-100 space-y-2">
                            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                              Stage &amp; Technical Logistics
                            </h4>
                            <div className="grid grid-cols-2 gap-2.5 text-xs">
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
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                              <span className="text-slate-600 font-medium">Sound System Provided:</span>
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                perf.sound_system_provided
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {perf.sound_system_provided ? 'Included (Artist)' : 'Not Included (Host PA)'}
                              </span>
                            </div>
                            {perf.technical_requirements && (
                              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                                <strong className="text-slate-800">Tech Rider:</strong> {perf.technical_requirements}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* PRIVATE KYC & ID PROOF (ADMIN ONLY) */}
                      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-4 text-xs text-slate-600">
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-amber-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 font-black text-xs flex items-center justify-center">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-extrabold text-amber-900">Private KYC &amp; ID Proof</h3>
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  Admin Only
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-700/80">Government identification &amp; settlement documents</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setModalStepTab('kyc')}
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Inspect KYC</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Legal Name on ID</span>
                            <span className={docs?.legal_name ? 'font-bold text-slate-900' : 'font-medium text-slate-400'}>
                              {docs?.legal_name || 'Not filled'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Govt ID Type</span>
                            <span className={(docs?.id_document_url || docs?.id_number_masked) && docs?.id_type ? 'font-bold text-slate-900 uppercase' : 'font-medium text-slate-400'}>
                              {(docs?.id_document_url || docs?.id_number_masked) && docs?.id_type ? docs.id_type : 'Not submitted'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 font-medium">Aadhaar / ID Number</span>
                            <span className={docs?.id_number_masked ? 'font-mono font-bold text-slate-900' : 'font-medium text-slate-400'}>
                              {docs?.id_number_masked || 'Not filled'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {docs?.id_document_url ? (
                            <a
                              href={getSecureKycUrl(docs.id_document_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs inline-flex items-center justify-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Inspect Govt ID</span>
                              <ExternalLink className="w-3 h-3 text-emerald-600" />
                            </a>
                          ) : (
                            <span className="text-rose-700 font-semibold text-[11px] p-2 bg-rose-50 border border-rose-200 rounded-lg w-full text-center">
                              No Govt ID attached
                            </span>
                          )}

                          {docs?.address_proof_url && (
                            <a
                              href={docs.address_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs inline-flex items-center justify-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-600" />
                              <span>Address Proof</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DEDICATED STEP 1 VIEW: Identity & Act */}
                {modalStepTab === 'step1' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-sm">
                          1
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900">Step 1 of 4: Identity &amp; Act</h3>
                            {s1Val.isValid ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Step 1 Completed</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1" title={s1Val.missing.join(', ')}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Step 1 Incomplete ({s1Val.missing.length} missing)</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">Legal performer registration details, contact info, and stage positioning</p>
                        </div>
                      </div>
                      <ArtistTierBadge
                        completedEvents={selectedRank.totalCompleted}
                        rankPosition={selectedRank.rank}
                        size="md"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Legal Full Name</span>
                        <span className="text-sm font-extrabold text-slate-900 block mt-1">{selectedArtist.name}</span>
                        <span className="text-[11px] text-slate-500">As per government records &amp; banking</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Stage / Act Name</span>
                        <span className="text-sm font-extrabold text-sky-700 block mt-1">{selectedArtist.stage_name || selectedArtist.name}</span>
                        <span className="text-[11px] text-slate-500">Public title displayed on Magnevents</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Performance Category</span>
                        <span className="text-sm font-extrabold text-slate-900 block mt-1">{selectedArtist.category}</span>
                        <span className="text-[11px] text-slate-500">Sub-genre: {selectedArtist.sub_category || 'Primary Act'}</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact Phone / WhatsApp</span>
                        <span className="text-sm font-extrabold text-slate-900 block mt-1">{selectedArtist.phone_no || 'Not provided'}</span>
                        <span className="text-[11px] text-slate-500">Used for client quote alerts &amp; booking dispatch</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Email Address</span>
                        <span className="text-sm font-extrabold text-slate-900 block mt-1 truncate">{selectedArtist.email || 'Not provided'}</span>
                        <span className="text-[11px] text-slate-500">Primary portal login &amp; verification contact</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Base City &amp; State</span>
                        <span className="text-sm font-extrabold text-slate-900 block mt-1">{selectedArtist.city}{selectedArtist.state ? `, ${selectedArtist.state}` : ''}</span>
                        <span className="text-[11px] text-slate-500">Country: {selectedArtist.country || 'India'}</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Experience in Industry</span>
                        <span className="text-sm font-extrabold text-slate-900 block mt-1">{selectedArtist.experience_years || 1} Years Active</span>
                        <span className="text-[11px] text-slate-500">Total historical gig experience</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Magnevents Completed Bookings</span>
                        <span className="text-sm font-extrabold text-slate-900 block mt-1">{selectedRank.totalCompleted} Shows Executed</span>
                        <span className="text-[11px] text-slate-500">Rank position: #{selectedRank.rank}</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Platform Visibility</span>
                        <span className={`text-sm font-extrabold block mt-1 ${selectedArtist.is_live ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {selectedArtist.is_live ? 'Live on Public Platform' : 'Pending Verification Activation'}
                        </span>
                        <span className="text-[11px] text-slate-500">Status: {selectedArtist.verification_status}</span>
                      </div>
                    </div>

                    {/* Step Navigator Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setModalStepTab('all')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                      >
                        All Steps Overview
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalStepTab('step2')}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Next: Step 2 Repertoire &amp; Bio</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. DEDICATED STEP 2 VIEW: Repertoire, Coverage & Bio */}
                {modalStepTab === 'step2' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-sm">
                          2
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900">Step 2 of 4: Repertoire, Coverage &amp; Bio</h3>
                            {s2Val.isValid ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Step 2 Completed</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1" title={s2Val.missing.join(', ')}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Step 2 Incomplete ({s2Val.missing.length} missing)</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">Artist biography story, musical genre capabilities, languages spoken, and coverage territory</p>
                        </div>
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Submitted Artist Biography</span>
                      <p className="leading-relaxed text-slate-800 text-sm whitespace-pre-wrap">
                        {selectedArtist.bio || 'No artist biography provided yet.'}
                      </p>
                    </div>

                    {/* Genres Grid */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Musical Genres Performed ({selectedArtist.genres?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(selectedArtist.genres || ['Bollywood']).map((g) => (
                          <span key={g} className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold">
                            🎵 {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Languages Grid */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Performance Languages ({selectedArtist.languages?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(selectedArtist.languages || ['Hindi', 'English']).map((lang) => (
                          <span key={lang} className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold">
                            🗣️ {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Serviceable Cities / Coverage */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Serviceable Cities &amp; Travel Readiness
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {perf?.serviceable_cities && perf.serviceable_cities.length > 0 ? (
                          perf.serviceable_cities.map((city, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{city}</span>
                            </span>
                          ))
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{selectedArtist.city} (Base City)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Social Handles */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Social &amp; Streaming Presence
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {selectedArtist.instagram_url && (
                          <a
                            href={selectedArtist.instagram_url.startsWith('http') ? selectedArtist.instagram_url : `https://instagram.com/${selectedArtist.instagram_url.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 font-bold text-xs inline-flex items-center gap-2 hover:bg-pink-100"
                          >
                            <Instagram className="w-4 h-4 text-pink-600" />
                            <span>Instagram: {selectedArtist.instagram_url}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
                          </a>
                        )}
                        {selectedArtist.youtube_url && (
                          <a
                            href={selectedArtist.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-xs inline-flex items-center gap-2 hover:bg-red-100"
                          >
                            <Youtube className="w-4 h-4 text-red-600" />
                            <span>YouTube Channel</span>
                            <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                          </a>
                        )}
                        {selectedArtist.website_url && (
                          <a
                            href={selectedArtist.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-2 hover:bg-slate-200"
                          >
                            <Globe className="w-4 h-4 text-slate-600" />
                            <span>Website: {selectedArtist.website_url}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>
                        )}
                        {!selectedArtist.instagram_url && !selectedArtist.youtube_url && !selectedArtist.website_url && (
                          <span className="text-slate-400 text-xs">No external social handles submitted.</span>
                        )}
                      </div>
                    </div>

                    {/* Step Navigator Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setModalStepTab('step1')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back: Step 1 Identity</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalStepTab('step3')}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Next: Step 3 Pricing &amp; Logistics</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. DEDICATED STEP 3 VIEW: Pricing & Logistics */}
                {modalStepTab === 'step3' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-sm">
                          3
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900">Step 3 of 4: Pricing &amp; Event Logistics</h3>
                            {s3Val.isValid ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Pricing Rates Defined</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1" title={s3Val.missing.join(', ')}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Pricing Incomplete ({s3Val.missing.length} missing)</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">Live booking pricing structures, stage durations, travel policies, and sound equipment rider</p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Solo Show / Starting</span>
                        <span className="text-xl font-black text-slate-900 block mt-1">
                          ₹{(pricing?.solo_price || selectedArtist.price_min || 15000).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-500">Base intimate performance fee</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Duo Performance Show</span>
                        <span className="text-xl font-black text-slate-900 block mt-1">
                          ₹{(pricing?.duo_price || 25000).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-500">2-artist acoustic or live setup</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Full Live Band / Ensemble</span>
                        <span className="text-xl font-black text-slate-900 block mt-1">
                          ₹{(pricing?.band_price || selectedArtist.price_max || 45000).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-500">Full group stage performance</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Hourly Overtime Rate</span>
                        <span className="text-xl font-black text-slate-900 block mt-1">
                          ₹{(pricing?.hourly_price || 5000).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-500">Additional hour beyond agreed set</span>
                      </div>
                    </div>

                    {/* Logistics & Policies */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Outstation Travel Policy</span>
                        <p className="text-sm font-semibold text-slate-800">
                          {pricing?.travel_charges_policy || 'Outstation travel & accommodation to be arranged by event host'}
                        </p>
                        <span className="text-[11px] text-slate-500 block">Travel Readiness: {(perf?.travel_readiness || 'pan_india').replace('_', ' ').toUpperCase()}</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Set Duration</span>
                        <p className="text-sm font-semibold text-slate-800">
                          {perf?.min_duration_minutes || 60} minutes to {perf?.max_duration_minutes || 180} minutes
                        </p>
                        <span className="text-[11px] text-slate-500 block">Standard live gig duration range</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sound System Arrangement</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            perf?.sound_system_provided
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {perf?.sound_system_provided ? '✓ Sound System Included by Artist' : '⚠️ Host / Venue PA Required'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">Client booking quote clarity</span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Technical Rider &amp; Stage PA</span>
                        <p className="text-xs text-slate-800 font-medium">
                          {perf?.technical_requirements || 'Standard Stage PA with 2 wireless vocal mics & stage monitoring'}
                        </p>
                      </div>
                    </div>

                    {/* Step Navigator Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setModalStepTab('step2')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back: Step 2 Repertoire</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalStepTab('step4')}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Next: Step 4 Portfolio &amp; Media</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. DEDICATED STEP 4 VIEW: Portfolio, Media & Socials */}
                {modalStepTab === 'step4' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-sm">
                          4
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900">Step 4 of 4: Portfolio, Media &amp; Socials</h3>
                            {s4Val.isValid ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Media Assets Submitted</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1" title={s4Val.missing.join(', ')}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Media Assets Incomplete ({s4Val.missing.length} missing)</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">Public profile imagery, cover banner, live stage video reels, and audio samples</p>
                        </div>
                      </div>
                    </div>

                    {/* Photos Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Primary Profile Photo</span>
                        <div className="flex items-center gap-3">
                          <img
                            src={selectedArtist.profile_image_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200'}
                            alt={selectedArtist.name}
                            className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-200"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs block truncate">
                              {selectedArtist.profile_image_url ? 'Profile Photo Uploaded' : 'Default Avatar Applied'}
                            </span>
                            {selectedArtist.profile_image_url && (
                              <a
                                href={selectedArtist.profile_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 hover:underline text-[11px] inline-flex items-center gap-1 font-bold mt-1"
                              >
                                <span>Inspect Full Resolution</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Stage Cover Banner</span>
                        {selectedArtist.cover_image_url ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={selectedArtist.cover_image_url}
                              alt="Cover Banner"
                              className="w-24 h-16 rounded-xl object-cover ring-2 ring-slate-200"
                            />
                            <a
                              href={selectedArtist.cover_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:underline text-[11px] inline-flex items-center gap-1 font-bold"
                            >
                              <span>Inspect Cover Banner</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <p className="text-slate-400 text-xs italic py-2">No stage cover banner uploaded.</p>
                        )}
                      </div>
                    </div>

                    {/* Performance Video Reels */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-rose-500" />
                        <span>Submitted Video Showreels ({selectedArtist.youtube_links?.length || 0})</span>
                      </span>
                      {selectedArtist.youtube_links && selectedArtist.youtube_links.length > 0 ? (
                        <div className="space-y-2">
                          {selectedArtist.youtube_links.map((link, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                                  <Video className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-bold text-slate-900 truncate text-xs">Video Reel #{i + 1}: {link}</span>
                              </div>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs inline-flex items-center gap-1 flex-shrink-0"
                              >
                                <span>Watch Video</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs italic">No performance video links submitted yet.</p>
                      )}
                    </div>

                    {/* Audio Tracks */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                        <Music className="w-4 h-4 text-indigo-500" />
                        <span>Submitted Audio Tracks &amp; Recordings ({selectedArtist.audio_samples?.length || 0})</span>
                      </span>
                      {selectedArtist.audio_samples && selectedArtist.audio_samples.length > 0 ? (
                        <div className="space-y-2">
                          {selectedArtist.audio_samples.map((audio, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                  <Music className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-bold text-slate-900 truncate text-xs">Audio Track #{i + 1}: {audio}</span>
                              </div>
                              <a
                                href={audio}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs inline-flex items-center gap-1 flex-shrink-0"
                              >
                                <span>Listen Audio</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs italic">No audio tracks submitted yet.</p>
                      )}
                    </div>

                    {/* Step Navigator Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setModalStepTab('step3')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back: Step 3 Pricing</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalStepTab('kyc')}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Next: Private KYC Proofs</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. DEDICATED PRIVATE KYC VIEW */}
                {modalStepTab === 'kyc' && (
                  <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-6 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-amber-950">Confidential: Private KYC &amp; Verification Proofs</h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                              Admin Access Only
                            </span>
                          </div>
                          <p className="text-xs text-amber-800/80">Government proof documents, Aadhaar / PAN identity data, and payout verification</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Legal Name on Aadhaar / ID</span>
                        <span className="text-base font-extrabold text-slate-900 block">{docs?.legal_name || 'Not filled'}</span>
                        <span className="text-[11px] text-amber-700">Must match settlement bank account</span>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Government ID Document Type</span>
                        <span className="text-base font-extrabold text-slate-900 uppercase block">
                          {(docs?.id_document_url || docs?.id_number_masked) && docs?.id_type ? docs.id_type : 'AADHAAR'}
                        </span>
                        <span className="text-[11px] text-amber-700">Aadhaar Card (UIDAI Verified)</span>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Aadhaar Card Number</span>
                        <span className="text-base font-mono font-extrabold text-slate-900 block">{docs?.id_number_masked || 'Not filled'}</span>
                        <span className="text-[11px] text-amber-700">Masked for privacy compliance</span>
                      </div>
                    </div>

                    {/* Attached Documents */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Attached Identification Documents
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {docs?.id_document_url ? (
                          <a
                            href={getSecureKycUrl(docs.id_document_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Inspect Government ID Document</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
                            ⚠️ No Government ID document attached by applicant.
                          </span>
                        )}

                        {docs?.address_proof_url && (
                          <a
                            href={docs.address_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Inspect Address Proof</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Step Navigator Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setModalStepTab('step4')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back: Step 4 Portfolio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalStepTab('all')}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <span>View All Steps Overview</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation Warning Box */}
                {deleteConfirmOpen && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-300 space-y-3 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-red-900">
                          Permanently Delete Application Query?
                        </h4>
                        <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                          Are you sure you want to permanently delete the application query for <strong>{selectedArtist.name}</strong> ({selectedArtist.email || 'No email'})? This will remove all their details, KYC proofs, and audio/video links from the system.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOpen(false)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteApplication(selectedArtist)}
                        disabled={deleting}
                        className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Confirm Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

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

                {/* Director Follow-Up & 2-Way Artist Inquiry Panel */}
                {(showFollowUpInput || followUpHistory.length > 0) && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-sky-50/80 via-white to-sky-50/30 border border-sky-200 shadow-sm space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-sky-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                          <MessageSquareQuote className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              Director Follow-Up &amp; Artist Query
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold">
                              Not a Rejection
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Direct inquiry for {selectedArtist.name}. The artist is notified and can reply to resolve any doubts or questions.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowFollowUpInput((prev) => !prev)}
                        className="text-xs font-bold text-sky-700 hover:text-sky-900 px-2.5 py-1 rounded-lg hover:bg-sky-100/60 transition-colors"
                      >
                        {showFollowUpInput ? 'Hide Composer' : '+ New Follow-Up Query'}
                      </button>
                    </div>

                    {/* Composer Area */}
                    {showFollowUpInput && (
                      <div className="space-y-3 bg-white p-3.5 sm:p-4 rounded-xl border border-sky-200/80 shadow-xs">
                        {/* Quick Presets */}
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                            Quick Topic Presets:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {FOLLOW_UP_PRESETS.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  setFollowUpSubject(preset.subject);
                                  setFollowUpMessage(preset.message(selectedArtist));
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-800 text-[11px] font-semibold transition-all flex items-center gap-1"
                              >
                                <span>{preset.icon}</span>
                                <span>{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Subject */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Follow-Up Subject:
                          </label>
                          <input
                            type="text"
                            value={followUpSubject}
                            onChange={(e) => setFollowUpSubject(e.target.value)}
                            placeholder="Enter inquiry topic..."
                            className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white"
                          />
                        </div>

                        {/* Message Box */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Message to Artist:
                          </label>
                          <textarea
                            value={followUpMessage}
                            onChange={(e) => setFollowUpMessage(e.target.value)}
                            placeholder="Type your question or clarification for the artist..."
                            className="w-full p-3 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white h-24 font-normal"
                          />
                        </div>

                        {/* Notification Channels */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
                            <span className="font-bold text-[11px] text-slate-500">Channels:</span>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={followUpChannels.email}
                                onChange={(e) =>
                                  setFollowUpChannels((prev) => ({ ...prev, email: e.target.checked }))
                                }
                                className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                              />
                              <span className="text-[11px] font-semibold">✉️ Email ({selectedArtist.email || 'No email'})</span>
                            </label>

                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={followUpChannels.whatsapp}
                                onChange={(e) =>
                                  setFollowUpChannels((prev) => ({ ...prev, whatsapp: e.target.checked }))
                                }
                                className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                              />
                              <span className="text-[11px] font-semibold">💬 WhatsApp ({selectedArtist.phone_no || 'No phone'})</span>
                            </label>

                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={followUpChannels.portal}
                                onChange={(e) =>
                                  setFollowUpChannels((prev) => ({ ...prev, portal: e.target.checked }))
                                }
                                className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                              />
                              <span className="text-[11px] font-semibold">🔔 In-Portal Alert</span>
                            </label>
                          </div>

                          <div className="flex items-center gap-2">
                            {selectedArtist.phone_no && (
                              <button
                                type="button"
                                onClick={() => {
                                  const url = buildArtistFollowUpWhatsAppUrl(selectedArtist, followUpMessage);
                                  window.open(url, '_blank', 'noopener,noreferrer');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                                title="Open WhatsApp chat with prefilled follow-up text"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp Query</span>
                              </button>
                            )}

                            {selectedArtist.email && (
                              <button
                                type="button"
                                onClick={() => {
                                  const url = buildArtistFollowUpEmailUrl(selectedArtist, followUpSubject, followUpMessage);
                                  window.location.href = url;
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1"
                                title="Open email client with prefilled follow-up"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Email Query</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={handleSendFollowUp}
                              disabled={followUpSending || !followUpMessage.trim()}
                              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {followUpSending ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send Follow-Up</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Previous Conversation History / Log */}
                    {followUpHistory.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                          Conversation &amp; Inquiry History ({followUpHistory.length}):
                        </span>

                        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                          {followUpHistory.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                                  <span className="font-bold text-xs text-slate-900">
                                    {item.subject}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <span>{new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                  <span>•</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                      item.status === 'replied'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {item.status === 'replied' ? '✓ Replied' : 'Awaiting Reply'}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-700 whitespace-pre-wrap pl-3.5 border-l-2 border-sky-300">
                                {item.message}
                              </p>

                              {/* Channels Used */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10px]">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <span>Notified via:</span>
                                  {item.channels.includes('email') && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                      ✉️ Email
                                    </span>
                                  )}
                                  {item.channels.includes('whatsapp') && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                                      💬 WhatsApp
                                    </span>
                                  )}
                                  {item.channels.includes('portal') && (
                                    <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-semibold">
                                      🔔 In-Portal
                                    </span>
                                  )}
                                </div>

                                {item.status === 'sent' && recordingReplyId !== item.id && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRecordingReplyId(item.id);
                                      setArtistReplyText('');
                                    }}
                                    className="text-sky-700 hover:text-sky-900 font-bold hover:underline flex items-center gap-1"
                                  >
                                    <Reply className="w-3 h-3" />
                                    <span>+ Log Artist&apos;s Reply / Doubt Resolution</span>
                                  </button>
                                )}
                              </div>

                              {/* Artist Reply Record Bubble if replied */}
                              {item.status === 'replied' && item.reply_note && (
                                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800">
                                    <span className="flex items-center gap-1">
                                      <CornerDownRight className="w-3 h-3 text-emerald-600" />
                                      <span>Artist Response:</span>
                                    </span>
                                    {item.reply_at && (
                                      <span className="text-slate-400 font-normal">
                                        {new Date(item.reply_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-emerald-950 italic pl-4">
                                    &ldquo;{item.reply_note}&rdquo;
                                  </p>
                                </div>
                              )}

                              {/* Recording reply input */}
                              {recordingReplyId === item.id && (
                                <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-200 text-xs space-y-2">
                                  <label className="block text-[11px] font-bold text-sky-900">
                                    Record Artist&apos;s Response (via Call, WhatsApp or Email):
                                  </label>
                                  <textarea
                                    value={artistReplyText}
                                    onChange={(e) => setArtistReplyText(e.target.value)}
                                    placeholder="Type what the artist replied or clarified..."
                                    className="w-full p-2 bg-white border border-sky-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-400 h-16"
                                  />
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setRecordingReplyId(null)}
                                      className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 font-medium"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveArtistReply(item.id)}
                                      disabled={!artistReplyText.trim()}
                                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                                    >
                                      Save Reply
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                    type="button"
                    onClick={() => {
                      setShowRejectInput(false);
                      setDeleteConfirmOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs min-h-[40px] flex items-center justify-center gap-1.5 transition-colors"
                    title="Permanently delete this application query"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Delete Query</span>
                  </button>

                  <button
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setShowRejectInput(true);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs min-h-[40px]"
                  >
                    Reject Application
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setShowRejectInput(false);
                      setShowFollowUpInput((prev) => !prev);
                    }}
                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl border font-bold text-xs min-h-[40px] flex items-center justify-center gap-1.5 transition-all ${
                      showFollowUpInput
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800'
                    }`}
                    title="Start a direct follow-up conversation with this artist (Not a rejection)"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Follow-Up / Query</span>
                    {followUpHistory.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-sky-200/90 text-sky-900 text-[10px] font-black">
                        {followUpHistory.length}
                      </span>
                    )}
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
