'use client';

import React, { useState } from 'react';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { supabase } from '../../../lib/supabase/client';
import { 
  KeyRound, 
  Mail, 
  Bell, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function SettingsPage() {
  const { user, artist, signOut } = useArtistAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 3500);
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8 font-sans">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage credentials, alerts, and active login sessions.
        </p>
      </div>

      {/* Account Info */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Mail className="w-4 h-4 text-sky-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Registered Email</span>
            <span className="font-semibold text-slate-900 break-all">{user?.email || artist?.email || 'Not set'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Contact Phone</span>
            <span className="font-semibold text-slate-900">{artist?.phone_no || 'Not provided'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Artist ID</span>
            <span className="font-mono text-slate-600 truncate block">{artist?.id || '—'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Authentication</span>
            <span className="text-emerald-700 font-semibold capitalize">
              {user?.app_metadata?.provider || 'Verified Session'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <KeyRound className="w-4 h-4 text-sky-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Update Password</h2>
        </div>

        {passwordMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs border flex items-center gap-2 ${
              passwordMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {passwordMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordLoading || !newPassword}
              className="btn-primary w-full sm:w-auto py-2 px-4 text-xs flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Bell className="w-4 h-4 text-sky-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Inquiry Alerts</h2>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-900 block">WhatsApp Gig Alerts</span>
              <span className="text-[11px] text-slate-500">Instant alert when clients request dates</span>
            </div>
            <button
              type="button"
              onClick={() => setNotifyWhatsapp(!notifyWhatsapp)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                notifyWhatsapp ? 'bg-sky-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white block transition-transform absolute top-1 shadow-sm ${
                  notifyWhatsapp ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Email Notifications</span>
              <span className="text-[11px] text-slate-500">Booking summaries and escrow receipts</span>
            </div>
            <button
              type="button"
              onClick={() => setNotifyEmail(!notifyEmail)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                notifyEmail ? 'bg-sky-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white block transition-transform absolute top-1 shadow-sm ${
                  notifyEmail ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-900 block">Active Performer Session</span>
          <span className="text-xs text-slate-500">Sign out of this browser. Your public listing remains active.</span>
        </div>

        <button
          onClick={() => signOut()}
          className="btn-secondary text-xs py-2 px-3.5 text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center gap-1.5 self-start sm:self-auto min-h-[38px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
