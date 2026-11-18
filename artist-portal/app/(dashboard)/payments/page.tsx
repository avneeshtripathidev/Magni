'use client';

import React, { useState, useEffect } from 'react';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { artistService } from '../../../services/artistService';
import { 
  Building, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  Wallet,
  Save,
  Loader2
} from 'lucide-react';

interface PayoutTransaction {
  id: string;
  event: string;
  date: string;
  amount: string;
  ref: string;
  method: string;
}

export default function PaymentsPage() {
  const { artist } = useArtistAuth();
  const [saving, setSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [hasSavedBank, setHasSavedBank] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [totalSettled, setTotalSettled] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [transactions, setTransactions] = useState<PayoutTransaction[]>([]);

  const [bankDetails, setBankDetails] = useState({
    account_holder: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && artist?.id) {
      const storageKey = `magnevents_artist_bank_details_${artist.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBankDetails({
            account_holder: parsed.account_holder || artist?.name || '',
            bank_name: parsed.bank_name || '',
            account_number: parsed.account_number || '',
            ifsc_code: parsed.ifsc_code || '',
            upi_id: parsed.upi_id || '',
          });
          setHasSavedBank(Boolean(parsed.account_number && parsed.ifsc_code));
          return;
        } catch {}
      }
      setBankDetails((prev) => ({
        ...prev,
        account_holder: prev.account_holder || artist?.name || '',
      }));
    }
  }, [artist?.id, artist?.name]);

  useEffect(() => {
    let active = true;
    async function loadEarnings() {
      if (!artist?.id) {
        if (active) {
          setTotalSettled(0);
          setEscrowBalance(0);
          setTransactions([]);
          setLoadingLedger(false);
        }
        return;
      }

      try {
        const bookings = await artistService.getArtistBookings(artist.id);
        let settled = 0;
        let escrow = 0;
        const ledger: PayoutTransaction[] = [];

        (bookings || []).forEach((b: any) => {
          const amount = Number(b.total_amount || 0);
          const advance = Number(b.advance_amount || 0);
          const rawDate = b.event_date || b.created_at;
          const formattedDate = rawDate
            ? new Date(rawDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'TBD';

          if (b.status === 'completed') {
            settled += amount;
            ledger.push({
              id: String(b.id),
              event: b.event_type || b.customer_name || 'Live Performance',
              date: formattedDate,
              amount: `₹${amount.toLocaleString('en-IN')}`,
              ref: String(b.reference_code || b.id),
              method: 'Settled',
            });
          } else if (b.status === 'confirmed') {
            escrow += advance > 0 ? advance : amount;
            ledger.push({
              id: String(b.id),
              event: b.event_type || b.customer_name || 'Confirmed Performance',
              date: formattedDate,
              amount: `₹${(advance > 0 ? advance : amount).toLocaleString('en-IN')}`,
              ref: String(b.reference_code || b.id),
              method: 'In Escrow',
            });
          }
        });

        if (active) {
          setTotalSettled(settled);
          setEscrowBalance(escrow);
          setTransactions(ledger);
        }
      } catch {
        if (active) {
          setTotalSettled(0);
          setEscrowBalance(0);
          setTransactions([]);
        }
      } finally {
        if (active) setLoadingLedger(false);
      }
    }

    loadEarnings();
    return () => {
      active = false;
    };
  }, [artist?.id]);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (typeof window !== 'undefined' && artist?.id) {
      localStorage.setItem(
        `magnevents_artist_bank_details_${artist.id}`,
        JSON.stringify(bankDetails)
      );
      setHasSavedBank(Boolean(bankDetails.account_number && bankDetails.ifsc_code));
    }
    setTimeout(() => {
      setSaving(false);
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 3500);
    }, 300);
  };

  const startingPrice = Number(artist?.submitted_pricing?.starting_price || artist?.price_min || 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Payouts & Settlements</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor earnings, escrow balances, and manage settlement bank details.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Settled</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ₹{totalSettled.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 block pt-1.5 border-t border-slate-100">
            Paid directly to bank account
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Escrow Balance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ₹{escrowBalance.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 block pt-1.5 border-t border-slate-100">
            Advance tokens pending event
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Base Rate</span>
            <CreditCard className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {startingPrice > 0 ? `₹${startingPrice.toLocaleString('en-IN')}` : 'Not set'}
          </div>
          <span className="text-[11px] text-slate-400 block pt-1.5 border-t border-slate-100">
            Solo starting package
          </span>
        </div>
      </div>

      {/* Bank Account Form */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Settlement Bank Account</h2>
          </div>
          {hasSavedBank ? (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Bank Details Saved
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Not Configured Yet
            </span>
          )}
        </div>

        {bankSaved && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Bank settlement details saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSaveBank} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                required
                value={bankDetails.account_holder}
                onChange={(e) => setBankDetails({ ...bankDetails, account_holder: e.target.value })}
                placeholder="Full name as on bank passbook"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                required
                value={bankDetails.bank_name}
                onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                placeholder="e.g. HDFC Bank, ICICI Bank"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                required
                value={bankDetails.account_number}
                onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                placeholder="Bank account number"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                required
                value={bankDetails.ifsc_code}
                onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
                placeholder="e.g. HDFC0001024"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm uppercase font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID</label>
              <input
                type="text"
                value={bankDetails.upi_id}
                onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })}
                placeholder="e.g. artistname@okhdfcbank"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Used for fast same-day event settlements.</span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full sm:w-auto py-2 px-4 text-xs flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Settlement Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Settlement History Ledger */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Payout Ledger</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">{transactions.length} records</span>
        </div>

        {loadingLedger ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-50 border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-10 text-center space-y-1.5">
            <Wallet className="w-8 h-8 text-slate-200 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No payouts recorded yet</p>
            <p className="text-[11px] text-slate-400">
              Completed performances and escrow settlements will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">{tx.event}</span>
                  <span className="text-[11px] text-slate-500">{tx.date} • {tx.ref}</span>
                </div>
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <span className="font-extrabold text-slate-900">{tx.amount}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {tx.method}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
