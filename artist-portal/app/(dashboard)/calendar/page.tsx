'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { artistService } from '../../../services/artistService';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Save,
  Loader2,
  CalendarCheck,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

export default function ArtistCalendarPage() {
  const { artist, refreshArtist } = useArtistAuth();

  // Current viewed month (first day of month)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Blocked dates array (YYYY-MM-DD format)
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [initialBlockedDates, setInitialBlockedDates] = useState<string[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load blocked dates & confirmed bookings from database
  const loadAvailability = useCallback(async () => {
    if (!artist?.id) return;
    setLoading(true);
    setSaveError(null);

    try {
      // 1. Fetch from availability endpoint
      const res = await fetch(`/api/artist/availability?artistId=${encodeURIComponent(artist.id)}`, {
        cache: 'no-store',
      });
      const json = await res.json();

      let blocked: string[] = [];
      const bookingsMap: Record<string, string> = {};

      if (json.success && json.data) {
        blocked = Array.isArray(json.data.blockedDates) ? json.data.blockedDates : [];
        if (Array.isArray(json.data.bookedDates)) {
          json.data.bookedDates.forEach((b: any) => {
            if (b.date) {
              const dStr = b.date.substring(0, 10);
              bookingsMap[dStr] = b.title || 'Confirmed Booking';
            }
          });
        }
      } else if (artist.performance_details?.blocked_dates) {
        blocked = artist.performance_details.blocked_dates;
      }

      setBlockedDates(blocked);
      setInitialBlockedDates(blocked);
      setConfirmedBookings(bookingsMap);
    } catch (err: any) {
      console.warn('Failed to load availability:', err);
      const fallback = artist?.performance_details?.blocked_dates || [];
      setBlockedDates(fallback);
      setInitialBlockedDates(fallback);
    } finally {
      setLoading(false);
    }
  }, [artist?.id, artist?.performance_details?.blocked_dates]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // Month calculations
  const calYear = currentMonth.getFullYear();
  const calMonthIdx = currentMonth.getMonth();

  const monthLabel = currentMonth.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  // Generate calendar grid dates
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate();
    // In JS: 0=Sun, 1=Mon, ..., 6=Sat. We prefer Monday as col 0.
    const firstDayOfWeek = (new Date(calYear, calMonthIdx, 1).getDay() + 6) % 7;

    const days: Array<{
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isPast: boolean;
      isWeekend: boolean;
      confirmedBooking?: string;
      isFree: boolean;
      isBlocked: boolean;
    }> = [];

    const todayStr = new Date().toISOString().substring(0, 10);

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(calMonthIdx + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${calYear}-${monthStr}-${dayStr}`;

      const dateObj = new Date(calYear, calMonthIdx, d);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;

      const confirmedBooking = confirmedBookings[dateStr];
      const isBlocked = blockedDates.includes(dateStr) || !!confirmedBooking;
      const isFree = !isBlocked;

      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday,
        isPast,
        isWeekend,
        confirmedBooking,
        isFree,
        isBlocked,
      });
    }

    return { days, leadingBlanks: firstDayOfWeek };
  }, [calYear, calMonthIdx, blockedDates, confirmedBookings]);

  // Has unsaved changes check
  const hasChanges = useMemo(() => {
    if (blockedDates.length !== initialBlockedDates.length) return true;
    const s1 = new Set(blockedDates);
    for (const d of initialBlockedDates) {
      if (!s1.has(d)) return true;
    }
    return false;
  }, [blockedDates, initialBlockedDates]);

  // Toggle single date
  const handleToggleDate = (dateStr: string) => {
    // Cannot toggle dates with confirmed client bookings
    if (confirmedBookings[dateStr]) return;

    setBlockedDates((prev) => {
      if (prev.includes(dateStr)) {
        // Was blocked -> now Free (remove from blocked)
        return prev.filter((d) => d !== dateStr);
      } else {
        // Was free -> now Blocked (add to blocked)
        return [...prev, dateStr];
      }
    });
    setSaveSuccess(false);
  };

  // Bulk Quick Action: Mark All Days of Current Month as Free
  const handleMarkAllMonthFree = () => {
    const currentMonthDates = new Set(calendarDays.days.map((d) => d.dateStr));
    setBlockedDates((prev) => prev.filter((d) => !currentMonthDates.has(d)));
    setSaveSuccess(false);
  };

  // Bulk Quick Action: Block Weekends of Current Month
  const handleBlockWeekends = () => {
    const weekendDates = calendarDays.days
      .filter((d) => d.isWeekend)
      .map((d) => d.dateStr);

    setBlockedDates((prev) => {
      const set = new Set([...prev, ...weekendDates]);
      return Array.from(set);
    });
    setSaveSuccess(false);
  };

  // Bulk Quick Action: Block All Days of Current Month
  const handleBlockEntireMonth = () => {
    const allMonthDates = calendarDays.days.map((d) => d.dateStr);
    setBlockedDates((prev) => {
      const set = new Set([...prev, ...allMonthDates]);
      return Array.from(set);
    });
    setSaveSuccess(false);
  };

  // Revert changes
  const handleReset = () => {
    setBlockedDates(initialBlockedDates);
    setSaveSuccess(false);
  };

  // Save Availability to DB
  const handleSaveAvailability = async () => {
    if (!artist?.id) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // 1. Direct API call to availability route
      const res = await fetch('/api/artist/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: artist.id,
          blockedDates,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save availability');
      }

      // 2. Also sync to artist service
      await artistService.updateAvailability(artist.id, blockedDates);
      await refreshArtist();

      setInitialBlockedDates([...blockedDates]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);
    } catch (err: any) {
      console.error('Error saving availability:', err);
      setSaveError(err.message || 'Failed to sync with database. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Month counts
  const monthFreeCount = calendarDays.days.filter((d) => d.isFree).length;
  const monthBlockedCount = calendarDays.days.filter((d) => d.isBlocked).length;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Manage Calendar & Availability
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Click any date to mark it <span className="font-bold text-green-700">Free (✓)</span> or{' '}
                <span className="font-bold text-red-600">Booked / Blocked (✗)</span>. Clients will see your live schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Save button & status */}
        <div className="flex items-center gap-3 self-start md:self-center">
          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAvailability}
            disabled={saving || !hasChanges}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95 ${
              hasChanges
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/25 ring-2 ring-emerald-500/20 animate-pulse'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{hasChanges ? 'Save Availability' : 'Availability Saved'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Toast / Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Availability saved successfully! Your public profile and booking inquiries are updated in real-time.</span>
          </div>
          <span className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">Live Synced ✓</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 2. Main Calendar Container */}
      <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-slate-200 shadow-sm space-y-5">
        {/* Navigation & Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(calYear, calMonthIdx - 1, 1))}
                className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(calYear, calMonthIdx + 1, 1))}
                className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{monthLabel}</h2>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="text-emerald-700 font-bold">{monthFreeCount} Days Free</span>
                <span>•</span>
                <span className="text-rose-600 font-bold">{monthBlockedCount} Days Booked</span>
              </div>
            </div>
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllMonthFree}
              className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold text-xs transition-colors"
            >
              ✓ Mark All Free
            </button>
            <button
              type="button"
              onClick={handleBlockWeekends}
              className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Block Weekends
            </button>
            <button
              type="button"
              onClick={handleBlockEntireMonth}
              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs transition-colors"
            >
              ✗ Block Entire Month
            </button>
          </div>
        </div>

        {/* Top Legend Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Free State */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-green-100 border border-green-300 text-green-700 flex items-center justify-center font-black text-xs">
                ✓
              </span>
              <span className="font-bold text-slate-800">Free Date (`✓`)</span>
              <span className="text-slate-400 font-normal">(Available for bookings)</span>
            </div>

            {/* Blocked State */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-red-100 border border-red-300 text-red-600 flex items-center justify-center font-black text-xs">
                ✗
              </span>
              <span className="font-bold text-slate-800">Unavailable / Booked (`✗`)</span>
              <span className="text-slate-400 font-normal">(Blocked schedule)</span>
            </div>

            {/* Confirmed Gig State */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-sky-100 border border-sky-300 text-sky-800 flex items-center justify-center font-black text-xs">
                <CalendarCheck className="w-3.5 h-3.5 text-sky-600" />
              </span>
              <span className="font-bold text-slate-800">Confirmed Gig</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Click any date to toggle</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto -mx-2 px-2 pb-2">
          <div className="min-w-[340px]">
            {/* Day Header Row */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <div
                  key={day}
                  className={`text-[11px] font-black uppercase tracking-wider py-1.5 ${
                    idx >= 5 ? 'text-amber-600' : 'text-slate-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Date Cells Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Leading blanks */}
              {Array.from({ length: calendarDays.leadingBlanks }).map((_, i) => (
                <div
                  key={`blank-${i}`}
                  className="rounded-2xl border border-dashed border-slate-100 bg-slate-50/40 min-h-[64px] sm:min-h-[82px]"
                />
              ))}

              {/* Month dates */}
              {calendarDays.days.map((item) => {
                const isConfirmed = !!item.confirmedBooking;

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => handleToggleDate(item.dateStr)}
                    disabled={isConfirmed}
                    aria-label={`${item.dateStr} is ${
                      isConfirmed ? 'booked' : item.isFree ? 'free' : 'blocked'
                    }`}
                    className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[64px] sm:min-h-[82px] touch-manipulation group ${
                      isConfirmed
                        ? 'bg-sky-50 border-sky-300 text-sky-950 cursor-default shadow-xs ring-1 ring-sky-300'
                        : item.isFree
                        ? 'bg-green-100/80 hover:bg-green-100 border-green-300 text-green-900 shadow-xs hover:border-green-400 active:scale-95'
                        : 'bg-red-100/70 hover:bg-red-100 border-red-300 text-red-900 shadow-xs hover:border-red-400 active:scale-95'
                    }`}
                  >
                    {/* Top Row: Date Number + State Badge */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs sm:text-sm font-black ${
                          item.isToday
                            ? 'w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center -m-1 shadow-xs'
                            : isConfirmed
                            ? 'text-sky-950'
                            : item.isFree
                            ? 'text-green-950'
                            : 'text-red-950'
                        }`}
                      >
                        {item.day}
                      </span>

                      {/* Icon */}
                      {isConfirmed ? (
                        <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 flex items-center justify-center">
                          <CalendarCheck className="w-3 h-3 text-sky-700" />
                        </span>
                      ) : item.isFree ? (
                        <span className="w-5 h-5 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-black text-[11px] shadow-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-red-200 text-red-700 flex items-center justify-center font-black text-[11px] shadow-xs">
                          ✗
                        </span>
                      )}
                    </div>

                    {/* Bottom Label */}
                    <div className="mt-1 truncate">
                      {isConfirmed ? (
                        <span className="text-[9px] sm:text-[10px] font-black text-sky-900 truncate block">
                          {item.confirmedBooking || 'Gig Booked'}
                        </span>
                      ) : item.isFree ? (
                        <span className="text-[9px] sm:text-[10px] font-black text-green-800 block">
                          ✓ Free
                        </span>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-bold text-red-700 block">
                          ✗ Booked
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Summary & Info */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Centralized sync active. Free dates appear with green checkmarks on your public portfolio page.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800">
              Total Blocked Dates: {blockedDates.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
