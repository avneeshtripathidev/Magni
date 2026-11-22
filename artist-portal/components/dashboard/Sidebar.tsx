"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useArtistAuth } from '../../lib/auth/authContext';
import {
  LayoutDashboard,
  User,
  Film,
  Music2,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  Settings,
  LogOut,
  X,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { artist, signOut } = useArtistAuth();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Profile: true,
  });

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const navSections = [
    {
      title: 'Main Menu',
      items: [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Live Bookings', href: '/bookings', icon: CalendarCheck },
        { name: 'Wedding Inquiries', href: '/wedding-invitations', icon: Sparkles },
        { name: 'Payouts & Earnings', href: '/payments', icon: CreditCard },
      ],
    },
    {
      title: 'Performer Profile',
      items: [
        { name: 'Profile & Logistics', href: '/profile', icon: User },
        { name: 'Portfolio & Reels', href: '/portfolio', icon: Film },
        { name: 'Audio Tracks', href: '/media', icon: Music2 },
      ],
    },
    {
      title: 'Trust & Settings',
      items: [
        { name: 'ID Verification', href: '/verification', icon: ShieldCheck },
        { name: 'Account Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  const publicUrl = artist?.slug ? `https://magnevents.in/artist/${artist.slug}` : null;
  const isVerified = artist?.verification_status === 'approved';

  return (
    <div className="flex flex-col h-full sidebar-dark border-r border-white/5 overflow-y-auto overscroll-contain select-none font-sans text-slate-200">
      {/* 1. Brand Logo Header (matching admin.magnevents.in) */}
      <div className="px-6 py-7 flex-shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            onClick={onClose}
            className="flex items-center gap-3 group focus:outline-none"
          >
            {/* White Squircle Brand Card */}
            <div className="flex-shrink-0 h-10 w-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md border border-white/20">
              <img
                src="/logo.webp"
                alt="Magnevents Logo"
                width={36}
                height={36}
                className="h-full w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black text-xl tracking-tight leading-none">
                Magnevents
              </span>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em] mt-1">
                Artist Portal
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5 min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Navigation Sections (exact Admin Portal nav styling) */}
      <nav className="px-3 space-y-6 flex-1 pt-4 pb-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                {section.title}
              </span>
            </div>

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] transition-all group ${
                      isActive
                        ? 'bg-white/10 text-white font-bold shadow-lg border border-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                      ) : null}
                      <Icon
                        size={17}
                        className={`transition-colors ${
                          isActive
                            ? 'text-sky-400'
                            : 'text-white/40 group-hover:text-white/80'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 3. Footer: Artist Profile Card & Logout (matching admin-portal) */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/15">
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs border border-white/10 shadow-lg overflow-hidden flex-shrink-0">
              {artist?.profile_image_url ? (
                <img
                  src={artist.profile_image_url}
                  alt={artist?.name || 'Artist'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(artist?.name || 'A')[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-white truncate leading-tight mb-1">
                {artist?.stage_name || artist?.name || 'Performer'}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase">
                  {isVerified ? 'Verified & Live' : (artist?.category || 'Performer')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-2">
                <ExternalLink size={13} className="text-sky-400" />
                <span>Public Listing</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Live
              </span>
            </a>
          )}

          <button
            onClick={() => {
              if (onClose) onClose();
              signOut();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-white/40 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all uppercase tracking-widest cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="text-center pt-3 text-[11px] text-white/20 font-bold tracking-widest uppercase">
          v0.1.2
        </div>
      </div>
    </div>
  );
}
