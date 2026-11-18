"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useArtistAuth } from '../../lib/auth/authContext';
import { StatusBadge } from './StatusBadge';
import { artistService } from '../../services/artistService';
import { ArtistNotification } from '../../types/artist';
import { Menu, Bell, Check } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { artist } = useArtistAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<ArtistNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (artist?.id) {
      artistService.getNotifications(artist.id).then(setNotifications);
    }
  }, [artist?.id]);

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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 flex-shrink-0 font-sans shadow-xs">
      {/* Left: Mobile Drawer Trigger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center border border-slate-200"
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

      {/* Right: Status Badge, Notification Bell & Mini Avatar */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <StatusBadge status={artist?.verification_status || 'pending'} size="sm" showIcon={false} />

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 relative transition-colors flex items-center justify-center focus:outline-none shadow-xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl p-3 shadow-panel z-50 animate-in fade-in slide-in-from-top-2">
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

        {/* Quick Profile Avatar */}
        <Link
          href="/profile"
          className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 hover:border-sky-500 transition-colors flex-shrink-0 shadow-xs"
          title="Edit Profile"
        >
          <img
            src={artist?.profile_image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=200'}
            alt={artist?.name || 'Artist Avatar'}
            className="w-full h-full object-cover"
          />
        </Link>
      </div>
    </header>
  );
}
