export interface ArtistTier {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  tagline: string;
  minEvents: number;
  maxEvents: number | null; // null means unlimited (51+)
  rangeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barGradient: string;
  iconColor: string;
}

export const ARTIST_TIERS: ArtistTier[] = [
  {
    level: 1,
    name: 'Rising Talent',
    tagline: 'Building Stage Presence',
    minEvents: 0,
    maxEvents: 5,
    rangeLabel: '0–5 Events',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    barGradient: 'from-slate-400 to-slate-500',
    iconColor: 'text-slate-500',
  },
  {
    level: 2,
    name: 'Star Performer',
    tagline: 'Trusted Live Artist',
    minEvents: 6,
    maxEvents: 10,
    rangeLabel: '6–10 Events',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    barGradient: 'from-sky-400 to-sky-600',
    iconColor: 'text-sky-600',
  },
  {
    level: 3,
    name: 'Elite Entertainer',
    tagline: 'High-Demand Performer',
    minEvents: 11,
    maxEvents: 25,
    rangeLabel: '11–25 Events',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    barGradient: 'from-indigo-500 to-violet-600',
    iconColor: 'text-indigo-600',
  },
  {
    level: 4,
    name: 'Premier Headliner',
    tagline: 'Signature Stage Act',
    minEvents: 26,
    maxEvents: 50,
    rangeLabel: '26–50 Events',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    barGradient: 'from-amber-400 to-orange-500',
    iconColor: 'text-amber-500',
  },
  {
    level: 5,
    name: 'Grand Maestro',
    tagline: 'Top-Ranked Legend',
    minEvents: 51,
    maxEvents: null,
    rangeLabel: '51+ Events',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    barGradient: 'from-emerald-500 to-teal-600',
    iconColor: 'text-emerald-600',
  },
];

export interface ArtistTierProgress {
  tier: ArtistTier;
  nextTier: ArtistTier | null;
  completedEvents: number;
  eventsToNext: number;
  progressPercent: number;
}

export function getArtistTierProgress(completedEventsRaw?: number | null): ArtistTierProgress {
  const completedEvents = Math.max(0, Number(completedEventsRaw) || 0);

  let currentIndex = 0;
  for (let i = ARTIST_TIERS.length - 1; i >= 0; i--) {
    if (completedEvents >= ARTIST_TIERS[i].minEvents) {
      currentIndex = i;
      break;
    }
  }

  const tier = ARTIST_TIERS[currentIndex];
  const nextTier = currentIndex < ARTIST_TIERS.length - 1 ? ARTIST_TIERS[currentIndex + 1] : null;

  if (!nextTier) {
    return {
      tier,
      nextTier: null,
      completedEvents,
      eventsToNext: 0,
      progressPercent: 100,
    };
  }

  const span = Math.max(1, nextTier.minEvents - tier.minEvents);
  const gained = Math.max(0, completedEvents - tier.minEvents);
  const progressPercent = Math.min(100, Math.round((gained / span) * 100));
  const eventsToNext = Math.max(0, nextTier.minEvents - completedEvents);

  return {
    tier,
    nextTier,
    completedEvents,
    eventsToNext,
    progressPercent,
  };
}

/**
 * Computes 1-based leaderboard rank (#1, #2, #3...) for a list of artists
 * sorted by their completed events count (highest first).
 */
export function getArtistRankMap<T extends { id: string; successful_bookings?: number }>(
  artists: T[],
  bonusByArtistName?: Record<string, number>
): Record<string, { rank: number; totalCompleted: number }> {
  const scored = artists.map((a: any) => {
    const base = Number(a.successful_bookings) || 0;
    const bonus = bonusByArtistName ? bonusByArtistName[(a.name || '').toLowerCase()] || 0 : 0;
    return {
      id: a.id,
      totalCompleted: base + bonus,
    };
  });

  scored.sort((a, b) => b.totalCompleted - a.totalCompleted);

  const result: Record<string, { rank: number; totalCompleted: number }> = {};
  scored.forEach((item, index) => {
    result[item.id] = {
      rank: index + 1,
      totalCompleted: item.totalCompleted,
    };
  });
  return result;
}
