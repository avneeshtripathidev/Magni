"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useArtistAuth } from '../../lib/auth/authContext';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { Topbar } from '../../components/dashboard/Topbar';
import { BottomNav } from '../../components/dashboard/BottomNav';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useArtistAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login?logged_out=true');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Loading Artist Portal...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 p-4 text-center font-sans">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Redirecting to Sign In...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col overflow-x-hidden font-sans">
      {/* 1. Desktop Fixed Sidebar — 240px matching admin.magnevents.in */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[240px] flex-col sidebar-dark border-r border-white/5 h-screen">
        <Sidebar />
      </aside>

      {/* 2. Mobile Slide-out Drawer & Overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-visibility duration-300 ${
          mobileMenuOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
        }`}
      >
        <div
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        <div
          className={`fixed inset-y-0 left-0 w-[260px] max-w-[85vw] sidebar-dark shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onClose={() => setMobileMenuOpen(false)} />
        </div>
      </div>

      {/* 3. Main Content Area — Offset lg:pl-[240px] matching admin.magnevents.in */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen lg:pl-[240px] overflow-x-hidden relative bg-[#F8FAFC]">
        {/* Mobile-only Header (Desktop starts clean right at the page heading) */}
        <div className="lg:hidden">
          <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        </div>

        {/* Main Content Canvas */}
        <main className="p-4 sm:p-6 lg:p-8 xl:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* 4. Native Mobile Bottom Navigation Bar */}
      <BottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
    </div>
  );
}
