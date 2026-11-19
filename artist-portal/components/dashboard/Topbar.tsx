"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useArtistAuth } from '../../lib/auth/authContext';
import { StatusBadge } from './StatusBadge';
import { artistService } from '../../services/artistService';
import { ArtistNotification } from '../../types/artist';
import {
  Menu,
  Bell,
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  LogOut,
  X,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Film,
  CreditCard,
  Settings,
  Music2,
  Sparkles,
} from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { artist, user, signOut } = useArtistAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<ArtistNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (artist?.id) {
      artistService.getNotifications(artist.id).then(setNotifications);
    }
  }, [artist?.id]);

  // Close menus on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setShowNotifications(false);
    setShowProfileMenu(false);
  }, [pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    notifications.forEach((n) => {
      if (!n.is_read) artistService.markNotificationRead(n.id);
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/profile') return 'Profile & Logistics';
    if (pathname === '/portfolio') return 'Portfolio & Showreels';
    if (pathname === '/media') return 'Audio Tracks';
    if (pathname === '/bookings') return 'Bookings & Gigs';
    if (pathname === '/payments') return 'Earnings & Payouts';
    if (pathname === '/verification') return 'ID Verification';
    if (pathname === '/settings') return 'Account Settings';
    return 'Artist Portal';
  };

  const displayName = artist?.stage_name || artist?.name || user?.user_metadata?.full_name || 'Performer';
  const legalName = artist?.name && artist?.name !== artist?.stage_name ? artist.name : null;
  const userEmail = artist?.email || user?.email || '';
  const userPhone = artist?.phone_no || user?.user_metadata?.phone || '';
  const userCity = artist?.city || 'Delhi NCR';
  const userCategory = artist?.category || 'Live Singer';
  const isLive = Boolean(artist?.is_live || artist?.verification_status === 'approved');
  const publicUrl = artist?.slug ? `https://magnevents.in/artist/${artist.slug}` : null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-30 flex-shrink-0 font-sans shadow-xs max-w-full">
      {/* Left: Mobile Drawer Trigger & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center border border-slate-200 flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
            {getPageTitle()}
          </span>
          {artist?.category && (
            <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-700 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 truncate max-w-[140px]">
              {artist.category}
            </span>
          )}
        </div>
      </div>

      {/* Right: Status Badge, Notification Bell & Profile Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        <div className="hidden min-[360px]:block">
          <StatusBadge status={isLive ? 'approved' : (artist?.verification_status || 'approved')} size="sm" showIcon={false} />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showProfileMenu) setShowProfileMenu(false);
            }}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 relative transition-colors flex items-center justify-center focus:outline-none shadow-xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[68px] sm:top-auto sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-24px)] bg-white border border-slate-200 rounded-2xl p-3 shadow-panel z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-semibold text-sky-600 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200/80"
                    >
                      <span className="font-bold text-slate-900 block text-[11px]">{n.title}</span>
                      <span className="text-slate-500 text-[10px] block mt-0.5 leading-snug">{n.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Interactive Profile Details Popover */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              if (showNotifications) setShowNotifications(false);
            }}
            className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all flex-shrink-0 shadow-xs bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer active:scale-95"
            aria-label="Open Profile Details"
            title="Open Profile Details"
          >
            {artist?.profile_image_url ? (
              <img
                src={artist.profile_image_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{(displayName || 'A')[0].toUpperCase()}</span>
            )}
          </button>

          {/* Mobile Backdrop Overlay */}
          {showProfileMenu && (
            <div
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-200"
              onClick={() => setShowProfileMenu(false)}
              aria-hidden="true"
            />
          )}

          {/* Profile Details Dropdown / Popover Modal */}
          {showProfileMenu && (
            <div
              className="fixed sm:absolute right-3 sm:right-0 top-[68px] sm:top-full sm:mt-2 w-[calc(100vw-24px)] max-w-[340px] sm:w-[340px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              role="dialog"
              aria-modal="true"
              aria-label="User Profile Details"
            >
              {/* Profile Card Header */}
              <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(false)}
                  className="absolute top-3 right-3 p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close Profile Details"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20 bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md">
                      {artist?.profile_image_url ? (
                        <img
                          src={artist.profile_image_url}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{(displayName || 'A')[0].toUpperCase()}</span>
                      )}
                    </div>
                    {/* Live status dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                        isLive ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    >
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-white text-sm tracking-tight truncate max-w-[170px]">
                        {displayName}
                      </h4>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    </div>

                    {legalName && (
                      <p className="text-[11px] text-white/60 truncate mt-0.5">
                        Legal: {legalName}
                      </p>
                    )}

                    <p className="text-[11px] font-semibold text-sky-400 truncate mt-0.5">
                      {userCategory} • {userCity}
                    </p>
                  </div>
                </div>

                {/* Profile Contact Details Pills */}
                <div className="mt-3.5 pt-3 border-t border-white/10 space-y-1.5 text-[11px]">
                  {userEmail && (
                    <div className="flex items-center gap-2 text-white/80 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span className="truncate">{userEmail}</span>
                    </div>
                  )}
                  {userPhone && (
                    <div className="flex items-center gap-2 text-white/80 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{userPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Navigation Menu */}
              <div className="p-2 space-y-0.5 bg-slate-50/50">
                <Link
                  href="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/profile'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-sky-600 flex-shrink-0" />
                    <div>
                      <span className="block leading-tight">View & Edit Profile</span>
                      <span className="block text-[10px] text-slate-600 font-normal mt-0.5">
                        Stage identity, bio & logistics
                      </span>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/portfolio"
                  onClick={() => setShowProfileMenu(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/portfolio'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Film className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div>
                      <span className="block leading-tight">Photos & Showreels</span>
                      <span className="block text-[10px] text-slate-600 font-normal mt-0.5">
                        Gallery photos & performance videos
                      </span>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/bookings"
                  onClick={() => setShowProfileMenu(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/bookings'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="block leading-tight">Bookings & Gigs</span>
                      <span className="block text-[10px] text-slate-600 font-normal mt-0.5">
                        Client requests & scheduled events
                      </span>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/payments"
                  onClick={() => setShowProfileMenu(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/payments'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <span className="block leading-tight">Earnings & Payouts</span>
                      <span className="block text-[10px] text-slate-600 font-normal mt-0.5">
                        Bank account & settlement history
                      </span>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/verification"
                  onClick={() => setShowProfileMenu(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/verification'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-violet-600 flex-shrink-0" />
                    <div>
                      <span className="block leading-tight">ID Verification (KYC)</span>
                      <span className="block text-[10px] text-slate-600 font-normal mt-0.5">
                        Aadhaar, PAN & Performer badge
                      </span>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === '/settings'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    <div>
                      <span className="block leading-tight">Account Settings</span>
                      <span className="block text-[10px] text-slate-600 font-normal mt-0.5">
                        Password, security & alerts
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Public Link & Sign Out Footer */}
              <div className="p-3 border-t border-slate-200/80 bg-white space-y-2">
                {publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors border border-sky-200/60"
                  >
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Public Live Listing
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      Live
                    </span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    signOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/80 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
