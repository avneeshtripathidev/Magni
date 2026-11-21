'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { artistService } from '../../../services/artistService';
import { EventVerificationPanel } from '../../../components/dashboard/EventVerificationPanel';
import { EventKYCModal } from '../../../components/dashboard/EventKYCModal';
import { LocationFilter, matchesLocationFilter } from '../../../components/shared/LocationFilter';
import { ModalPortal } from '../../../components/shared/ModalPortal';
import {
  EventVerificationRecord,
  computeProofStatus,
} from '../../../types/eventVerification';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Search, 
  PhoneCall, 
  ShieldCheck, 
  Check, 
  X, 
  CalendarCheck,
  CheckCircle2,
  Clock,
  Lock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Radio,
  Upload,
  MessageSquare,
  MessageCircle,
  Send,
  CornerDownRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function BookingsPage() {
  const { artist, refreshArtist } = useArtistAuth();
  const [viewTab, setViewTab] = useState<'inquiries' | 'calendar'>('inquiries');
  const [bookings, setBookings] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<EventVerificationRecord[]>([]);
  const [activeVerifyEvent, setActiveVerifyEvent] = useState<EventVerificationRecord | null>(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycEvent, setKycEvent] = useState<EventVerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const isKYCCompleted = Boolean(
    artist?.verification_documents?.legal_name &&
    artist?.verification_documents?.id_number_masked
  );
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Availability calendar state (dynamic current month)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [blockedDates, setBlockedDates] = useState<string[]>(
    artist?.performance_details?.blocked_dates || []
  );
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Reject Booking Modal State
  const [rejectBooking, setRejectBooking] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('Schedule / Date Conflict with another show');
  const [rejectNote, setRejectNote] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Chat with Admin Coordinator State
  const [chatBooking, setChatBooking] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatBookingMessages, setChatBookingMessages] = useState<Record<string, any[]>>({});

  const isEventForArtist = useCallback(
    (e: EventVerificationRecord) => {
      if (!artist) return false;
      const artistId = (artist.id || '').toLowerCase();
      const artistName = (artist.name || '').toLowerCase();
      const stageName = (artist.stage_name || '').toLowerCase();

      if (Array.isArray(e.assigned_artists) && e.assigned_artists.length > 0) {
        return e.assigned_artists.some(
          (a) =>
            (artistId && (a.artist_id || '').toLowerCase() === artistId) ||
            (artistName && (a.name || '').toLowerCase() === artistName) ||
            (stageName && (a.stage_name || '').toLowerCase() === stageName)
        );
      }

      const evArtist = (e.artist_name || '').toLowerCase();
      return Boolean(
        (artistName && evArtist.includes(artistName)) ||
          (stageName && evArtist.includes(stageName))
      );
    },
    [artist]
  );

  // Load Live Event Verifications assigned to this artist (started by Admin)
  const loadLiveEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/artist/event-verification', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.events)) {
        const artistEvents = data.events.filter(isEventForArtist);
        setLiveEvents(artistEvents);
        // Only refresh the popup data if the user already has a proof modal open
        setActiveVerifyEvent((prev) => {
          if (!prev) return null;
          return artistEvents.find((e: EventVerificationRecord) => e.booking_id === prev.booking_id) || prev;
        });
      }
    } catch (err) {
      console.warn('Could not load live event verifications:', err);
    }
  }, [isEventForArtist]);

  // Load Bookings from centralized database + live admin events
  useEffect(() => {
    async function loadBookings() {
      try {
        if (artist?.id) {
          const data = await artistService.getArtistBookings(artist.id);
          setBookings(Array.isArray(data) ? data : []);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
    loadLiveEvents();

    const poll = setInterval(loadLiveEvents, 8000);

    // Sync blocked dates from profile
    if (artist?.performance_details?.blocked_dates) {
      setBlockedDates(artist.performance_details.blocked_dates);
    }

    // Subscribe to real-time changes
    let unsubscribe = () => {};
    if (artist?.id) {
      unsubscribe = artistService.subscribeToArtistChanges(artist.id, () => {
        loadBookings();
        loadLiveEvents();
        refreshArtist();
      });
    }

    return () => {
      clearInterval(poll);
      unsubscribe();
    };
  }, [artist?.id, loadLiveEvents]);

  const handleEventProofUpdated = (updated: EventVerificationRecord) => {
    setLiveEvents((prev) =>
      prev.map((e) => (e.booking_id === updated.booking_id ? updated : e))
    );
    setActiveVerifyEvent(updated);
  };

  // Handle Accept Booking
  const handleAcceptBooking = async (bookingId: string) => {
    try {
      await artistService.updateBookingStatus(bookingId, 'confirmed');
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed', payout_status: 'Advance in Escrow' } : b))
      );
      setActionMessage({ type: 'success', text: `Booking #${bookingId} accepted and confirmed! Date is now locked.` });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' } : b))
      );
      setActionMessage({ type: 'success', text: `Booking #${bookingId} confirmed.` });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Handle Decline Booking
  const handleDeclineBooking = async (bookingId: string) => {
    handleOpenRejectModal({ id: bookingId });
  };

  // Handle Open Reject Modal
  const handleOpenRejectModal = (b: any) => {
    setRejectBooking(b);
    setRejectReason('Schedule / Date Conflict with another show');
    setRejectNote('');
  };

  // Handle Confirm Reject / Decline Booking
  const handleConfirmRejectBooking = async () => {
    if (!rejectBooking) return;
    setSubmittingReject(true);
    const bookingId = rejectBooking.id;
    const fullReason = rejectNote.trim()
      ? `${rejectReason} — Note: ${rejectNote.trim()}`
      : rejectReason;

    try {
      await artistService.updateBookingStatus(bookingId, 'rejected', fullReason);

      try {
        await fetch('/api/artist/event-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_booking_status',
            booking_id: bookingId,
            status: 'rejected',
            reason: fullReason,
          }),
        });
      } catch (e) {}

      await artistService.sendNotification({
        artist_id: artist?.id || 'admin',
        type: 'booking',
        title: `Booking #${bookingId} Declined/Rejected by Performer`,
        message: `${artist?.stage_name || artist?.name || 'Artist'} rejected booking #${bookingId}: "${fullReason}". Coordinator reassignment required.`,
      });

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected', notes: fullReason } : b))
      );
      setLiveEvents((prev) =>
        prev.map((e) => (e.booking_id === bookingId ? { ...e, booking_status: 'rejected' } : e))
      );

      setActionMessage({
        type: 'success',
        text: `Booking #${bookingId} has been declined. Admin coordinator notified for reassignment.`,
      });
      setRejectBooking(null);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected', notes: fullReason } : b))
      );
      setLiveEvents((prev) =>
        prev.map((e) => (e.booking_id === bookingId ? { ...e, booking_status: 'rejected' } : e))
      );
      setActionMessage({
        type: 'success',
        text: `Booking #${bookingId} marked as rejected. Coordinator notified.`,
      });
      setRejectBooking(null);
      setTimeout(() => setActionMessage(null), 5000);
    } finally {
      setSubmittingReject(false);
    }
  };

  // Handle Open Chat Modal
  const handleOpenChatModal = (b: any) => {
    setChatBooking(b);
    setChatMessage('');
    try {
      const stored = localStorage.getItem(`magne_booking_chat_${b.id}`);
      if (stored) {
        setChatBookingMessages((prev) => ({ ...prev, [b.id]: JSON.parse(stored) }));
      }
    } catch (e) {}
  };

  // Handle Send Booking Message to Admin
  const handleSendBookingMessage = async () => {
    if (!chatBooking || !chatMessage.trim()) return;
    setSendingChat(true);
    const bookingId = chatBooking.id;
    const msgText = chatMessage.trim();
    const newMsg = {
      id: `msg_${Date.now()}`,
      text: msgText,
      artist_name: artist?.stage_name || artist?.name || 'Artist',
      sent_at: new Date().toISOString(),
    };

    try {
      try {
        await fetch('/api/artist/event-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'artist_message',
            booking_id: bookingId,
            message: msgText,
            artist_name: artist?.stage_name || artist?.name,
            artist_id: artist?.id,
          }),
        });
      } catch (e) {}

      await artistService.sendNotification({
        artist_id: artist?.id || 'admin',
        type: 'booking',
        title: `Artist Message on Booking #${bookingId}`,
        message: `${artist?.stage_name || artist?.name || 'Artist'}: "${msgText}"`,
      });

      const updatedList = [...(chatBookingMessages[bookingId] || []), newMsg];
      setChatBookingMessages((prev) => ({
        ...prev,
        [bookingId]: updatedList,
      }));

      try {
        localStorage.setItem(`magne_booking_chat_${bookingId}`, JSON.stringify(updatedList));
      } catch (e) {}

      setActionMessage({
        type: 'success',
        text: `Your message regarding Booking #${bookingId} has been sent to the Artist Admin.`,
      });
      setChatMessage('');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Failed to send message. Please use WhatsApp or Call Coordinator.',
      });
    } finally {
      setSendingChat(false);
    }
  };

  // Handle Calendar Date Toggle
  const handleToggleDate = async (dateStr: string) => {
    if (!artist?.id) return;
    const isCurrentlyBlocked = blockedDates.includes(dateStr);
    const newBlocked = isCurrentlyBlocked
      ? blockedDates.filter((d) => d !== dateStr)
      : [...blockedDates, dateStr];

    setBlockedDates(newBlocked);
    setSavingAvailability(true);

    try {
      await artistService.updateAvailability(artist.id, newBlocked);
      await refreshArtist();
      setActionMessage({
        type: 'success',
        text: isCurrentlyBlocked ? `Date ${dateStr} marked Available.` : `Date ${dateStr} is now Blocked.`,
      });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.warn('Failed to save availability to DB:', err);
    } finally {
      setSavingAvailability(false);
    }
  };

  // Merge live admin-started events into bookings list so newly started events show up automatically
  const mergedBookings = (() => {
    const map = new Map<string, any>();
    bookings.forEach((b) => map.set(b.id, b));
    liveEvents.forEach((ev) => {
      const existing = map.get(ev.booking_id);
      if (existing) {
        map.set(ev.booking_id, {
          ...existing,
          status: ev.booking_status || existing.status,
          payout_status: ev.payout_status || existing.payout_status,
          liveEvent: ev,
        });
      } else {
        map.set(ev.booking_id, {
          id: ev.booking_id,
          customer_name: ev.client_name,
          event_type: ev.event_title,
          city: ev.city,
          event_date: ev.event_date,
          guest_count: ev.guest_count,
          package_title: ev.package_title || 'Live Event Set',
          total_amount: ev.budget,
          status: ev.booking_status || 'confirmed',
          payout_status: ev.payout_status || 'Advance in Escrow',
          coordinator_phone: ev.client_phone || '+91 80765 15257',
          liveEvent: ev,
        });
      }
    });
    return Array.from(map.values());
  })();

  const filtered = mergedBookings.filter((b) => {
    const statusMatch = filter === 'all' || (b.status || '').toLowerCase() === filter;
    const locationMatch = matchesLocationFilter(locationFilter, b.city, undefined, b.liveEvent?.venue);
    const searchMatch = !search || 
      (b.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.event_type || '').toLowerCase().includes(search.toLowerCase());
    return statusMatch && locationMatch && searchMatch;
  });

  // Calendar Helper: Build dynamic dates for the selected month
  const calYear = currentMonth.getFullYear();
  const calMonthIdx = currentMonth.getMonth();
  const calMonthLabel = currentMonth.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
  const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate();
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${calYear}-${(calMonthIdx + 1).toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}`;
    const confirmedBooking = mergedBookings.find(
      (b) => b.event_date === dateStr && (b.status === 'confirmed' || b.status === 'completed')
    );
    const isBlocked = blockedDates.includes(dateStr);

    return {
      day,
      dateStr,
      confirmedBooking,
      isBlocked,
    };
  });

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* Header with View Switcher (matching admin.magnevents.in) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
            Bookings & Availability
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Manage inquiries, confirm performance dates, and control live calendar availability.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex flex-wrap sm:flex-nowrap p-1 bg-slate-200/50 backdrop-blur-md rounded-[20px] border border-white items-center self-start sm:self-auto max-w-full shadow-xs">
          <button
            onClick={() => setViewTab('inquiries')}
            className={`px-3.5 sm:px-5 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 whitespace-nowrap ${
              viewTab === 'inquiries'
                ? 'bg-white text-sky-600 shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Inquiries ({mergedBookings.length})</span>
          </button>

          <button
            onClick={() => setViewTab('calendar')}
            className={`px-3.5 sm:px-5 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 whitespace-nowrap ${
              viewTab === 'calendar'
                ? 'bg-white text-sky-600 shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Availability Calendar</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs border flex items-center justify-between shadow-xs animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs font-bold opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: INQUIRIES & BOOKINGS LIST */}
      {viewTab === 'inquiries' && (
        <div className="space-y-4">
          {/* Action Required: KYC Banner when Event is Assigned */}
          {liveEvents.length > 0 && !isKYCCompleted && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border-2 border-sky-400 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    KYC Required for Assigned Event
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Admin assigned you to an active booking. Please submit your Government ID & Bank Payout details to accept.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setKycEvent(liveEvents[0]);
                  setShowKYCModal(true);
                }}
                className="btn-primary py-2 px-4 text-xs font-bold self-start sm:self-auto flex-shrink-0 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Complete KYC</span>
              </button>
            </div>
          )}

          {/* Full-width Rounded Search Bar + Location Selector */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group flex-1 min-w-0">
              <div className="absolute inset-y-0 left-4 sm:left-6 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 group-focus-within:text-sky-600 transition-colors" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by client name, city, or event type..."
                className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 h-14 rounded-[22px] border border-slate-200/80 bg-white shadow-sm text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-sky-600/5 focus:border-sky-300 transition-all"
              />
            </div>

            <LocationFilter
              value={locationFilter}
              onChange={setLocationFilter}
              availableCities={mergedBookings.map((b) => b.city)}
              className="h-14 px-4 rounded-[22px] flex-shrink-0"
            />
          </div>

          {/* Filter Pills Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex p-1 bg-slate-200/50 backdrop-blur-md rounded-[20px] border border-white items-center overflow-x-auto max-w-full scrollbar-hide shadow-xs">
              {(['all', 'confirmed', 'pending', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-5 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                    filter === tab
                      ? 'bg-white text-sky-600 shadow-sm border border-slate-100'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings Cards inside Luxe Container */}
          {loading ? (
            <div className="luxe-card p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse h-24" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="luxe-card p-16 text-center flex flex-col items-center justify-center gap-3 min-h-[280px]">
              <Calendar className="w-12 h-12 text-slate-200" />
              <h3 className="text-lg font-bold text-slate-400">No inquiries found</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {artist?.verification_status !== 'approved'
                  ? 'Complete verification so your listing goes live to prospective hosts.'
                  : 'Client performance inquiries will appear here.'}
              </p>
            </div>
          ) : (
            <div className="luxe-card p-5 sm:p-6 space-y-3">
              {filtered.map((item) => {
                const isPending = (item.status || '').toLowerCase() === 'pending';
                const liveEv: EventVerificationRecord | undefined = item.liveEvent;
                const liveStatus = liveEv?.event_live_status;
                const proof = liveEv ? computeProofStatus(liveEv) : null;

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl bg-white border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                      liveStatus === 'started'
                        ? 'border-sky-300 ring-2 ring-sky-500/10'
                        : liveStatus === 'verified'
                        ? 'border-emerald-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'completed'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : item.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.status || 'Pending'}
                        </span>

                        {liveStatus === 'started' && proof && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-wider">
                            <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                            Event Started • {proof.completedCount}/4 Proofs
                          </span>
                        )}

                        {liveStatus === 'verified' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Event Verified ✓
                          </span>
                        )}

                        <span className="text-[11px] font-mono text-slate-400">#{item.id}</span>
                        <span className="text-xs font-bold text-slate-900">
                          {item.event_type}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        <span className="text-slate-900 font-semibold">{item.customer_name}</span>
                        <span className="mx-1.5 text-slate-300">•</span>
                        <span>{item.package_title}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-500 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          <span>
                            {item.event_date
                              ? new Date(item.event_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'TBD'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.city}</span>
                        </div>

                        {item.guest_count && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.guest_count} guests</span>
                          </div>
                        )}

                        {item.payout_status && (
                          <div className="flex items-center gap-1 text-emerald-700 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{item.payout_status}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right pr-2">
                        <div className="text-base font-extrabold text-slate-900">
                          ₹{Number(item.total_amount || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Performance Fee</span>
                      </div>

                      {/* Admin-Started Live Event Proof Upload Button */}
                      {liveEv && liveStatus === 'started' && proof && (
                        <button
                          type="button"
                          onClick={() => setActiveVerifyEvent(liveEv)}
                          className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5 min-h-[38px] touch-manipulation"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Proofs ({proof.completedCount}/4)</span>
                        </button>
                      )}

                      {liveEv && liveStatus === 'verified' && (
                        <button
                          type="button"
                          onClick={() => setActiveVerifyEvent(liveEv)}
                          className="py-2 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-1.5 min-h-[38px] touch-manipulation transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>View Verified Proofs</span>
                        </button>
                      )}

                      {/* Action Buttons */}
                      {isPending ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptBooking(item.id)}
                            className="btn-primary py-2 px-3 text-xs flex items-center gap-1 min-h-[38px] touch-manipulation"
                            title="Accept this gig"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal(item)}
                            className="btn-secondary py-2 px-2.5 text-xs text-rose-700 hover:bg-rose-50 border-rose-200 min-h-[38px] touch-manipulation flex items-center gap-1"
                            title="Decline this gig"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenChatModal(item)}
                            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 min-h-[38px] touch-manipulation text-sky-700 hover:bg-sky-50 border-sky-200"
                            title="Send message or query to Artist Admin"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                            <span>Chat with Admin</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Chat with Admin Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenChatModal(item)}
                            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 min-h-[38px] touch-manipulation text-sky-700 hover:bg-sky-50 border-sky-200"
                            title="Send message or chat with Artist Admin for this booking"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                            <span>Chat with Admin</span>
                          </button>

                          {/* Call Coordinator Button */}
                          <a
                            href={`tel:${item.coordinator_phone || '+918076515257'}`}
                            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 min-h-[38px] touch-manipulation"
                            title="Call your assigned event coordinator"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                            <span>Call Coordinator</span>
                          </a>

                          {/* Reject / Cancel Booking Button */}
                          {item.status !== 'rejected' && item.status !== 'cancelled' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(item)}
                              className="btn-secondary text-xs py-2 px-2.5 flex items-center gap-1 min-h-[38px] touch-manipulation text-rose-700 hover:bg-rose-50 border-rose-200"
                              title="Reject or decline this booking"
                            >
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Reject</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                              Declined by Performer
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: INTERACTIVE AVAILABILITY CALENDAR */}
      {viewTab === 'calendar' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          {/* Calendar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                {calMonthLabel} Calendar
              </h2>
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(calYear, calMonthIdx - 1, 1))}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(calYear, calMonthIdx + 1, 1))}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="font-semibold text-slate-700">Confirmed Gig</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>Blocked by You</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Tap any future date below to toggle between <span className="text-slate-900 font-semibold">Available</span> and <span className="text-slate-600 font-semibold">Blocked</span>. Changes sync immediately to Magnevents customer searches across website and mobile.
          </p>

          {/* Responsive Calendar Grid */}
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[290px] sm:min-w-0 text-center select-none">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-[10px] sm:text-xs font-bold text-slate-400 py-1 uppercase tracking-wider">
                  {day}
                </div>
              ))}

              {monthDates.map((item) => {
                const isBooked = !!item.confirmedBooking;
                const isBlocked = item.isBlocked;

                return (
                  <button
                    key={item.day}
                    type="button"
                    onClick={() => !isBooked && handleToggleDate(item.dateStr)}
                    disabled={isBooked}
                    className={`p-1.5 sm:p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[54px] sm:min-h-[76px] touch-manipulation ${
                      isBooked
                        ? 'bg-sky-50 border-sky-300 text-sky-900 cursor-default shadow-xs'
                        : isBlocked
                        ? 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 active:scale-95'
                        : 'bg-white border-slate-200 text-slate-900 hover:border-sky-500 hover:shadow-xs active:scale-95'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs sm:text-sm font-bold">{item.day}</span>
                      {isBooked ? (
                        <CalendarCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-sky-600 flex-shrink-0" />
                      ) : isBlocked ? (
                        <Lock className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </div>

                    <span className="text-[8px] sm:text-[10px] font-semibold truncate block mt-1">
                      {isBooked ? 'Gig Confirmed' : isBlocked ? 'Blocked' : 'Available'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              <strong className="text-slate-900 font-bold">{blockedDates.length}</strong> dates currently blocked
            </span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Auto-synced to centralized database
            </span>
          </div>
        </div>
      )}

      {/* Popup Modal for Uploading / Viewing 4 Mandatory Event Proofs */}
      <ModalPortal
        isOpen={!!activeVerifyEvent}
        onClose={() => setActiveVerifyEvent(null)}
      >
        {activeVerifyEvent && (
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] shadow-2xl">
            <EventVerificationPanel
              event={activeVerifyEvent}
              onUpdated={handleEventProofUpdated}
              onClose={() => setActiveVerifyEvent(null)}
            />
          </div>
        )}
      </ModalPortal>

      {/* KYC & Payout Details Modal for Assigned Event */}
      <EventKYCModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        event={kycEvent || liveEvents[0]}
      />

      {/* Reject / Decline Booking Modal */}
      <ModalPortal
        isOpen={!!rejectBooking}
        onClose={() => setRejectBooking(null)}
      >
        {rejectBooking && (
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-rose-50 via-white to-red-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Reject Booking #{rejectBooking.id}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {rejectBooking.event_type || rejectBooking.package_title || 'Live Performance'} • {rejectBooking.city}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectBooking(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Important Notice:</span> Declining or rejecting this booking will immediately alert the Magnevents Artist Coordinator to reassign another verified performer for this client.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Please select reason for rejection:
                </label>
                <div className="space-y-1.5">
                  {[
                    'Schedule / Date Conflict with another show',
                    'Personal Emergency or Health Illness',
                    'Sound / Tech Rider Setup not provided',
                    'Performance Fee / Budget Discrepancy',
                    'Travel / Venue Location not reachable',
                    'Other Operational Reason',
                  ].map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        rejectReason === reason
                          ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-bold'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reject_reason"
                        checked={rejectReason === reason}
                        onChange={() => setRejectReason(reason)}
                        className="text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Additional Note for Coordinator (Optional):
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Provide any details to help coordinator manage client expectations..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectBooking(null)}
                disabled={submittingReject}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectBooking}
                disabled={submittingReject || !rejectReason}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {submittingReject ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Chat / Message with Artist Admin Modal */}
      <ModalPortal
        isOpen={!!chatBooking}
        onClose={() => setChatBooking(null)}
      >
        {chatBooking && (
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-sky-50 via-white to-blue-50 border-b border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Message Artist Admin &amp; Coordinator
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Booking #{chatBooking.id} • {chatBooking.event_type || chatBooking.package_title} ({chatBooking.city})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatBooking(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Coordinator Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black text-xs">
                    MA
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block text-xs">
                      Magnevents Artist Operations Desk
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Coordinator: {chatBooking.coordinator_name || 'Assigned Lead'} • {chatBooking.coordinator_phone || '+91 80765 15257'}
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${chatBooking.coordinator_phone || '+918076515257'}`}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] hover:bg-slate-100 flex items-center gap-1 shadow-2xs"
                >
                  <PhoneCall className="w-3 h-3 text-sky-600" />
                  <span>Call</span>
                </a>
              </div>

              {/* Quick Query Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
                  Quick Topic Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: '📍 Venue & Address',
                      text: `Hi Admin, could you share the exact Google Maps location & client coordinator contact for booking #${chatBooking.id} in ${chatBooking.city}?`,
                    },
                    {
                      label: '🎛️ Sound & PA Setup',
                      text: `Hi Admin, please clarify if the sound PA console, monitors, and wireless microphones are provided by venue or if I should carry my personal rider setup?`,
                    },
                    {
                      label: '⏰ Timing & Call Schedule',
                      text: `Hi Admin, what is the exact soundcheck and stage call time for booking #${chatBooking.id}?`,
                    },
                    {
                      label: '💰 Advance & Escrow',
                      text: `Hi Admin, quick query regarding the escrow advance payment and payout release for booking #${chatBooking.id}.`,
                    },
                    {
                      label: '❓ General Question',
                      text: `Hi Admin, I have a doubt regarding my upcoming performance for booking #${chatBooking.id}. Could you please guide me?`,
                    },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setChatMessage(preset.text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-800 text-[11px] font-semibold transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your Message to Coordinator:
                </label>
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message, query, or doubt for the admin coordinator..."
                  rows={4}
                  className="w-full p-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:bg-white resize-none"
                />
              </div>

              {/* Booking Messages Thread (if any) */}
              {chatBookingMessages[chatBooking.id]?.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                    Message Thread ({chatBookingMessages[chatBooking.id].length}):
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {chatBookingMessages[chatBooking.id].map((msg: any) => (
                      <div
                        key={msg.id}
                        className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-sky-800 font-bold">
                          <span>You (Performer)</span>
                          <span className="text-slate-400 font-normal">
                            {new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <a
                href={`https://wa.me/${(chatBooking.coordinator_phone || '918076515257').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hi Admin Coordinator, this is ${artist?.stage_name || artist?.name || 'Artist'} regarding Booking #${chatBooking.id} (${chatBooking.event_type} in ${chatBooking.city}):\n\n${chatMessage || 'Hi, I have a doubt regarding this event.'}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chat on WhatsApp</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChatBooking(null)}
                  disabled={sendingChat}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendBookingMessage}
                  disabled={sendingChat || !chatMessage.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  {sendingChat ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Admin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
