"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { artistService } from '../../../services/artistService';
import { supabase } from '../../../lib/supabase/client';
import { MissingDetailsBanner } from '../../../components/dashboard/MissingDetailsBanner';
import {
  Film,
  Instagram,
  Youtube,
  Globe,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Music2,
  Upload,
  Video,
  Camera,
  Sparkles,
  Check,
} from 'lucide-react';

const MAX_GALLERY_PHOTOS = 15;
const MIN_VISIBLE_PHOTO_SLOTS = 4;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.startsWith('data:video/') ||
    /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url) ||
    url.includes('.r2.dev/')
  );
}

function getYouTubeEmbedThumb(url: string): string | null {
  try {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match?.[1]) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  } catch {
    // ignore
  }
  return null;
}

export default function PortfolioPage() {
  const { artist, refreshArtist, updateLocalArtist } = useArtistAuth();

  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [spotify, setSpotify] = useState('');
  const [website, setWebsite] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [videos, setVideos] = useState<string[]>([]);
  const [newVideoLink, setNewVideoLink] = useState('');

  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryMultiInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const isRealUuid = !!(artist?.id && UUID_REGEX.test(artist.id));

  // Hydrate fields from artist profile
  useEffect(() => {
    if (!artist) return;

    setInstagram(artist.instagram_url || '');
    setYoutube(artist.youtube_url || '');
    setSpotify(artist.spotify_url || '');
    setWebsite(artist.website_url || '');
    setProfileImage(artist.profile_image_url || '');
    setCoverImage(artist.cover_image_url || '');

    // Merge all saved videos (Cloudflare direct video + primary video + youtube_links)
    const combinedVideos: string[] = [];
    const pushUnique = (u?: string) => {
      if (u && u.trim() && !combinedVideos.includes(u.trim())) {
        combinedVideos.push(u.trim());
      }
    };
    pushUnique(artist.cloudflare_video_url);
    pushUnique(artist.video_url);
    (artist.youtube_links || []).forEach((l) => pushUnique(l));
    setVideos(combinedVideos);
  }, [artist]);

  // Fetch gallery images (Supabase for live UUIDs + localStorage fallback for demo/offline)
  useEffect(() => {
    async function loadGallery() {
      if (!artist?.id) return;
      const storageKey = `magnevents_artist_gallery_${artist.id}`;

      if (isRealUuid) {
        try {
          const { data } = await supabase
            .from('artist_images')
            .select('image_url')
            .eq('artist_id', artist.id)
            .order('display_order', { ascending: true });
          if (data && data.length > 0) {
            setGalleryImages(data.map((d: any) => d.image_url));
            return;
          }
        } catch {
          // Fall back to localStorage below
        }
      }

      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setGalleryImages(parsed);
              return;
            }
          }
        } catch {
          // ignore
        }
      }
    }
    loadGallery();
  }, [artist?.id, isRealUuid]);

  const persistGalleryLocally = (nextImages: string[]) => {
    if (artist?.id && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`magnevents_artist_gallery_${artist.id}`, JSON.stringify(nextImages));
      } catch {
        // ignore quota errors
      }
    }
  };

  // Upload file to Cloudflare R2 (artist-basic-details/) via /api/upload
  const uploadToR2 = async (file: File, category: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'basic');
    formData.append('category', category);
    formData.append('artistId', artist?.id || 'artist');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (res.ok && data.url) {
      return data.url as string;
    }

    // Safe base64 fallback for small images if R2 is unreachable
    if (file.type.startsWith('image/') && file.size < 4 * 1024 * 1024) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error(data.error || 'Upload failed'));
        reader.readAsDataURL(file);
      });
    }

    throw new Error(data.error || 'File upload failed.');
  };

  // 1. Cover Photo Upload (Mandatory)
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlot('cover');
    setError(null);
    setSuccess(null);
    try {
      const url = await uploadToR2(file, 'cover');
      setCoverImage(url);
      setSuccess('Cover photo uploaded to Cloudflare R2. Click Save Portfolio to confirm.');
    } catch (err: any) {
      setError(err.message || 'Could not upload cover photo.');
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  // Profile Avatar Upload (Optional)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlot('avatar');
    setError(null);
    setSuccess(null);
    try {
      const url = await uploadToR2(file, 'avatar');
      setProfileImage(url);
      setSuccess('Profile avatar uploaded. Click Save Portfolio to confirm.');
    } catch (err: any) {
      setError(err.message || 'Could not upload avatar photo.');
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  // 2. Gallery Photos Upload (1 Mandatory, 2nd/3rd/4th+ Optional)
  const handleGalleryFilesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    replaceSlotIndex?: number
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_GALLERY_PHOTOS - galleryImages.length;
    if (replaceSlotIndex === undefined && remainingSlots <= 0) {
      setError(`Maximum ${MAX_GALLERY_PHOTOS} photos allowed.`);
      e.target.value = '';
      return;
    }

    const toUpload =
      replaceSlotIndex !== undefined ? [files[0]] : files.slice(0, remainingSlots);

    setUploadingSlot(replaceSlotIndex !== undefined ? `gallery-${replaceSlotIndex}` : 'gallery');
    setError(null);
    setSuccess(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        const url = await uploadToR2(file, 'gallery');
        uploadedUrls.push(url);
      }

      let nextImages: string[];
      if (replaceSlotIndex !== undefined && replaceSlotIndex < galleryImages.length) {
        nextImages = [...galleryImages];
        nextImages[replaceSlotIndex] = uploadedUrls[0];
      } else {
        nextImages = [...galleryImages, ...uploadedUrls].slice(0, MAX_GALLERY_PHOTOS);
      }

      setGalleryImages(nextImages);
      persistGalleryLocally(nextImages);

      // Sync newly added image(s) to Supabase artist_images for real UUID artists
      if (isRealUuid && artist?.id) {
        try {
          await supabase.from('artist_images').insert(
            uploadedUrls.map((url, idx) => ({
              artist_id: artist.id,
              image_url: url,
              is_primary: galleryImages.length === 0 && idx === 0,
              display_order: galleryImages.length + idx + 1,
            }))
          );
        } catch {
          // Non-blocking — saved again on Save Portfolio
        }
      }

      setSuccess(
        `${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} uploaded to Cloudflare R2.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo(s).');
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const addGalleryImageByUrl = async () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (galleryImages.length >= MAX_GALLERY_PHOTOS) {
      setError(`Maximum ${MAX_GALLERY_PHOTOS} photos allowed.`);
      return;
    }
    const nextImages = [...galleryImages, trimmed];
    setGalleryImages(nextImages);
    persistGalleryLocally(nextImages);
    setNewImageUrl('');

    if (isRealUuid && artist?.id) {
      try {
        await supabase.from('artist_images').insert([
          {
            artist_id: artist.id,
            image_url: trimmed,
            is_primary: galleryImages.length === 0,
            display_order: nextImages.length,
          },
        ]);
      } catch {
        // Non-blocking
      }
    }
  };

  const removeGalleryImage = async (index: number) => {
    const targetUrl = galleryImages[index];
    const nextImages = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(nextImages);
    persistGalleryLocally(nextImages);

    if (isRealUuid && artist?.id && targetUrl) {
      try {
        await supabase
          .from('artist_images')
          .delete()
          .eq('artist_id', artist.id)
          .eq('image_url', targetUrl);
      } catch {
        // Non-blocking
      }
    }
  };

  // 3. Performance Videos Upload (1 Mandatory, More Optional)
  const handleVideoFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingSlot('video');
    setError(null);
    setSuccess(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        if (file.size > 100 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds 100 MB limit. Please upload a shorter clip or paste a YouTube link.`);
        }
        const url = await uploadToR2(file, 'video');
        uploadedUrls.push(url);
      }
      setVideos((prev) => [...prev, ...uploadedUrls]);
      setSuccess(
        `${uploadedUrls.length} performance video${uploadedUrls.length > 1 ? 's' : ''} uploaded to Cloudflare R2.`
      );
    } catch (err: any) {
      setError(err.message || 'Video upload failed.');
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const addVideoByLink = () => {
    const trimmed = newVideoLink.trim();
    if (!trimmed) return;
    if (videos.includes(trimmed)) {
      setNewVideoLink('');
      return;
    }
    setVideos((prev) => [...prev, trimmed]);
    setNewVideoLink('');
    setError(null);
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation Flags
  const hasCover = Boolean(coverImage.trim());
  const hasMandatoryPhoto = galleryImages.length >= 1;
  const hasMandatoryVideo = videos.length >= 1;
  const allMandatoryComplete = hasCover && hasMandatoryPhoto && hasMandatoryVideo;

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist?.id) return;
    setError(null);
    setSuccess(null);

    const missing: string[] = [];
    if (!hasCover) missing.push('Cover Photo');
    if (!hasMandatoryPhoto) missing.push('at least 1 Artist Photo');
    if (!hasMandatoryVideo) missing.push('at least 1 Performance Video');

    if (missing.length > 0) {
      setError(`Required before saving: Please upload ${missing.join(', ')}. Additional photos and videos are optional.`);
      return;
    }

    setSaving(true);

    const firstCloudflareVideo = videos.find((v) => isDirectVideoUrl(v)) || '';
    const updates = {
      instagram_url: instagram,
      youtube_url: youtube,
      spotify_url: spotify,
      website_url: website,
      profile_image_url: profileImage || galleryImages[0] || coverImage,
      cover_image_url: coverImage,
      video_url: videos[0] || '',
      cloudflare_video_url: firstCloudflareVideo,
      youtube_links: videos,
    };

    try {
      persistGalleryLocally(galleryImages);

      if (isRealUuid) {
        await artistService.updateProfile(artist.id, updates);

        // Sync full gallery order to artist_images
        try {
          await supabase.from('artist_images').delete().eq('artist_id', artist.id);
          if (galleryImages.length > 0) {
            await supabase.from('artist_images').insert(
              galleryImages.map((url, idx) => ({
                artist_id: artist.id,
                image_url: url,
                is_primary: idx === 0,
                display_order: idx + 1,
              }))
            );
          }
        } catch {
          // Non-blocking
        }

        await refreshArtist();
      } else {
        // Demo mode: persist cleanly in AuthContext & localStorage
        updateLocalArtist(updates);
      }

      setSuccess('Cover photo, artist gallery, videos & social links saved successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      // Fall back to local artist update so uploads are never lost
      updateLocalArtist(updates);
      setError(err.message || 'Could not sync with database, saved locally in session.');
    } finally {
      setSaving(false);
    }
  };

  // Build visible photo slots (minimum 4 slots: #1 Mandatory, #2-#4 Optional, plus any extras)
  const visiblePhotoSlotCount = Math.max(MIN_VISIBLE_PHOTO_SLOTS, galleryImages.length);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 font-sans">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Portfolio & Reels
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Photos, live performance showreels, and media links.
        </p>
      </div>

      <MissingDetailsBanner artist={artist} currentPage="portfolio" />

      {/* Live Requirement Checklist Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            hasCover
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                hasCover ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {hasCover ? <Check className="w-4 h-4" /> : <Camera className="w-3.5 h-3.5" />}
            </div>
            <div>
              <div className="text-xs font-extrabold">Cover Photo *</div>
              <div className="text-[11px] opacity-80">
                {hasCover ? 'Uploaded (16:9 Banner)' : 'Mandatory • Required'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80">
            {hasCover ? 'Done' : 'Required'}
          </span>
        </div>

        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            hasMandatoryPhoto
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                hasMandatoryPhoto ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {hasMandatoryPhoto ? <Check className="w-4 h-4" /> : <ImageIcon className="w-3.5 h-3.5" />}
            </div>
            <div>
              <div className="text-xs font-extrabold">Artist Photos *</div>
              <div className="text-[11px] opacity-80">
                {galleryImages.length} uploaded • 1 mandatory, 3–4+ optional
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80">
            {galleryImages.length}/{MAX_GALLERY_PHOTOS}
          </span>
        </div>

        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            hasMandatoryVideo
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                hasMandatoryVideo ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {hasMandatoryVideo ? <Check className="w-4 h-4" /> : <Video className="w-3.5 h-3.5" />}
            </div>
            <div>
              <div className="text-xs font-extrabold">Performance Videos *</div>
              <div className="text-[11px] opacity-80">
                {videos.length} added • 1 mandatory, more optional
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80">
            {videos.length} Video{videos.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSavePortfolio} className="space-y-6">
        {/* SECTION 1: COVER PHOTO (MANDATORY) + PROFILE AVATAR (OPTIONAL) */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                1. Artist Cover Photo & Avatar
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider">
              Cover Photo Mandatory *
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Cover Photo (2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Artist Cover Photo (16:9 Landscape) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingSlot === 'cover'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold transition-colors"
                >
                  {uploadingSlot === 'cover' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{coverImage ? 'Replace Cover' : 'Upload Cover Photo'}</span>
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </div>

              {coverImage ? (
                <div className="relative group rounded-2xl overflow-hidden aspect-[16/9] max-h-60 w-full border border-slate-200 bg-slate-100 shadow-xs">
                  <img
                    src={coverImage}
                    alt="Artist Cover Photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent p-3 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                      Cover Photo Ready
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-[11px] font-bold"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white"
                        title="Remove cover photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingSlot === 'cover'}
                  className="w-full aspect-[16/9] max-h-56 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/40 hover:bg-sky-50 transition-colors flex flex-col items-center justify-center gap-2 text-center p-4"
                >
                  {uploadingSlot === 'cover' ? (
                    <Loader2 className="w-7 h-7 text-sky-600 animate-spin" />
                  ) : (
                    <Upload className="w-7 h-7 text-sky-600" />
                  )}
                  <div className="text-xs font-extrabold text-slate-800">
                    Click to Upload Artist Cover Photo
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Landscape 16:9 image (JPG, PNG, WebP) • Uploaded to Cloudflare R2
                  </div>
                </button>
              )}

              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Or paste cover photo URL (https://...)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500"
              />
            </div>

            {/* Profile Avatar (1 col) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Profile Avatar <span className="text-slate-400 font-medium">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingSlot === 'avatar'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                >
                  {uploadingSlot === 'avatar' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  <span>Upload</span>
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col items-center justify-center gap-3 min-h-[180px]">
                {profileImage ? (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                    <img src={profileImage} alt="Avatar preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setProfileImage('')}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/65 text-white hover:bg-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-sky-400 bg-white flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-sky-600 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Add Avatar</span>
                  </button>
                )}
                <p className="text-[11px] text-slate-500 text-center">
                  Square headshot shown on your artist badge
                </p>
              </div>

              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="Or paste avatar URL (https://...)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ARTIST PHOTOS (3-4+ IMAGES: 1 MANDATORY, EXTRA OPTIONAL) */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  2. Artist Stage Photos (3–4+ Images)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase">
                  1 Mandatory *
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                  2nd, 3rd, 4th+ Optional
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload at least 1 high-resolution stage photo. Adding 3–4+ photos increases client bookings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                {galleryImages.length} / {MAX_GALLERY_PHOTOS}
              </span>
              <button
                type="button"
                onClick={() => galleryMultiInputRef.current?.click()}
                disabled={uploadingSlot === 'gallery' || galleryImages.length >= MAX_GALLERY_PHOTOS}
                className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5"
              >
                {uploadingSlot === 'gallery' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Upload Photos</span>
              </button>
              <input
                ref={galleryMultiInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleGalleryFilesUpload(e)}
              />
            </div>
          </div>

          {/* 4+ Numbered Photo Slots Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {Array.from({ length: visiblePhotoSlotCount }).map((_, idx) => {
              const url = galleryImages[idx];
              const isMandatorySlot = idx === 0;
              const isSlotUploading = uploadingSlot === `gallery-${idx}`;

              if (url) {
                return (
                  <div
                    key={`${idx}-${url}`}
                    className="relative group rounded-2xl overflow-hidden aspect-[4/3] border border-slate-200 bg-slate-100 shadow-xs"
                  >
                    <img
                      src={url}
                      alt={`Artist Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm ${
                        isMandatorySlot
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-900/75 text-white'
                      }`}
                    >
                      {isMandatorySlot ? 'Photo 1 • Primary' : `Photo ${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/65 hover:bg-rose-600 text-white transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <label
                  key={`empty-slot-${idx}`}
                  className={`cursor-pointer rounded-2xl aspect-[4/3] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 p-3 text-center transition-all ${
                    isMandatorySlot
                      ? 'border-sky-400 bg-sky-50/50 hover:bg-sky-50 text-sky-900'
                      : 'border-slate-200 bg-slate-50/60 hover:border-sky-300 hover:bg-sky-50/30 text-slate-600'
                  }`}
                >
                  {isSlotUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                  ) : (
                    <Plus
                      className={`w-5 h-5 ${isMandatorySlot ? 'text-sky-600' : 'text-slate-400'}`}
                    />
                  )}
                  <span className="text-xs font-extrabold">
                    Photo {idx + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      isMandatorySlot
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-white border border-slate-200 text-slate-500'
                    }`}
                  >
                    {isMandatorySlot ? 'Mandatory *' : 'Optional'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleGalleryFilesUpload(e)}
                  />
                </label>
              );
            })}

            {/* Extra "+ Add More Photo" tile when 4+ photos already uploaded */}
            {galleryImages.length >= MIN_VISIBLE_PHOTO_SLOTS &&
              galleryImages.length < MAX_GALLERY_PHOTOS && (
                <button
                  type="button"
                  onClick={() => galleryMultiInputRef.current?.click()}
                  className="rounded-2xl aspect-[4/3] border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/40 flex flex-col items-center justify-center gap-1.5 text-slate-600 transition-colors"
                >
                  <Plus className="w-5 h-5 text-sky-600" />
                  <span className="text-xs font-bold">Add Photo</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                </button>
              )}
          </div>

          {/* Optional Paste URL Bar */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Or paste an image URL (https://.../stage-photo.jpg)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 flex-1 min-w-0"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGalleryImageByUrl())}
            />
            <button
              type="button"
              onClick={addGalleryImageByUrl}
              className="btn-secondary whitespace-nowrap min-h-[38px] text-xs w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add URL</span>
            </button>
          </div>
        </div>

        {/* SECTION 3: PERFORMANCE VIDEOS (1 MANDATORY, MORE OPTIONAL) */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Film className="w-4 h-4 text-sky-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  3. Performance Videos & Showreels
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase">
                  1 Mandatory *
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                  More Optional
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload live video clips (.mp4, .mov, .webm) directly to Cloudflare R2 or add YouTube links.
              </p>
            </div>

            <button
              type="button"
              onClick={() => videoFileInputRef.current?.click()}
              disabled={uploadingSlot === 'video'}
              className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5"
            >
              {uploadingSlot === 'video' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{uploadingSlot === 'video' ? 'Uploading Video...' : 'Upload Video File'}</span>
            </button>
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={handleVideoFilesUpload}
            />
          </div>

          {/* Add YouTube / Cloudflare Video Link Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={newVideoLink}
              onChange={(e) => setNewVideoLink(e.target.value)}
              placeholder="Or paste YouTube / Cloudflare video link (https://youtube.com/watch?v=...)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 flex-1 min-w-0"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVideoByLink())}
            />
            <button
              type="button"
              onClick={addVideoByLink}
              className="btn-secondary whitespace-nowrap min-h-[38px] text-xs w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </button>
          </div>

          {/* Video Cards / Empty Slots */}
          {videos.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                disabled={uploadingSlot === 'video'}
                className="p-6 rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50/50 hover:bg-sky-50 flex flex-col items-center justify-center gap-2 text-center transition-colors"
              >
                <Video className="w-6 h-6 text-sky-600" />
                <div className="text-xs font-extrabold text-slate-900">
                  Upload Video 1 <span className="text-rose-500">*</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                  Mandatory • .mp4 / .mov / .webm
                </span>
              </button>

              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                disabled={uploadingSlot === 'video'}
                className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:border-sky-300 hover:bg-sky-50/30 flex flex-col items-center justify-center gap-2 text-center transition-colors"
              >
                <Plus className="w-6 h-6 text-slate-400" />
                <div className="text-xs font-extrabold text-slate-700">Upload Video 2+</div>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  Optional • Extra Showcase
                </span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {videos.map((vidUrl, idx) => {
                const isDirect = isDirectVideoUrl(vidUrl);
                const ytThumb = !isDirect ? getYouTubeEmbedThumb(vidUrl) : null;
                return (
                  <div
                    key={`${idx}-${vidUrl}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs flex flex-col"
                  >
                    {isDirect ? (
                      <video
                        src={vidUrl}
                        controls
                        preload="metadata"
                        className="w-full aspect-video bg-slate-950 object-cover"
                      />
                    ) : ytThumb ? (
                      <a
                        href={vidUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block aspect-video bg-slate-900 overflow-hidden group"
                      >
                        <img
                          src={ytThumb}
                          alt={`Video ${idx + 1}`}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <span className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                            <Youtube className="w-3.5 h-3.5" />
                            <span>Watch on YouTube</span>
                          </span>
                        </div>
                      </a>
                    ) : (
                      <div className="aspect-video bg-slate-900/90 flex flex-col items-center justify-center gap-2 p-4 text-center text-white">
                        <Film className="w-7 h-7 text-sky-400" />
                        <span className="text-[11px] text-slate-300 break-all line-clamp-2">
                          {vidUrl}
                        </span>
                      </div>
                    )}

                    <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              idx === 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {idx === 0 ? 'Video 1 • Mandatory' : `Video ${idx + 1} • Optional`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-1">{vidUrl}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <a
                          href={vidUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                          title="Open video"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => removeVideo(idx)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                          title="Remove video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Always show an Optional "+ Add Another Video" tile */}
              <button
                type="button"
                onClick={() => videoFileInputRef.current?.click()}
                disabled={uploadingSlot === 'video'}
                className="min-h-[180px] rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/30 flex flex-col items-center justify-center gap-2 text-center p-4 transition-colors"
              >
                {uploadingSlot === 'video' ? (
                  <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
                ) : (
                  <Plus className="w-6 h-6 text-sky-600" />
                )}
                <span className="text-xs font-extrabold text-slate-800">
                  Add Another Video
                </span>
                <span className="text-[11px] text-slate-500">
                  Optional • Upload .mp4 / .mov or paste link above
                </span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION 4: SOCIAL CHANNELS */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Globe className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              4. Social Links (Optional)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-slate-500" />
                <span>Instagram Profile</span>
              </label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/username"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-slate-500" />
                <span>YouTube Channel</span>
              </label>
              <input
                type="url"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@channel"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Spotify / Apple Music</span>
              </label>
              <input
                type="url"
                value={spotify}
                onChange={(e) => setSpotify(e.target.value)}
                placeholder="https://open.spotify.com/artist/..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Website / Linktree</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://artistname.com"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer Save Bar */}
        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {allMandatoryComplete ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                All mandatory media ready (Cover + {galleryImages.length} Photo{galleryImages.length === 1 ? '' : 's'} + {videos.length} Video{videos.length === 1 ? '' : 's'})
              </span>
            ) : (
              <span className="text-amber-700 font-semibold">
                Required: Cover Photo, at least 1 Stage Photo &amp; at least 1 Performance Video.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !!uploadingSlot}
            className="btn-primary min-h-[42px] px-6 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Portfolio</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
