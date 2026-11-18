"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let storedNext = '';
    try {
      storedNext = sessionStorage.getItem('magnevents_oauth_next') || '';
      sessionStorage.removeItem('magnevents_oauth_next');
    } catch {}
    const rawNext = searchParams.get('next') || storedNext || '/dashboard';
    const safeNext = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

    const finishLogin = () => {
      if (!active) return;
      document.cookie = 'artist_session_active=true; path=/; max-age=604800; SameSite=Lax';
      router.replace(safeNext);
    };

    async function handleOAuthReturn() {
      try {
        const urlError = searchParams.get('error_description') || searchParams.get('error');
        if (urlError) {
          if (active) setError(urlError);
          return;
        }

        // Handle PKCE ?code=... if Supabase uses PKCE flow
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            if (active) setError(exchangeErr.message || 'Could not complete Google sign-in.');
            return;
          }
          finishLogin();
          return;
        }

        // Check existing / hash-hydrated session (#access_token=...)
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          finishLogin();
          return;
        }

        // Wait briefly for Supabase client to parse #access_token hash
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            sub.subscription.unsubscribe();
            finishLogin();
          }
        });

        setTimeout(async () => {
          if (!active) return;
          const { data: retry } = await supabase.auth.getSession();
          if (retry?.session) {
            sub.subscription.unsubscribe();
            finishLogin();
          } else {
            sub.subscription.unsubscribe();
            setError('Google sign-in session could not be verified. Please try signing in again.');
          }
        }, 4000);
      } catch (err: any) {
        if (active) setError(err?.message || 'Authentication callback failed.');
      }
    }

    handleOAuthReturn();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-lg p-7 text-center space-y-4">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-base font-extrabold text-slate-900">Sign-In Interrupted</h1>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
            <Link
              href="/login"
              className="btn-primary w-full py-2.5 text-xs justify-center"
            >
              Return to Sign In
            </Link>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h1 className="text-base font-extrabold text-slate-900">Completing Google Sign-In</h1>
              <p className="text-xs text-slate-500">
                Setting up your Magnevents Performer session...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
