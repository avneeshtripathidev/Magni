"use client";

import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';

export const DEFAULT_LOCATIONS = [
  'Delhi NCR',
  'Mumbai',
  'Bengaluru',
  'Gurgaon',
  'Jaipur',
  'Udaipur',
  'Goa',
  'Chandigarh',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Chennai',
];

const LOCATION_ALIASES: Record<string, string[]> = {
  'delhi ncr': ['delhi', 'new delhi', 'south delhi', 'delhi ncr', 'delhi aerocity', 'ncr', 'noida', 'gurgaon', 'gurugram'],
  'delhi': ['delhi', 'new delhi', 'south delhi', 'delhi ncr', 'delhi aerocity'],
  'mumbai': ['mumbai', 'south mumbai', 'navi mumbai', 'bandra', 'colaba'],
  'bengaluru': ['bengaluru', 'bangalore'],
  'gurgaon': ['gurgaon', 'gurugram'],
};

/**
 * Smart location matcher so selecting "Delhi NCR" matches "Delhi", "New Delhi", "South Delhi", "Gurgaon", etc.
 */
export function matchesLocationFilter(
  selectedLocation: string,
  city?: string | null,
  state?: string | null,
  venue?: string | null
): boolean {
  if (!selectedLocation || selectedLocation === 'all') return true;

  const target = selectedLocation.trim().toLowerCase();
  const haystack = [city, state, venue].filter(Boolean).join(' ').toLowerCase();
  if (!haystack) return false;

  const aliases = LOCATION_ALIASES[target];
  if (aliases) {
    return aliases.some((alias) => haystack.includes(alias));
  }

  return haystack.includes(target);
}

interface LocationFilterProps {
  value: string;
  onChange: (city: string) => void;
  availableCities?: (string | undefined | null)[];
  compact?: boolean;
  className?: string;
}

export function LocationFilter({
  value,
  onChange,
  availableCities = [],
  compact = false,
  className = '',
}: LocationFilterProps) {
  // Merge default major cities with any unique cities present in live records
  const mergedCities = React.useMemo(() => {
    const seen = new Set<string>(DEFAULT_LOCATIONS.map((c) => c.toLowerCase()));
    const list = [...DEFAULT_LOCATIONS];

    availableCities.forEach((raw) => {
      if (!raw) return;
      const clean = raw.split(',')[0].trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        list.push(clean);
      }
    });

    return list;
  }, [availableCities]);

  return (
    <div
      className={`relative inline-flex items-center bg-white border rounded-[18px] shadow-xs transition-all ${
        value !== 'all'
          ? 'border-sky-300 ring-2 ring-sky-500/10'
          : 'border-slate-200 hover:border-slate-300'
      } ${compact ? 'h-9 px-2.5' : 'h-10 px-3.5'} ${className}`}
    >
      <MapPin
        className={`flex-shrink-0 mr-1.5 ${
          value !== 'all' ? 'text-sky-600' : 'text-slate-400'
        } ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filter by location"
        className={`appearance-none bg-transparent border-none pr-6 font-bold focus:outline-none cursor-pointer ${
          value !== 'all' ? 'text-sky-700' : 'text-slate-700'
        } ${compact ? 'text-[11px]' : 'text-xs'}`}
      >
        <option value="all" className="text-slate-900">
          All Locations
        </option>
        {mergedCities.map((city) => (
          <option key={city} value={city} className="text-slate-900">
            {city}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5" />
    </div>
  );
}
