"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { CompletionMeter } from '../../../components/dashboard/CompletionMeter';
import { StatusBadge } from '../../../components/dashboard/StatusBadge';
import { ArtistTierCard } from '../../../components/shared/ArtistTierBadge';
import { LocationFilter, matchesLocationFilter } from '../../../components/shared/LocationFilter';
import { EventVerificationPanel } from '../../../components/dashboard/EventVerificationPanel';
import { ModalPortal } from '../../../components/shared/ModalPortal';
import { EventVerificationRecord, computeProofStatus } from '../../../types/eventVerification';
import { artistService } from '../../../services/artistService';
import {
  CalendarCheck,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
  PhoneCall,
  Star,
  DollarSign,
  AlertCircle,
  Search,
  Download,
  SortAsc,
  SortDesc,
  User,
  Calendar,
  MapPin,
  Radio,
  Upload,
} from 'lucide-react';

export default function ArtistDashboardPage() {
  const { artist, refreshArtist } = useArtistAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed'>('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeLiveEvents, setActiveLiveEvents] = useState<EventVerificationRecord[]>([]);
  const [activeModalEvent, setActiveModalEvent] = useState<EventVerificationRecord | null>(null);

  const loadActiveLiveEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/artist/event-verification', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.events)) {
        // Show any events started by admin (or recently verified) right on the dashboard
        const startedOrVerified = data.events.filter(
          (e: EventVerificationRecord) =>
            e.event_live_status === 'started' || e.event_live_status === 'verified'
        );
        setActiveLiveEvents(startedOrVerified);
        setActiveModalEvent((prev) => {
          if (!prev) return null;
          return data.events.find((e: EventVerificationRecord) => e.booking_id === prev.booking_id) || prev;
        });
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadActiveLiveEvents();
    const poll = setInterval(loadActiveLiveEvents, 8000);
    return () => clearInterval(poll);
  }, [loadActiveLiveEvents]);

  const handleDashboardEventUpdated = (updated: EventVerificationRecord) => {
    setActiveLiveEvents((prev) =>
      prev.map((e) => (e.booking_id === updated.booking_id ? updated : e))
    );
    setActiveModalEvent(updated);
  };

  const handleSubmitForReview = async () => {
    if (!artist?.id) return;
    setSubmitting(true);
    try {
      await artistService.submitForVerification(artist.id);
      await refreshArtist();
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const status = artist?.verification_status || 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const isPending = status === 'pending';

  const sampleGigs = [
    {
      id: 'MAG-8821',
      title: 'Wedding Sangeet Night',
      client: 'Kapur Family',
      city: 'Gurgaon',
      date: '14 Dec 2026',
      package: 'Acoustic Band (3-Piece)',
      budget: '₹55,000',
      status: 'confirmed',
    },
    {
      id: 'MAG-8794',
      title: 'Corporate Gala Dinner',
      client: 'Nexus Global Tech',
      city: 'Delhi Aerocity',
      date: '22 Dec 2026',
      package: 'Solo Vocals + Tracks',
      budget: '₹35,000',
      status: 'pending',
    },
    {
      id: 'MAG-8710',
      title: 'Intimate House Concert',
      client: 'Mehra Residence',
      city: 'South Delhi',
      date: '02 Dec 2026',
      package: 'Acoustic Duo Set',
      budget: '₹22,000',
      status: 'completed',
    },
  ];

  const filteredGigs = sampleGigs.filter((gig) => {
    const matchesStatus = statusFilter === 'all' || gig.status === statusFilter;
    const matchesLocation = matchesLocationFilter(locationFilter, gig.city);
    const matchesSearch = !searchQuery ||
      gig.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gig.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesLocation && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header (matching admin.magnevents.in/dashboard/requests) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            Client Inquiries & Overview
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Incoming requests from the client platform. Acknowledge to confirm performance dates.
          </p>
        </div>

        <Link
          href="/bookings"
          className="group h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 border border-emerald-400 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Download size={16} strokeWidth={3} className="text-white" />
          <span>Export XLS</span>
        </Link>
      </div>

      {/* 1B. Active Live Events Started by Admin (Compact Banner -> Opens Popup Modal) */}
      {activeLiveEvents.length > 0 && (
        <div className="space-y-3">
          {activeLiveEvents.map((ev) => {
            const proof = computeProofStatus(ev);
            const isVerified = ev.event_live_status === 'verified';
            return (
              <div
                key={ev.booking_id}
                className={`p-4 rounded-2xl bg-white border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isVerified ? 'border-emerald-200' : 'border-sky-300 ring-2 ring-sky-500/10'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Event Verified ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                        <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                        Live Event • {proof.completedCount}/{proof.totalRequired} Proofs
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">#{ev.booking_id}</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 truncate">
                    {ev.event_title} — {ev.client_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {ev.venue ? `${ev.venue}, ` : ''}{ev.city} • {ev.event_date}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalEvent(ev)}
                  className={
                    isVerified
                      ? 'py-2 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-1.5 self-start sm:self-center flex-shrink-0 transition-colors'
                      : 'btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 self-start sm:self-center flex-shrink-0'
                  }
                >
                  {isVerified ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>View Verified Proofs</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Proofs ({proof.completedCount}/{proof.totalRequired})</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Verification Action Banner */}
      {isRejected && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <p className="text-xs text-rose-800">
              <span className="font-bold">Action Required:</span> {artist?.rejection_reason || 'Please upload updated identity proof or video showreels.'}
            </p>
          </div>
          <Link href="/verification" className="btn-primary py-2 px-4 text-xs font-bold self-start sm:self-auto">
            Update & Resubmit
          </Link>
        </div>
      )}

      {isPending && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-900">
              <span className="font-bold">Pending Review:</span> Your profile is being reviewed by the Magnevents curation team.
            </p>
          </div>
          <button
            onClick={handleSubmitForReview}
            disabled={submitting}
            className="btn-primary py-2 px-4 text-xs font-bold self-start sm:self-auto"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      )}

      {isApproved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-900">
              <span className="font-bold">Profile Verified:</span> Live and open for client booking inquiries.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link href="/profile" className="btn-secondary py-1.5 px-3 text-xs">
              Edit Rates
            </Link>
            {artist?.slug && (
              <a
                href={`https://magnevents.in/artist/${artist.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1"
              >
                <span>View Profile</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Profile submitted successfully. Our team will review your application shortly.</span>
        </div>
      )}

      {/* 2B. Performer Event Position & 5-Tier Milestone Progression */}
      <ArtistTierCard
        completedEvents={
          (artist?.successful_bookings || 0) +
          activeLiveEvents.filter((e) => e.event_live_status === 'verified').length
        }
        artistName={artist?.stage_name || artist?.name}
      />

      {/* 3. Metric Stats Grid (Admin Portal Luxe Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[22px] bg-white border border-slate-200 shadow-sm space-y-1.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="pt-0.5">
            <StatusBadge status={status} size="sm" />
          </div>
          <span className="text-[11px] text-slate-400 block pt-1.5 border-t border-slate-100 font-medium">
            {isApproved ? 'Active on Catalog' : 'Under Review'}
          </span>
        </div>

        <div className="p-5 rounded-[22px] bg-white border border-slate-200 shadow-sm space-y-1.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Starting Rate</span>
            <DollarSign className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{(artist?.submitted_pricing?.starting_price || artist?.price_min || 15000).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 block pt-1.5 border-t border-slate-100 font-medium">
            Per live event
          </span>
        </div>

        <div className="p-5 rounded-[22px] bg-white border border-slate-200 shadow-sm space-y-1.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Inquiries</span>
            <CalendarCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            3
          </div>
          <span className="text-[11px] text-slate-400 block pt-1.5 border-t border-slate-100 font-medium">
            Avg. response &lt; 2h
          </span>
        </div>

        <div className="p-5 rounded-[22px] bg-white border border-slate-200 shadow-sm space-y-1.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Performer Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>4.95</span>
            <span className="text-xs font-bold text-amber-500">★</span>
          </div>
          <span className="text-[11px] text-slate-400 block pt-1.5 border-t border-slate-100 font-medium">
            42 verified host reviews
          </span>
        </div>
      </div>

      {/* 4. Search and Filter Bar (exact admin.magnevents.in styling) */}
      <div className="flex flex-col space-y-3">
        {/* Full-width Rounded Search Bar + Location Selector */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-sky-600 transition-colors" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="Search by client name, email, or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 h-14 rounded-[22px] border border-slate-200/80 bg-white shadow-sm text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-sky-600/5 focus:border-sky-300 transition-all"
            />
          </div>

          <LocationFilter
            value={locationFilter}
            onChange={setLocationFilter}
            availableCities={sampleGigs.map((g) => g.city)}
            className="h-14 px-4 rounded-[22px] flex-shrink-0"
          />
        </div>

        {/* Filter Pills and Sort Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex p-1 bg-slate-200/50 backdrop-blur-md rounded-[20px] border border-white items-center overflow-x-auto scrollbar-hide shadow-xs">
            {[
              { id: 'all', label: 'ALL INQUIRIES' },
              { id: 'confirmed', label: 'CONFIRMED' },
              { id: 'pending', label: 'PENDING' },
              { id: 'completed', label: 'COMPLETED' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-5 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-sky-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md p-1.5 rounded-[22px] border border-white shadow-sm ml-auto">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50/50 rounded-[18px]">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort:</span>
              <span className="text-[12px] font-black text-slate-700 uppercase">SUBMISSION</span>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-10 h-10 rounded-[16px] flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-sky-600 hover:border-sky-100 transition-all shadow-sm active:scale-90"
            >
              {sortOrder === 'asc' ? <SortAsc size={16} strokeWidth={2.5} /> : <SortDesc size={16} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Luxe Card: Inquiries List Container (matching admin.magnevents.in) */}
      <div className="luxe-card p-6 sm:p-8 flex flex-col min-h-[300px]">
        {filteredGigs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-60 my-auto text-center">
            <CalendarCheck size={48} className="text-slate-300" />
            <p className="text-base font-bold text-slate-400">No inquiries found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGigs.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 rounded-[18px] border border-slate-200/80 bg-white hover:border-sky-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors flex-shrink-0">
                    <User size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">{item.client}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {item.title} • {item.package}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {item.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {item.city}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-black text-slate-900 block leading-tight">
                      {item.budget}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Fee
                    </span>
                  </div>

                  <Link
                    href="/bookings"
                    className="btn-secondary py-2 px-3.5 text-xs font-bold flex items-center gap-1"
                  >
                    <span>View Inquiries</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Profile Completion Meter */}
      <CompletionMeter artist={artist} />

      {/* Popup Modal for Uploading / Viewing 4 Mandatory Event Proofs */}
      <ModalPortal
        isOpen={!!activeModalEvent}
        onClose={() => setActiveModalEvent(null)}
      >
        {activeModalEvent && (
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] shadow-2xl">
            <EventVerificationPanel
              event={activeModalEvent}
              onUpdated={handleDashboardEventUpdated}
              onClose={() => setActiveModalEvent(null)}
            />
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
