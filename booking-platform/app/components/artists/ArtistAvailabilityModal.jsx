"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ArtistAvailabilityModal({
  isOpen,
  onClose,
  artist,
  onSelectDate,
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);

  if (!isOpen || !artist) return null;

  const calYear = currentMonth.getFullYear();
  const calMonthIdx = currentMonth.getMonth();

  const monthLabel = currentMonth.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  // Extract blocked dates
  const blockedDates = useMemo(() => {
    const raw =
      artist.blocked_dates ||
      artist.performance_details?.blocked_dates ||
      artist.availability?.blocked_dates ||
      [];
    return Array.isArray(raw) ? raw : [];
  }, [artist]);

  // Calendar dates calculation
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate();
    // Monday as index 0:
    const firstDayOfWeek = (new Date(calYear, calMonthIdx, 1).getDay() + 6) % 7;

    const todayStr = new Date().toISOString().substring(0, 10);
    const days = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(calMonthIdx + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${calYear}-${monthStr}-${dayStr}`;

      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isBlocked = blockedDates.includes(dateStr);
      const isFree = !isPast && !isBlocked;

      days.push({
        day: d,
        dateStr,
        isPast,
        isToday,
        isBlocked,
        isFree,
      });
    }

    return { days, leadingBlanks: firstDayOfWeek };
  }, [calYear, calMonthIdx, blockedDates]);

  const artistName = artist.alias || artist.name || 'Artist';
  const category = artist.category || artist.subCategory || 'Live Performer';
  const city = artist.city || 'India';

  const handleBookSelectedDate = () => {
    if (onSelectDate && selectedDate) {
      onSelectDate(selectedDate);
    } else {
      window.dispatchEvent(
        new CustomEvent('open-contact-modal', {
          detail: {
            type: 'booking',
            artist: { name: artistName, category },
            preferredDate: selectedDate,
          },
        })
      );
    }
    onClose();
  };

  const handleWhatsAppInquiry = () => {
    const msg = selectedDate
      ? `Hello Magnevents! I would like to check availability and book verified artist ${artistName} (${category}) for my event on ${selectedDate} in ${city}. Please share pricing and details!`
      : `Hello Magnevents! I would like to check availability and book verified artist ${artistName} (${category}) in ${city}. Please share live rates!`;
    const waUrl = `https://wa.me/918808393732?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        style={{ zIndex: 9999 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#111318] text-white rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Live Availability
                </span>
                <span className="text-xs text-white/50">{city}</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {artistName}&rsquo;s Schedule
              </h3>
              <p className="text-xs text-white/60">
                Check free dates to book your live show without scheduling conflicts.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Month Navigation & Legend */}
          <div className="p-4 sm:p-5 border-b border-white/5 space-y-3 bg-[#0d0e12]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-tight">
                {monthLabel}
              </h4>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(calYear, calMonthIdx - 1, 1))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white text-xs font-bold transition-colors"
                  aria-label="Previous Month"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(calYear, calMonthIdx + 1, 1))}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white text-xs font-bold transition-colors"
                  aria-label="Next Month"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Top Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span className="text-emerald-300 font-semibold text-[11px]">Free / Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold text-[10px]">
                    ✗
                  </span>
                  <span className="text-rose-300 font-semibold text-[11px]">Booked / Busy</span>
                </div>
              </div>
              <span className="text-[10px] text-white/40">Tap date to select</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 sm:p-5 overflow-y-auto">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <div
                  key={day}
                  className={`text-[10px] font-bold uppercase tracking-wider py-1 ${
                    idx >= 5 ? 'text-amber-400/80' : 'text-white/40'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Date Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {Array.from({ length: calendarDays.leadingBlanks }).map((_, i) => (
                <div
                  key={`blank-${i}`}
                  className="rounded-xl border border-white/[0.03] bg-white/[0.01] min-h-[48px] sm:min-h-[58px]"
                />
              ))}

              {calendarDays.days.map((item) => {
                const isSelected = selectedDate === item.dateStr;

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    disabled={item.isPast || item.isBlocked}
                    onClick={() => {
                      if (item.isFree) {
                        setSelectedDate(item.dateStr);
                      }
                    }}
                    className={`p-1 sm:p-1.5 rounded-xl border text-left flex flex-col justify-between min-h-[48px] sm:min-h-[58px] transition-all relative ${
                      isSelected
                        ? 'bg-emerald-500 text-black border-emerald-400 font-black ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/30'
                        : item.isPast
                        ? 'bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed opacity-50'
                        : item.isBlocked
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-300/80 cursor-not-allowed'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-200 cursor-pointer active:scale-95'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-black ${isSelected ? 'text-black' : ''}`}>
                        {item.day}
                      </span>
                      <span className="text-[10px] font-black">
                        {item.isPast ? '' : item.isBlocked ? '✗' : '✓'}
                      </span>
                    </div>

                    <span
                      className={`text-[8px] sm:text-[9px] font-bold truncate block ${
                        isSelected
                          ? 'text-black'
                          : item.isBlocked
                          ? 'text-rose-400/70'
                          : 'text-emerald-400'
                      }`}
                    >
                      {item.isPast ? 'Past' : item.isBlocked ? 'Booked' : 'Free'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0d0e12] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-white/70 w-full sm:w-auto text-center sm:text-left">
              {selectedDate ? (
                <span>
                  Selected Date:{' '}
                  <strong className="text-emerald-400 font-black">{selectedDate}</strong>
                </span>
              ) : (
                <span className="text-white/40">Select a free date to book</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleWhatsAppInquiry}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleBookSelectedDate}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span>{selectedDate ? `Book Date (${selectedDate})` : 'Inquire Booking'}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

