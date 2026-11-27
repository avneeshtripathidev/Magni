"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ModalPortal } from '../../../components/shared/ModalPortal';
import {
  CalendarCheck,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  Play,
  ShieldCheck,
  Radio,
  Eye,
  X,
  Camera,
  Images,
  Video,
  Navigation,
  ExternalLink,
  Plus,
  RefreshCw,
  Loader2,
  RotateCcw,
  Users,
  UserPlus,
  Check,
  Trash2,
} from 'lucide-react';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import { LocationFilter, matchesLocationFilter } from '../../../components/shared/LocationFilter';
import {
  AssignedArtist,
  EventVerificationRecord,
  computeProofStatus,
} from '../../../types/eventVerification';

export default function AdminBookingsPage() {
  const { artists: directoryArtists } = useAdminAuth();
  const [events, setEvents] = useState<EventVerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live' | 'verified' | 'confirmed' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [startingId, setStartingId] = useState<string | null>(null);
  const [inspectEvent, setInspectEvent] = useState<EventVerificationRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create New Event Modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [artistSearch, setArtistSearch] = useState('');
  const [artistLocationFilter, setArtistLocationFilter] = useState('all');
  const [customArtistName, setCustomArtistName] = useState('');
  const [selectedArtists, setSelectedArtists] = useState<AssignedArtist[]>([]);
  const [newEventForm, setNewEventForm] = useState({
    event_title: '',
    client_name: '',
    city: '',
    venue: '',
    event_date: new Date().toISOString().slice(0, 10),
    budget: 0,
    start_immediately: true,
  });

  // Manage Assigned Artists Modal state (for existing events)
  const [assignModalEvent, setAssignModalEvent] = useState<EventVerificationRecord | null>(null);
  const [assignDraftArtists, setAssignDraftArtists] = useState<AssignedArtist[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignLocationFilter, setAssignLocationFilter] = useState('all');
  const [assignCustomName, setAssignCustomName] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Combine Admin directory artists + any newly registered local artist
  const availableArtists: AssignedArtist[] = useMemo(() => {
    const map = new Map<string, AssignedArtist>();
    directoryArtists.forEach((a) => {
      map.set(a.id, {
        artist_id: a.id,
        name: a.name,
        stage_name: a.stage_name || a.name,
        category: a.category,
        city: a.city,
        profile_image_url: a.profile_image_url,
      });
    });

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('magnevents_registered_artist');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.name && !Array.from(map.values()).some((x) => x.name.toLowerCase() === parsed.name.toLowerCase())) {
            const id = parsed.id || `registered-${Date.now()}`;
            map.set(id, {
              artist_id: id,
              name: parsed.name,
              stage_name: parsed.stage_name || parsed.name,
              category: parsed.category || 'Performer',
              city: parsed.city || 'India',
              profile_image_url: parsed.profile_image_url,
            });
          }
        }
      } catch {}
    }

    return Array.from(map.values());
  }, [directoryArtists]);

  // Default to first artist when opening new event modal if none selected
  const openNewEventModal = () => {
    if (selectedArtists.length === 0 && availableArtists.length > 0) {
      setSelectedArtists([availableArtists[0]]);
    }
    setArtistSearch('');
    setCustomArtistName('');
    setShowNewModal(true);
  };

  const toggleArtistInList = (
    artist: AssignedArtist,
    list: AssignedArtist[],
    setList: React.Dispatch<React.SetStateAction<AssignedArtist[]>>
  ) => {
    const exists = list.some(
      (a) => a.artist_id === artist.artist_id || a.name.toLowerCase() === artist.name.toLowerCase()
    );
    if (exists) {
      setList(
        list.filter(
          (a) => a.artist_id !== artist.artist_id && a.name.toLowerCase() !== artist.name.toLowerCase()
        )
      );
    } else {
      setList([...list, artist]);
    }
  };

  const addCustomArtistToList = (
    name: string,
    setName: React.Dispatch<React.SetStateAction<string>>,
    list: AssignedArtist[],
    setList: React.Dispatch<React.SetStateAction<AssignedArtist[]>>
  ) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (list.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      setName('');
      return;
    }
    setList([
      ...list,
      {
        artist_id: `custom-${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-3)}`,
        name: trimmed,
        stage_name: trimmed,
        category: 'Guest Performer',
      },
    ]);
    setName('');
  };

  const loadEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/artist/event-verification', { cache: 'no-store' });
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
        setInspectEvent((prev) =>
          prev ? data.events.find((e: EventVerificationRecord) => e.booking_id === prev.booking_id) || prev : null
        );
      }
    } catch (err) {
      console.error('Failed to load live events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(() => loadEvents(true), 8000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleStartEvent = async (bookingId: string) => {
    setStartingId(bookingId);
    try {
      const res = await fetch('/api/artist/event-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_event', booking_id: bookingId }),
      });
      const data = await res.json();
      if (res.ok && data.event) {
        setEvents((prev) => prev.map((e) => (e.booking_id === bookingId ? data.event : e)));
        showToast(
          `Event #${bookingId} STARTED! Assigned artist(s) must now upload Start Image, Event Images, Live Location & Event Video to verify.`
        );
      }
    } catch (err) {
      console.error('Failed to start event:', err);
    } finally {
      setStartingId(null);
    }
  };

  const handleResetEvent = async (bookingId: string) => {
    setStartingId(bookingId);
    try {
      const res = await fetch('/api/artist/event-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_event', booking_id: bookingId }),
      });
      const data = await res.json();
      if (res.ok && data.event) {
        setEvents((prev) => prev.map((e) => (e.booking_id === bookingId ? data.event : e)));
        setInspectEvent(data.event);
        showToast(`Reset verification proofs for #${bookingId}. Artist can re-upload all 4 proofs.`);
      }
    } finally {
      setStartingId(null);
    }
  };

  const handleDeleteEvent = async (bookingId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete booking #${bookingId}? This cannot be undone.`)) {
      return;
    }
    setDeletingId(bookingId);
    try {
      const res = await fetch('/api/artist/event-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_event', booking_id: bookingId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents((prev) => prev.filter((e) => e.booking_id !== bookingId));
        if (inspectEvent?.booking_id === bookingId) {
          setInspectEvent(null);
        }
        showToast(`Booking #${bookingId} deleted successfully.`);
      } else {
        alert(data.error || 'Failed to delete booking.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error while deleting booking.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedArtists.length === 0) {
      showToast('Please assign at least one artist before creating the event.');
      return;
    }

    setCreatingEvent(true);
    try {
      const res = await fetch('/api/artist/event-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_and_start',
          ...newEventForm,
          artist_name: selectedArtists.map((a) => a.name).join(', '),
          assigned_artists: selectedArtists,
        }),
      });
      const data = await res.json();
      if (res.ok && data.event) {
        setEvents((prev) => [data.event, ...prev]);
        setShowNewModal(false);
        const names = selectedArtists.map((a) => a.name).join(', ');
        showToast(
          `Event #${data.event.booking_id} created & assigned to ${selectedArtists.length} artist${
            selectedArtists.length > 1 ? 's' : ''
          } (${names})!`
        );
      }
    } finally {
      setCreatingEvent(false);
    }
  };

  const openAssignArtistsModal = (ev: EventVerificationRecord) => {
    setAssignModalEvent(ev);
    setAssignDraftArtists(ev.assigned_artists || []);
    setAssignSearch('');
    setAssignCustomName('');
  };

  const handleSaveAssignedArtists = async () => {
    if (!assignModalEvent || assignDraftArtists.length === 0) return;
    setSavingAssignment(true);
    try {
      const res = await fetch('/api/artist/event-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_artists',
          booking_id: assignModalEvent.booking_id,
          assigned_artists: assignDraftArtists,
        }),
      });
      const data = await res.json();
      if (res.ok && data.event) {
        setEvents((prev) =>
          prev.map((e) => (e.booking_id === assignModalEvent.booking_id ? data.event : e))
        );
        setAssignModalEvent(null);
        showToast(
          `Updated #${assignModalEvent.booking_id} — assigned ${assignDraftArtists.length} artist${
            assignDraftArtists.length > 1 ? 's' : ''
          }.`
        );
      }
    } finally {
      setSavingAssignment(false);
    }
  };

  const filtered = events.filter((b) => {
    if (filter === 'live' && b.event_live_status !== 'started') return false;
    if (filter === 'verified' && b.event_live_status !== 'verified') return false;
    if (filter === 'confirmed' && b.booking_status !== 'confirmed') return false;
    if (filter === 'pending' && b.booking_status !== 'pending') return false;
    if (!matchesLocationFilter(locationFilter, b.city, undefined, b.venue)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.client_name.toLowerCase().includes(q) ||
        b.artist_name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.event_title.toLowerCase().includes(q) ||
        b.booking_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const liveCount = events.filter((e) => e.event_live_status === 'started').length;
  const verifiedCount = events.filter((e) => e.event_live_status === 'verified').length;

  const isDirectVideoFile = (url?: string) => {
    if (!url) return false;
    return (
      url.startsWith('data:video/') ||
      /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url) ||
      url.includes('/artist-portal/media/')
    );
  };

  const filteredNewModalArtists = availableArtists.filter((a) => {
    if (!matchesLocationFilter(artistLocationFilter, a.city)) return false;
    if (!artistSearch.trim()) return true;
    const q = artistSearch.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.stage_name || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q) ||
      (a.city || '').toLowerCase().includes(q)
    );
  });

  const filteredAssignModalArtists = availableArtists.filter((a) => {
    if (!matchesLocationFilter(assignLocationFilter, a.city)) return false;
    if (!assignSearch.trim()) return true;
    const q = assignSearch.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.stage_name || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q) ||
      (a.city || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-bold mb-2 shadow-xs">
            <CalendarCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Live Event Control & 4-Proof Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Booking Orders & Live Events
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign one or multiple artists to live events and monitor their Start Photo, Event Photos, Live GPS Location & Event Video.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => loadEvents()}
            className="btn-secondary py-2.5 px-3.5 text-xs"
            title="Refresh live proofs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={openNewEventModal}
            className="btn-emerald"
          >
            <Plus size={15} strokeWidth={3} />
            <span>Start New Event</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-700 hover:underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Search Bar, Location Filter & Filter Pills */}
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group flex-1 min-w-0">
            <div className="absolute inset-y-0 left-4 sm:left-6 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-sky-600 transition-colors" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by booking ID, artist, client, city, or event..."
              className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 h-14 rounded-[22px] border border-slate-200/80 bg-white shadow-sm text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-sky-600/5 focus:border-sky-300 transition-all"
            />
          </div>

          <LocationFilter
            value={locationFilter}
            onChange={setLocationFilter}
            availableCities={events.map((e) => e.city)}
            className="h-14 px-4 rounded-[22px] flex-shrink-0"
          />
        </div>

        <div className="flex p-1 bg-slate-200/50 backdrop-blur-md rounded-[20px] border border-white items-center overflow-x-auto max-w-full self-start shadow-xs">
          {[
            { id: 'all', label: `All (${events.length})` },
            { id: 'live', label: `Live Active (${liveCount})` },
            { id: 'verified', label: `Verified (${verifiedCount})` },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'pending', label: 'Pending' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-white text-sky-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Bookings & Live Event Verification List */}
      <div className="luxe-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Loading Events...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-slate-200" />
            <p className="text-sm font-bold">No booking orders match this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const proof = computeProofStatus(item);
              const isLive = item.event_live_status === 'started';
              const isVerified = item.event_live_status === 'verified';
              const assignedList = item.assigned_artists || [];

              return (
                <div
                  key={item.booking_id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Event & Assigned Artists */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">#{item.booking_id}</span>
                      <span className="text-sm font-black text-slate-900">{item.event_title}</span>

                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Event Verified ✓
                        </span>
                      ) : isLive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                          <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                          Live • {proof.completedCount}/4 Proofs
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          Not Started
                        </span>
                      )}
                    </div>

                    {/* Assigned Artists Row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                        <Users className="w-3.5 h-3.5 text-sky-600" />
                        {assignedList.length > 1 ? `Artists (${assignedList.length}):` : 'Artist:'}
                      </span>
                      {assignedList.length > 0 ? (
                        assignedList.map((a) => (
                          <span
                            key={a.artist_id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-bold"
                          >
                            {a.profile_image_url && (
                              <img
                                src={a.profile_image_url}
                                alt={a.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            )}
                            <span>{a.name}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-bold text-slate-800">{item.artist_name}</span>
                      )}

                      <button
                        type="button"
                        onClick={() => openAssignArtistsModal(item)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 hover:text-sky-600 transition-colors"
                        title="Assign or add more artists"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Client: <strong className="text-slate-800">{item.client_name}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.venue ? `${item.venue}, ` : ''}
                        {item.city}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{item.event_date}</span>
                    </div>

                    {/* Mini Proof Checklist Pills when Live or Verified */}
                    {(isLive || isVerified) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {[
                          { label: 'Start Image', ok: proof.hasStartImage },
                          { label: `Event Images (${item.event_images?.length || 0})`, ok: proof.hasEventImages },
                          { label: 'Live Location', ok: proof.hasLocation },
                          { label: 'Event Video', ok: proof.hasVideo },
                        ].map((p) => (
                          <span
                            key={p.label}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                              p.ok
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {p.ok ? '✓ ' : '○ '}
                            {p.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Budget & Admin Controls */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right pr-2">
                      <div className="text-base font-black text-slate-900">
                        ₹{Number(item.budget || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.payout_status || item.booking_status}
                      </span>
                    </div>

                    {item.event_live_status === 'not_started' ? (
                      <button
                        type="button"
                        onClick={() => handleStartEvent(item.booking_id)}
                        disabled={startingId === item.booking_id}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
                      >
                        {startingId === item.booking_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-white" />
                        )}
                        <span>Start Event</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setInspectEvent(item)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all shadow-xs ${
                          isVerified
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isVerified ? 'Inspect Verified Proofs' : `Inspect Proofs (${proof.completedCount}/4)`}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(item.booking_id)}
                      disabled={deletingId === item.booking_id}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all active:scale-95"
                      title={`Delete query #${item.booking_id}`}
                      aria-label="Delete booking query"
                    >
                      {deletingId === item.booking_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL: Create & Start New Live Event (WITH MULTI-ARTIST ASSIGNMENT) */}
      {showNewModal && (
        <ModalPortal isOpen={true} onClose={() => setShowNewModal(false)}>
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">Create & Assign New Event</h2>
                <p className="text-xs text-slate-500">
                  Assign one or multiple artists — assigned artists will receive the live 4-proof checklist.
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAndStart} className="space-y-4">
              {/* Event Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="form-label">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={newEventForm.event_title}
                    onChange={(e) => setNewEventForm({ ...newEventForm, event_title: e.target.value })}
                    placeholder="e.g. Luxury Wedding Sangeet Live"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Client / Host Name *</label>
                  <input
                    type="text"
                    required
                    value={newEventForm.client_name}
                    onChange={(e) => setNewEventForm({ ...newEventForm, client_name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={newEventForm.event_date}
                    onChange={(e) => setNewEventForm({ ...newEventForm, event_date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    required
                    value={newEventForm.city}
                    onChange={(e) => setNewEventForm({ ...newEventForm, city: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Total Event Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newEventForm.budget}
                    onChange={(e) => setNewEventForm({ ...newEventForm, budget: Number(e.target.value) })}
                    className="form-input font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Venue Name</label>
                  <input
                    type="text"
                    value={newEventForm.venue}
                    onChange={(e) => setNewEventForm({ ...newEventForm, venue: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* MULTI-ARTIST ASSIGNMENT PICKER */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-600" />
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Assign Artist(s) *
                    </label>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-black uppercase">
                    {selectedArtists.length} Selected {selectedArtists.length > 1 ? '(Multi-Artist)' : ''}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Select one artist or tap multiple artists below to assign them together to this event.
                </p>

                {/* Selected Artist Removable Chips */}
                {selectedArtists.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedArtists.map((a) => (
                      <span
                        key={a.artist_id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-600 text-white text-xs font-bold shadow-xs"
                      >
                        {a.profile_image_url && (
                          <img
                            src={a.profile_image_url}
                            alt={a.name}
                            className="w-4 h-4 rounded-full object-cover border border-white/40"
                          />
                        )}
                        <span>{a.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleArtistInList(a, selectedArtists, setSelectedArtists)}
                          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                          aria-label={`Remove ${a.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search & Location Filter for Directory Artists */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={artistSearch}
                      onChange={(e) => setArtistSearch(e.target.value)}
                      placeholder="Search artists by name, category..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 h-9"
                    />
                  </div>
                  <LocationFilter
                    value={artistLocationFilter}
                    onChange={setArtistLocationFilter}
                    availableCities={availableArtists.map((a) => a.city)}
                    compact
                    className="rounded-xl flex-shrink-0"
                  />
                </div>

                {/* Directory Artist Multi-Select Checkboxes */}
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {filteredNewModalArtists.map((artist) => {
                    const isSelected = selectedArtists.some(
                      (a) => a.artist_id === artist.artist_id || a.name.toLowerCase() === artist.name.toLowerCase()
                    );
                    return (
                      <button
                        key={artist.artist_id}
                        type="button"
                        onClick={() => toggleArtistInList(artist, selectedArtists, setSelectedArtists)}
                        className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-sky-50 border-sky-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                            {artist.profile_image_url ? (
                              <img src={artist.profile_image_url} alt={artist.name} className="w-full h-full object-cover" />
                            ) : (
                              artist.name[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{artist.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {artist.category || 'Performer'} {artist.city ? `• ${artist.city}` : ''}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-sky-600 border-sky-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom / Additional Artist Inline */}
                <div className="flex gap-2 pt-1 border-t border-slate-200/80">
                  <input
                    type="text"
                    value={customArtistName}
                    onChange={(e) => setCustomArtistName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomArtistToList(customArtistName, setCustomArtistName, selectedArtists, setSelectedArtists);
                      }
                    }}
                    placeholder="Or type another artist name to assign..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      addCustomArtistToList(customArtistName, setCustomArtistName, selectedArtists, setSelectedArtists)
                    }
                    className="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Artist</span>
                  </button>
                </div>
              </div>

              {/* Start Immediately Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEventForm.start_immediately}
                  onChange={(e) => setNewEventForm({ ...newEventForm, start_immediately: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-emerald-900">
                  Start Event Immediately (Triggers 4-proof verification checklist in Artist Panel right away)
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent || selectedArtists.length === 0}
                  className="btn-primary px-5"
                >
                  {creatingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  <span>
                    {newEventForm.start_immediately ? 'Create & Start Event' : 'Create Event'} ({selectedArtists.length}{' '}
                    {selectedArtists.length === 1 ? 'Artist' : 'Artists'})
                  </span>
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* 5. MODAL: Assign / Edit Multiple Artists on an Existing Event */}
      {assignModalEvent && (
        <ModalPortal isOpen={true} onClose={() => setAssignModalEvent(null)}>
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Assign Artists — #{assignModalEvent.booking_id}
                </h2>
                <p className="text-xs text-slate-500">{assignModalEvent.event_title}</p>
              </div>
              <button
                onClick={() => setAssignModalEvent(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Pills */}
            {assignDraftArtists.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {assignDraftArtists.map((a) => (
                  <span
                    key={a.artist_id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-600 text-white text-xs font-bold"
                  >
                    <span>{a.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleArtistInList(a, assignDraftArtists, setAssignDraftArtists)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search artists to add or remove..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 h-9"
                />
              </div>
              <LocationFilter
                value={assignLocationFilter}
                onChange={setAssignLocationFilter}
                availableCities={availableArtists.map((a) => a.city)}
                compact
                className="rounded-xl flex-shrink-0"
              />
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5">
              {filteredAssignModalArtists.map((artist) => {
                const isSelected = assignDraftArtists.some(
                  (a) => a.artist_id === artist.artist_id || a.name.toLowerCase() === artist.name.toLowerCase()
                );
                return (
                  <button
                    key={artist.artist_id}
                    type="button"
                    onClick={() => toggleArtistInList(artist, assignDraftArtists, setAssignDraftArtists)}
                    className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected ? 'bg-sky-50 border-sky-300' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{artist.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {artist.category || 'Performer'} {artist.city ? `• ${artist.city}` : ''}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={assignCustomName}
                onChange={(e) => setAssignCustomName(e.target.value)}
                placeholder="Add another artist by name..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  addCustomArtistToList(assignCustomName, setAssignCustomName, assignDraftArtists, setAssignDraftArtists)
                }
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setAssignModalEvent(null)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button
                onClick={handleSaveAssignedArtists}
                disabled={savingAssignment || assignDraftArtists.length === 0}
                className="btn-primary px-5 text-xs"
              >
                {savingAssignment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save ({assignDraftArtists.length} Assigned)</span>
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 6. MODAL: Inspect Artist's 4 Event Verification Proofs */}
      {inspectEvent && (
        <ModalPortal isOpen={true} onClose={() => setInspectEvent(null)}>
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto overscroll-contain">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-slate-400">#{inspectEvent.booking_id}</span>
                  {inspectEvent.event_live_status === 'verified' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase">
                      Event Verified ✓
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase">
                      Awaiting Artist Proofs ({computeProofStatus(inspectEvent).completedCount}/4)
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900">{inspectEvent.event_title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned Artists: <strong>{inspectEvent.artist_name}</strong> • Client: <strong>{inspectEvent.client_name}</strong> • {inspectEvent.city}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(inspectEvent.booking_id)}
                  disabled={deletingId === inspectEvent.booking_id}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all"
                  title="Delete this booking query"
                >
                  {deletingId === inspectEvent.booking_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setInspectEvent(null)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Start Image */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-600" />
                    1. Start Image
                  </span>
                  {inspectEvent.start_image_url ? (
                    <span className="text-emerald-600">Uploaded ✓</span>
                  ) : (
                    <span className="text-amber-600">Pending</span>
                  )}
                </div>
                {inspectEvent.start_image_url ? (
                  <img
                    src={inspectEvent.start_image_url}
                    alt="Start image"
                    className="w-full h-44 object-cover rounded-xl border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="h-32 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-xs text-slate-400">
                    Waiting for artist to upload start photo
                  </div>
                )}
              </div>

              {/* 2. Event Images */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Images className="w-4 h-4 text-indigo-600" />
                    2. Event Images ({inspectEvent.event_images?.length || 0})
                  </span>
                  {inspectEvent.event_images?.length > 0 ? (
                    <span className="text-emerald-600">Uploaded ✓</span>
                  ) : (
                    <span className="text-amber-600">Pending</span>
                  )}
                </div>
                {inspectEvent.event_images?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {inspectEvent.event_images.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Event photo ${i + 1}`}
                        className="w-full h-24 object-cover rounded-xl border border-slate-200 bg-white"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-32 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-xs text-slate-400">
                    Waiting for artist to upload event photos
                  </div>
                )}
              </div>

              {/* 3. Artist Live Location */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    3. Artist Live Location
                  </span>
                  {inspectEvent.artist_location ? (
                    <span className="text-emerald-600">Shared ✓</span>
                  ) : (
                    <span className="text-amber-600">Pending</span>
                  )}
                </div>
                {inspectEvent.artist_location ? (
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-1.5 text-xs">
                    <div className="font-mono text-slate-800 font-semibold">
                      Lat: {inspectEvent.artist_location.latitude} | Lng: {inspectEvent.artist_location.longitude}
                    </div>
                    {inspectEvent.artist_location.address && (
                      <div className="text-slate-600">{inspectEvent.artist_location.address}</div>
                    )}
                    <div className="text-[10px] text-slate-400">
                      Shared at: {new Date(inspectEvent.artist_location.shared_at).toLocaleString('en-IN')}
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${inspectEvent.artist_location.latitude},${inspectEvent.artist_location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary py-1.5 px-3 text-xs mt-1 inline-flex items-center gap-1.5 text-sky-600"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>View Exact Pin on Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="h-32 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-xs text-slate-400">
                    Waiting for artist to share live GPS location
                  </div>
                )}
              </div>

              {/* 4. Event Video */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-rose-600" />
                    4. Event Video
                  </span>
                  {inspectEvent.event_video_url ? (
                    <span className="text-emerald-600">Uploaded ✓</span>
                  ) : (
                    <span className="text-amber-600">Pending</span>
                  )}
                </div>
                {inspectEvent.event_video_url ? (
                  isDirectVideoFile(inspectEvent.event_video_url) ? (
                    <video
                      src={inspectEvent.event_video_url}
                      controls
                      className="w-full h-44 rounded-xl bg-black border border-slate-200"
                    />
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                      <p className="truncate font-mono text-slate-700">{inspectEvent.event_video_url}</p>
                      <a
                        href={inspectEvent.event_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5 text-sky-600"
                      >
                        <span>Watch Event Video</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )
                ) : (
                  <div className="h-32 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-xs text-slate-400">
                    Waiting for artist to upload event video
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleResetEvent(inspectEvent.booking_id)}
                  className="btn-secondary text-xs text-slate-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Proofs (Re-request)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(inspectEvent.booking_id)}
                  disabled={deletingId === inspectEvent.booking_id}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                  title="Permanently delete this booking query"
                >
                  {deletingId === inspectEvent.booking_id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete Query</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setInspectEvent(null)}
                className="btn-primary px-5 text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
