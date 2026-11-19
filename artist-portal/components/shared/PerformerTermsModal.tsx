"use client";

import React, { useState } from 'react';
import { ModalPortal } from './ModalPortal';
import {
  ShieldCheck,
  Clock,
  Ban,
  ShieldAlert,
  Award,
  Lock,
  Database,
  EyeOff,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  FileText,
  Sparkles,
} from 'lucide-react';

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
  const [showFullTerms, setShowFullTerms] = useState(false);

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Performer Terms &amp; Security Commitment
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Magnevents Artist Platform Policy &amp; Privacy Pledge
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close terms modal"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-700 text-xs leading-relaxed">
          {/* Highlight Notification Pill */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-[11.5px]">
              <span className="font-bold">Important Notice for All Artists:</span> Please carefully review the 4 fundamental commitments below before joining Magnevents. These policies maintain our 99.8% event delivery record and protect your artist reputation.
            </div>
          </div>

          {/* SECTION 1: 4 TOP CORE COMMITMENTS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                4 Core Performer Commitments
              </h3>
            </div>

            <div className="space-y-3">
              {/* Commitment 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-600" /> Guaranteed Arrival Time &amp; Soundcheck
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 uppercase tracking-wider">
                        Mandatory
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-normal">
                      Punctuality is strictly guaranteed. You must arrive at the venue at least <span className="font-bold text-slate-900">60 to 90 minutes before</span> your scheduled performance time to complete soundcheck, line check, and coordinate with the on-site event director.
                    </p>
                  </div>
                </div>
              </div>

              {/* Commitment 2 */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 hover:border-rose-300 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5 text-rose-600" /> Locked Event Commitment &amp; Zero Cancellation
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-200 text-rose-800 uppercase tracking-wider">
                        Strict Penalty
                      </span>
                    </div>
                    <p className="text-[11.5px] text-rose-900 leading-normal">
                      Once you accept and lock a booking, <span className="font-bold">you do not have permission to cancel</span>. Backing out of a locked event damages the client’s celebration. Any unapproved cancellation will result in <span className="font-bold underline">immediate and permanent suspension</span> of your Performer ID and blacklisting across our network.
                    </p>
                  </div>
                </div>
              </div>

              {/* Commitment 3 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" /> Platform Integrity &amp; No Off-Platform Poaching
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                        Integrity
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-normal">
                      While actively engaged on Magnevents, you agree not to solicit or divert Magnevents clients to personal contact channels or competing platforms. All bookings, extensions, and repeat gigs initiated via Magnevents must be processed on-platform to safeguard payment escrow and artist guarantees.
                    </p>
                  </div>
                </div>
              </div>

              {/* Commitment 4 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                    4
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-600" /> Professional Standard &amp; Stage Decorum
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                        High Standard
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-normal">
                      Artists must deliver the agreed performance duration, adhere to client dress codes, provide the requested musical repertoire, and maintain exemplary stage decorum without unprofessional disruptions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PRIVACY & DATA SECURITY GUARANTEE */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-sky-50/60 border border-emerald-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight">
                  Artist Privacy, Security &amp; Data Storage Guarantee
                </h3>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Zero Data Sharing • Bank-Grade Security
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm flex items-start gap-2.5">
                <EyeOff className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold text-slate-900">Zero Private Data Sharing</div>
                  <p className="text-[10.5px] text-slate-600 leading-tight mt-0.5">
                    We <span className="font-bold text-slate-900">NEVER share or sell</span> your private contact info, mobile number, or government documents to unauthorized third parties or clients.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm flex items-start gap-2.5">
                <Database className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold text-slate-900">Encrypted Cloud Storage</div>
                  <p className="text-[10.5px] text-slate-600 leading-tight mt-0.5">
                    All Aadhaar, PAN, and banking data is securely encrypted using 256-bit AES protocol and accessed solely for legal verification and direct bank payouts.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[10.5px] text-slate-500 italic pt-0.5">
              By registering, you consent to Magnevents displaying your public stage name, approved photos, and performance showreels to verified event organizers.
            </p>
          </div>

          {/* SECTION 3: EXPANDABLE FULL TERMS & LEGAL CLAUSES */}
          <div className="border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={() => setShowFullTerms(!showFullTerms)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{showFullTerms ? 'Hide Comprehensive Legal Clauses' : 'Read Comprehensive Terms & Legal Clauses (5 Articles)'}</span>
              </span>
              {showFullTerms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showFullTerms && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3.5 text-[11px] text-slate-600 animate-in fade-in duration-200">
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">Article 1: Booking Confirmation &amp; Escrow</h5>
                  <p>
                    A booking is officially confirmed once the client pays the escrow advance through Magnevents. The agreed performance fee will be deposited directly into your verified bank account according to platform milestone schedules following performance sign-off.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 mb-1">Article 2: Punctuality, Soundcheck &amp; Equipment Rider</h5>
                  <p>
                    The artist is solely responsible for verifying equipment riders (mics, instruments, monitors, power supplies) with the venue or event planner ahead of time. Failure to attend mandatory soundcheck without written director notice will incur penalty deductions.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 mb-1">Article 3: Force Majeure &amp; Verified Medical Exemption</h5>
                  <p>
                    In genuine cases of severe medical emergencies or unavoidable acts of God, the artist must produce certified documentation within 24 hours. Magnevents reserve team will assist in providing emergency replacements. Unauthorized cancellations remain subject to account suspension.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 mb-1">Article 4: Intellectual Property &amp; Promotion Rights</h5>
                  <p>
                    Artists retain full copyright of their original musical compositions. By using the platform, artists grant Magnevents a non-exclusive license to feature stage performances, images, and audio samples solely for marketing and event booking curation.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 mb-1">Article 5: Account Suspension &amp; Blacklisting</h5>
                  <p>
                    Magnevents reserves the right to suspend or terminate accounts that breach arrival commitments, solicit off-platform transactions, misrepresent identity, or display harassment or substance abuse at client venues.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Understand &amp; Agree</span>
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
