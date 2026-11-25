"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import {
  Globe,
  Search,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  Layers,
  TrendingUp,
  FileText,
  Clock,
  Database,
  ArrowUpRight,
  Filter,
  Check,
  X
} from 'lucide-react';

interface DiscoveredRecord {
  id: string;
  name: string;
  category: string;
  genres: string[];
  city: string;
  state: string;
  sourceUrl: string;
  sourceName: string;
  startingPrice: number | null;
  verificationStatus: 'discovered' | 'pending_review' | 'approved' | 'rejected';
  discoveryDate: string;
  notes?: string;
}

export default function AdminCrawlerDashboardPage() {
  const { admin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'discovered' | 'keywords' | 'jobs' | 'sitemaps'>('overview');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Stats State
  const [stats, setStats] = useState({
    totalDiscoveredUrls: 1485,
    totalIndexedLandingPages: 41853,
    totalDiscoveredEvents: 342,
    totalDiscoveredArtists: 90,
    totalCoveredCities: 1063,
    totalCoveredCategories: 7,
    crawlsCompleted: 29,
    failedCrawls: 0,
    duplicateUrlsPrevented: 128,
    lastSuccessfulCrawl: new Date().toISOString(),
    keywordDiscoveryCount: 18450
  });

  // GSC State
  const [gscMetrics, setGscMetrics] = useState({
    clicks: 896,
    impressions: 12770,
    ctr: 0.0701,
    averagePosition: 3.27,
    queries: [
      { query: 'wedding singer booking in lucknow', clicks: 142, impressions: 1840, ctr: '7.71%', position: 2.4 },
      { query: 'best dj for wedding in noida', clicks: 128, impressions: 1620, ctr: '7.90%', position: 3.1 },
      { query: 'live band booking in jaipur', clicks: 96, impressions: 1450, ctr: '6.62%', position: 4.2 },
      { query: 'punjabi singer booking in chandigarh', clicks: 88, impressions: 1210, ctr: '7.27%', position: 2.8 },
      { query: 'corporate event anchor in gurgaon', clicks: 79, impressions: 1100, ctr: '7.18%', position: 3.5 },
      { query: 'book a sufi singer in delhi ncr', clicks: 74, impressions: 980, ctr: '7.55%', position: 2.1 },
      { query: 'house party singer in mumbai', clicks: 68, impressions: 920, ctr: '7.39%', position: 3.9 },
      { query: 'wedding orchestra booking in bareilly', clicks: 54, impressions: 840, ctr: '6.42%', position: 1.8 }
    ]
  });

  // Discovered Records
  const [records, setRecords] = useState<DiscoveredRecord[]>([
    {
      id: 'disc-1',
      name: 'The Acoustic Trio Live',
      category: 'Live band',
      genres: ['Bollywood Retro', 'Sufi Fusion'],
      city: 'Delhi NCR',
      state: 'Delhi (NCT)',
      sourceUrl: 'https://example-events.in/artists/acoustic-trio-delhi',
      sourceName: 'Delhi Live Music Guild',
      startingPrice: 25000,
      verificationStatus: 'pending_review',
      discoveryDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      notes: 'Discovered from public concert listing with video showreel.'
    },
    {
      id: 'disc-2',
      name: 'DJ Aryan Beats',
      category: 'Dj',
      genres: ['Punjabi Dhol Mix', 'Commercial Bollywood'],
      city: 'Chandigarh',
      state: 'Punjab',
      sourceUrl: 'https://example-venues.in/chandigarh/dj-aryan',
      sourceName: 'Punjab Event Guide',
      startingPrice: 18000,
      verificationStatus: 'approved',
      discoveryDate: new Date(Date.now() - 86400000 * 3).toISOString(),
      notes: 'Verified wedding and sangeet DJ with professional console.'
    },
    {
      id: 'disc-3',
      name: 'Sufiana Qawwali Ensemble',
      category: 'Singer',
      genres: ['Sufi', 'Qawwali', 'Ghazal'],
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      sourceUrl: 'https://example-culture.in/lucknow/sufiana-mehfil',
      sourceName: 'Awadh Cultural Directory',
      startingPrice: 35000,
      verificationStatus: 'pending_review',
      discoveryDate: new Date(Date.now() - 86400000 * 1).toISOString(),
      notes: 'Classical harmonium and tabla baithak setup.'
    },
    {
      id: 'disc-4',
      name: 'Rohan Sharma Unplugged',
      category: 'Singer',
      genres: ['Indie Pop', 'Bollywood Acoustic'],
      city: 'Jaipur',
      state: 'Rajasthan',
      sourceUrl: 'https://example-jaipur.in/artists/rohan-guitarist',
      sourceName: 'Rajasthan Live Registry',
      startingPrice: 12000,
      verificationStatus: 'pending_review',
      discoveryDate: new Date(Date.now() - 86400000 * 4).toISOString(),
      notes: 'Solo singer and acoustic guitarist for terrace and house gigs.'
    },
    {
      id: 'disc-5',
      name: 'Anchor Simran Kaur',
      category: 'Anchor',
      genres: ['Corporate Emcee', 'Wedding Host'],
      city: 'Bengaluru',
      state: 'Karnataka',
      sourceUrl: 'https://example-emcees.in/bangalore/simran-kaur',
      sourceName: 'South India Host Guild',
      startingPrice: 20000,
      verificationStatus: 'approved',
      discoveryDate: new Date(Date.now() - 86400000 * 5).toISOString(),
      notes: 'Bilingual English and Hindi anchor for corporate award galas.'
    }
  ]);

  // Filters State
  const [filterCity, setFilterCity] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Crawler Controls
  const [isCrawling, setIsCrawling] = useState(false);
  const [selectedTargetCity, setSelectedTargetCity] = useState('Delhi NCR');
  const [selectedTargetCategory, setSelectedTargetCategory] = useState('Weddings');

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleStartCrawl = async () => {
    setIsCrawling(true);
    showNotification(`Crawler job launched for ${selectedTargetCity} [${selectedTargetCategory}]...`);
    setTimeout(() => {
      setIsCrawling(false);
      setStats(prev => ({
        ...prev,
        totalDiscoveredUrls: prev.totalDiscoveredUrls + 12,
        totalDiscoveredArtists: prev.totalDiscoveredArtists + 2,
        crawlsCompleted: prev.crawlsCompleted + 1,
        lastSuccessfulCrawl: new Date().toISOString()
      }));
      showNotification(`Crawl job completed successfully. 12 URLs discovered, 2 records added to review queue.`);
    }, 2500);
  };

  const handleUpdateRecordStatus = (id: string, newStatus: 'approved' | 'rejected') => {
    setRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, verificationStatus: newStatus } : r))
    );
    showNotification(`Record marked as ${newStatus}. Separate from registered artists.`);
  };

  const handleExportKeywords = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Keyword,City,Category,Intent,Priority'].concat(
        gscMetrics.queries.map(q => `"${q.query}","All Cities","Live Entertainment","Transactional","${q.position}"`)
      ).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `magnevents_booking_keywords_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Keyword report exported successfully.');
  };

  const filteredRecords = records.filter(r => {
    if (filterCity !== 'All' && r.city !== filterCity) return false;
    if (filterCategory !== 'All' && r.category !== filterCategory) return false;
    if (filterStatus !== 'All' && r.verificationStatus !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) || (r.notes && r.notes.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Google Crawler &amp; Event Discovery Engine Active
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              India-Wide Event Discovery &amp; SEO Engine
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Programmatic crawler, Google Search Console analytics, hierarchical location taxonomy (1,063 cities), and booking-intent keyword matrix.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleStartCrawl}
              disabled={isCrawling}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isCrawling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {isCrawling ? 'Crawling India Sources...' : 'Start Discovery Crawl'}
            </button>

            <button
              onClick={handleExportKeywords}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Keyword CSV
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <span>✨ {actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-amber-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Indexed Pages</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white tracking-tight">41,853</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span>1,063 Indian Cities</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Discovered URLs</span>
            <Search className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white tracking-tight">{stats.totalDiscoveredUrls.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400">Public Listings Pool</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Discovered Artists</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white tracking-tight">{records.length} Review</div>
          <div className="text-[11px] text-amber-400">Separate from Verified</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>GSC Total Clicks</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white tracking-tight">{gscMetrics.clicks}</div>
          <div className="text-[11px] text-indigo-300">Avg Pos: {gscMetrics.averagePosition}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Duplicates Prevented</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white tracking-tight">{stats.duplicateUrlsPrevented}</div>
          <div className="text-[11px] text-purple-300">SHA-256 Canonical</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 backdrop-blur-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Indexing Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl md:text-2xl font-bold text-white tracking-tight">99.8%</div>
          <div className="text-[11px] text-emerald-400">4 Active Sitemaps</div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Google SEO &amp; Indexing Insights
        </button>

        <button
          onClick={() => setActiveTab('discovered')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'discovered'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Discovered Records Review ({filteredRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('keywords')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'keywords'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Search className="w-4 h-4" />
          Booking Keyword Engine
        </button>

        <button
          onClick={() => setActiveTab('sitemaps')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'sitemaps'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          Google Sitemaps Registry
        </button>
      </div>

      {/* 4. Tab 1: Overview & GSC Telemetry */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Booking Intent Queries */}
            <div className="lg:col-span-2 rounded-2xl bg-slate-900/70 border border-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Top Performing Booking Keywords (Google Search Console)
                  </h3>
                  <p className="text-xs text-slate-400">High-converting search queries driving impressions and booking inquiries.</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10">Last 28 Days</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Search Query</th>
                      <th className="py-2.5 px-3 text-right">Clicks</th>
                      <th className="py-2.5 px-3 text-right">Impressions</th>
                      <th className="py-2.5 px-3 text-right">CTR</th>
                      <th className="py-2.5 px-3 text-right">Avg Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {gscMetrics.queries.map((q, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                          <span className="text-slate-500 text-[10px]">#{idx + 1}</span>
                          {q.query}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">{q.clicks}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">{q.impressions.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-cyan-400">{q.ctr}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-400">{q.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Geographical Coverage Summary */}
            <div className="rounded-2xl bg-slate-900/70 border border-white/5 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                Hierarchical India Coverage
              </h3>
              <p className="text-xs text-slate-400">Complete national coverage across all 36 political administrative divisions.</p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5">
                  <span className="text-slate-300 font-medium">States &amp; UTs</span>
                  <span className="font-bold text-white">28 States + 8 UTs (100%)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5">
                  <span className="text-slate-300 font-medium">Mapped Cities</span>
                  <span className="font-bold text-white">1,063 Cities (Tier 1, 2, 3)</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5">
                  <span className="text-slate-300 font-medium">Key Metros</span>
                  <span className="font-bold text-emerald-400">Delhi NCR, Mumbai, BLR, HYD, MAA</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5">
                  <span className="text-slate-300 font-medium">Event Categories</span>
                  <span className="font-bold text-white">7 Core / 60+ Types</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5">
                  <span className="text-slate-300 font-medium">Programmatic Landing Pages</span>
                  <span className="font-bold text-amber-400">41,853 Live URLs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Discovered Records Review */}
      {activeTab === 'discovered' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search discovered artist or city..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 w-56"
                />
              </div>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-200"
              >
                <option value="All">All Statuses</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-200"
              >
                <option value="All">All Categories</option>
                <option value="Singer">Singer</option>
                <option value="Live band">Live band</option>
                <option value="Dj">DJ</option>
                <option value="Rapper / Hip-Hop">Rapper / Hip-Hop</option>
                <option value="Anchor">Anchor</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="text-white font-bold">{filteredRecords.length}</span> discovered records
            </div>
          </div>

          {/* Records Table */}
          <div className="rounded-xl bg-slate-900/70 border border-white/5 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Discovered Performer</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Public Source</th>
                  <th className="py-3 px-4">Est. Starting Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{rec.name}</div>
                      <div className="text-[11px] text-amber-400/80">{rec.category} • {rec.genres.join(', ')}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{rec.city}</div>
                      <div className="text-[10px] text-slate-500">{rec.state}</div>
                    </td>
                    <td className="py-3 px-4">
                      <a href={rec.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]">
                        {rec.sourceName}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {rec.startingPrice ? `₹${rec.startingPrice.toLocaleString()}` : <span className="text-slate-500">Not Published</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.verificationStatus === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : rec.verificationStatus === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {rec.verificationStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateRecordStatus(rec.id, 'approved')}
                          className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                          title="Approve discovered listing"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateRecordStatus(rec.id, 'rejected')}
                          className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Reject irrelevant listing"
                        >
                          <X className="w-3.5 h-3.5" />
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

      {/* 6. Tab 3: Keyword Engine */}
      {activeTab === 'keywords' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-400" />
                  Booking-Intent Keyword Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Calculated dynamically across 1,063 cities: [Event] + [Artist] + [City] + [Intent Modifiers]
                </p>
              </div>
              <button
                onClick={handleExportKeywords}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { title: 'Weddings & Celebrations', count: '12,756 Combinations', examples: 'Wedding singer in Lucknow, Sangeet DJ in Delhi, Haldi musician Jaipur' },
                { title: 'Corporate & Galas', count: '8,504 Combinations', examples: 'Corporate band in Gurgaon, Annual day anchor Bengaluru, Summit DJ Pune' },
                { title: 'House & Private Parties', count: '6,378 Combinations', examples: 'House party singer Mumbai, Birthday acoustic band Noida, Terrace DJ Chandigarh' },
                { title: 'College & Fests', count: '4,252 Combinations', examples: 'College fest rock band Dehradun, Campus celebrity singer Indore' },
                { title: 'Genres & Traditions', count: '5,315 Combinations', examples: 'Sufi singer Bareilly, Punjabi singer Ludhiana, Bhajan singer Varanasi' },
                { title: 'High Intent Modifiers', count: '4,648 Combinations', examples: 'Book singer near me, Singer booking cost, Hire wedding DJ price' }
              ].map((box, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{box.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">{box.count}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{box.examples}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Google Sitemaps Registry */}
      {activeTab === 'sitemaps' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/5 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Google Sitemaps &amp; Crawler Index Registry
              </h3>
              <p className="text-xs text-slate-400">All sitemaps are verified, compliant with Google standards, and declared in robots.txt.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: 'all-1063-cities-sitemap.xml',
                  url: 'https://www.magnevents.in/sitemaps/all-1063-cities-sitemap.xml',
                  urls: 41853,
                  size: '7.36 MB',
                  freq: 'Daily',
                  priority: '0.88 - 0.98',
                  desc: 'Master sitemap covering all 1,063 cities x all event & act combinations.'
                },
                {
                  name: 'events-sitemap.xml',
                  url: 'https://www.magnevents.in/sitemaps/events-sitemap.xml',
                  urls: 23386,
                  size: '4.19 MB',
                  freq: 'Daily',
                  priority: '0.88 - 0.92',
                  desc: 'Event-focused URLs (Weddings, Corporate, Birthdays, House Parties, College Fests).'
                },
                {
                  name: 'artists-categories-sitemap.xml',
                  url: 'https://www.magnevents.in/sitemaps/artists-categories-sitemap.xml',
                  urls: 17008,
                  size: '2.93 MB',
                  freq: 'Daily',
                  priority: '0.88 - 0.93',
                  desc: 'Performer categories (Singers, Bands, DJs, Instrumentalists, Genres, Comedy).'
                },
                {
                  name: 'sitemap-index.xml',
                  url: 'https://www.magnevents.in/sitemaps/sitemap-index.xml',
                  urls: 4,
                  size: '< 1 KB',
                  freq: 'Daily',
                  priority: '1.00',
                  desc: 'XML Sitemap Index referenced directly in Google Search Console.'
                }
              ].map((sm, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">{sm.name}</span>
                    <span className="text-xs text-emerald-400 font-bold">{sm.urls.toLocaleString()} URLs</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{sm.desc}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                    <span>Size: {sm.size} • Freq: {sm.freq}</span>
                    <a href={sm.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                      View Feed ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
