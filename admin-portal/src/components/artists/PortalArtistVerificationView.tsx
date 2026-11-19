"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@database/connection/supabase-admin';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Search, 
  Loader2, 
  ExternalLink, 
  ShieldCheck, 
  FileText, 
  IndianRupee, 
  Music, 
  Video, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PortalArtist {
  id: string;
  user_id?: string;
  name: string;
  stage_name?: string;
  email?: string;
  phone_no?: string;
  category: string;
  sub_category?: string;
  city?: string;
  genres?: string[];
  languages?: string[];
  experience_years?: number;
  bio?: string;
  price_min?: number;
  price_max?: number;
  video_url?: string;
  youtube_links?: string[];
  audio_samples?: string[];
  instagram_url?: string;
  spotify_url?: string;
  submitted_pricing?: {
    starting_price?: number;
    solo_price?: number;
    duo_price?: number;
    band_price?: number;
    hourly_price?: number;
    travel_charges_policy?: string;
  };
  performance_details?: {
    min_duration_minutes?: number;
    max_duration_minutes?: number;
    sound_system_provided?: boolean;
    technical_requirements?: string;
    travel_readiness?: string;
    serviceable_cities?: string[];
  };
  verification_documents?: {
    legal_name?: string;
    id_type?: string;
    id_number_masked?: string;
    id_document_url?: string;
    address_proof_url?: string;
    pan_or_tax_id?: string;
  };
  verification_status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  rejection_reason?: string;
  profile_completion?: number;
  profile_submitted_at?: string;
  verified_at?: string;
  is_live: boolean;
  created_at: string;
}

export function PortalArtistVerificationView() {
  const { toast } = useToast();
  const [artists, setArtists] = useState<PortalArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all');
  
  // Selected for review modal
  const [selectedArtist, setSelectedArtist] = useState<PortalArtist | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection modal
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPortalArtists = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase.from('artists') as any)
        .select('*')
        .not('verification_status', 'is', null);

      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }

      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,stage_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone_no.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setArtists(data || []);
    } catch (err: any) {
      console.error('Error fetching portal artists:', err);
      toast({
        variant: 'destructive',
        title: 'Fetch Error',
        description: err.message || 'Could not load portal artists.',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPortalArtists();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPortalArtists]);

  // Handle Approve
  const handleApprove = async () => {
    if (!selectedArtist) return;
    setActionLoading(true);

    try {
      const startingPrice = selectedArtist.submitted_pricing?.starting_price || selectedArtist.price_min || 5000;

      const { error } = await (supabase.from('artists') as any)
        .update({
          verification_status: 'approved',
          is_live: true,
          rejection_reason: null,
          price_min: startingPrice,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedArtist.id);

      if (error) throw error;

      // Log verification history
      try {
        await (supabase.from('artist_verification_history') as any).insert([
          {
            artist_id: selectedArtist.id,
            previous_status: selectedArtist.verification_status,
            new_status: 'approved',
            reason: 'Profile & identity documents verified by Magnevents Administrator',
          },
        ]);
      } catch (e) {
        // non-blocking
      }

      // Send notification to artist
      try {
        await (supabase.from('artist_notifications') as any).insert([
          {
            artist_id: selectedArtist.id,
            user_id: selectedArtist.user_id,
            title: '🎉 Profile Approved & Verified!',
            message: 'Congratulations! Your profile has been verified and published to the live Magnevents platform. Clients can now book you with 0% commission fees.',
            type: 'verification',
            action_url: '/dashboard',
          },
        ]);
      } catch (e) {
        // non-blocking
      }

      toast({
        title: '✅ Artist Approved & Published!',
        description: `${selectedArtist.name} is now verified and live on Magnevents.`,
      });

      setIsReviewOpen(false);
      setSelectedArtist(null);
      fetchPortalArtists();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: err.message || 'Failed to approve artist.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!selectedArtist) return;
    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Reason Required',
        description: 'Please provide a clear rejection or update reason for the artist.',
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await (supabase.from('artists') as any)
        .update({
          verification_status: 'rejected',
          is_live: false,
          rejection_reason: rejectionReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedArtist.id);

      if (error) throw error;

      // Log history
      try {
        await (supabase.from('artist_verification_history') as any).insert([
          {
            artist_id: selectedArtist.id,
            previous_status: selectedArtist.verification_status,
            new_status: 'rejected',
            reason: rejectionReason.trim(),
          },
        ]);
      } catch (e) {
        // non-blocking
      }

      // Send notification
      try {
        await (supabase.from('artist_notifications') as any).insert([
          {
            artist_id: selectedArtist.id,
            user_id: selectedArtist.user_id,
            title: '⚠️ Verification Action Required',
            message: rejectionReason.trim(),
            type: 'verification',
            action_url: '/verification',
          },
        ]);
      } catch (e) {
        // non-blocking
      }

      toast({
        title: 'Artist Request Rejected',
        description: 'Status set to rejected and feedback has been sent to the artist portal.',
      });

      setRejectionModalOpen(false);
      setRejectionReason('');
      setIsReviewOpen(false);
      setSelectedArtist(null);
      fetchPortalArtists();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: err.message || 'Failed to reject artist.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Review
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Eye className="w-3.5 h-3.5 text-sky-600" />
            Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Action Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            {status || 'Draft'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by artist name, stage name, email, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {(['all', 'pending', 'under_review', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all",
                statusFilter === s
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {s === 'all' ? 'All Applications' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Artists Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading portal performer applications...</p>
        </div>
      ) : artists.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No Performer Applications Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {statusFilter !== 'all'
              ? `No artists found matching status "${statusFilter}".`
              : 'Performers registered via the new Artist Portal (artists.magnevents.in) will appear here for verification.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Performer / Stage Name</th>
                  <th className="px-5 py-3.5">Category & City</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Proposed Price</th>
                  <th className="px-5 py-3.5">Completion</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {artists.map((artist) => {
                  const pricing = artist.submitted_pricing;
                  const docs = artist.verification_documents;
                  return (
                    <tr key={artist.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{artist.name}</div>
                        {artist.stage_name && (
                          <div className="text-[11px] text-sky-600 font-semibold">
                            Stage: &ldquo;{artist.stage_name}&rdquo;
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ID: {artist.id.slice(0, 8)}...
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="text-slate-800 font-semibold">{artist.category || 'Music'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{artist.city || 'Delhi NCR'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{artist.phone_no || 'N/A'}</span>
                        </div>
                        {artist.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">{artist.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <IndianRupee className="w-3 h-3 text-emerald-600" />
                          <span>
                            {pricing?.starting_price
                              ? Number(pricing.starting_price).toLocaleString('en-IN')
                              : artist.price_min
                              ? Number(artist.price_min).toLocaleString('en-IN')
                              : '0'}
                          </span>
                        </div>
                        {pricing?.solo_price ? (
                          <div className="text-[10px] text-slate-400">
                            Solo: ₹{Number(pricing.solo_price).toLocaleString('en-IN')}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${artist.profile_completion || 40}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {artist.profile_completion || 40}%
                          </span>
                        </div>
                        {docs?.id_document_url ? (
                          <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
                            <FileText className="w-3 h-3" />
                            ID Attached
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 flex items-center gap-1 mt-1 font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            No ID Attached
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        {getStatusBadge(artist.verification_status)}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedArtist(artist);
                            setIsReviewOpen(true);
                          }}
                          className="h-8 px-3 text-xs font-semibold text-slate-700 hover:text-sky-600 hover:border-sky-300 gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review & Verify
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Review Modal */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-sky-600" />
              <span>Review Artist Application: {selectedArtist?.name}</span>
            </div>
            {getStatusBadge(selectedArtist?.verification_status)}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Review submitted government identification, proposed client pricing, logistics, and audition showreels before approving.
          </DialogDescription>

          {selectedArtist && (
            <div className="space-y-6 pt-4 text-xs">
              {/* Previous Rejection Banner (if any) */}
              {selectedArtist.verification_status === 'rejected' && selectedArtist.rejection_reason && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Previous Rejection Feedback Sent to Artist:
                  </div>
                  <p className="font-mono text-[11px]">{selectedArtist.rejection_reason}</p>
                </div>
              )}

              {/* 1. Basic & Performance Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-600" />
                  Performer & Genre Profile
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Legal Name</span>
                    <span className="font-semibold">{selectedArtist.verification_documents?.legal_name || selectedArtist.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Stage Name</span>
                    <span className="font-semibold">{selectedArtist.stage_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Category</span>
                    <span className="font-semibold">{selectedArtist.category} ({selectedArtist.sub_category || 'Solo'})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Base City</span>
                    <span className="font-semibold">{selectedArtist.city || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Experience</span>
                    <span className="font-semibold">{selectedArtist.experience_years || 0} Years</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Languages</span>
                    <span className="font-semibold">{selectedArtist.languages?.join(', ') || 'Hindi, English'}</span>
                  </div>
                </div>

                {selectedArtist.bio && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] uppercase mb-1">Bio / Performer Overview</span>
                    <p className="text-slate-700 leading-relaxed italic">{selectedArtist.bio}</p>
                  </div>
                )}
              </div>

              {/* 2. Identity Verification Documents */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Government Identity Documents (Confidential)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">ID Type & Number</span>
                    <span className="font-semibold capitalize">
                      {selectedArtist.verification_documents?.id_type || 'Unspecified'} — {selectedArtist.verification_documents?.id_number_masked || 'No number entered'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">PAN / Tax ID</span>
                    <span className="font-mono font-semibold">
                      {selectedArtist.verification_documents?.pan_or_tax_id || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase mb-1">Primary ID Document Link</span>
                    {selectedArtist.verification_documents?.id_document_url ? (
                      <a
                        href={selectedArtist.verification_documents.id_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 font-semibold hover:bg-amber-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Uploaded ID Document
                      </a>
                    ) : (
                      <span className="text-rose-600 font-semibold">No ID document submitted yet</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase mb-1">Address Proof Link</span>
                    {selectedArtist.verification_documents?.address_proof_url ? (
                      <a
                        href={selectedArtist.verification_documents.address_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-semibold hover:bg-slate-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Address Proof
                      </a>
                    ) : (
                      <span className="text-slate-400">None provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Proposed Pricing & Logistics */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  Submitted Performance Pricing (0% Agency Margin)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Starting Rate</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      ₹{Number(selectedArtist.submitted_pricing?.starting_price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Solo Rate</span>
                    <span className="font-bold text-slate-800 text-sm">
                      ₹{Number(selectedArtist.submitted_pricing?.solo_price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Acoustic Duo</span>
                    <span className="font-bold text-slate-800 text-sm">
                      ₹{Number(selectedArtist.submitted_pricing?.duo_price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                    <span className="text-slate-400 block text-[10px] uppercase">Full Live Band</span>
                    <span className="font-bold text-slate-800 text-sm">
                      ₹{Number(selectedArtist.submitted_pricing?.band_price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {selectedArtist.submitted_pricing?.travel_charges_policy && (
                  <div className="pt-2">
                    <span className="text-slate-400 block text-[10px] uppercase">Travel Charges Policy</span>
                    <p className="text-slate-700 mt-0.5">{selectedArtist.submitted_pricing.travel_charges_policy}</p>
                  </div>
                )}
              </div>

              {/* 4. Media & Showreels */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Video className="w-4 h-4 text-sky-600" />
                  Media Showreels & Portfolio Links
                </h4>
                <div className="space-y-2">
                  {selectedArtist.video_url && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border">
                      <span className="truncate max-w-sm font-mono text-slate-600">{selectedArtist.video_url}</span>
                      <a
                        href={selectedArtist.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        Play Video <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {selectedArtist.youtube_links && selectedArtist.youtube_links.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase">Additional YouTube Links:</span>
                      {selectedArtist.youtube_links.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-white border text-[11px]">
                          <span className="truncate max-w-sm font-mono text-slate-600">{link}</span>
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                            Open
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedArtist.audio_samples && selectedArtist.audio_samples.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-slate-400 block text-[10px] uppercase">Audio Tracks:</span>
                      {selectedArtist.audio_samples.map((track, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-white border text-[11px]">
                          <span className="truncate max-w-sm font-mono text-slate-600">{track}</span>
                          <a href={track} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                            Listen
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setIsReviewOpen(false)}
                  disabled={actionLoading}
                >
                  Close
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => setRejectionModalOpen(true)}
                    disabled={actionLoading}
                    className="gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Application
                  </Button>

                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Approve & Publish to Magnevents
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Feedback Dialog */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Provide Rejection Reason
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            This exact feedback message will be displayed in the performer&apos;s portal dashboard so they can make the necessary corrections and resubmit.
          </DialogDescription>

          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Feedback / What to Fix: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Government ID document was unreadable or password-protected. Please upload a clear photo of your Aadhaar card front and back to proceed with verification."
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectionModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? 'Saving...' : 'Send Rejection Feedback'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

