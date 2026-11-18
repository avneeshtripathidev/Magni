"use client";

import React from 'react';
import { Menu } from 'lucide-react';

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  return (
    <header className="lg:hidden h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between sticky top-0 z-20 font-sans">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 min-h-[38px] min-w-[38px] flex items-center justify-center"
          aria-label="Open Admin Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-extrabold text-slate-900 tracking-tight">Magnevents Admin</span>
      </div>
    </header>
  );
}
