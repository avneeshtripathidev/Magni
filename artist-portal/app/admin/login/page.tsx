"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import { ShieldCheck, Lock, Loader2, Mic2, AlertTriangle } from 'lucide-react';

function AdminLoginContent() {
  const { admin, loading, authError, clearAuthError, signInAdminWithGoogle } = useAdminAuth();
  const [signingIn, setSigningIn] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlErrorCode = searchParams.get('error');
  const blockedEmail = searchParams.get('email');

  const urlErrorMessage =
    urlErrorCode === 'unauthorized'
      ? `Access Denied: "${blockedEmail || 'This Google account'}" is not in the 3 authorized admin emails.`
      : urlErrorCode === 'cancelled'
      ? 'Google sign-in was cancelled. Please try again with an authorized admin account.'
      : urlErrorCode === 'invalid_state'
      ? 'Security verification expired. Please click Sign in with Google again.'
      : urlErrorCode === 'token_exchange_failed'
      ? 'Google OAuth exchange failed. Make sure <your-domain>/api/admin/auth/google/callback is added to Authorized redirect URIs in Google Cloud Console.'
      : urlErrorCode
      ? 'Could not complete Google authentication. Please try again.'
      : null;

  const displayError = authError || urlErrorMessage;

  // Redirect authenticated whitelisted admin straight to dashboard
  useEffect(() => {
    if (!loading && admin) {
      router.replace('/admin/dashboard');
    }
  }, [admin, loading, router]);

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setSigningIn(true);
    const res = await signInAdminWithGoogle();
    if (!res.success) {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between overflow-x-hidden font-sans">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-7 sm:p-8 rounded-2xl border border-slate-200 shadow-xl relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-sky-400 shadow-md mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Artist Director Console
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Restricted Admin Access • Google Authentication Only
            </p>
          </div>

          {/* Unauthorized / Error Banner */}
          {displayError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          {/* ONLY ONE LOGIN OPTION: GOOGLE SIGN-IN */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm rounded-xl border-2 border-slate-200 hover:border-slate-300 shadow-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60 min-h-[50px]"
          >
            {signingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.16-4.06 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29A7.19 7.19 0 0 1 4.9 12c0-.79.14-1.57.38-2.29V6.62H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.38l3.99-3.09Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.99 3.09c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Security Notice */}
          <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-[11px] text-slate-600">
            <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Strict 3-Admin Security Lock</p>
              <p className="mt-0.5 leading-relaxed">
                Password logins and bypasses are disabled. Only the 3 authorized Magnevents administrator Google accounts are permitted access.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-indigo-600 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>Back to Artist Performer Login</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
