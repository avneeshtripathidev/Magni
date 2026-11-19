"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import { ArtistTierBadge } from '../../../components/shared/ArtistTierBadge';
import { LocationFilter, matchesLocationFilter } from '../../../components/shared/LocationFilter';
import { WhatsAppShareActions } from '../../../components/shared/WhatsAppShareActions';
import { getArtistRankMap } from '../../../lib/artistTiers';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  Music,
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function AdminArtistsDirectoryPage() {
  const { artists, updateArtistStatus } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const categories = ['all', 'Singer', 'Band', 'DJ'];

  const rankMap = getArtistRankMap(artists);

  const filtered = artists
    .filter((a) => {
      if (categoryFilter !== 'all' && !a.category?.toLowerCase().includes(categoryFilter.toLowerCase())) {
        return false;
      }
      if (!matchesLocationFilter(locationFilter, a.city, a.state)) {
        return false;
      }
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
      {/* 1. Header Actions */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
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
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. Controls */}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
        {filtered.map((artist) => {
          const isApproved = artist.verification_status === 'approved';
          const isRejected = artist.verification_status === 'rejected';
          const rankInfo = rankMap[artist.id] || { rank: 1, totalCompleted: artist.successful_bookings || 0 };
          const heroImg = artist.cover_image_url || artist.profile_image_url || '';

          return (
            <div
              key={artist.id}
              className="bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all rounded-2xl overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[380px] shadow-xs"
            >
              {/* Top Visual Cover + Status Overlay */}
              <div className="relative h-28 sm:h-36 lg:h-40 w-full bg-gradient-to-br from-slate-800 via-indigo-900 to-sky-900 overflow-hidden flex-shrink-0">
                {heroImg ? (
                  <img
                    src={heroImg}
                    alt={artist.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-2 text-center">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-base sm:text-xl font-black text-white">
                      {(artist.name || 'A')[0].toUpperCase()}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-white/60 mt-1 sm:mt-2 uppercase tracking-wider truncate max-w-full">
                      {artist.category || 'Performer'}
                    </span>
                  </div>
                )}

                <div className="absolute inset-x-0 top-0 p-2 sm:p-3 flex items-center justify-between gap-1 bg-gradient-to-b from-black/60 via-black/25 to-transparent">
                  <div className="scale-90 sm:scale-100 origin-left">
                    <ArtistTierBadge
                      completedEvents={rankInfo.totalCompleted}
                      rankPosition={rankInfo.rank}
                      size="xs"
                    />
                  </div>
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide border flex-shrink-0 shadow-xs ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isApproved ? 'Live' : isRejected ? 'Rejected' : 'Review'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3.5">
                <div className="space-y-2 sm:space-y-3">
                  {/* Identity */}
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug truncate">
                      {artist.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-indigo-600 font-semibold truncate mt-0.5">
                      {artist.stage_name || artist.category || 'Solo Act'}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="pt-2 border-t border-slate-100 text-[10px] sm:text-xs text-slate-600 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-slate-400">Events</span>
                      <span className="font-bold text-slate-900">{rankInfo.totalCompleted} Done</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-slate-400">Category</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[90px] sm:max-w-none">
                        {artist.category || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-slate-400">City</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[90px] sm:max-w-none">
                        {artist.city || 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-slate-400">Status</span>
                      <span className={artist.is_live ? 'text-emerald-600 font-bold' : 'text-slate-400 font-semibold'}>
                        {artist.is_live ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 sm:pt-3 border-t border-slate-100 space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">Share</span>
                    <WhatsAppShareActions
                      artist={artist}
                      rank={rankInfo.rank}
                      completedEvents={rankInfo.totalCompleted}
                      variant="compact"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Link
                      href={`/admin/verification?reviewId=${artist.id}`}
                      className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg sm:rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] sm:text-xs font-semibold flex-1 flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                      <span>Dossier</span>
                    </Link>

                    {artist.is_live ? (
                      <button
                        onClick={() => updateArtistStatus(artist.id, 'under_review')}
                        className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] sm:text-xs font-semibold"
                        title="Hide from public search"
                      >
                        Hide
                      </button>
                    ) : (
                      <button
                        onClick={() => updateArtistStatus(artist.id, 'approved')}
                        className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
