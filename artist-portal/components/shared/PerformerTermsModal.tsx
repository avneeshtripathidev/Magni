"use client";

import React, { useState } from 'react';
import { ModalPortal } from './ModalPortal';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface PerformerTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function PerformerTermsModal({
  isOpen,
  onClose,
  onAccept,
}: PerformerTermsModalProps) {
  const [showFull, setShowFull] = useState(false);

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              Performer Agreement &amp; Terms
            </h2>
            <p className="text-[11px] text-slate-500">
              Key operating rules and privacy guarantee
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs">
          {/* Key Operating Rules */}
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-900 text-xs mt-0.5">1.</span>
              <div>
                <span className="font-bold text-slate-900">Guaranteed Arrival Time: </span>
                <span className="text-slate-600">
                  Arrive at least <strong>60 to 90 minutes before</strong> showtime for soundcheck and stage prep. Punctuality is strictly required.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-900 text-xs mt-0.5">2.</span>
              <div>
                <span className="font-bold text-slate-900">Locked Event &amp; Zero Cancellation: </span>
                <span className="text-slate-600">
                  Once an event is locked, cancellation is strictly not permitted. Cancelling a confirmed event results in <strong>immediate ID suspension</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-900 text-xs mt-0.5">3.</span>
              <div>
                <span className="font-bold text-slate-900">Platform Integrity: </span>
                <span className="text-slate-600">
                  Do not divert Magnevents clients to personal channels or other platforms. All bookings must stay on-platform for payment escrow and artist protection.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="font-bold text-slate-900 text-xs mt-0.5">4.</span>
              <div>
                <span className="font-bold text-slate-900">Performance Standards: </span>
                <span className="text-slate-600">
                  Fulfill agreed performance duration, requested repertoire, dress code, and maintain professional stage decorum.
                </span>
              </div>
            </div>
          </div>

          {/* Privacy & Data Storage Guarantee */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 text-xs">
              Privacy &amp; Data Security Guarantee
            </div>
            <ul className="space-y-1.5 list-disc pl-4 text-[11.5px] text-slate-600">
              <li>
                <strong>We never share your private data:</strong> Phone numbers, email, and KYC documents are never shared or sold to clients or third parties.
              </li>
              <li>
                <strong>Encrypted storage:</strong> Bank and government ID details (PAN, Aadhaar) are stored with 256-bit encryption strictly for payout processing.
              </li>
              <li>
                <strong>Public profile:</strong> Only your stage name, approved photos, and performance videos are shown to event organizers.
              </li>
            </ul>
          </div>

          {/* Expandable full legal details */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowFull(!showFull)}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <span>{showFull ? 'Hide additional terms' : 'View additional terms (Payouts, Force Majeure)'}</span>
              {showFull ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showFull && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-[11px] text-slate-600 leading-normal">
                <p>
                  <strong>Payouts:</strong> Client deposits are held in platform escrow and disbursed to your registered bank account upon event completion.
                </p>
                <p>
                  <strong>Force Majeure:</strong> Exceptions to cancellation policies require certified medical documentation submitted within 24 hours.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="flex-1 sm:flex-none py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            I Accept &amp; Agree
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
