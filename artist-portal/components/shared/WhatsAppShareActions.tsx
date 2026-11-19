"use client";

import React, { useState } from 'react';
import { ArtistProfile } from '../../types/artist';
import {
  buildWhatsAppShareUrl,
  copyArtistWhatsAppDetails,
} from '../../lib/whatsappArtistShare';
import { Check, Copy } from 'lucide-react';

interface WhatsAppShareActionsProps {
  artist: ArtistProfile;
  rank?: number;
  completedEvents?: number;
  /**
   * - 'compact': Small icon/pill buttons ideal for artist cards & table rows
   * - 'grid': Full-width 50/50 responsive grid buttons for cards
   * - 'header-dark': Frosted dark-header buttons for the Executive Navy modal header
   * - 'full': Labeled buttons for modals, dossiers, and profile headers
   */
  variant?: 'compact' | 'header-dark' | 'full' | 'grid';
  className?: string;
}

function WhatsAppIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.49 0 .14 5.35.14 11.92c0 2.1.55 4.15 1.59 5.96L0 24l6.29-1.65a11.89 11.89 0 0 0 5.77 1.47h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.18-3.47-8.42ZM12.07 21.8h-.01a9.87 9.87 0 0 1-5.04-1.38l-.36-.21-3.73.98 1-3.64-.24-.37a9.85 9.85 0 0 1-1.52-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.45-4.44 9.87-9.9 9.87Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.21 5.09 4.5.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

export function WhatsAppShareActions({
  artist,
  rank,
  completedEvents,
  variant = 'compact',
  className = '',
}: WhatsAppShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const res = await copyArtistWhatsAppDetails(artist, {
      rank,
      completedEvents,
    });
    if (res.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSendWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = buildWhatsAppShareUrl(artist, { rank, completedEvents });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'header-dark') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy all artist details for WhatsApp"
          className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all border ${
            copied
              ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
              : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">Copy Details</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSendWhatsApp}
          title="Send all artist details on WhatsApp"
          className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
        >
          <WhatsAppIcon className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Send WP</span>
        </button>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy all artist details formatted for WhatsApp"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all border shadow-xs ${
            copied
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Details Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy WP Details</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSendWhatsApp}
          title="Open WhatsApp with all artist details ready to send"
          className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all"
        >
          <WhatsAppIcon className="w-3.5 h-3.5" />
          <span>Send on WhatsApp</span>
        </button>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-2 gap-1 sm:gap-1.5 w-full ${className}`}>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy all artist details for WhatsApp"
          className={`h-7 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold inline-flex items-center justify-center gap-1 border transition-all ${
            copied
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500" />
              <span>Copy</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSendWhatsApp}
          title="Send all artist details on WhatsApp"
          className="h-7 px-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition-all"
        >
          <WhatsAppIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span>WP</span>
        </button>
      </div>
    );
  }

  // Default: 'compact' — small, static buttons for cards & table rows
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleCopy}
        title="Copy all artist details for WhatsApp"
        className={`h-7 px-2 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 border ${
          copied
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3 text-slate-400" />
            <span>Copy</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleSendWhatsApp}
        title="Send all artist details on WhatsApp"
        className="h-7 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
      >
        <WhatsAppIcon className="w-3 h-3" />
        <span>WP</span>
      </button>
    </div>
  );
}
