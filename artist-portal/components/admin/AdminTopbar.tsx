"use client";

import React from 'react';
import Link from 'next/link';
import { Menu, UserPlus } from 'lucide-react';

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  return (
    <header className="lg:hidden h-14 border-b border-slate-200 bg-white px-3 sm:px-4 flex items-center justify-between sticky top-0 z-20 font-sans shadow-xs">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
          aria-label="Open Admin Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-extrabold text-slate-900 tracking-tight">Magnevents Admin</span>
      </div>

      <Link
        href="/admin/register-artist"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all"
        title="Register new artist"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>+ Artist</span>
      </Link>
    </header>
  );
}
