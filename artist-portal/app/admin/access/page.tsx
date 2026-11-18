"use client";

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import { MAX_ADMIN_EMAILS } from '../../../lib/auth/adminWhitelist';
import { ShieldCheck, Lock, Mail, Plus, Trash2, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function AdminAccessControlPage() {
  const { admin, allowedAdminEmails, updateAllowedAdminEmails } = useAdminAuth();
  const [slots, setSlots] = useState<string[]>(['', '', '']);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const filled = [
      allowedAdminEmails[0] || '',
      allowedAdminEmails[1] || '',
      allowedAdminEmails[2] || '',
    ];
    setSlots(filled);
  }, [allowedAdminEmails]);

  const handleSlotChange = (index: number, value: string) => {
    setSlots((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const nonEmpty = slots.map((s) => s.trim().toLowerCase()).filter(Boolean);
    const res = await updateAllowedAdminEmails(nonEmpty);
    if (res.success) {
      setMessage({
        type: 'success',
        text: `Updated authorized admin access (${nonEmpty.length}/${MAX_ADMIN_EMAILS} Google accounts active).`,
      });
    } else {
      setMessage({ type: 'error', text: res.error || 'Could not update allowed emails.' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto font-sans">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold mb-2">
          <Lock className="w-3.5 h-3.5 text-sky-600" />
          <span>Strict Google-Only Access Control</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Authorized Admin Accounts (Max 3)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Only the 3 Google accounts listed below can sign in to the Artist Admin Panel. All other Google accounts are automatically blocked.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Whitelisted Admin Gmail Slots ({allowedAdminEmails.length} / {MAX_ADMIN_EMAILS})
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 break-all">
            Active: {admin?.email}
          </span>
        </div>

        <div className="space-y-3.5">
          {[0, 1, 2].map((idx) => {
            const isCurrentUser =
              admin?.email && slots[idx].trim().toLowerCase() === admin.email.toLowerCase();
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Authorized Admin #{idx + 1} {idx === 0 && <span className="text-rose-500">*</span>}
                  </label>
                  {isCurrentUser && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      Current Session
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required={idx === 0}
                      value={slots[idx]}
                      onChange={(e) => handleSlotChange(idx, e.target.value)}
                      placeholder={`admin${idx + 1}@gmail.com`}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  {!isCurrentUser && slots[idx] && (
                    <button
                      type="button"
                      onClick={() => handleSlotChange(idx, '')}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600"
                      title="Clear slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            For permanent deployment locks, also keep these 3 emails in <code className="font-mono">NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS</code>.
          </p>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save 3 Admin Emails</span>
          </button>
        </div>
      </form>
    </div>
  );
}
