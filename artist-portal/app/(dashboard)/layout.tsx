
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useArtistAuth } from '../../lib/auth/authContext';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { Topbar } from '../../components/dashboard/Topbar';
import { BottomNav } from '../../components/dashboard/BottomNav';
import { Loader2, ArrowRight } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isOnboardingComplete, hasSkippedOnboarding, profileCompletion, onboardingStep } = useArtistAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (typeof window !== 'undefined') {
          window.location.replace('/login?logged_out=true');
        } else {
          router.replace('/login');
        }
      } else if (!isOnboardingComplete && !hasSkippedOnboarding) {
        router.replace('/onboarding');
      }
    }
  }, [user, loading, isOnboardingComplete, hasSkippedOnboarding, router]);

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

  if (!isOnboardingComplete && !hasSkippedOnboarding) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 p-4 text-center font-sans">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Redirecting to Complete Onboarding...
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
        <main className="p-4 sm:p-6 lg:p-8 xl:p-10 pb-24 lg:pb-10 max-w-7xl mx-auto w-full flex-1 min-w-0 overflow-x-hidden space-y-6">
          {!isOnboardingComplete && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0 font-black text-sm">
                  {profileCompletion}%
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>Incomplete Artist Profile</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                      Pending Verification
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Your profile is {profileCompletion}% complete. Complete all 4 onboarding steps to get verified by directors and go live for client bookings.
                  </p>
                </div>
              </div>
              <Link
                href={`/onboarding?step=${onboardingStep}`}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98] transition-all"
              >
                <span>Resume Onboarding (Step {onboardingStep})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* 4. Native Mobile Bottom Navigation Bar */}
      <BottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
    </div>
  );
}
