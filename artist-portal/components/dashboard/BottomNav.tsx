"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  User,
  Film,
  Menu,
} from 'lucide-react';

interface BottomNavProps {
  onOpenMenu: () => void;
  pendingBookingsCount?: number;
}

export function BottomNav({ onOpenMenu, pendingBookingsCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      label: 'Bookings',
      href: '/bookings',
      icon: CalendarCheck,
      isActive: pathname.startsWith('/bookings'),
      badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      isActive: pathname.startsWith('/profile'),
    },
    {
      label: 'Portfolio',
      href: '/portfolio',
      icon: Film,
      isActive: pathname.startsWith('/portfolio'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-bottom shadow-lg"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
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
                <Icon className={`w-5 h-5 transition-transform ${item.isActive ? 'scale-110 text-sky-600' : ''}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${item.isActive ? 'font-bold text-sky-600' : 'font-medium'}`}>
                {item.label}
              </span>
              {item.isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-sky-600" />
              )}
            </Link>
          );
        })}

        {/* 5th Tab: "More" Menu Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center h-full relative text-slate-500 hover:text-slate-900 active:scale-95 touch-manipulation min-h-[48px]"
          aria-label="Open More Options Menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
