import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { ArtistProfile } from '../../types/artist';

interface CompletionMeterProps {
  artist: ArtistProfile | null;
}

export function CompletionMeter({ artist }: CompletionMeterProps) {
  const checklist = [
    { label: 'Basic Info & Location', done: !!(artist?.name && (artist?.phone_no || '').replace(/\D/g, '').length >= 7 && artist?.city), link: '/profile?complete=1' },
    { label: 'Bio & Experience', done: !!(artist?.bio && artist.bio.trim().length >= 20), link: '/profile?complete=1' },
    { label: 'Repertoire & Genres', done: !!(artist?.category && artist?.genres?.length), link: '/profile?complete=1' },
    { label: 'Stage Photos', done: !!(artist?.profile_image_url || artist?.cover_image_url), link: '/portfolio?complete=1' },
    { label: 'Live Showreels', done: !!(artist?.video_url || artist?.cloudflare_video_url || artist?.youtube_links?.length), link: '/portfolio?complete=1' },
    { label: 'KYC Document', done: !!(artist?.verification_documents?.id_document_url), link: '/verification?complete=1' },
  ];

  const completedCount = checklist.filter((c) => c.done).length;
  const completion = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-xs sm:text-sm font-bold text-slate-900">Profile Setup</span>
          <span className="text-[11px] text-slate-500">
            ({checklist.filter(c => c.done).length}/{checklist.length} steps complete)
          </span>
        </div>
        <span className="text-xs font-extrabold text-sky-600">{completion}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-500 ease-out shadow-xs"
          style={{ width: `${completion}%` }}
        />
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
        {checklist.map((item) => (
          <Link
            key={item.label}
            href={item.link}
            className={`p-2 rounded-xl border text-[11px] font-medium transition-all flex items-center justify-between gap-1.5 min-h-[38px] ${
              item.done
                ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                : 'bg-slate-50 border-dashed border-slate-200 text-slate-500 hover:border-sky-300 hover:text-slate-900'
            }`}
          >
            <span className="truncate">{item.label}</span>
            {item.done ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
