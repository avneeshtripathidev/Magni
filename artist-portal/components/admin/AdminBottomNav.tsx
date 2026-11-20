"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CalendarCheck,
  Menu,
  X,
} from 'lucide-react';

interface AdminBottomNavProps {
  onOpenMenu: () => void;
  isMenuOpen?: boolean;
  pendingCount?: number;
}

export function AdminBottomNav({
  onOpenMenu,
  isMenuOpen = false,
  pendingCount = 0,
}: AdminBottomNavProps) {
  const pathname = usePathname();

  // Secondary admin routes that live inside the "Menu" drawer
  const isMenuRouteActive =
    pathname.startsWith('/admin/register-artist') ||
    pathname.startsWith('/admin/profiles') ||
    pathname.startsWith('/admin/access') ||
    pathname.startsWith('/admin/artist-clicks');

  const navItems = [
    {
      label: 'Overview',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/admin/dashboard',
    },
    {
      label: 'Artists',
      href: '/admin/artists',
      icon: Users,
      isActive: pathname === '/admin/artists',
    },
    {
      label: 'Verify',
      href: '/admin/verification',
      icon: ShieldCheck,
      isActive: pathname.startsWith('/admin/verification'),
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      label: 'Bookings',
      href: '/admin/bookings',
      icon: CalendarCheck,
      isActive: pathname.startsWith('/admin/bookings'),
    },
  ];

  return (
    <nav
      aria-label="Admin Mobile Navigation Bar"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-bottom shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center h-full relative transition-colors active:scale-95 touch-manipulation min-h-[48px] ${
                item.isActive ? 'text-sky-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    item.isActive ? 'scale-110 text-sky-600' : 'text-slate-500'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center px-1 shadow-xs animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight truncate max-w-full px-0.5 ${
                  item.isActive ? 'font-bold text-sky-600' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
              {item.isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-sky-600" />
              )}
            </Link>
          );
        })}

        {/* 5th Tab: "Menu" / Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className={`flex flex-col items-center justify-center h-full relative active:scale-95 touch-manipulation min-h-[48px] transition-colors ${
            isMenuOpen || isMenuRouteActive
              ? 'text-sky-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label={isMenuOpen ? 'Close Navigation Menu' : 'Open Full Admin Navigation Menu'}
        >
          <div className="relative">
            {isMenuOpen ? (
              <X className="w-5 h-5 text-sky-600 scale-110" />
            ) : (
              <Menu
                className={`w-5 h-5 transition-transform ${
                  isMenuRouteActive ? 'text-sky-600 scale-110' : 'text-slate-500'
                }`}
              />
            )}
          </div>
          <span
            className={`text-[10px] mt-1 tracking-tight ${
              isMenuOpen || isMenuRouteActive ? 'font-bold text-sky-600' : 'font-medium'
            }`}
          >
            Menu
          </span>
          {(isMenuOpen || isMenuRouteActive) && (
            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-sky-600" />
          )}
        </button>
      </div>
    </nav>
  );
}
