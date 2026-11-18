"use client";

import React from 'react';
import {
  Sparkles,
  Star,
  Award,
  Trophy,
  Crown,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  ARTIST_TIERS,
  getArtistTierProgress,
} from '../../lib/artistTiers';

function getTierIcon(level: number) {
  switch (level) {
    case 5:
      return Crown;
    case 4:
      return Trophy;
    case 3:
      return Award;
    case 2:
      return Star;
    default:
      return Sparkles;
  }
}

interface ArtistTierBadgeProps {
  completedEvents?: number | null;
  rankPosition?: number;
  showCount?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function ArtistTierBadge({
  completedEvents = 0,
  rankPosition,
  showCount = true,
  size = 'sm',
  className = '',
}: ArtistTierBadgeProps) {
  const { tier, completedEvents: count } = getArtistTierProgress(completedEvents);
  const Icon = getTierIcon(tier.level);

  const sizeClass =
    size === 'xs'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : size === 'md'
      ? 'px-3 py-1.5 text-xs gap-1.5'
      : 'px-2.5 py-1 text-[11px] gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder} ${sizeClass} ${className}`}
      title={`Level ${tier.level} • ${tier.name} (${tier.rangeLabel}) — ${count} completed events`}
    >
      {rankPosition !== undefined && (
        <span className="font-black opacity-80">#{rankPosition}</span>
      )}
      <Icon className={`w-3 h-3 flex-shrink-0 ${tier.iconColor}`} />
      <span>{tier.name}</span>
      {showCount && (
        <>
          <span className="opacity-40">•</span>
          <span className="font-extrabold">{count} Events</span>
        </>
      )}
    </span>
  );
}

interface ArtistTierCardProps {
  completedEvents?: number | null;
  rankPosition?: number;
  artistName?: string;
}

export function ArtistTierCard({
  completedEvents = 0,
  rankPosition,
  artistName,
}: ArtistTierCardProps) {
  const { tier, nextTier, completedEvents: count, eventsToNext, progressPercent } =
    getArtistTierProgress(completedEvents);
  const ActiveIcon = getTierIcon(tier.level);

  return (
    <div className="p-4 sm:p-6 rounded-[22px] bg-white border border-slate-200 shadow-sm space-y-4 font-sans">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xs flex-shrink-0 ${tier.badgeBg} ${tier.badgeBorder}`}
          >
            <ActiveIcon className={`w-6 h-6 ${tier.iconColor}`} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Position Level {tier.level} of 5
              </span>
              {rankPosition !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black">
                  Rank #{rankPosition}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
              {tier.name}
            </h3>
            <p className="text-xs font-medium text-slate-500 break-words">
              {artistName ? `${artistName} • ` : ''}
              {tier.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 w-full sm:w-auto self-start sm:self-center flex-shrink-0">
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">{count}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              Events Done
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-200" />
          <div className="text-right">
            {nextTier ? (
              <>
                <div className="text-xs font-black text-sky-600 flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{eventsToNext} more</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                  to {nextTier.name}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs font-black text-emerald-600">Max Position</div>
                <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                  Top Tier Unlocked
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tier.barGradient} transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-semibold text-slate-400">
          <span>{tier.name} ({tier.rangeLabel})</span>
          <span>
            {nextTier ? `Next: ${nextTier.name} (${nextTier.rangeLabel})` : 'Highest Performer Honor Achieved'}
          </span>
        </div>
      </div>

      {/* All 5 Positions / Milestone Ladder */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
        {ARTIST_TIERS.map((t) => {
          const Icon = getTierIcon(t.level);
          const unlocked = count >= t.minEvents;
          const isCurrent = t.level === tier.level;

          return (
            <div
              key={t.level}
              className={`p-2.5 rounded-xl border transition-all ${
                isCurrent
                  ? `${t.badgeBg} ${t.badgeBorder} ring-2 ring-sky-500/15 shadow-xs`
                  : unlocked
                  ? 'bg-emerald-50/40 border-emerald-200/70'
                  : 'bg-slate-50/70 border-slate-200/70 opacity-65'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-3.5 h-3.5 ${unlocked ? t.iconColor : 'text-slate-400'}`} />
                {unlocked && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              </div>
              <div className="text-[11px] font-black text-slate-900 truncate">{t.name}</div>
              <div className="text-[10px] font-semibold text-slate-500">{t.rangeLabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
