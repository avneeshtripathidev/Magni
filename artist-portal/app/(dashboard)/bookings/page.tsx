'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { artistService } from '../../../services/artistService';
import { EventVerificationPanel } from '../../../components/dashboard/EventVerificationPanel';
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
} from 'lucide-react';
import Link from 'next/link';

export default function BookingsPage() {
  const { artist, refreshArtist } = useArtistAuth();
  const [viewTab, setViewTab] = useState<'inquiries' | 'calendar'>('inquiries');
  const [bookings, setBookings] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<EventVerificationRecord[]>([]);
  const [activeVerifyEvent, setActiveVerifyEvent] = useState<EventVerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Availability calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 11, 1)); // Dec 2026
  const [blockedDates, setBlockedDates] = useState<string[]>(
    artist?.performance_details?.blocked_dates || ['2026-12-25', '2026-12-31']
  );
  const [savingAvailability, setSavingAvailability] = useState(false);

  const defaultBookings = [
    {
      id: 'MAG-8821',
      customer_name: 'Kapur Family',
      event_type: 'Wedding Sangeet',
      city: 'Gurgaon',
      event_date: '2026-12-14',
      guest_count: 250,
      package_title: 'Acoustic Band (3-Piece)',
      total_amount: 55000,
      status: 'confirmed',
      payout_status: 'Advance in Escrow',
      coordinator_phone: '+91 80765 15257',
    },
    {
      id: 'MAG-8794',
      customer_name: 'Nexus Global Tech',
      event_type: 'Corporate Gala Dinner',
      city: 'Delhi Aerocity',
      event_date: '2026-12-22',
      guest_count: 120,
      package_title: 'Solo Vocals + Backing Tracks',
      total_amount: 35000,
      status: 'pending',
      payout_status: 'Proposal Review',
      coordinator_phone: '+91 80765 15257',
    },
    {
      id: 'MAG-8710',
      customer_name: 'Mehra Residence',
      event_type: 'Private House Concert',
      city: 'South Delhi',
      event_date: '2026-12-02',
      guest_count: 40,
      package_title: 'Acoustic Duo Set',
      total_amount: 22000,
      status: 'completed',
      payout_status: 'Settled to Bank',
      coordinator_phone: '+91 80765 15257',
    },
  ];

  // Load Live Event Verifications (started by Admin)
  const loadLiveEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/artist/event-verification', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.events)) {
        setLiveEvents(data.events);
        // Only refresh the popup data if the user already has a proof modal open
        setActiveVerifyEvent((prev) => {
          if (!prev) return null;
          return data.events.find((e: EventVerificationRecord) => e.booking_id === prev.booking_id) || prev;
        });
      }
    } catch (err) {
      console.warn('Could not load live event verifications:', err);
    }
  }, []);

  // Load Bookings from centralized database + live admin events
  useEffect(() => {
    async function loadBookings() {
      try {
        if (artist?.id) {
          const data = await artistService.getArtistBookings(artist.id);
          if (data && data.length > 0) {
            setBookings(data);
          } else {
            setBookings(defaultBookings);
          }
        } else {
          setBookings(defaultBookings);
        }
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setBookings(defaultBookings);
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
    try {
      await artistService.updateBookingStatus(bookingId, 'rejected', 'Performer unavailable for requested time');
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected' } : b))
      );
      setActionMessage({ type: 'success', text: `Booking #${bookingId} declined.` });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected' } : b))
      );
      setActionMessage({ type: 'success', text: `Booking #${bookingId} declined.` });
      setTimeout(() => setActionMessage(null), 4000);
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

  // Calendar Helper: Build December 2026 dates (1 to 31)
  const daysInMonth = 31;
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `2026-12-${day.toString().padStart(2, '0')}`;
    const confirmedBooking = bookings.find(
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            Bookings & Availability
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Manage inquiries, confirm performance dates, and control live calendar availability.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex p-1 bg-slate-200/50 backdrop-blur-md rounded-[20px] border border-white items-center self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setViewTab('inquiries')}
            className={`px-5 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${
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
            className={`px-5 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${
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
          {/* Full-width Rounded Search Bar + Location Selector */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 group-focus-within:text-sky-600 transition-colors" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by client name, city, or event type..."
                className="w-full pl-16 pr-6 h-14 rounded-[22px] border border-slate-200/80 bg-white shadow-sm text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-sky-600/5 focus:border-sky-300 transition-all"
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
            <div className="flex p-1 bg-slate-200/50 backdrop-blur-md rounded-[20px] border border-white items-center overflow-x-auto scrollbar-hide shadow-xs">
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

                      {/* Interactive Accept / Decline for Pending Leads */}
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptBooking(item.id)}
                            className="btn-primary py-2 px-3 text-xs flex items-center gap-1 min-h-[38px] touch-manipulation"
                            title="Accept this gig"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleDeclineBooking(item.id)}
                            className="btn-secondary py-2 px-2.5 text-xs text-rose-700 hover:bg-rose-50 border-rose-200 min-h-[38px] touch-manipulation"
                            title="Decline this gig"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      ) : (
                        <a
                          href={`tel:${item.coordinator_phone || '+918076515257'}`}
                          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 min-h-[38px] touch-manipulation"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                          <span>Call Coordinator</span>
                        </a>
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
                December 2026 Calendar
              </h2>
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
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center select-none">
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
                  className={`p-2 sm:p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[64px] sm:min-h-[76px] touch-manipulation ${
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
                      <CalendarCheck className="w-3.5 h-3.5 text-sky-600" />
                    ) : isBlocked ? (
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  <span className="text-[9px] sm:text-[10px] font-semibold truncate block mt-1">
                    {isBooked ? 'Gig Confirmed' : isBlocked ? 'Blocked' : 'Available'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
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
    </div>
  );
}
