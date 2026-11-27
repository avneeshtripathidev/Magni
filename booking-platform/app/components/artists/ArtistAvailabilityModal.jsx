"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '@/app/styles/components/ArtistAvailabilityModal.css';

export default function ArtistAvailabilityModal({
  isOpen = false,
  onClose,
  artist = {},
  onSelectDate,
  isInPage = false,
}) {
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key when modal is open
  useEffect(() => {
    if (!isOpen || isInPage) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isInPage, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen || isInPage) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, isInPage]);

  // If it's a modal and not open, don't render anything
  if (!isInPage && !isOpen) {
    return null;
  }

  const calYear = currentMonth.getFullYear();
  const calMonthIdx = currentMonth.getMonth();

  const monthLabel = currentMonth.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  // Extract blocked dates
  const blockedDates = useMemo(() => {
    const raw =
      artist?.blocked_dates ||
      artist?.performance_details?.blocked_dates ||
      artist?.availability?.blocked_dates ||
      [];
    return Array.isArray(raw) ? raw : [];
  }, [artist]);

  // Calendar dates calculation (Monday = 0)
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate();
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

  const artistName = artist?.alias || artist?.stage_name || artist?.name || 'Artist';
  const category = artist?.category || artist?.sub_category || 'Live Performer';
  const city = artist?.city || 'India';

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
    if (onClose) onClose();
  };

  const handleWhatsAppInquiry = () => {
    const msg = selectedDate
      ? `Hello Magnevents! I would like to check availability and book verified artist ${artistName} (${category}) for my event on ${selectedDate} in ${city}. Please share pricing and details!`
      : `Hello Magnevents! I would like to check availability and book verified artist ${artistName} (${category}) in ${city}. Please share live rates!`;
    const waUrl = `https://wa.me/918076515257?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const calendarContent = (
    <div className={isInPage ? 'aam-inpage-card' : 'aam-card'} onClick={(e) => e.stopPropagation()}>
      {/* 1. Header */}
      <div className="aam-header">
        <div className="aam-header-left">
          <div className="aam-badge-row">
            <span className="aam-live-badge">
              <span className="aam-live-dot" />
              Live Availability
            </span>
            <span className="aam-city-badge">📍 {city}</span>
          </div>

          <h3 className="aam-title">
            {artistName}&rsquo;s Schedule
          </h3>

          <p className="aam-subtitle">
            Check free dates to book your live show without scheduling conflicts.
          </p>
        </div>

        {!isInPage && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="aam-close-btn"
            aria-label="Close Schedule Modal"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Month Navigation & Legend Bar */}
      <div className="aam-month-bar">
        <div className="aam-month-nav">
          <div className="aam-month-title">
            <span>📅 {monthLabel}</span>
          </div>

          <div className="aam-nav-arrows">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(calYear, calMonthIdx - 1, 1))}
              className="aam-arrow-btn"
              aria-label="Previous Month"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(calYear, calMonthIdx + 1, 1))}
              className="aam-arrow-btn"
              aria-label="Next Month"
            >
              ›
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="aam-legend-row">
          <div className="aam-legend-items">
            <div className="aam-legend-pill free">
              <span className="dot" />
              <span>Free / Available</span>
            </div>
            <div className="aam-legend-pill booked">
              <span className="dot" />
              <span>Booked / Busy</span>
            </div>
          </div>
          <span className="aam-legend-tip">Tap any free date to select</span>
        </div>
      </div>

      {/* 3. Calendar Grid */}
      <div className="aam-calendar-wrap">
        {/* Days of week header */}
        <div className="aam-days-header">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
            <div
              key={day}
              className={`aam-day-name ${idx >= 5 ? 'weekend' : ''}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date cells grid */}
        <div className="aam-dates-grid">
          {/* Leading blank offset */}
          {Array.from({ length: calendarDays.leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} className="aam-blank-cell" />
          ))}

          {/* Actual Month Days */}
          {calendarDays.days.map((item) => {
            const isSelected = selectedDate === item.dateStr;

            let cellClass = 'aam-date-cell';
            if (isSelected) cellClass += ' is-selected';
            else if (item.isPast) cellClass += ' is-past';
            else if (item.isBlocked) cellClass += ' is-booked';
            else cellClass += ' is-free';

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
                className={cellClass}
                title={item.isBlocked ? 'Booked for an event' : (item.isPast ? 'Past date' : `Available on ${item.dateStr}`)}
              >
                <div className="aam-cell-top">
                  <span className="aam-day-number">{item.day}</span>
                  <span className="aam-status-icon">
                    {item.isPast ? '' : item.isBlocked ? '✕' : '✓'}
                  </span>
                </div>

                <span className="aam-status-label">
                  {item.isPast ? 'Past' : item.isBlocked ? 'Booked' : 'Free'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Footer & Quick Action Bar */}
      <div className="aam-footer">
        <div className="aam-footer-info">
          {selectedDate ? (
            <span>
              Selected Date:{' '}
              <span className="aam-selected-pill">
                ✓ {selectedDate}
              </span>
            </span>
          ) : (
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Select a free date to book
            </span>
          )}
        </div>

        <div className="aam-footer-actions">
          <button
            type="button"
            onClick={handleWhatsAppInquiry}
            className="aam-btn-whatsapp"
          >
            <span>💬 WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleBookSelectedDate}
            className="aam-btn-book"
          >
            <span>{selectedDate ? `Book Date (${selectedDate})` : 'Inquire Booking'}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );

  // If in-page, render directly inline
  if (isInPage) {
    return calendarContent;
  }

  // If modal, render via portal into body
  if (mounted && typeof document !== 'undefined') {
    return createPortal(
      <div className="aam-overlay" onClick={onClose}>
        {calendarContent}
      </div>,
      document.body
    );
  }

  return (
    <div className="aam-overlay" onClick={onClose}>
      {calendarContent}
    </div>
  );
}
