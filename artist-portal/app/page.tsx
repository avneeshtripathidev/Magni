"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useArtistAuth } from '../lib/auth/authContext';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Mic2, 
  Zap, 
  CheckCircle2, 
  Music,
  IndianRupee,
} from 'lucide-react';

export default function HomePage() {
  const { user, loading, signInWithGoogle, loginAsDemoArtist } = useArtistAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleAdminBypass = () => {
    window.location.href = '/admin/dashboard?bypass=director';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Admin Portal Ambient Glow Blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/20 rounded-full animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-purple-200/20 rounded-full animate-pulse delay-700 pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] bg-cyan-100/20 rounded-full animate-pulse delay-1000 pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between relative z-10 border-b border-slate-200 bg-white/60 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 flex items-center justify-center">
            <img
              src="/logo.webp"
              alt="Magnevents Logo"
              width={56}
              height={36}
              className="h-full w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-none">Magnevents</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Performer Suite</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="btn-primary py-2 px-4 text-xs"
          >
            Join as Performer
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-2xl mx-auto px-6 py-12 text-center relative z-10 my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 mb-5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>India&apos;s Live Performer Ecosystem</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
          Perform Live. <br />
          <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">Get Booked Directly.</span>
        </h1>

        <p className="text-sm text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed font-normal">
          Direct client booking inquiries for weddings, corporate galas, and private events with 0% broker commission and 100% payout protection.
        </p>

        {/* Primary Auth Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto mb-8">
          <button
            onClick={() => signInWithGoogle()}
            className="w-full sm:w-auto flex-1 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
            <span>Google Login</span>
          </button>

          <Link
            href="/register"
            className="btn-secondary w-full sm:w-auto flex-1 py-2.5 px-5"
          >
            <span>Email Sign Up</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Fast Access Bypasses */}
        <div className="pt-6 border-t border-slate-200 max-w-sm mx-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>Fast Access / Testing Bypasses</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={loginAsDemoArtist}
              className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px] shadow-sm"
            >
              <Mic2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <span>Artist Bypass</span>
            </button>

            <button
              onClick={handleAdminBypass}
              className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px] shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              <span>Admin Bypass</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
