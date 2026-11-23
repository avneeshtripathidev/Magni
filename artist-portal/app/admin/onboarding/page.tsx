'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  INITIAL_ONBOARDING_ARTISTS, 
  ArtistOnboardingRecord 
} from '../../../data/artistOnboardingData';
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  Send,
  Check,
  ExternalLink,
  PhoneCall,
  Mail,
  Copy,
  ChevronRight,
  LayoutGrid,
  List,
  Sparkles,
  ShieldCheck,
  Music,
  MapPin,
  Mic2,
  CalendarCheck,
  Award,
  Video,
  X,
  Share2
} from 'lucide-react';

export default function AdminArtistOnboardingPage() {
  const [records, setRecords] = useState<ArtistOnboardingRecord[]>(INITIAL_ONBOARDING_ARTISTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedArtist, setSelectedArtist] = useState<ArtistOnboardingRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied to clipboard: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered records
  const filtered = useMemo(() => {
    return records.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.homeCity.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.bio.toLowerCase().includes(q);

      const matchCategory =
        categoryFilter === 'all' || item.category.toLowerCase().includes(categoryFilter.toLowerCase());

      const matchRegion =
        regionFilter === 'all' || item.region.toLowerCase().includes(regionFilter.toLowerCase());

      const matchVerification =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && item.verificationStatus === 'Verified') ||
        (verificationFilter === 'circle' && item.verificationStatus === 'Circle-Affiliated Native');

      return matchSearch && matchCategory && matchRegion && matchVerification;
    });
  }, [records, search, categoryFilter, regionFilter, verificationFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const verified = records.filter(r => r.verificationStatus === 'Verified').length;
    const circle = records.filter(r => r.verificationStatus === 'Circle-Affiliated Native').length;
    const singers = records.filter(r => r.category === 'Singer').length;
    const bands = records.filter(r => r.category === 'Live Band').length;
    const musicians = records.filter(r => r.category === 'Musician').length;
    const others = total - singers - bands - musicians;

    return { total, verified, circle, singers, bands, musicians, others };
  }, [records]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Magnevents Artist Network
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  18 Emails Dispatched
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Artist Onboard &amp; Outreach Queue
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Official directory of artists invited to complete their profile on the Magnevents Artist Portal.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  const emails = records.map(r => r.email).join(', ');
                  copyToClipboard(emails, 'all_emails');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy All 18 Emails</span>
              </button>

              <a
                href="https://artists.magnevents.in/register"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm"
              >
                <span>Artist Register Form</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Outreach</span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.total}</div>
            <p className="text-xs font-medium text-emerald-600 mt-1">100% Dispatched via SMTP</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Base</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.verified}</div>
            <p className="text-xs font-medium text-slate-500 mt-1">Lucknow &amp; Varanasi verified</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Circle Natives</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{stats.circle}</div>
            <p className="text-xs font-medium text-slate-500 mt-1">UP East, Bihar &amp; Jharkhand</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Talent Mix</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Mic2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-800">
              {stats.singers} Singers • {stats.bands} Bands
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              +{stats.musicians} Musicians, {stats.others} Anchors/Comedians
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by artist name, phone, email, city, category, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Category:
            </span>
            {['all', 'singer', 'live band', 'musician', 'comedian', 'anchor'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}

            <span className="font-bold text-slate-400 flex items-center gap-1 ml-4 mr-1">
              Region:
            </span>
            {['all', 'lucknow', 'delhi', 'bihar', 'up east'].map((reg) => (
              <button
                key={reg}
                onClick={() => setRegionFilter(reg)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  regionFilter === reg
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>Showing {filtered.length} of {records.length} Artists</span>
          <span>Emails Dispatched: 24 Nov 2026</span>
        </div>

        {/* 1. Cards Grid View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((artist) => {
              return (
                <div
                  key={artist.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top: ID and Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {artist.id}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          artist.verificationStatus === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {artist.verificationStatus}
                      </span>
                    </div>

                    {/* Artist Title & Category */}
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {artist.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        <Music className="w-3 h-3 text-slate-500" />
                        {artist.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {artist.homeCity}
                      </span>
                    </div>

                    {/* Pricing and Zone */}
                    <div className="mt-3.5 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block font-medium">Starting Rate</span>
                        <strong className="text-slate-800 font-extrabold">{artist.startingPrice}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block font-medium">Zone</span>
                        <span className="text-slate-700 font-semibold">{artist.region}</span>
                      </div>
                    </div>

                    {/* Bio snippet */}
                    <p className="text-xs text-slate-600 line-clamp-2 mt-3 leading-relaxed">
                      {artist.bio}
                    </p>

                    {/* Email dispatched badge */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50/70 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Email Dispatched (24 Nov)</span>
                    </div>
                  </div>

                  {/* Card Actions Bottom */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/91${artist.phone}?text=Hi%20${encodeURIComponent(artist.name)}!%20This%20is%20the%20Magnevents%20Talent%20Team.%20We%20sent%20you%20an%20official%20Artist%20Onboarding%20invitation%20email%20to%20complete%20your%20verified%20profile%20on%20our%20portal.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Direct Call Button */}
                      <a
                        href={`tel:${artist.phone}`}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                        title="Call Artist"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      {/* Portfolio Link */}
                      {artist.portfolioUrl && (
                        <a
                          href={artist.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                          title="Open Video/Portfolio"
                        >
                          <Video className="w-3.5 h-3.5 text-amber-600" />
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedArtist(artist)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-amber-600 transition-colors"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Table View */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Artist Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">City / Zone</th>
                    <th className="py-3.5 px-4">Contact Details</th>
                    <th className="py-3.5 px-4">Starting Rate</th>
                    <th className="py-3.5 px-4">Verification</th>
                    <th className="py-3.5 px-4">Portfolio</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filtered.map((artist) => (
                    <tr key={artist.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        {artist.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block font-bold">{artist.name}</strong>
                        <span className="text-slate-400 text-[11px] font-normal">{artist.stageName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-md font-bold text-slate-800">
                          {artist.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-900 font-semibold block">{artist.homeCity}</span>
                        <span className="text-slate-400 text-[11px]">{artist.region}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          <span>{artist.phone}</span>
                          <button
                            onClick={() => copyToClipboard(artist.phone, `phone_${artist.id}`)}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy phone"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-slate-400 text-[11px] block">{artist.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {artist.startingPrice}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            artist.verificationStatus === 'Verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {artist.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {artist.portfolioUrl ? (
                          <a
                            href={artist.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 font-normal">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/91${artist.phone}?text=Hi%20${encodeURIComponent(artist.name)}!%20This%20is%20Magnevents.%20Please%20check%20your%20email%20for%20your%20Artist%20Portal%20onboarding%20invitation.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            title="WhatsApp Chat"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setSelectedArtist(artist)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Inspection Modal / Drawer */}
      {selectedArtist && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div>
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold bg-slate-800 text-amber-400 px-2.5 py-0.5 rounded">
                      {selectedArtist.id}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      {selectedArtist.verificationStatus}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{selectedArtist.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedArtist.category} • {selectedArtist.homeCity}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedArtist(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 text-sm text-slate-700">
                {/* Onboarding Email Status Banner */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900 font-bold block">
                      Onboarding Email Dispatched
                    </strong>
                    <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                      Sent on <strong>24 Nov 2026</strong> via Magnevents Concierge SMTP. Invitation links to{' '}
                      <code>https://artists.magnevents.in/register</code>.
                    </p>
                  </div>
                </div>

                {/* Contact Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-400 block font-semibold">Phone Number</span>
                    <div className="flex items-center justify-between mt-1">
                      <strong className="text-slate-900 font-bold">{selectedArtist.phone}</strong>
                      <button
                        onClick={() => copyToClipboard(selectedArtist.phone, 'd_phone')}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-400 block font-semibold">Starting Price</span>
                    <strong className="text-slate-900 font-bold block mt-1">
                      {selectedArtist.startingPrice}
                    </strong>
                  </div>
                </div>

                {/* Email Address */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-400 block font-semibold">Email Address</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-800 font-semibold">{selectedArtist.email}</span>
                    <button
                      onClick={() => copyToClipboard(selectedArtist.email, 'd_email')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Location Evidence */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Location Evidence
                  </h4>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                    {selectedArtist.locationEvidence}
                  </p>
                </div>

                {/* Bio & Experience */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Bio &amp; Artist Statement
                  </h4>
                  <p className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed">
                    {selectedArtist.bio}
                  </p>
                </div>

                {/* Portfolio URL */}
                {selectedArtist.portfolioUrl && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Live Video / Portfolio
                    </h4>
                    <a
                      href={selectedArtist.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-between hover:bg-amber-100 transition-colors"
                    >
                      <span className="truncate">{selectedArtist.portfolioUrl}</span>
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </a>
                  </div>
                )}

                {/* Source Booking ID */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Source Reference
                  </h4>
                  <p className="text-xs font-mono text-slate-500 bg-slate-100 p-2.5 rounded-lg break-all">
                    {selectedArtist.sourceReference}
                  </p>
                </div>

                {/* Pre-written WhatsApp Follow-up Message */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Quick WhatsApp Follow-up Prompt
                  </h4>
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                    <p className="italic">
                      &quot;Namaste {selectedArtist.name}! This is Avneesh from Magnevents Concierge. We approved your application for {selectedArtist.category} in {selectedArtist.homeCity}. We just emailed you your portal onboarding link. Could you complete your profile so we can start locking direct gigs for you?&quot;
                    </p>
                    <button
                      onClick={() => {
                        const msg = `Namaste ${selectedArtist.name}! This is Avneesh from Magnevents Concierge. We approved your application for ${selectedArtist.category} in ${selectedArtist.homeCity}. We just emailed you your portal onboarding link. Could you complete your profile at https://artists.magnevents.in/register so we can start locking direct gigs for you?`;
                        copyToClipboard(msg, 'wp_msg');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy WhatsApp Prompt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
              <a
                href={`https://wa.me/91${selectedArtist.phone}?text=Namaste%20${encodeURIComponent(selectedArtist.name)}!%20This%20is%20Avneesh%20from%20Magnevents%20Concierge.%20We%20approved%20your%20profile%20for%20${encodeURIComponent(selectedArtist.category)}%20in%20${encodeURIComponent(selectedArtist.homeCity)}.%20Please%20complete%20your%20listing%20at%20https://artists.magnevents.in/register%20to%20go%20live.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={`tel:${selectedArtist.phone}`}
                className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Artist</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
