"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useArtistAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetErr } = await resetPassword(email);
      if (resetErr) {
        setError(resetErr.message || 'Could not send reset link.');
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md my-auto relative py-6 font-sans">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-16 h-16 flex items-center justify-center p-2 mb-3">
          <img
            src="/logo.webp"
            alt="Magnevents Logo"
            width={64}
            height={64}
            className="object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-none">
          Magne<span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">vents</span>
        </h1>
        <p className="text-slate-400 font-bold mt-2 text-xs uppercase tracking-[0.2em]">
          Artist Suite
        </p>
      </div>

      <div className="w-full p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-slate-900">Reset Password</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your registered email to receive a secure recovery link
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Check Your Inbox</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5">
              Password recovery link has been sent to <span className="text-slate-900 font-semibold">{email}</span>.
            </p>
            <Link
              href="/login"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="performer@magnevents.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
              <span>Send Recovery Link</span>
            </button>

            <div className="text-center pt-4 border-t border-slate-100">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
