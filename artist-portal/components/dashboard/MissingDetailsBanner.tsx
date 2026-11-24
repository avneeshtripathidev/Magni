"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArtistProfile } from '../../types/artist';
import { getMissingProfileSections } from '../../lib/profileCompletion';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface MissingDetailsBannerProps {
  artist: ArtistProfile | null;
  currentPage: 'profile' | 'portfolio' | 'verification';
}

export function MissingDetailsBanner({ artist, currentPage }: MissingDetailsBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!artist || dismissed) return null;

  // If artist is already approved, only show banner if explicitly coming from a review check
  if (artist.verification_status === 'approved') return null;

  const missingSections = getMissingProfileSections(artist);
  const currentMissing = missingSections.find((s) => s.id === currentPage);
  const nextMissing = missingSections.find((s) => s.id !== currentPage);

  if (currentMissing) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
        <div className="flex items-start gap-2.5 min-w-0">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-0.5">
            <p className="font-bold">Mandatory Details Required on this Page:</p>
            <p className="text-amber-800">{currentMissing.missingFields.join(' • ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
          <span className="text-[11px] font-bold text-amber-700 bg-white/80 border border-amber-200 px-3 py-1 rounded-full">
            Required *
          </span>
        </div>
      </div>
    );
  }

  if (nextMissing) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-900">
            <span className="font-bold">Section Complete!</span> Next, complete{' '}
            <span className="font-bold">{nextMissing.title}</span> ({nextMissing.missingFields.join(', ')}).
          </p>
        </div>
        <Link
          href={`${nextMissing.href}?complete=1`}
          className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-center flex-shrink-0"
        >
          <span>Continue to {nextMissing.title}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <p className="text-xs text-emerald-900">
          <span className="font-bold">All required details are complete!</span> Return to Overview to submit your profile for review.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-center flex-shrink-0"
      >
        <span>Go to Submit</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
