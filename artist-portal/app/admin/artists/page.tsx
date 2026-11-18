"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import { ArtistTierBadge } from '../../../components/shared/ArtistTierBadge';
import { LocationFilter, matchesLocationFilter } from '../../../components/shared/LocationFilter';
import { WhatsAppShareActions } from '../../../components/shared/WhatsAppShareActions';
import { getArtistRankMap } from '../../../lib/artistTiers';
import { 
  Users, 
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
      {/* 1. Header (admin-portal theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-bold mb-2 shadow-xs">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            <span>Artist Ecosystem Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Performer Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete database of all registered performers, verification states, and booking availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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
      </div>

      {/* 2. Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
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

      {/* 3. Cards Grid (5 compact static cards in a single row on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {filtered.map((artist) => {
          const isApproved = artist.verification_status === 'approved';
          const isRejected = artist.verification_status === 'rejected';
          const rankInfo = rankMap[artist.id] || { rank: 1, totalCompleted: artist.successful_bookings || 0 };

          return (
            <div
              key={artist.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 flex flex-col justify-between gap-2.5"
            >
              <div className="space-y-2.5">
                {/* Top Row: Rank Badge + Status */}
                <div className="flex items-center justify-between gap-1">
                  <ArtistTierBadge
                    completedEvents={rankInfo.totalCompleted}
                    rankPosition={rankInfo.rank}
                    size="xs"
                  />
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border flex-shrink-0 ${
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

                {/* Identity Row */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={artist.profile_image_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200'}
                    alt={artist.name}
                    className="w-10 h-10 rounded-lg object-cover object-top border border-slate-200 flex-shrink-0 bg-slate-100"
                  />
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 leading-tight truncate">{artist.name}</h3>
                    <p className="text-[10px] text-indigo-600 font-semibold truncate mt-0.5">
                      {artist.stage_name || 'Solo Act'}
                    </p>
                  </div>
                </div>

                {/* Compact Metrics */}
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-400">Events</span>
                    <span className="font-bold text-slate-900">{rankInfo.totalCompleted} Done</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-400">Category</span>
                    <span className="font-semibold text-slate-800 truncate">{artist.category}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-400">City</span>
                    <span className="font-semibold text-slate-800 truncate">{artist.city || 'India'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-400">Status</span>
                    <span className={artist.is_live ? 'text-emerald-600 font-bold' : 'text-slate-400 font-semibold'}>
                      {artist.is_live ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Footer Actions */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-semibold text-slate-400">Share</span>
                  <WhatsAppShareActions
                    artist={artist}
                    rank={rankInfo.rank}
                    completedEvents={rankInfo.totalCompleted}
                    variant="compact"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/admin/verification?reviewId=${artist.id}`}
                    className="h-7 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-semibold flex-1 flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-slate-500" />
                    <span>Dossier</span>
                  </Link>

                  {artist.is_live ? (
                    <button
                      onClick={() => updateArtistStatus(artist.id, 'under_review')}
                      className="h-7 px-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-semibold"
                      title="Hide from public search"
                    >
                      Hide
                    </button>
                  ) : (
                    <button
                      onClick={() => updateArtistStatus(artist.id, 'approved')}
                      className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
