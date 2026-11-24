"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '../../lib/auth/adminAuthContext';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Users, 
  CalendarCheck, 
  LogOut, 
  ExternalLink,
  X,
  Mic2,
  Sparkles,
  IdCard,
  UserPlus,
  Lock,
  MousePointerClick,
  Send
} from 'lucide-react';

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { admin, logoutAdmin, artists } = useAdminAuth();
  const router = useRouter();

  const pendingCount = artists.filter(
    (a) => a.verification_status === 'pending' || a.verification_status === 'under_review'
  ).length;

  const liveCount = artists.filter(
    (a) => Boolean(a.is_live) && a.verification_status === 'approved'
  ).length;

  const navSections = [
    {
      title: 'Performer Oversight',
      items: [
        {
          name: 'Overview & Metrics',
          href: '/admin/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Artist Registration',
          href: '/admin/register-artist',
          icon: UserPlus,
        },
        {
          name: 'Artist Onboard',
          href: '/admin/onboarding',
          icon: Send,
          badge: 18,
        },
        {
          name: 'Verification Queue',
          href: '/admin/verification',
          icon: ShieldCheck,
          badge: pendingCount > 0 ? pendingCount : undefined,
          badgePulse: true,
        },
        {
          name: 'Artist Clicks & IPs',
          href: '/admin/artist-clicks',
          icon: MousePointerClick,
        },
        {
          name: 'Performer Directory',
          href: '/admin/artists',
          icon: Users,
          count: liveCount,
        },
        {
          name: 'Performer Profiles',
          href: '/admin/profiles',
          icon: IdCard,
          count: artists.length,
        },
        {
          name: 'Booking Inquiries',
          href: '/admin/bookings',
          icon: CalendarCheck,
        },
        {
          name: 'Wedding Inquiries',
          href: '/admin/wedding-invitations',
          icon: Sparkles,
        },
        {
          name: 'Admin Access (3 Max)',
          href: '/admin/access',
          icon: Lock,
        },
      ]
    }
  ];

  const handleSignOut = () => {
    if (onClose) onClose();
    logoutAdmin();
    router.push('/admin/login');
  };

  return (
    <div className="flex flex-col h-full sidebar-dark border-r border-white/5 overflow-y-auto overscroll-contain select-none font-sans">
      {/* 1. Header / Logo matching admin-portal */}
      <div className="px-5 py-6 flex-shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" onClick={onClose} className="flex items-center gap-3 group min-w-0">
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
              <span className="text-white font-black text-xl tracking-tighter leading-none">Magnevents</span>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em] mt-1">
                Artist Director
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5 min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Close Sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Navigation Sections */}
      <nav className="px-3 space-y-6 flex-1 pt-4 pb-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
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
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white font-bold shadow-lg border border-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={17}
                        className={isActive ? 'text-indigo-400' : 'text-white/40'}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-rose-400 animate-pulse">
                        {item.badge}
                      </span>
                    )}

                    {item.count !== undefined && (
                      <span className="bg-white/10 text-white/60 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 3. User Card & Footer Actions matching admin-portal */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/15">
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs border border-white/10 shadow-lg flex-shrink-0">
              AD
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-white truncate leading-tight mb-1">
                {admin?.name || 'Artist Director'}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black tracking-wider text-white/40 uppercase">
                  Super Admin
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-2">
              <Mic2 size={14} className="text-indigo-400" />
              <span>Performer Portal</span>
            </div>
            <ExternalLink size={12} className="text-white/40" />
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-white/50 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all uppercase tracking-widest"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="text-center mt-3 text-[10px] text-white/20 font-bold tracking-widest uppercase">
          v1.1.0 • Magnevents
        </div>
      </div>
    </div>
  );
}
