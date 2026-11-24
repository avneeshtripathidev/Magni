"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import { ArtistProfile } from '../../../types/artist';
import { ArtistTierBadge } from '../../../components/shared/ArtistTierBadge';
import { LocationFilter, matchesLocationFilter } from '../../../components/shared/LocationFilter';
import { WhatsAppShareActions } from '../../../components/shared/WhatsAppShareActions';
import { ArtistDetailModal } from '../../../components/admin/ArtistDetailModal';
import { getArtistRankMap } from '../../../lib/artistTiers';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  Music,
  MapPin,
  Sparkles,
  ArrowRight,
  Users,
  Loader2,
} from 'lucide-react';

export default function AdminArtistsDirectoryPage() {
  const { artists, updateArtistStatus, toggleArtistLive, loading } = useAdminAuth();
  const [selectedArtist, setSelectedArtist] = useState<ArtistProfile | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [liveStatusTab, setLiveStatusTab] = useState<'live' | 'offline' | 'all'>('live');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const categories = ['all', 'Singer', 'Band', 'DJ'];

  const rankMap = getArtistRankMap(artists);

  const liveArtists = artists.filter((a) => Boolean(a.is_live) && a.verification_status === 'approved');
  const offlineArtists = artists.filter((a) => !a.is_live || a.verification_status !== 'approved');
  const inReviewCount = artists.filter((a) => a.verification_status === 'pending' || a.verification_status === 'under_review').length;

  const filtered = artists
    .filter((a) => {
      // 1. Live Status Tab filter: 'live' shows ONLY approved & live artists on website
      if (liveStatusTab === 'live') {
        if (!a.is_live || a.verification_status !== 'approved') return false;
      } else if (liveStatusTab === 'offline') {
        if (a.is_live && a.verification_status === 'approved') return false;
      }

      // 2. Category filter
      if (categoryFilter !== 'all' && !a.category?.toLowerCase().includes(categoryFilter.toLowerCase())) {
        return false;
      }

      // 3. Location filter
      if (!matchesLocationFilter(locationFilter, a.city, a.state)) {
        return false;
      }

      // 4. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          (a.stage_name || '').toLowerCase().includes(q) ||
          (a.city || '').toLowerCase().includes(q) ||
          (a.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => (b.successful_bookings || 0) - (a.successful_bookings || 0));

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 1. Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/register-artist"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <span>+ Register Artist</span>
          </Link>
          <Link
            href="/admin/verification"
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-sky-500/20 inline-flex items-center gap-2 transition-all"
          >
            <span>Pending Verifications</span>
            {inReviewCount > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {inReviewCount}
              </span>
            )}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {inReviewCount > 0 && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>{inReviewCount} performer{inReviewCount > 1 ? 's' : ''} awaiting approval in Verification Queue</span>
          </div>
        )}
      </div>

      {/* 2. Live Status Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setLiveStatusTab('live')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              liveStatusTab === 'live'
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>Live on Website</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${liveStatusTab === 'live' ? 'bg-emerald-700/90 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {liveArtists.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLiveStatusTab('offline')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              liveStatusTab === 'offline'
                ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span>Not Live / Offline</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${liveStatusTab === 'offline' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
              {offlineArtists.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLiveStatusTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              liveStatusTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <span>All Performers</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${liveStatusTab === 'all' ? 'bg-indigo-700/90 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {artists.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-2 hidden md:block">
          {liveStatusTab === 'live'
            ? 'Showing only approved & live artists on main website'
            : liveStatusTab === 'offline'
            ? 'Artists hidden from main website search'
            : 'Complete performer registry'}
        </div>
      </div>

      {/* 3. Controls (Categories, Location & Search) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {categories.map((cat) => {
            const isCatActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                  isCatActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'all' ? 'All Acts' : cat}
              </button>
            );
          })}
        </div>

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by artist, stage name, city..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-xs min-h-[40px]"
            />
          </div>
        </div>
      </div>

      {/* 3. Cards Grid (4 cards in mobile view & 4 per row on desktop) */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-xl sm:rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            {liveStatusTab === 'live'
              ? 'No Live Performers Match Filters'
              : liveStatusTab === 'offline'
              ? 'No Offline Performers Match Filters'
              : 'No Performers Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {liveStatusTab === 'live'
              ? 'Currently showing only approved & live artists on the main website. Click "Not Live / Offline" to view and publish hidden artists, or visit the Verification Queue.'
              : 'Try adjusting your search query, location filter, or act category.'}
          </p>
          {liveStatusTab === 'live' && offlineArtists.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setLiveStatusTab('offline')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>View {offlineArtists.length} Offline Performer{offlineArtists.length > 1 ? 's' : ''}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
          {filtered.map((artist) => {
            const isApproved = artist.verification_status === 'approved';
            const isRejected = artist.verification_status === 'rejected';
            const isLiveOnWebsite = Boolean(artist.is_live && isApproved);
            const rankInfo = rankMap[artist.id] || { rank: 1, totalCompleted: artist.successful_bookings || 0 };
            const heroImg = artist.cover_image_url || artist.profile_image_url || '';

            return (
              <div
                key={artist.id}
                onClick={() => setSelectedArtist(artist)}
                className="group/card bg-white border border-slate-200 hover:border-sky-300 hover:shadow-lg transition-all rounded-xl sm:rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs cursor-pointer active:scale-[0.99]"
              >
                {/* Top Visual Cover + Status Overlay */}
                <div className="relative h-24 sm:h-32 lg:h-36 w-full bg-gradient-to-br from-slate-800 via-indigo-900 to-sky-900 overflow-hidden flex-shrink-0">
                  {heroImg ? (
                    <img
                      src={heroImg}
                      alt={artist.name}
                      className="w-full h-full object-cover object-top group-hover/card:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-2 text-center">
                      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-sm sm:text-lg font-black text-white">
                        {(artist.name || 'A')[0].toUpperCase()}
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-white/60 mt-1 uppercase tracking-wider truncate max-w-full">
                        {artist.category || 'Performer'}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-x-0 top-0 p-1.5 sm:p-2.5 flex items-center justify-between gap-1 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
                    <div className="min-w-0 max-w-[65%]">
                      <ArtistTierBadge
                        completedEvents={rankInfo.totalCompleted}
                        rankPosition={rankInfo.rank}
                        size="xs"
                        showCount={false}
                      />
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide border flex-shrink-0 shadow-xs flex items-center gap-1 ${
                        isLiveOnWebsite
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : !artist.is_live
                          ? 'bg-slate-900/80 text-slate-200 border-white/20 backdrop-blur-sm'
                          : isRejected
                          ? 'bg-rose-500 text-white border-rose-400'
                          : 'bg-amber-500 text-white border-amber-400'
                      }`}
                    >
                      {isLiveOnWebsite ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Live</span>
                        </>
                      ) : !artist.is_live ? (
                        <>
                          <EyeOff className="w-2.5 h-2.5 text-slate-300" />
                          <span>Not Live</span>
                        </>
                      ) : isRejected ? (
                        'Rejected'
                      ) : (
                        'Review'
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-2 sm:p-3.5 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
                  <div className="space-y-1.5 sm:space-y-2.5">
                    {/* Identity */}
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug truncate group-hover/card:text-sky-600 transition-colors" title={artist.name}>
                        {artist.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-indigo-600 font-semibold truncate mt-0.5" title={artist.stage_name || artist.category || 'Solo Act'}>
                        {artist.stage_name || artist.category || 'Solo Act'}
                      </p>
                    </div>

                    {/* Metrics */}
                    <div className="pt-1.5 sm:pt-2 border-t border-slate-100 text-[10px] sm:text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400">Events</span>
                        <span className="font-bold text-slate-900">{rankInfo.totalCompleted} Done</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400">Category</span>
                        <span className="font-semibold text-slate-800 truncate text-right max-w-[65px] sm:max-w-[120px]" title={artist.category || '—'}>
                          {artist.category || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400">City</span>
                        <span className="font-semibold text-slate-800 truncate text-right max-w-[65px] sm:max-w-[120px]" title={artist.city || 'Not set'}>
                          {artist.city || 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400">Website</span>
                        <span className={`font-bold flex items-center gap-1 ${isLiveOnWebsite ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {isLiveOnWebsite ? (
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
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div 
                    className="pt-1.5 sm:pt-2.5 border-t border-slate-100 space-y-1.5 sm:space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <WhatsAppShareActions
                      artist={artist}
                      rank={rankInfo.rank}
                      completedEvents={rankInfo.totalCompleted}
                      variant="grid"
                    />

                    <div className="grid grid-cols-2 gap-1 sm:gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArtist(artist);
                        }}
                        className="h-7 sm:h-8 px-1 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1 w-full transition-all"
                        title="Inspect full profile credentials and KYC"
                      >
                        <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-600" />
                        <span>Details</span>
                      </button>

                      {artist.is_live ? (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await toggleArtistLive(artist.id, false);
                            showToast(`"${artist.stage_name || artist.name}" has been taken off live from main website.`);
                          }}
                          className="h-7 sm:h-8 px-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 hover:border-rose-300 text-[10px] sm:text-xs font-bold inline-flex items-center justify-center gap-1 w-full transition-all shadow-xs"
                          title="Click to take this artist off live from the main website (magnevents.in)"
                        >
                          <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-600 flex-shrink-0" />
                          <span className="truncate">Take Off Live</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await toggleArtistLive(artist.id, true);
                            showToast(`"${artist.stage_name || artist.name}" is now live on main website!`);
                          }}
                          className="h-7 sm:h-8 px-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold inline-flex items-center justify-center gap-1 w-full transition-all shadow-xs"
                          title="Click to publish this artist live to the main website (magnevents.in)"
                        >
                          <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white flex-shrink-0" />
                          <span className="truncate">Make Live</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Artist Detail Modal */}
      <ArtistDetailModal
        artist={selectedArtist}
        onClose={() => setSelectedArtist(null)}
      />
    </div>
  );
}
