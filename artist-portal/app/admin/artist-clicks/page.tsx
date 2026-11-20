"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  MousePointerClick,
  Users,
  Flame,
  MapPin,
  Smartphone,
  Laptop,
  Search,
  RefreshCw,
  Download,
  ExternalLink,
  Copy,
  Check,
  X,
  Filter,
  Globe,
  Activity,
  Sparkles,
  ShieldCheck,
  Eye,
  Radio,
  ArrowRight,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ArtistClickRecord {
  id: string;
  created_at: string;
  path: string;
  type: string;
  ip_address: string;
  city: string;
  region: string;
  country: string;
  device_type: string;
  browser: string;
  os: string;
  referrer: string;
  source: string;
  details?: any;
}

interface StatsSummary {
  total: number;
  uniqueIps: number;
  today: number;
  topCity: string;
  mobilePct: number;
}

export default function ArtistClicksAdminPage() {
  const [records, setRecords] = useState<ArtistClickRecord[]>([]);
  const [stats, setStats] = useState<StatsSummary>({
    total: 0,
    uniqueIps: 0,
    today: 0,
    topCity: 'Loading...',
    mobilePct: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedClick, setSelectedClick] = useState<ArtistClickRecord | null>(null);
  const [testProbeLoading, setTestProbeLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Fetch Clicks & IPs
  const fetchClicks = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/artist-clicks', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setRecords(data.clicks || []);
        if (data.stats) {
          setStats(data.stats);
        }
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to load artist clicks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClicks(false);
  }, [fetchClicks]);

  // Auto-refresh interval (every 15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchClicks(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchClicks]);

  // Copy IP handler
  const handleCopyIp = (ip: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Test Probe generator
  const handleSendTestProbe = async () => {
    setTestProbeLoading(true);
    try {
      const testIps = ['103.211.12.88', '49.36.177.204', '152.57.142.91', '106.219.120.12'];
      const testCities = ['Delhi NCR', 'Mumbai', 'Bengaluru', 'Faridabad'];
      const randIdx = Math.floor(Math.random() * testIps.length);

      const res = await fetch('/api/admin/artist-clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: testIps[randIdx],
          city: testCities[randIdx],
          source: 'Live Admin Verification Probe',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBannerMessage(`Test CTA Click recorded successfully with IP ${testIps[randIdx]} (${testCities[randIdx]})!`);
        setTimeout(() => setBannerMessage(null), 4500);
        await fetchClicks(true);
      }
    } catch (err) {
      console.error('Test probe failed:', err);
    } finally {
      setTestProbeLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      'IP Address',
      'City',
      'Region',
      'Country',
      'Timestamp (ISO)',
      'Device Type',
      'Browser',
      'Operating System',
      'CTA Trigger / Source',
      'Referrer',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.ip_address}"`,
      `"${r.city || ''}"`,
      `"${r.region || ''}"`,
      `"${r.country || ''}"`,
      `"${r.created_at || ''}"`,
      `"${r.device_type || ''}"`,
      `"${r.browser || ''}"`,
      `"${r.os || ''}"`,
      `"${r.source || ''}"`,
      `"${r.referrer || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `magnevents_artist_cta_clicks_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    return records.filter((r) => {
      // Date filter
      if (dateFilter === 'today' && (!r.created_at || !r.created_at.startsWith(todayStr))) {
        return false;
      }
      if (dateFilter === 'week' && (!r.created_at || r.created_at < sevenDaysAgo)) {
        return false;
      }

      // Device filter
      if (deviceFilter === 'mobile' && r.device_type !== 'mobile' && r.device_type !== 'tablet') {
        return false;
      }
      if (deviceFilter === 'desktop' && r.device_type !== 'desktop') {
        return false;
      }

      // Source filter
      if (sourceFilter !== 'all') {
        const src = (r.source || '').toLowerCase();
        if (!src.includes(sourceFilter.toLowerCase())) return false;
      }

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const ip = (r.ip_address || '').toLowerCase();
        const city = (r.city || '').toLowerCase();
        const region = (r.region || '').toLowerCase();
        const country = (r.country || '').toLowerCase();
        const browser = (r.browser || '').toLowerCase();
        const os = (r.os || '').toLowerCase();
        const source = (r.source || '').toLowerCase();

        return (
          ip.includes(q) ||
          city.includes(q) ||
          region.includes(q) ||
          country.includes(q) ||
          browser.includes(q) ||
          os.includes(q) ||
          source.includes(q)
        );
      }

      return true;
    });
  }, [records, dateFilter, deviceFilter, sourceFilter, search]);

  const formatSourceBadge = (source: string) => {
    const s = (source || '').toLowerCase();
    if (s.includes('desktop') || s.includes('nav')) {
      return {
        label: 'Top Nav Button',
        color: 'bg-sky-50 text-sky-700 border-sky-200',
      };
    }
    if (s.includes('mobile')) {
      return {
        label: 'Mobile Drawer CTA',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    }
    if (s.includes('role')) {
      return {
        label: 'Role Selector',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    if (s.includes('register') || s.includes('direct')) {
      return {
        label: 'Register Page Visit',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    return {
      label: source || 'CTA Click',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Banner if any */}
      {bannerMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{bannerMessage}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            <span>Performer Oversight</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sky-600">Visitor IP Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Artist CTA Clicks & Visitor IPs
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-black">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Pipeline
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time capture of every visitor who clicks &ldquo;Are you an Artist?&rdquo; on magnevents.in or visits registration.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchClicks(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
            title="Refresh click logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border shadow-xs transition-all ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle 15-second auto refresh"
          >
            <Radio className={`w-3 h-3 ${autoRefresh ? 'animate-pulse text-emerald-600' : ''}`} />
            <span>Auto-refresh: {autoRefresh ? '15s' : 'Off'}</span>
          </button>

          <button
            onClick={handleSendTestProbe}
            disabled={testProbeLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
            title="Send test click to verify live IP recording"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{testProbeLoading ? 'Probing...' : 'Simulate Click'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
            title="Download records as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3. KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Clicks */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-sky-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Clicks</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.total.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">All-time recorded clicks</span>
        </div>

        {/* Unique IPs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unique IPs</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.uniqueIps.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Distinct visitor origins</span>
        </div>

        {/* Today's Clicks */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Clicks Today</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.today.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Active leads in 24 hours</span>
        </div>

        {/* Top Location */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Top Location</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate" title={stats.topCity}>
            {stats.topCity}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Highest performer demand</span>
        </div>

        {/* Mobile vs Desktop */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-violet-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mobile Share</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.mobilePct}%
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Smartphones & tablets</span>
        </div>
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IP, City, State, Device, Browser..."
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400 font-sans"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                dateFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                dateFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                dateFilter === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
          </div>

          {/* Device Filter */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600">
            <button
              onClick={() => setDeviceFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                deviceFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All Tech
            </button>
            <button
              onClick={() => setDeviceFilter('mobile')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                deviceFilter === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Mobile
            </button>
            <button
              onClick={() => setDeviceFilter('desktop')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                deviceFilter === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Desktop
            </button>
          </div>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-[11px] font-bold bg-slate-100 text-slate-700 py-1.5 px-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">All Sources</option>
            <option value="nav">Top Nav Button</option>
            <option value="mobile">Mobile Drawer</option>
            <option value="role">Role Selector</option>
            <option value="register">Register Visit</option>
          </select>
        </div>
      </div>

      {/* 5. Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong>{filteredRecords.length}</strong> visitor click events
          {search && ` matching "${search}"`}
        </span>
        <span className="text-[11px]">
          Last checked: {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
        </span>
      </div>

      {/* 6. Live Table / Cards */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Querying Supabase Visitor Analytics...</h3>
          <p className="text-xs text-slate-500 mt-1">Connecting to real-time visitor event stream</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Clicks Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            When visitors click &ldquo;Are you an Artist?&rdquo; on magnevents.in, their IP address, city, and device will stream directly here.
          </p>
          <button
            onClick={handleSendTestProbe}
            disabled={testProbeLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Test Visitor Click</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Visitor IP Address</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Time of Click</th>
                  <th className="py-3 px-4">Device & Browser</th>
                  <th className="py-3 px-4">CTA Button / Source</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredRecords.map((item) => {
                  const badge = formatSourceBadge(item.source);
                  const isLocal =
                    item.ip_address === '127.0.0.1' ||
                    item.ip_address === '::1' ||
                    item.ip_address === 'localhost';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedClick(item)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* IP */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {item.ip_address}
                          </span>
                          <button
                            onClick={(e) => handleCopyIp(item.ip_address, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                            title="Copy IP address"
                          >
                            {copiedIp === item.ip_address ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {isLocal && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              Local Test
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>
                            {item.city || 'India'}
                            {item.region ? `, ${item.region}` : ''}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 ml-5 block">
                          {item.country || 'India 🇮🇳'}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">
                          {item.created_at
                            ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
                            : 'Just now'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a') : 'Live'}
                        </span>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          {item.device_type === 'mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{item.browser || 'Browser'}</span>
                          <span className="text-slate-400 text-[10px]">({item.os || 'OS'})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          {item.device_type || 'Desktop'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://ipinfo.io/${item.ip_address}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 transition-all"
                            title="Lookup IP details on IPinfo"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setSelectedClick(item)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredRecords.map((item) => {
              const badge = formatSourceBadge(item.source);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedClick(item)}
                  className="p-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {item.ip_address}
                      </span>
                      <button
                        onClick={(e) => handleCopyIp(item.ip_address, e)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                      >
                        {copiedIp === item.ip_address ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.city || 'India'}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-800">
                      {item.created_at
                        ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
                        : 'Just now'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                    <div className="flex items-center gap-1">
                      {item.device_type === 'mobile' ? (
                        <Smartphone className="w-3 h-3 text-slate-400" />
                      ) : (
                        <Laptop className="w-3 h-3 text-slate-400" />
                      )}
                      <span>
                        {item.browser} ({item.os})
                      </span>
                    </div>
                    <span className="text-sky-600 font-bold flex items-center gap-0.5">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Click Detail Modal */}
      {selectedClick && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedClick(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Visitor Click Inspection</h3>
                  <span className="text-xs text-slate-500">Magnevents Visitor Lead Intelligence</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClick(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* IP & Geolocation Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client IP Address</span>
                <a
                  href={`https://ipinfo.io/${selectedClick.ip_address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1"
                >
                  <span>IPinfo Lookup</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedClick.ip_address}</span>
                <button
                  onClick={() => handleCopyIp(selectedClick.ip_address)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                >
                  {copiedIp === selectedClick.ip_address ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">City / Location</span>
                  <span className="font-bold text-slate-800">
                    {selectedClick.city || 'Unknown'}, {selectedClick.region || ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Country</span>
                  <span className="font-bold text-slate-800">{selectedClick.country || 'India 🇮🇳'}</span>
                </div>
              </div>
            </div>

            {/* Click Event Details */}
            <div className="space-y-2 text-xs">
              <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">Event Metadata</span>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Trigger CTA</span>
                  <span className="font-bold text-slate-800">{selectedClick.source || 'CTA Click'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Exact Timestamp</span>
                  <span className="font-bold text-slate-800">
                    {selectedClick.created_at
                      ? format(new Date(selectedClick.created_at), 'dd MMM yyyy, hh:mm:ss a')
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Device & OS</span>
                  <span className="font-bold text-slate-800">
                    {selectedClick.device_type} ({selectedClick.os})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Browser</span>
                  <span className="font-bold text-slate-800">{selectedClick.browser}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Target Path</span>
                  <span className="font-mono text-slate-800">{selectedClick.path}</span>
                </div>
                {selectedClick.referrer && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Referrer</span>
                    <span className="font-mono text-slate-800 text-[11px] truncate block">
                      {selectedClick.referrer}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Raw JSON viewer */}
            {selectedClick.details && (
              <details className="text-xs bg-slate-900 text-slate-300 p-3 rounded-2xl">
                <summary className="cursor-pointer font-bold text-slate-200 select-none">
                  View Full Raw JSON Headers
                </summary>
                <pre className="mt-2 text-[10px] overflow-x-auto text-emerald-400 font-mono">
                  {JSON.stringify(selectedClick.details, null, 2)}
                </pre>
              </details>
            )}

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setSelectedClick(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
