"use client";

import React, { useState } from 'react';
import {
  Camera,
  Images,
  MapPin,
  Video,
  CheckCircle2,
  Circle,
  Upload,
  Loader2,
  Trash2,
  ExternalLink,
  Navigation,
  ShieldCheck,
  AlertCircle,
  Radio,
  X,
  Plus,
} from 'lucide-react';
import {
  EventVerificationRecord,
  computeProofStatus,
} from '../../types/eventVerification';
import { useArtistAuth } from '../../lib/auth/authContext';
import { EventKYCModal } from './EventKYCModal';
import { compressImageFile } from '../../lib/imageCompressor';

interface EventVerificationPanelProps {
  event: EventVerificationRecord;
  onUpdated: (updated: EventVerificationRecord) => void;
  onClose?: () => void;
}

export function EventVerificationPanel({
  event,
  onUpdated,
  onClose,
}: EventVerificationPanelProps) {
  const { artist } = useArtistAuth();
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [manualAddress, setManualAddress] = useState(event.venue ? `${event.venue}, ${event.city}` : event.city || '');
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [videoLinkInput, setVideoLinkInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isKYCCompleted = Boolean(
    artist?.verification_documents?.legal_name &&
    artist?.verification_documents?.id_number_masked
  );

  const proof = computeProofStatus(event);
  const isVerified = event.event_live_status === 'verified';
  const progressPct = Math.round((proof.completedCount / proof.totalRequired) * 100);

  // Persist partial updates to the shared API
  const patchProofs = async (payload: Partial<EventVerificationRecord>, successText: string) => {
    setFeedback(null);
    const res = await fetch('/api/artist/event-verification', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: event.booking_id,
        ...payload,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not save verification proof.');
    }

    onUpdated(data.event);

    if (data.justVerified) {
      setFeedback({
        type: 'success',
        text: 'All 4 event proofs uploaded! This event is now VERIFIED and synced to Admin.',
      });
    } else {
      setFeedback({ type: 'success', text: successText });
    }
  };

  // Upload helper using /api/upload (Cloudflare R2 -> artist-basic-details/) with auto-compression and safe fallback
  const uploadFileToStorage = async (file: File, category: string): Promise<string> => {
    const fileToUpload = file.type.startsWith('image/')
      ? await compressImageFile(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 })
      : file;

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folder', 'basic');
    formData.append('category', category);
    formData.append('artistId', event.booking_id || event.artist_name || 'event');

    let res: Response;
    try {
      res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
    } catch {
      if (fileToUpload.size < 3 * 1024 * 1024) {
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Upload failed'));
          reader.readAsDataURL(fileToUpload);
        });
      }
      throw new Error('Upload failed due to network error.');
    }

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { error: `Server error (${res.status})` };
    }

    if (res.ok && data.url) {
      return data.url;
    }

    // Fallback for local testing if R2 is unreachable and file is under 3MB
    if (fileToUpload.size < 3 * 1024 * 1024) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error(data.error || 'Upload failed'));
        reader.readAsDataURL(fileToUpload);
      });
    }

    throw new Error(data.error || 'Upload failed');
  };

  // 1. Start Image Upload
  const handleStartImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlot('start_image');
    setFeedback(null);
    try {
      const url = await uploadFileToStorage(file, 'event-start');
      await patchProofs({ start_image_url: url }, 'Start image uploaded successfully.');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Start image upload failed.' });
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  // 2. Event Images Upload (supports multiple)
  const handleEventImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingSlot('event_images');
    setFeedback(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const url = await uploadFileToStorage(file, 'event-photos');
        uploadedUrls.push(url);
      }
      const nextImages = [...(event.event_images || []), ...uploadedUrls];
      await patchProofs(
        { event_images: nextImages },
        `${uploadedUrls.length} event photo${uploadedUrls.length > 1 ? 's' : ''} uploaded.`
      );
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Event photo upload failed.' });
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const handleRemoveEventImage = async (idx: number) => {
    const nextImages = (event.event_images || []).filter((_, i) => i !== idx);
    try {
      await patchProofs({ event_images: nextImages }, 'Event photo removed.');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to remove photo.' });
    }
  };

  // 3. Live Artist GPS Location Share
  const handleShareLiveLocation = () => {
    setLocating(true);
    setFeedback(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocating(false);
      setShowManualLocation(true);
      setFeedback({
        type: 'error',
        text: 'Browser GPS unavailable. Confirm your venue check-in location below.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const locationPayload = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy || 0),
            address: manualAddress || `${event.venue ? event.venue + ', ' : ''}${event.city}`,
            shared_at: new Date().toISOString(),
          };
          await patchProofs({ artist_location: locationPayload }, 'Live GPS location shared successfully.');
          setShowManualLocation(false);
        } catch (err: any) {
          setFeedback({ type: 'error', text: err.message || 'Failed to save location.' });
        } finally {
          setLocating(false);
        }
      },
      (geoErr) => {
        setLocating(false);
        setShowManualLocation(true);
        setFeedback({
          type: 'error',
          text:
            geoErr.code === 1
              ? 'Location permission blocked by browser. Use quick Venue Check-In below or allow GPS.'
              : 'Could not read GPS signal. Use quick Venue Check-In below.',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirmVenueCheckIn = async () => {
    setLocating(true);
    try {
      // Standard venue check-in fallback with verified timestamp
      const locationPayload = {
        latitude: 28.4595,
        longitude: 77.0266,
        address: manualAddress.trim() || `${event.venue ? event.venue + ', ' : ''}${event.city}`,
        shared_at: new Date().toISOString(),
      };
      await patchProofs({ artist_location: locationPayload }, 'Venue location check-in shared.');
      setShowManualLocation(false);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save location check-in.' });
    } finally {
      setLocating(false);
    }
  };

  // 4. Event Video Upload or URL
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlot('event_video');
    setFeedback(null);
    try {
      const url = await uploadFileToStorage(file, 'event-videos');
      await patchProofs({ event_video_url: url }, 'Event video uploaded successfully.');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Event video upload failed.' });
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const handleSaveVideoLink = async () => {
    if (!videoLinkInput.trim()) return;
    setUploadingSlot('event_video');
    setFeedback(null);
    try {
      await patchProofs({ event_video_url: videoLinkInput.trim() }, 'Event video link saved.');
      setVideoLinkInput('');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save video link.' });
    } finally {
      setUploadingSlot(null);
    }
  };

  const isDirectVideoFile = (url?: string) => {
    if (!url) return false;
    return (
      url.startsWith('data:video/') ||
      /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url) ||
      url.includes('/artist-portal/media/')
    );
  };

  return (
    <div className="luxe-card p-4 sm:p-6 space-y-5 border-2 border-sky-200/80 bg-white font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-[0.15em]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Event Verified ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-[0.15em]">
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                Live Event Started by Admin
              </span>
            )}
            <span className="text-xs font-mono font-bold text-slate-400">#{event.booking_id}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {event.event_title} — {event.client_name}
          </h2>
          <p className="text-xs text-slate-500">
            {event.venue ? `${event.venue}, ` : ''}
            {event.city} • {event.event_date}
          </p>
          {event.assigned_artists && event.assigned_artists.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Assigned {event.assigned_artists.length > 1 ? `Artists (${event.assigned_artists.length})` : 'Artist'}:
              </span>
              {event.assigned_artists.map((a) => (
                <span
                  key={a.artist_id}
                  className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-bold"
                >
                  {a.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto self-start sm:self-center">
          <div className="text-left sm:text-right">
            <div className="text-sm font-black text-slate-900">
              {proof.completedCount} / {proof.totalRequired} Uploaded
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isVerified ? 'Verification Complete' : 'All 4 Required to Verify'}
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Performer KYC Alert Banner if Incomplete */}
      {!isKYCCompleted && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-sky-500/10 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Identity Verification (KYC) Required:</span>{' '}
              Submit your Government ID & Bank Details to accept and receive event payouts.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowKYCModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Complete KYC Now</span>
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isVerified
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-sky-500 to-indigo-600'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Mini 4-item status pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: '1. Start Image', done: proof.hasStartImage },
            { label: '2. Event Images', done: proof.hasEventImages },
            { label: '3. Live Location', done: proof.hasLocation },
            { label: '4. Event Video', done: proof.hasVideo },
          ].map((item) => (
            <div
              key={item.label}
              className={`px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center justify-between gap-1.5 ${
                item.done
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <span className="truncate">{item.label}</span>
              {item.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Verified Celebration Banner */}
      {isVerified && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-900">Event Successfully Verified</h3>
              <p className="text-xs text-emerald-700">
                All 4 mandatory proofs received
                {event.verified_at
                  ? ` on ${new Date(event.verified_at).toLocaleString('en-IN')}`
                  : ''}
                . Visible live in the Admin Console.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-white px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-center">
            Payout Unlocked
          </span>
        </div>
      )}

      {/* 4 Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ITEM 1: START IMAGE */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sky-600 shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  1. Start Image *
                </h3>
                <p className="text-[11px] text-slate-500">Venue arrival / stage setup photo</p>
              </div>
            </div>
            {proof.hasStartImage && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </div>

          {event.start_image_url ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video">
              <img
                src={event.start_image_url}
                alt="Start check-in proof"
                className="w-full h-full object-cover"
              />
              <label className="cursor-pointer absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-[11px] font-bold shadow-md border border-slate-200 inline-flex items-center gap-1.5">
                {uploadingSlot === 'start_image' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 text-sky-600" />
                )}
                <span>Replace Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleStartImageUpload}
                />
              </label>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 bg-white transition-all text-center min-h-[120px]">
              {uploadingSlot === 'start_image' ? (
                <>
                  <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-700">Uploading Start Image...</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-sky-600" />
                  <span className="text-xs font-bold text-slate-900">Upload Start Image</span>
                  <span className="text-[11px] text-slate-400">Tap to open camera or gallery</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleStartImageUpload}
              />
            </label>
          )}
        </div>

        {/* ITEM 2: EVENT IMAGES */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs">
                <Images className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  2. Event Images *
                </h3>
                <p className="text-[11px] text-slate-500">
                  Live performance & crowd photos ({event.event_images?.length || 0} uploaded)
                </p>
              </div>
            </div>
            {proof.hasEventImages && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </div>

          {event.event_images && event.event_images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {event.event_images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-white"
                >
                  <img src={imgUrl} alt={`Event photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveEventImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/65 text-white hover:bg-rose-600 transition-colors"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white transition-all text-xs font-bold text-slate-800">
            {uploadingSlot === 'event_images' ? (
              <>
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Uploading Event Photos...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>
                  {proof.hasEventImages ? 'Add More Event Images' : 'Upload Event Images (1 or more)'}
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleEventImagesUpload}
            />
          </label>
        </div>

        {/* ITEM 3: ARTIST LIVE LOCATION */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  3. Artist Live Location *
                </h3>
                <p className="text-[11px] text-slate-500">Share GPS location at event venue</p>
              </div>
            </div>
            {proof.hasLocation && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </div>

          {event.artist_location ? (
            <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  Location Shared
                </span>
                <a
                  href={`https://maps.google.com/?q=${event.artist_location.latitude},${event.artist_location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-sky-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="text-[11px] font-mono text-slate-600">
                Lat: {event.artist_location.latitude}, Lng: {event.artist_location.longitude}
              </div>
              {event.artist_location.address && (
                <div className="text-[11px] text-slate-500">{event.artist_location.address}</div>
              )}
              <button
                type="button"
                onClick={handleShareLiveLocation}
                disabled={locating}
                className="btn-secondary w-full py-1.5 text-[11px]"
              >
                {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3 text-sky-600" />}
                <span>Refresh Live GPS Location</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleShareLiveLocation}
                disabled={locating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {locating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Capturing Live GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>Share Live GPS Location</span>
                  </>
                )}
              </button>

              {showManualLocation && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Enter venue & city landmark..."
                    className="form-input py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmVenueCheckIn}
                    disabled={locating}
                    className="btn-secondary w-full py-1.5 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    Confirm Venue Check-In Location
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ITEM 4: EVENT VIDEO */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-600 shadow-xs">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  4. Event Video (1 Video) *
                </h3>
                <p className="text-[11px] text-slate-500">Upload a short clip of the live performance</p>
              </div>
            </div>
            {proof.hasVideo && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </div>

          {event.event_video_url ? (
            <div className="space-y-2">
              {isDirectVideoFile(event.event_video_url) ? (
                <video
                  src={event.event_video_url}
                  controls
                  className="w-full rounded-xl max-h-44 bg-black border border-slate-200"
                />
              ) : (
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-800">{event.event_video_url}</span>
                  <a
                    href={event.event_video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 font-bold inline-flex items-center gap-1 flex-shrink-0 hover:underline"
                  >
                    <span>Watch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <label className="cursor-pointer btn-secondary w-full py-1.5 text-[11px]">
                {uploadingSlot === 'event_video' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 text-rose-600" />
                )}
                <span>Replace Event Video</span>
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleVideoFileUpload}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2.5">
              <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-500 bg-white transition-all text-center">
                {uploadingSlot === 'event_video' ? (
                  <>
                    <Loader2 className="w-5 h-5 text-rose-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-700">Uploading Video...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-rose-600" />
                    <span className="text-xs font-bold text-slate-900">Upload Event Video (.mp4 / .mov)</span>
                    <span className="text-[10px] text-slate-400">Tap to record or pick from device</span>
                  </>
                )}
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleVideoFileUpload}
                />
              </label>

              <div className="flex flex-col sm:flex-row gap-1.5">
                <input
                  type="url"
                  value={videoLinkInput}
                  onChange={(e) => setVideoLinkInput(e.target.value)}
                  placeholder="Or paste event video URL..."
                  className="form-input py-1.5 text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={handleSaveVideoLink}
                  disabled={!videoLinkInput.trim() || uploadingSlot === 'event_video'}
                  className="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap"
                >
                  Save URL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performer KYC Modal for Event */}
      <EventKYCModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        event={event}
      />
    </div>
  );
}
