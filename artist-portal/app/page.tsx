"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useArtistAuth } from '../lib/auth/authContext';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Mic2,
  CheckCircle2,
  Music,
  MapPin,
  Star,
  Award,
  Clock,
  Lock,
  Radio,
} from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'Create Your Profile',
    desc: 'Sign up in 30 seconds and upload your cover photo, stage photos, live videos & pricing.',
  },
  {
    num: '02',
    title: 'Get Verified Fast',
    desc: 'Quick Directorate check activates your verified listing across 230+ Indian cities.',
  },
  {
    num: '03',
    title: 'Perform & Get Paid',
    desc: 'Accept direct wedding & corporate inquiries with 0% broker fee and escrow payouts.',
  },
];

export default function HomePage() {
  const { user, loading, signInWithGoogle } = useArtistAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col relative overflow-x-hidden font-sans">
      {/* Subtle Ambient Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-[380px] h-[380px] rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      {/* Minimal Sticky Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1.5 flex-shrink-0">
              <img
                src="/logo.webp"
                alt="Magnevents Logo"
                width={32}
                height={32}
                className="h-full w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <span className="text-base font-black tracking-tight text-slate-900 block leading-none truncate">
                Magne<span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">vents</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 block mt-0.5 truncate">
                Performer Suite
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-xl hover:bg-slate-100 whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 inline-flex items-center gap-1.5 transition-all active:scale-[0.98] whitespace-nowrap"
            >
              <span>Join as Performer</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* SECTION 1: HERO (Screen 1) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[calc(100vh-4rem)] py-10 sm:py-14 flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Copy & Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-xs text-[11px] font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>India&apos;s Verified Live Performer Ecosystem</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.06]">
                Perform Live.{' '}
                <span className="block bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                  Get Booked Directly.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Direct client inquiries for weddings, corporate galas, and private concerts across India —{' '}
                <strong className="text-slate-900">0% broker commission</strong> and{' '}
                <strong className="text-slate-900">100% escrow payout protection</strong>.
              </p>

              {/* Primary CTA Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-1">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Mic2 className="w-4 h-4" />
                  <span>Create Performer Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => signInWithGoogle('/onboarding')}
                  className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-sm inline-flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Already registered?{' '}
                <Link href="/login" className="font-bold text-sky-600 hover:text-sky-700 hover:underline">
                  Sign in to your Dashboard →
                </Link>
              </div>

              {/* 3 Compact Trust Numbers */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-black text-slate-900">0%</div>
                  <div className="text-[11px] font-semibold text-slate-500">Broker Commission</div>
                </div>
                <div className="text-center lg:text-left border-x border-slate-200/80 px-2">
                  <div className="text-xl sm:text-2xl font-black text-slate-900">230+</div>
                  <div className="text-[11px] font-semibold text-slate-500">Indian Cities</div>
                </div>
                <div className="text-center lg:text-left pl-1">
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">100%</div>
                  <div className="text-[11px] font-semibold text-slate-500">Escrow Protected</div>
                </div>
              </div>
            </div>

            {/* Right Executive Suite Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-tr from-sky-500/20 via-indigo-500/15 to-emerald-400/20 rounded-[32px] blur-xl" />

                <div className="relative sidebar-dark rounded-[28px] border border-white/10 shadow-2xl p-5 sm:p-6 text-white space-y-4">
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center font-black text-sm text-white shadow-lg flex-shrink-0">
                        <Music className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-white truncate">
                            Verified Performer Suite
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        </div>
                        <span className="text-[11px] text-slate-300 block truncate">
                          Live Catalog • magnevents.in
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-300 text-[11px] font-black flex-shrink-0">
                      <Star className="w-3 h-3 fill-amber-300" />
                      <span>4.95</span>
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Direct Booking Inquiry
                      </span>
                      <span className="text-[11px] font-mono text-white/50">#MAG-8821</span>
                    </div>

                    <div>
                      <div className="text-sm font-black text-white">
                        Luxury Wedding Sangeet Live
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-400" />
                          Delhi NCR • 250 Guests
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          90 Mins Set
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold block">
                          Guaranteed Fee
                        </span>
                        <span className="text-lg font-black text-white">₹55,000</span>
                      </div>
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[11px] font-extrabold shadow-sm">
                        Advance in Escrow
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-sky-300 text-[11px] font-extrabold">
                        <Award className="w-3.5 h-3.5" />
                        <span>Performer Tiers</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Climb ranks and unlock featured catalog visibility.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-extrabold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Fast Payouts</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Direct IMPS &amp; UPI settlement after live check-in.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: SIMPLE 3-STEP HOW IT WORKS + CTA (Screen 2) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8 border-t border-slate-200/70">
          <div className="text-center max-w-xl mx-auto pt-6">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-600">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Go Live on Magnevents in 3 Simple Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-xs shadow-sm">
                  {step.num}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="sidebar-dark rounded-[28px] p-7 sm:p-9 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-white/10">
            <div className="text-center md:text-left max-w-xl space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Ready to Take the Main Stage?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Join India&apos;s verified performer roster today and start receiving direct bookings.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-shrink-0">
              <Link
                href="/register"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
              >
                <span>Join as Performer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center transition-all"
              >
                Performer Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
