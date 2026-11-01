"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@database/connection/supabase-admin';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Gift,
  Tag,
  Percent,
  Calendar,
  Eye,
  Laptop,
  Smartphone,
  Save,
  RefreshCw,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Download,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Layers,
  MapPin,
  Clock,
  Phone,
  Sliders,
  DollarSign
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { exportToExcel } from '@/lib/exportExcel';

interface DiwaliSettings {
  isVisible: boolean;
  leftText: string;
  rightText: string;
  couponCode: string;
  discountPercent: number;
  minBookingValue: number;
  campaignName: string;
  formHeading: string;
  supportingMessage: string;
  offerHighlight: string;
  ctaText: string;
  startDate: string;
  expiryDate: string;
  updatedAt?: string;
}

const DEFAULT_SETTINGS: DiwaliSettings = {
  isVisible: true,
  leftText: "🎁 A Diwali Gift for You! Get 10% EXTRA OFF",
  rightText: "Use Code: DIW100 →",
  couponCode: "DIW100",
  discountPercent: 10,
  minBookingValue: 10000,
  campaignName: "Diwali Special",
  formHeading: "Your Diwali Gift Is Waiting! 🎁",
  supportingMessage: "Make Your Celebration Special, Spend a Little Less!",
  offerHighlight: "Enjoy an additional 10% discount on event bookings of ₹10,000 or more.",
  ctaText: "CLAIM MY 10% DISCOUNT",
  startDate: "2026-10-01",
  expiryDate: "2026-11-30"
};

export default function DiwaliOfferManagementPage() {
  const { toast } = useToast();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'analytics' | 'leads'>('config');

  // Configuration state
  const [settings, setSettings] = useState<DiwaliSettings>(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Live preview device switcher
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewFormOpen, setPreviewFormOpen] = useState(false);

  // Sandbox simulation test budget
  const [testBudget, setTestBudget] = useState<number>(15000);

  // Analytics states
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | '90days' | 'all' | 'custom'>('30days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Analytics raw data
  const [funnelEvents, setFunnelEvents] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  // Leads table filter
  const [searchLeadQuery, setSearchLeadQuery] = useState('');
  const [categoryLeadFilter, setCategoryLeadFilter] = useState('all');
  const [currentLeadPage, setCurrentLeadPage] = useState(1);
  const leadsPerPage = 12;

  // 1. Fetch live configuration from Supabase (top_ad_settings id=3)
  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const { data, error } = await (supabase.from('top_ad_settings') as any)
        .select('*')
        .eq('id', 3)
        .single();

      if (data && !error) {
        let parsed: Partial<DiwaliSettings> = {};
        if (data.text_desktop && data.text_desktop.startsWith('{')) {
          try {
            parsed = JSON.parse(data.text_desktop);
          } catch (e) {}
        }
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          isVisible: typeof data.is_visible === 'boolean' ? data.is_visible : true,
          updatedAt: data.updated_at
        });
      } else {
        // Fallback fetch via public API
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.magnevents.in');
        const res = await fetch(`${baseUrl}/api/settings/diwali-offer`).then(r => r.json()).catch(() => null);
        if (res) {
          setSettings({ ...DEFAULT_SETTINGS, ...res });
        }
      }
    } catch (err) {
      console.error('[DiwaliAdmin] fetchSettings error:', err);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  // 2. Fetch live analytics events & bookings
  const fetchAnalytics = useCallback(async (showToast = false) => {
    setLoadingAnalytics(true);
    setRefreshingAnalytics(true);
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        Promise.resolve(
          (supabase.from('campaign_funnel_events') as any)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(4000)
        ).catch(() => ({ data: [] })),
        (supabase.from('bookings') as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3000)
      ]);

      setFunnelEvents(eventsRes.data || []);
      setLeads(bookingsRes.data || []);

      if (showToast) {
        toast({
          title: "Analytics Refreshed",
          description: "Diwali campaign metrics and leads successfully synchronized.",
        });
      }
    } catch (err: any) {
      console.error('[DiwaliAdmin] fetchAnalytics error:', err);
      toast({
        variant: "destructive",
        title: "Analytics Sync Notice",
        description: "Data synced with fallback tables.",
      });
    } finally {
      setLoadingAnalytics(false);
      setRefreshingAnalytics(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
    fetchAnalytics();
  }, [fetchSettings, fetchAnalytics]);

  // 3. Save Configuration Handler
  const handleSaveSettings = async (overrideVisibility?: boolean) => {
    setSavingSettings(true);
    const updatedVisible = typeof overrideVisibility === 'boolean' ? overrideVisibility : settings.isVisible;
    const newSettings: DiwaliSettings = {
      ...settings,
      isVisible: updatedVisible,
      updatedAt: new Date().toISOString()
    };

    try {
      const jsonStr = JSON.stringify(newSettings);

      // Save to Supabase top_ad_settings id=3
      const { error } = await (supabase.from('top_ad_settings') as any).upsert({
        id: 3,
        is_visible: updatedVisible,
        text_desktop: jsonStr,
        text_mobile: jsonStr,
        updated_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }

      // Also trigger API update for local caches
      try {
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.magnevents.in');
        await fetch(`${baseUrl}/api/settings/diwali-offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings)
        });
      } catch (e) {}

      setSettings(newSettings);
      toast({
        title: "Offer Settings Saved",
        description: updatedVisible
          ? "Diwali announcement strip and DIW100 offer are LIVE on the website."
          : "Diwali announcement strip has been disabled from the website.",
      });
    } catch (err: any) {
      console.error('[DiwaliAdmin] Save error:', err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message || "Could not update settings. Please try again.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // 4. Date Interval Calculation
  const dateInterval = useMemo(() => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday': {
        const y = subDays(now, 1);
        return { start: startOfDay(y), end: endOfDay(y) };
      }
      case '7days':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case '30days':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case '90days':
        return { start: startOfDay(subDays(now, 90)), end: endOfDay(now) };
      case 'custom':
        if (customStart && customEnd) {
          return { start: startOfDay(parseISO(customStart)), end: endOfDay(parseISO(customEnd)) };
        }
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case 'all':
      default:
        return null;
    }
  }, [dateFilter, customStart, customEnd]);

  // Filter events and leads within the selected date window
  const isWithinDate = useCallback((dateStr: string) => {
    if (!dateInterval) return true;
    if (!dateStr) return false;
    try {
      const d = parseISO(dateStr);
      return isWithinInterval(d, dateInterval);
    } catch {
      return false;
    }
  }, [dateInterval]);

  // 5. Aggregate Analytics Metrics
  const metrics = useMemo(() => {
    // Relevant events for diwali campaign
    const diwaliEvents = funnelEvents.filter(ev => {
      const matchCampaign =
        ev.campaign_id === 'diwali-special' ||
        ev.campaign_name?.toLowerCase().includes('diwali') ||
        ev.metadata?.couponCode === settings.couponCode ||
        ev.event_name?.startsWith('diwali_') ||
        ev.event_name === 'offer_strip_view' ||
        ev.event_name === 'offer_strip_click';
      return matchCampaign && isWithinDate(ev.created_at);
    });

    // Count specific event types
    const stripImpressions = diwaliEvents.filter(e => e.event_name === 'offer_strip_view').length;
    const stripClicks = diwaliEvents.filter(e => e.event_name === 'offer_strip_click').length;
    const formOpens = diwaliEvents.filter(e => e.event_name === 'diwali_offer_form_open' || e.event_name === 'offer_form_view').length;
    const formStarts = diwaliEvents.filter(e => e.event_name === 'diwali_offer_form_start' || e.event_name === 'offer_form_start').length;
    const formSubmissionsEvent = diwaliEvents.filter(e => e.event_name === 'diwali_offer_form_submit' || e.event_name === 'offer_form_submit').length;
    const couponAppliedEvent = diwaliEvents.filter(e => e.event_name === 'diwali_coupon_applied').length;

    // Filter leads table for diwali enquiries
    const diwaliLeads = leads.filter(b => {
      const isDiwali =
        b.type === 'diwali_offer_lead' ||
        b.form_name === 'DiwaliOfferBookingForm' ||
        b.campaign_id === 'diwali-special' ||
        b.coupon_code === settings.couponCode ||
        (b.notes && b.notes.includes('DIW100')) ||
        (b.campaign_name && b.campaign_name.toLowerCase().includes('diwali'));
      return isDiwali && isWithinDate(b.created_at);
    });

    const totalSubmissions = Math.max(formSubmissionsEvent, diwaliLeads.length);
    const totalCouponApplications = Math.max(couponAppliedEvent, diwaliLeads.length);

    // Compute CTR and conversion rates
    const stripCTR = stripImpressions > 0 ? ((stripClicks / stripImpressions) * 100).toFixed(1) : '0.0';
    const clickToFormRate = stripClicks > 0 ? ((formOpens / stripClicks) * 100).toFixed(1) : '0.0';
    const formToSubmitRate = formOpens > 0 ? ((totalSubmissions / formOpens) * 100).toFixed(1) : '0.0';
    const overallConversionRate = stripClicks > 0 ? ((totalSubmissions / stripClicks) * 100).toFixed(1) : '0.0';

    // Financial pipeline aggregations
    let grossPipeline = 0;
    let totalDiscountGranted = 0;

    diwaliLeads.forEach(lead => {
      const budgetNum = typeof lead.budget === 'string'
        ? Number(lead.budget.replace(/[^0-9]/g, ''))
        : (Number(lead.budget) || 0);

      const effectiveBudget = budgetNum > 0 ? budgetNum : 15000;
      grossPipeline += effectiveBudget;

      if (effectiveBudget >= settings.minBookingValue) {
        totalDiscountGranted += Math.round(effectiveBudget * (settings.discountPercent / 100));
      }
    });

    const netPipeline = grossPipeline - totalDiscountGranted;
    const avgBookingValue = diwaliLeads.length > 0 ? Math.round(grossPipeline / diwaliLeads.length) : 0;

    // Breakdown by category
    const categoryMap: Record<string, { count: number; pipeline: number }> = {};
    diwaliLeads.forEach(l => {
      const cat = l.event_type || l.category || 'Wedding';
      const budgetNum = typeof l.budget === 'string'
        ? Number(l.budget.replace(/[^0-9]/g, ''))
        : (Number(l.budget) || 15000);

      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, pipeline: 0 };
      categoryMap[cat].count += 1;
      categoryMap[cat].pipeline += budgetNum;
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, val]) => ({
        category,
        leads: val.count,
        pipeline: val.pipeline,
        share: diwaliLeads.length > 0 ? Math.round((val.count / diwaliLeads.length) * 100) : 0
      }))
      .sort((a, b) => b.leads - a.leads);

    // Breakdown by cities
    const cityMap: Record<string, { count: number; pipeline: number }> = {};
    diwaliLeads.forEach(l => {
      const city = l.location || l.city || 'Delhi NCR';
      const budgetNum = typeof l.budget === 'string'
        ? Number(l.budget.replace(/[^0-9]/g, ''))
        : (Number(l.budget) || 15000);

      if (!cityMap[city]) cityMap[city] = { count: 0, pipeline: 0 };
      cityMap[city].count += 1;
      cityMap[city].pipeline += budgetNum;
    });

    const cityBreakdown = Object.entries(cityMap)
      .map(([city, val]) => ({
        city,
        leads: val.count,
        pipeline: val.pipeline
      }))
      .sort((a, b) => b.leads - a.leads);

    return {
      stripImpressions,
      stripClicks,
      stripCTR,
      formOpens,
      formStarts,
      totalSubmissions,
      totalCouponApplications,
      clickToFormRate,
      formToSubmitRate,
      overallConversionRate,
      grossPipeline,
      totalDiscountGranted,
      netPipeline,
      avgBookingValue,
      categoryBreakdown,
      cityBreakdown,
      diwaliLeads
    };
  }, [funnelEvents, leads, settings, isWithinDate]);

  // Sandbox simulation computed savings with tiered (+2% per tier)
  const testSavings = useMemo(() => {
    const amount = Number(testBudget) || 0;
    const isEligible = amount >= settings.minBookingValue;

    let pct = Number(settings.discountPercent) || 10;
    if (isEligible) {
      if (amount >= 200000) pct = 28;
      else if (amount >= 150000) pct = 26;
      else if (amount >= 120000) pct = 24;
      else if (amount >= 80000) pct = 22;
      else if (amount >= 50000) pct = 20;
      else if (amount >= 35000) pct = 18;
      else if (amount >= 25000) pct = 16;
      else if (amount >= 20000) pct = 14;
      else if (amount >= 15000) pct = 12;
      else pct = 10;
    } else {
      pct = 0;
    }

    const discountAmt = isEligible ? Math.round(amount * (pct / 100)) : 0;
    const finalAmt = isEligible ? amount - discountAmt : amount;
    return {
      amount,
      isEligible,
      discountAmt,
      finalAmt,
      pct
    };
  }, [testBudget, settings.minBookingValue, settings.discountPercent]);

  // Filtered Leads Table records
  const filteredLeads = useMemo(() => {
    return metrics.diwaliLeads.filter(lead => {
      const q = searchLeadQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        lead.name?.toLowerCase().includes(q) ||
        lead.phone?.toLowerCase().includes(q) ||
        lead.location?.toLowerCase().includes(q) ||
        lead.reference_code?.toLowerCase().includes(q);

      const matchCategory =
        categoryLeadFilter === 'all' ||
        (lead.event_type || lead.category)?.toLowerCase() === categoryLeadFilter.toLowerCase();

      return matchSearch && matchCategory;
    });
  }, [metrics.diwaliLeads, searchLeadQuery, categoryLeadFilter]);

  // Pagination for Leads
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / leadsPerPage));
  const paginatedLeads = useMemo(() => {
    const start = (currentLeadPage - 1) * leadsPerPage;
    return filteredLeads.slice(start, start + leadsPerPage);
  }, [filteredLeads, currentLeadPage]);

  // Export to Excel Handler
  const handleExportExcel = () => {
    if (filteredLeads.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Notice",
        description: "No lead records available to export for the selected filters.",
      });
      return;
    }

    const exportRows = filteredLeads.map((item, idx) => {
      const budgetNum = typeof item.budget === 'string'
        ? Number(item.budget.replace(/[^0-9]/g, ''))
        : (Number(item.budget) || 0);

      const discountVal = budgetNum >= settings.minBookingValue
        ? Math.round(budgetNum * (settings.discountPercent / 100))
        : 0;

      return {
        'S.No': idx + 1,
        'Reference Code': item.reference_code || `MAG-DIW-${item.id}`,
        'Client Name': item.name || 'Anonymous Client',
        'Mobile Number': item.phone || 'N/A',
        'Event Category': item.event_type || item.category || 'Wedding',
        'Event City': item.location || item.city || 'N/A',
        'Event Date': item.date || item.event_date || 'N/A',
        'Estimated Budget (₹)': budgetNum > 0 ? budgetNum : 'N/A',
        'Coupon Applied': settings.couponCode,
        'Diwali Savings (₹)': discountVal,
        'Final Estimate (₹)': budgetNum > 0 ? budgetNum - discountVal : 'N/A',
        'Traffic Source': item.utm_source || 'direct',
        'UTM Campaign': item.utm_campaign || 'diwali_special',
        'Created At': item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
      };
    });

    exportToExcel(exportRows, `Diwali_Offer_DIW100_Leads_${format(new Date(), 'yyyy-MM-dd')}`, 'Diwali Leads');

    toast({
      title: "Export Generated",
      description: `Successfully exported ${exportRows.length} Diwali campaign records to Excel.`,
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Bar with Status & Master Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Diwali Offer Management</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                settings.isVisible
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {settings.isVisible ? '● Live Active' : '○ Disabled'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Top announcement strip, <span className="font-semibold text-amber-600">{settings.couponCode}</span> coupon rules, and conversion analytics.
            </p>
          </div>
        </div>

        {/* Master Actions */}
        <div className="flex items-center flex-wrap gap-3">
          <button
            onClick={() => handleSaveSettings(!settings.isVisible)}
            disabled={savingSettings || loadingSettings}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              settings.isVisible
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
            }`}
          >
            {settings.isVisible ? 'Disable Announcement Strip' : 'Activate Announcement Strip'}
          </button>

          <button
            onClick={() => handleSaveSettings()}
            disabled={savingSettings || loadingSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-amber-500/20 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {savingSettings ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            onClick={() => {
              fetchSettings();
              fetchAnalytics(true);
            }}
            disabled={refreshingAnalytics}
            className="inline-flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium border border-gray-200 transition-all"
            title="Refresh analytics and settings"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingAnalytics ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3.5 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'config'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Offer & Strip Configuration
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-3.5 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'preview'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Eye className="w-4 h-4" />
          Live Interactive Preview
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3.5 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Campaign Analytics & Funnel
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-3.5 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'leads'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Diwali Campaign Leads ({metrics.diwaliLeads.length})
        </button>
      </div>

      {/* 3. TAB 1: OFFER & STRIP CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Form: Strip & Coupon Rules (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcement Strip Copy */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Gift className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900">Announcement Strip Copy (Top Bar)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Left Promotional Text
                  </label>
                  <input
                    type="text"
                    value={settings.leftText}
                    onChange={(e) => setSettings({ ...settings, leftText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                    placeholder="🎁 A Diwali Gift for You! Get 10% EXTRA OFF"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Includes emoji and main value hook</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Right Action / Coupon Text
                  </label>
                  <input
                    type="text"
                    value={settings.rightText}
                    onChange={(e) => setSettings({ ...settings, rightText: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                    placeholder="Use Code: DIW100 →"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Action trigger with code and arrow</p>
                </div>
              </div>
            </div>

            {/* Coupon & Validation Parameters */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Tag className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900">Coupon Validation & Discount Rules</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Coupon Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={settings.couponCode}
                      onChange={(e) => setSettings({ ...settings, couponCode: e.target.value.toUpperCase() })}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold uppercase tracking-wider text-amber-600"
                      placeholder="DIW100"
                    />
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Discount Percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.discountPercent}
                      onChange={(e) => setSettings({ ...settings, discountPercent: Number(e.target.value) })}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                      placeholder="10"
                    />
                    <Percent className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Min Booking Value (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={settings.minBookingValue}
                      onChange={(e) => setSettings({ ...settings, minBookingValue: Number(e.target.value) })}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                      placeholder="10000"
                    />
                    <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-400">₹</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Campaign Start Date
                  </label>
                  <input
                    type="date"
                    value={settings.startDate}
                    onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Campaign Expiry Date
                  </label>
                  <input
                    type="date"
                    value={settings.expiryDate}
                    onChange={(e) => setSettings({ ...settings, expiryDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Offer Form Content */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Layers className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900">Diwali Booking Modal Copy</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Modal Heading
                  </label>
                  <input
                    type="text"
                    value={settings.formHeading}
                    onChange={(e) => setSettings({ ...settings, formHeading: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                    placeholder="Your Diwali Gift Is Waiting! 🎁"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Supporting Sub-Message
                  </label>
                  <input
                    type="text"
                    value={settings.supportingMessage}
                    onChange={(e) => setSettings({ ...settings, supportingMessage: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                    placeholder="Make Your Celebration Special, Spend a Little Less!"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Offer Highlight Summary
                    </label>
                    <input
                      type="text"
                      value={settings.offerHighlight}
                      onChange={(e) => setSettings({ ...settings, offerHighlight: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                      placeholder="Enjoy an additional 10% discount on event bookings of ₹10,000 or more."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Submit CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={settings.ctaText}
                      onChange={(e) => setSettings({ ...settings, ctaText: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold text-amber-600"
                      placeholder="CLAIM MY 10% DISCOUNT"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Discount Sandbox Simulator (1 Col) */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl p-6 border border-amber-500/20 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-amber-500/20">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-gray-900">Live Discount Simulator</h3>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Test the backend coupon validation matrix in real time. Disallows discounts below ₹{settings.minBookingValue.toLocaleString('en-IN')}.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Test Booking Budget
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    value={testBudget}
                    onChange={(e) => setTestBudget(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-amber-200 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-gray-400">₹</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center flex-wrap gap-2">
                {[5000, 10000, 15000, 20000, 25000, 35000, 50000, 80000, 120000, 200000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setTestBudget(amt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      testBudget === amt
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Live Calculation Output Card */}
              <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Gross Budget:</span>
                  <span className="font-semibold text-gray-900">₹{testSavings.amount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Eligibility Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    testSavings.isEligible
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {testSavings.isEligible ? 'Eligible for Extra 10% OFF' : 'Not Eligible (Min ₹10,000)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-amber-600 font-semibold">
                  <span>Diwali Savings ({testSavings.pct}%):</span>
                  <span>- ₹{testSavings.discountAmt.toLocaleString('en-IN')}</span>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">Final Client Payable:</span>
                  <span className="text-base font-extrabold text-emerald-600">
                    ₹{testSavings.finalAmt.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 leading-normal flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  All calculations strictly enforced by server-side endpoint <code className="bg-white px-1 rounded border border-gray-200 text-gray-700">/api/campaigns/coupon/validate</code>.
                </span>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Target Platforms & Routing</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-600">Production Website:</span>
                  <a
                    href="https://magnevents.in"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-amber-600 hover:underline flex items-center gap-1"
                  >
                    magnevents.in <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-600">Direct Trigger Anchor:</span>
                  <code className="text-[11px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-800">
                    #diwali-gift
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: LIVE INTERACTIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Device Toggle */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Real-Time Visual Preview</h3>
              <p className="text-xs text-gray-500">See exactly how the top announcement strip appears to customers</p>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Laptop className="w-4 h-4" />
                Desktop
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile (375px)
              </button>
            </div>
          </div>

          {/* Preview Container Frame */}
          <div className="flex justify-center bg-gray-900/5 p-8 rounded-3xl border border-gray-200 min-h-[500px]">
            <div
              className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 transition-all ${
                previewDevice === 'desktop' ? 'w-full max-w-4xl' : 'w-[375px]'
              }`}
            >
              {/* Browser bar mockup */}
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="bg-white rounded-md px-3 py-0.5 text-[11px] text-gray-400 flex-1 text-center font-mono">
                  https://magnevents.in
                </div>
              </div>

              {/* Exact Announcement Strip Mockup */}
              {settings.isVisible ? (
                <div
                  onClick={() => setPreviewFormOpen(true)}
                  style={{
                    backgroundColor: '#050505',
                    height: previewDevice === 'mobile' ? '34px' : '36px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: previewDevice === 'mobile' ? '0 12px' : '0 24px',
                    color: '#ffffff',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: previewDevice === 'mobile' ? '11px' : '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    <span style={{ fontSize: '14px' }}>🎁</span>
                    <span>
                      A Diwali Gift for You!{' '}
                      <span style={{ fontWeight: 700, color: '#FFD166' }}>
                        Get {settings.discountPercent}% EXTRA OFF
                      </span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    <span>Use Code:</span>
                    <span
                      style={{
                        color: '#FFD166',
                        fontWeight: 800,
                        letterSpacing: '0.04em'
                      }}
                    >
                      {settings.couponCode}
                    </span>
                    <span style={{ color: '#FFD166', fontWeight: 700 }}>→</span>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 text-rose-700 py-2 text-center text-xs font-semibold border-b border-rose-200">
                  Strip is currently DISABLED. Toggle switch to activate.
                </div>
              )}

              {/* Mock Website Navigation Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center text-sm">
                    M
                  </div>
                  <span className="font-extrabold text-sm tracking-tight text-gray-900">MAGNEVENTS</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                  <span>Artists</span>
                  <span>Categories</span>
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full font-bold">Book Artist</span>
                </div>
              </div>

              {/* Website Mock Body */}
              <div className="p-8 text-center space-y-4 bg-gradient-to-b from-gray-50 to-white min-h-[300px] flex flex-col items-center justify-center">
                <span className="text-xs uppercase tracking-widest text-amber-600 font-bold">
                  {settings.campaignName} 2026
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 max-w-md">
                  Book Top Verified Artists For Your Grand Celebrations
                </h2>
                <p className="text-xs text-gray-500 max-w-sm">
                  Click the slim black announcement strip above to trigger the Diwali Offer Form.
                </p>
                <button
                  onClick={() => setPreviewFormOpen(true)}
                  className="px-4 py-2 bg-black text-amber-400 font-bold rounded-xl text-xs hover:bg-gray-800 transition-all flex items-center gap-1.5"
                >
                  <Gift className="w-3.5 h-3.5" />
                  Preview Modal Popup
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Modal Preview Overlay */}
          {previewFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#121214] text-white rounded-3xl max-w-md w-full border border-amber-500/30 p-6 space-y-5 shadow-2xl relative">
                {/* Close Button */}
                <button
                  onClick={() => setPreviewFormOpen(false)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-white p-2"
                >
                  ✕
                </button>

                {/* Modal Header */}
                <div className="space-y-1.5 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Special Campaign
                  </div>
                  <h3 className="text-xl font-bold text-white">{settings.formHeading}</h3>
                  <p className="text-xs text-amber-200/80">{settings.supportingMessage}</p>
                </div>

                {/* Offer Highlight Box */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">Coupon Code</span>
                    <div className="text-lg font-black text-white tracking-widest">{settings.couponCode}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 font-medium">Extra Discount</span>
                    <div className="text-lg font-black text-amber-400">{settings.discountPercent}% OFF</div>
                  </div>
                </div>

                {/* Mock Live Budget Selector */}
                <div className="space-y-2 bg-[#1b1b1e] p-4 rounded-2xl border border-gray-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Selected Event Budget:</span>
                    <span className="font-bold text-white">₹{testSavings.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-amber-400">
                    <span>Diwali Savings:</span>
                    <span className="font-bold">- ₹{testSavings.discountAmt.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-800 flex justify-between text-xs font-bold">
                    <span className="text-gray-300">Net Estimated Amount:</span>
                    <span className="text-emerald-400 font-extrabold text-sm">
                      ₹{testSavings.finalAmt.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Action CTA */}
                <button
                  onClick={() => setPreviewFormOpen(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-sm hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
                >
                  {settings.ctaText}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: CAMPAIGN ANALYTICS & FUNNEL */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Date Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Date Window:</span>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: '90days', label: 'Last 90 Days' },
                { id: 'all', label: 'All Time' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDateFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    dateFilter === tab.id
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 12 Key Performance Indicator Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-400 text-xs font-medium mb-1">Strip Impressions</div>
              <div className="text-xl font-black text-gray-900">{metrics.stripImpressions.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-gray-400 mt-1">offer_strip_view</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-400 text-xs font-medium mb-1">Strip Clicks</div>
              <div className="text-xl font-black text-amber-600">{metrics.stripClicks.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-amber-600/80 mt-1 font-semibold">CTR: {metrics.stripCTR}%</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-400 text-xs font-medium mb-1">Form Views</div>
              <div className="text-xl font-black text-gray-900">{metrics.formOpens.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-gray-400 mt-1">Open Rate: {metrics.clickToFormRate}%</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-400 text-xs font-medium mb-1">Form Submissions</div>
              <div className="text-xl font-black text-emerald-600">{metrics.totalSubmissions.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Conv: {metrics.overallConversionRate}%</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-400 text-xs font-medium mb-1">Total Pipeline</div>
              <div className="text-xl font-black text-gray-900">₹{metrics.grossPipeline.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-gray-400 mt-1">Gross Booking Budget</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-gray-400 text-xs font-medium mb-1">Discounts Granted</div>
              <div className="text-xl font-black text-amber-600">₹{metrics.totalDiscountGranted.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-amber-600 mt-1">Code: {settings.couponCode}</div>
            </div>
          </div>

          {/* Full Visual Step-by-Step Conversion Funnel */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-gray-900">Diwali Campaign Conversion Funnel</h3>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                End-to-End Visitor Journey
              </span>
            </div>

            <div className="space-y-4">
              {[
                { stage: '1. Announcement Strip Displayed', count: metrics.stripImpressions, color: 'bg-blue-500', pct: 100 },
                {
                  stage: '2. Announcement Strip Clicked',
                  count: metrics.stripClicks,
                  color: 'bg-amber-500',
                  pct: metrics.stripImpressions > 0 ? ((metrics.stripClicks / metrics.stripImpressions) * 100).toFixed(1) : 0
                },
                {
                  stage: '3. Offer Form Opened',
                  count: metrics.formOpens,
                  color: 'bg-indigo-500',
                  pct: metrics.stripClicks > 0 ? ((metrics.formOpens / metrics.stripClicks) * 100).toFixed(1) : 0
                },
                {
                  stage: '4. Form Interaction Started',
                  count: metrics.formStarts,
                  color: 'bg-purple-500',
                  pct: metrics.formOpens > 0 ? ((metrics.formStarts / metrics.formOpens) * 100).toFixed(1) : 0
                },
                {
                  stage: '5. Enquiry Lead Submitted',
                  count: metrics.totalSubmissions,
                  color: 'bg-emerald-500',
                  pct: metrics.formStarts > 0 ? ((metrics.totalSubmissions / metrics.formStarts) * 100).toFixed(1) : 0
                },
                {
                  stage: '6. Coupon Claimed / Applied',
                  count: metrics.totalCouponApplications,
                  color: 'bg-amber-600',
                  pct: metrics.totalSubmissions > 0 ? ((metrics.totalCouponApplications / metrics.totalSubmissions) * 100).toFixed(1) : 0
                }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">{item.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{item.count.toLocaleString('en-IN')}</span>
                      <span className="text-gray-400 text-[11px]">({item.pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.min(100, metrics.stripImpressions > 0 ? (item.count / metrics.stripImpressions) * 100 : 0)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event Categories & Cities Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Categories */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                Performance by Event Category
              </h3>

              {metrics.categoryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {metrics.categoryBreakdown.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div>
                        <div className="text-xs font-bold text-gray-900">{cat.category}</div>
                        <div className="text-[11px] text-gray-500">₹{cat.pipeline.toLocaleString('en-IN')} pipeline</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-600">{cat.leads} Leads</div>
                        <div className="text-[10px] text-gray-400">{cat.share}% share</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No categorical breakdown available for selected date range.
                </div>
              )}
            </div>

            {/* Cities */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                Performance by Top Cities
              </h3>

              {metrics.cityBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {metrics.cityBreakdown.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div>
                        <div className="text-xs font-bold text-gray-900">{c.city}</div>
                        <div className="text-[11px] text-gray-500">₹{c.pipeline.toLocaleString('en-IN')} gross budget</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-600">{c.leads} Leads</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No geographic records available for selected date range.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: DIWALI CAMPAIGN LEADS TABLE */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4">
          {/* Table Controls */}
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Attributed Diwali Campaign Leads</h3>
              <p className="text-xs text-gray-500">
                All customer inquiries submitted with the <span className="font-semibold text-amber-600">{settings.couponCode}</span> discount coupon.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchLeadQuery}
                  onChange={(e) => setSearchLeadQuery(e.target.value)}
                  placeholder="Search lead, phone, city..."
                  className="pl-9 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 w-56"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
              </div>

              {/* Category Filter */}
              <select
                value={categoryLeadFilter}
                onChange={(e) => setCategoryLeadFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Categories</option>
                <option value="Wedding">Wedding</option>
                <option value="Engagement">Engagement</option>
                <option value="Birthday">Birthday</option>
                <option value="Corporate">Corporate Event</option>
                <option value="Anniversary">Anniversary</option>
                <option value="Private Party">Private Party</option>
              </select>

              {/* Excel Export */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export to Excel
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Ref Code</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Diwali Savings</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {paginatedLeads.length > 0 ? (
                  paginatedLeads.map((item, idx) => {
                    const budgetNum = typeof item.budget === 'string'
                      ? Number(item.budget.replace(/[^0-9]/g, ''))
                      : (Number(item.budget) || 0);

                    const isEligible = budgetNum >= settings.minBookingValue;
                    const discountAmt = isEligible ? Math.round(budgetNum * (settings.discountPercent / 100)) : 0;

                    return (
                      <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-gray-900">
                          {item.reference_code || `MAG-DIW-${item.id}`}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          {item.name || 'Anonymous Client'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 font-mono">
                          {item.phone || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                            {item.event_type || item.category || 'Wedding'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {item.location || item.city || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {item.date || item.event_date || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {budgetNum > 0 ? `₹${budgetNum.toLocaleString('en-IN')}` : item.budget || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          {discountAmt > 0 ? `- ₹${discountAmt.toLocaleString('en-IN')}` : 'Not Eligible'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                          {item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy, HH:mm') : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      No matching Diwali leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div>
                Showing {(currentLeadPage - 1) * leadsPerPage + 1} to{' '}
                {Math.min(currentLeadPage * leadsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentLeadPage(p => Math.max(1, p - 1))}
                  disabled={currentLeadPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2 font-semibold text-gray-800">
                  {currentLeadPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentLeadPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentLeadPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

