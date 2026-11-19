"use client";

import React from 'react';
import { ModalPortal } from './ModalPortal';
import { X } from 'lucide-react';

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
  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-xl max-h-[88vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Performer Agreement &amp; Terms of Service
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Last updated: November 2026 • Magnevents Performer Network
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs leading-relaxed">
          {/* Introductory notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <p className="text-[12px] leading-relaxed">
              Please review these operational standards and terms before creating your performer profile. By completing registration, you agree to adhere to these binding requirements across all bookings arranged through Magnevents.
            </p>
          </div>

          {/* Core Clauses */}
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                1. Punctuality &amp; Soundcheck Protocol
              </h3>
              <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">
                Performers must arrive at the venue at least <strong className="text-slate-900 font-semibold">60 to 90 minutes prior</strong> to scheduled stage time to conduct soundcheck, line check, and coordinate with the on-site event coordinator. Punctuality is strictly required to guarantee smooth event delivery.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900">
                2. Locked Event Policy &amp; Non-Cancellation
              </h3>
              <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">
                Once a gig or booking is accepted and marked as locked, cancellation is strictly prohibited. Performers do not have permission to withdraw from a confirmed engagement. Any unapproved cancellation will result in <strong className="text-slate-900 font-semibold">immediate and permanent suspension</strong> of your Performer ID and removal from the platform directory.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900">
                3. Platform Exclusivity &amp; Direct Engagement
              </h3>
              <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">
                While actively registered on Magnevents, performers agree not to divert Magnevents clients to personal contact channels or competing third-party platforms. All bookings, date adjustments, and repeat performances originating from Magnevents leads must be processed on-platform to maintain payment escrow and dispute insurance.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900">
                4. Performance Standards &amp; Decorum
              </h3>
              <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">
                Performers are required to deliver the agreed set duration, musical repertoire, and adhere to event dress codes agreed upon during booking. High standards of professional decorum, sobriety, and respectful conduct on venue premises are strictly enforced.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-5 space-y-2">
              <h3 className="text-xs font-bold text-slate-900">
                5. Privacy, Confidentiality &amp; Data Security
              </h3>
              <p className="text-[12px] text-slate-600 leading-relaxed">
                Magnevents safeguards your personal, financial, and legal credentials under bank-grade security standards:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-[12px] text-slate-600">
                <li>
                  <strong className="text-slate-900 font-semibold">No Third-Party Sharing:</strong> We do not sell, rent, or disclose your private phone numbers, personal email, or identification documents to clients or outside vendors.
                </li>
                <li>
                  <strong className="text-slate-900 font-semibold">Encrypted Storage:</strong> Government IDs (Aadhaar, PAN) and banking records are protected using 256-bit AES encryption at rest and in transit.
                </li>
                <li>
                  <strong className="text-slate-900 font-semibold">Controlled Scope:</strong> Private credentials are used strictly for identity verification and direct milestone payouts. Only your approved public stage name, photos, and performance media are visible to event planners.
                </li>
              </ul>
            </div>

            <div className="border-t border-slate-200 pt-5 space-y-2">
              <h3 className="text-xs font-bold text-slate-900">
                6. Payment Settlement &amp; Milestones
              </h3>
              <p className="text-[12px] text-slate-600 leading-relaxed">
                Client deposits are held in platform escrow upon booking confirmation. Following successful performance sign-off by the client or event lead, payouts are released directly into your registered bank account according to platform disbursement schedules.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-5 space-y-2">
              <h3 className="text-xs font-bold text-slate-900">
                7. Force Majeure &amp; Medical Exemptions
              </h3>
              <p className="text-[12px] text-slate-600 leading-relaxed">
                In rare events of severe illness or certified emergencies, the performer must submit formal medical or incident documentation within 24 hours. Magnevents will attempt to arrange an emergency substitute from our verified artist pool to protect the client event.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
          <p className="text-[11px] text-slate-500 hidden sm:block">
            By accepting, you confirm you have read and agree to all terms.
          </p>
          <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto">
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
      </div>
    </ModalPortal>
  );
}
