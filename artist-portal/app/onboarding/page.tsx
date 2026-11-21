"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useArtistAuth } from '../../lib/auth/authContext';
import { artistService } from '../../services/artistService';
import { supabase } from '../../lib/supabase/client';
import {
  User,
  Mic2,
  Music,
  Clock,
  CreditCard,
  Film,
  ShieldCheck,
  Building,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Instagram,
  Youtube,
  Globe,
  Music2,
  Image as ImageIcon,
  ExternalLink,
  Video,
  MapPin,
} from 'lucide-react';

const CATEGORIES = [
  'Solo Singer',
  'Live Band',
  'Acoustic Duo',
  'DJ',
  'Instrumentalist',
  'Sufi Singer',
  'Classical Musician',
  'Wedding Performer',
  'Anchor / Host',
  'Comedian',
];

const GENRES = [
  'Bollywood',
  'Bollywood Retro',
  'Sufi',
  'Punjabi Pop',
  'Western Pop',
  'Classic Rock',
  'Ghazals',
  'Classical Fusion',
  'EDM / Commercial',
  'English Jazz',
  'Indie Acoustic',
  'Folk & Regional',
];

const LANGUAGES = [
  'Hindi',
  'English',
  'Punjabi',
  'Urdu',
  'Bengali',
  'Gujarati',
  'Marathi',
  'Tamil',
  'Telugu',
  'Spanish',
];

const COVERAGE_LOCATIONS = [
  'All India (Pan-India)',
  'Delhi NCR',
  'Mumbai',
  'Bengaluru',
  'Jaipur',
  'Udaipur',
  'Goa',
  'Chandigarh',
  'Lucknow',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Chennai',
  'Ahmedabad',
  'Gandhinagar',
  'Indore',
  'Dehradun',
  'Agra',
  'Varanasi',
  'Jodhpur',
  'Surat',
];

const STEPS = [
  { id: 1, title: 'Identity & Act', icon: User },
  { id: 2, title: 'Repertoire & Bio', icon: Music },
  { id: 3, title: 'Pricing & Logistics', icon: CreditCard },
  { id: 4, title: 'Portfolio & Media', icon: Film },
];

export default function ArtistOnboardingPage() {
  const { user, artist, loading, refreshArtist, updateLocalArtist } = useArtistAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const [newYoutubeLink, setNewYoutubeLink] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [customLocation, setCustomLocation] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Identity & Act (Only name and email will be prefilled; all other fields are blank for user to fill)
    name: '',
    stage_name: '',
    phone_no: '',
    email: '',
    city: '',
    state: '',
    country: 'India',
    experience_years: '' as any,
    category: '',
    sub_category: '',

    // Step 2: Repertoire, Coverage Area & Bio (Blank for user to choose)
    genres: [] as string[],
    languages: [] as string[],
    serviceable_cities: [] as string[],
    bio: '',

    // Step 3: Pricing & Logistics (Blank for user to fill)
    starting_price: '' as any,
    solo_price: '' as any,
    duo_price: '' as any,
    band_price: '' as any,
    hourly_price: '' as any,
    travel_policy: '',
    min_duration: '' as any,
    max_duration: '' as any,
    travel_readiness: 'pan_india',
    sound_system: false,
    tech_requirements: '',

    // Step 4: Portfolio, Media & Socials
    profile_image_url: '',
    cover_image_url: '',
    gallery_images: [] as string[],
    youtube_links: [] as string[],
    audio_samples: [] as string[],
    instagram_url: '',
    youtube_url: '',
    spotify_url: '',
    website_url: '',

    // Step 5: KYC & Settlement Bank
    legal_name: '',
    id_type: 'aadhaar',
    id_number_masked: '',
    pan_or_tax_id: '',
    id_document_url: '',
    address_proof_url: '',
    bank_holder: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
  });

  // Pre-fill from newly registered user: ONLY Name and Gmail!
  // All other fields start empty so the user fills them himself.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const stepParam = parseInt(urlParams.get('step') || '', 10);
      if (stepParam >= 1 && stepParam <= 4) {
        setStep(stepParam);
      }
    }

    const initialName =
      artist?.name ||
      user?.user_metadata?.full_name ||
      '';
    const initialEmail = artist?.email || user?.email || '';

    setFormData((prev) => ({
      ...prev,
      name: prev.name || initialName,
      email: prev.email || initialEmail,
      legal_name: prev.legal_name || initialName,
      // Keep everything else user-driven!
    }));
  }, [artist, user]);

  // Calculate live progress %
  const calculateLiveProgress = () => {
    let score = 20; // Account created
    if (formData.name && formData.stage_name && formData.city && formData.category) score += 20;
    if (formData.genres.length > 0 && formData.bio.trim().length >= 15) score += 15;
    if (formData.starting_price > 0) score += 15;
    if (formData.profile_image_url || formData.youtube_links.length > 0) score += 15;
    if (formData.legal_name && (formData.id_document_url || formData.id_number_masked)) score += 15;
    return Math.min(100, score);
  };

  const progress = calculateLiveProgress();

  const toggleGenre = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const toggleCoverageLocation = (loc: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceable_cities: prev.serviceable_cities.includes(loc)
        ? prev.serviceable_cities.filter((c) => c !== loc)
        : [...prev.serviceable_cities, loc],
    }));
  };

  const addCustomCoverageLocation = () => {
    const trimmed = customLocation.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      if (prev.serviceable_cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        serviceable_cities: [...prev.serviceable_cities, trimmed],
      };
    });
    setCustomLocation('');
  };

  const addYoutubeLink = () => {
    if (!newYoutubeLink.trim()) return;
    setFormData((prev) => ({
      ...prev,
      youtube_links: [...prev.youtube_links, newYoutubeLink.trim()],
    }));
    setNewYoutubeLink('');
  };

  const removeYoutubeLink = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      youtube_links: prev.youtube_links.filter((_, i) => i !== idx),
    }));
  };

  const addAudioTrack = () => {
    if (!newAudioUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      audio_samples: [...prev.audio_samples, newAudioUrl.trim()],
    }));
    setNewAudioUrl('');
  };

  const removeAudioTrack = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      audio_samples: prev.audio_samples.filter((_, i) => i !== idx),
    }));
  };

  // Direct upload to Cloudflare R2 via /api/upload
  // Basic profile/cover -> artist-basic-details/ ; Aadhaar/Address KYC -> artist-private-kyc/
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'profile_image_url' | 'cover_image_url' | 'id_document_url' | 'address_proof_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    setError(null);

    try {
      const isPrivateDoc = field === 'id_document_url' || field === 'address_proof_url';
      const category =
        field === 'profile_image_url'
          ? 'profile'
          : field === 'cover_image_url'
          ? 'cover'
          : field === 'id_document_url'
          ? formData.id_type || 'aadhaar'
          : 'address-proof';

      const body = new FormData();
      body.append('file', file);
      body.append('folder', isPrivateDoc ? 'private' : 'basic');
      body.append('category', category);
      body.append('artistId', artist?.id || formData.name || 'new-artist');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'File upload failed');
      }

      setFormData((prev) => ({ ...prev, [field]: data.url }));
    } catch (err: any) {
      setError(err.message || 'Could not upload file. You can paste a direct URL instead.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  // Multi-image gallery upload -> artist-basic-details/gallery/
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 15 - formData.gallery_images.length;
    if (remaining <= 0) {
      setError('Maximum 15 artist photos allowed.');
      e.target.value = '';
      return;
    }

    setUploadingField('gallery_images');
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, remaining)) {
        const body = new FormData();
        body.append('file', file);
        body.append('folder', 'basic');
        body.append('category', 'gallery');
        body.append('artistId', artist?.id || formData.name || 'new-artist');

        const res = await fetch('/api/upload', { method: 'POST', body });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || 'Photo upload failed');
        uploaded.push(data.url);
      }

      setFormData((prev) => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...uploaded].slice(0, 15),
      }));
    } catch (err: any) {
      setError(err.message || 'Could not upload gallery photo(s).');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const removeGalleryPhoto = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== idx),
    }));
  };

  // Direct performance video file upload -> artist-basic-details/video/
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingField('video_upload');
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        if (file.size > 100 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds 100 MB. Please upload a shorter clip or paste a YouTube link.`);
        }
        const body = new FormData();
        body.append('file', file);
        body.append('folder', 'basic');
        body.append('category', 'video');
        body.append('artistId', artist?.id || formData.name || 'new-artist');

        const res = await fetch('/api/upload', { method: 'POST', body });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || 'Video upload failed');
        uploaded.push(data.url);
      }

      setFormData((prev) => ({
        ...prev,
        youtube_links: [...prev.youtube_links, ...uploaded],
      }));
    } catch (err: any) {
      setError(err.message || 'Could not upload video file.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

    const handleNextStep = (e?: React.FormEvent) => {
    setError(null);

    // STEP 1 VALIDATION: All fields mandatory
    if (step === 1) {
      const missingStep1: string[] = [];
      if (!formData.name.trim()) missingStep1.push('Legal Full Name');
      if (!formData.stage_name.trim()) {
        missingStep1.push('Stage / Act Name');
      } else if (formData.name.trim() && formData.stage_name.trim().toLowerCase() === formData.name.trim().toLowerCase()) {
        setError('Stage / Act Name must be different from your Legal Full Name. Please enter your stage persona, DJ title, or band moniker (e.g. DJ Aarav, The Acoustic Project, etc.).');
        return;
      }
      if (!formData.phone_no.trim()) missingStep1.push('Contact Phone / WhatsApp');
      if (!formData.email.trim()) missingStep1.push('Email Address');
      if (!formData.category.trim()) missingStep1.push('Primary Category');
      if (!formData.sub_category.trim()) missingStep1.push('Specialty / Sub-Category');
      if (!formData.city.trim()) missingStep1.push('Base City');
      if (!formData.state.trim()) missingStep1.push('State / Region');
      if (formData.experience_years === undefined || formData.experience_years === null || formData.experience_years < 0) {
        missingStep1.push('Years of Experience');
      }

      if (missingStep1.length > 0) {
        setError(`All fields are mandatory. Please provide: ${missingStep1.join(', ')}.`);
        return;
      }

      // Phone validation (at least 10 digits)
      const digitsOnly = formData.phone_no.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setError('Please enter a valid 10-digit mobile number for Contact Phone / WhatsApp.');
        return;
      }

      // Email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    // STEP 2 VALIDATION: All fields mandatory
    if (step === 2) {
      const missingStep2: string[] = [];
      if (!formData.genres || formData.genres.length === 0) missingStep2.push('at least 1 Musical Genre');
      if (!formData.languages || formData.languages.length === 0) missingStep2.push('at least 1 Performance Language');
      if (!formData.serviceable_cities || formData.serviceable_cities.length === 0) missingStep2.push('at least 1 Performance Coverage Area');
      if (!formData.bio.trim() || formData.bio.trim().length < 20) missingStep2.push('Artist Biography (minimum 20 characters)');

      if (missingStep2.length > 0) {
        setError(`All fields are mandatory. Please complete: ${missingStep2.join(', ')}.`);
        return;
      }
    }

    // STEP 3 VALIDATION: All fields mandatory
    if (step === 3) {
      const missingStep3: string[] = [];
      if (!formData.starting_price || formData.starting_price <= 0) missingStep3.push('Solo / Starting Rate (₹)');
      if (!formData.duo_price || formData.duo_price <= 0) missingStep3.push('Duo Act Rate (₹)');
      if (!formData.band_price || formData.band_price <= 0) missingStep3.push('Full Band Show Rate (₹)');
      if (!formData.hourly_price || formData.hourly_price <= 0) missingStep3.push('Hourly Overtime Rate (₹)');
      if (!formData.min_duration || formData.min_duration <= 0) missingStep3.push('Min Set Duration');
      if (!formData.max_duration || formData.max_duration <= 0) missingStep3.push('Max Set Duration');
      if (!formData.tech_requirements.trim()) missingStep3.push('Technical Stage Rider');
      if (!formData.travel_policy.trim()) missingStep3.push('Travel & Hospitality Policy');

      if (missingStep3.length > 0) {
        setError(`All fields are mandatory. Please provide: ${missingStep3.join(', ')}.`);
        return;
      }

      if (Number(formData.max_duration) < Number(formData.min_duration)) {
        setError('Max Set Duration must be greater than or equal to Min Set Duration.');
        return;
      }
    }

    // STEP 4 VALIDATION: All fields mandatory
    if (step === 4) {
      const missingStep4: string[] = [];
      if (!formData.cover_image_url.trim()) missingStep4.push('Cover Banner Photo');
      if (!formData.profile_image_url.trim()) missingStep4.push('Profile Avatar');
      if (!formData.gallery_images || formData.gallery_images.length < 1) missingStep4.push('at least 1 Stage Photo in Gallery');
      if (!formData.youtube_links || formData.youtube_links.length < 1) missingStep4.push('at least 1 Performance Video / Reel');
      if (!formData.instagram_url.trim()) missingStep4.push('Instagram Profile Handle');

      if (missingStep4.length > 0) {
        setError(`All fields are mandatory. Please provide: ${missingStep4.join(', ')}.`);
        return;
      }

      if (e) e.preventDefault();
      handleFinalSubmit(e || ({} as any));
      return;
    }

    if (step < 4) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const updates: any = {
      name: formData.name.trim() || 'Artist',
      stage_name: formData.stage_name.trim() || formData.name.trim() || 'Artist',
      phone_no: formData.phone_no.trim(),
      email: formData.email.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      country: formData.country.trim(),
      experience_years: Number(formData.experience_years) || 0,
      category: formData.category,
      sub_category: formData.sub_category.trim(),
      genres: formData.genres,
      languages: formData.languages,
      bio: formData.bio.trim(),
      price_min: Number(formData.starting_price) || 15000,
      price_max: Number(formData.band_price) || 45000,
      profile_image_url: formData.profile_image_url.trim() || formData.gallery_images[0] || formData.cover_image_url.trim() || undefined,
      cover_image_url: formData.cover_image_url.trim() || undefined,
      youtube_links: formData.youtube_links,
      video_url: formData.youtube_links[0] || undefined,
      cloudflare_video_url:
        formData.youtube_links.find((u) => /\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i.test(u) || u.includes('.r2.dev/')) ||
        undefined,
      audio_samples: formData.audio_samples,
      instagram_url: formData.instagram_url.trim() || undefined,
      youtube_url: formData.youtube_url.trim() || undefined,
      spotify_url: formData.spotify_url.trim() || undefined,
      website_url: formData.website_url.trim() || undefined,
      submitted_pricing: {
        starting_price: Number(formData.starting_price) || 15000,
        solo_price: Number(formData.solo_price) || Number(formData.starting_price) || 15000,
        duo_price: Number(formData.duo_price) || 25000,
        band_price: Number(formData.band_price) || 45000,
        hourly_price: Number(formData.hourly_price) || 5000,
        travel_charges_policy: formData.travel_policy.trim(),
      },
      performance_details: {
        min_duration_minutes: Number(formData.min_duration) || 60,
        max_duration_minutes: Number(formData.max_duration) || 180,
        sound_system_provided: formData.sound_system,
        technical_requirements: formData.tech_requirements.trim(),
        travel_readiness: formData.travel_readiness as any,
        serviceable_cities:
          formData.serviceable_cities.length > 0
            ? formData.serviceable_cities
            : [formData.city.trim()].filter(Boolean),
      },
      verification_documents: {
        legal_name: formData.legal_name.trim() || formData.name.trim(),
        id_type: formData.id_type as any,
        id_number_masked: formData.id_number_masked.trim(),
        pan_or_tax_id: formData.pan_or_tax_id.trim().toUpperCase(),
        id_document_url: formData.id_document_url.trim(),
        address_proof_url: formData.address_proof_url.trim(),
      },
      profile_completion: progress,
      verification_status: 'pending',
    };

    try {
      // Save bank details & gallery locally for pre-fill
      if (typeof window !== 'undefined') {
        if (artist?.id && formData.gallery_images.length > 0) {
          localStorage.setItem(
            `magnevents_artist_gallery_${artist.id}`,
            JSON.stringify(formData.gallery_images)
          );
        }
        localStorage.setItem(
          'magnevents_artist_bank_details',
          JSON.stringify({
            account_holder: formData.bank_holder || formData.name,
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            ifsc_code: formData.ifsc_code.toUpperCase(),
            upi_id: formData.upi_id,
          })
        );
        document.cookie = 'artist_session_active=true; path=/; max-age=604800';
      }

      // Immediately update local auth state so dashboard reflects all entered details
      updateLocalArtist(updates);

      // Sync to Supabase if we have a real DB artist ID
      if (artist?.id && !artist.id.startsWith('local-') && !artist.id.startsWith('demo-')) {
        try {
          await artistService.updateProfile(artist.id, updates);
          if (formData.gallery_images.length > 0) {
            await supabase.from('artist_images').delete().eq('artist_id', artist.id);
            await supabase.from('artist_images').insert(
              formData.gallery_images.map((url, idx) => ({
                artist_id: artist.id,
                image_url: url,
                is_primary: idx === 0,
                display_order: idx + 1,
              }))
            );
          }
          await artistService.submitForVerification(artist.id);
          await refreshArtist();
        } catch (dbErr) {
          console.warn('Supabase sync deferred (saved locally):', dbErr);
        }
      }

      setCompleted(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while saving your profile.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Preparing Onboarding...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col relative overflow-x-hidden font-sans">
      {/* Subtle Admin Portal Ambient Blobs */}
      <div className="fixed top-[-15%] left-[-10%] w-[45%] h-[45%] bg-indigo-200/20 rounded-full pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-sky-200/20 rounded-full pointer-events-none" />

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-slate-200 flex-shrink-0">
              <img
                src="/logo.webp"
                alt="Magnevents Logo"
                width={32}
                height={32}
                className="h-full w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 block leading-none">
                Magne<span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">vents</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
                Artist Onboarding
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Profile Strength
              </span>
              <span className="text-xs font-black text-sky-600">{progress}%</span>
            </div>
            <Link
              href="/dashboard"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Skip for now →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Onboarding Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Page Heading */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Build Your Performer Profile
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Fill out your stage identity, pricing, media reels, and verification details to go live on Magnevents.
            </p>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="mb-6">
          <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Interactive 5-Step Pill Stepper (Admin Portal Pill Style) */}
        <div className="flex p-1.5 bg-slate-200/60 backdrop-blur-md rounded-[22px] border border-white items-center overflow-x-auto max-w-full gap-1 mb-6 shadow-xs">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < step) {
                    setError(null);
                    setStep(s.id);
                  } else if (s.id > step) {
                    handleNextStep();
                  }
                }}
                className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-[16px] text-[11px] font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-sky-600 shadow-sm border border-slate-100 font-black'
                    : isDone
                    ? 'text-emerald-700 hover:bg-white/50'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                )}
                <span>{s.id}. {s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {completed && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>All artist details saved! Redirecting you to your Performer Dashboard...</span>
          </div>
        )}

        {/* Main Form Luxe Card */}
        <form onSubmit={handleFinalSubmit} className="luxe-card p-4 sm:p-6 md:p-8 space-y-6">
          {/* ================= STEP 1: IDENTITY & ACT ================= */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Identity, Category & Base Location
                  </h2>
                  <p className="text-xs text-slate-500">Basic details shown to prospective event hosts</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                <span>All fields marked with <strong className="text-rose-600">*</strong> are mandatory for verification and live approval.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Legal Full Name <span className="text-rose-500 font-bold">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name as on Govt ID"
                    className="form-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Stage / Act Name <span className="text-rose-500 font-bold">*</span></label>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Must be different from Legal Name
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.stage_name}
                    onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                    placeholder="e.g. DJ Aarav, The Acoustic Project, Sufi Soul"
                    className={`form-input ${
                      formData.stage_name && formData.name && formData.stage_name.trim().toLowerCase() === formData.name.trim().toLowerCase()
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-200'
                        : ''
                    }`}
                  />
                  {formData.stage_name && formData.name && formData.stage_name.trim().toLowerCase() === formData.name.trim().toLowerCase() ? (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      <span>Stage Name cannot be identical to Legal Name. Please use your stage moniker or DJ/band name.</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Public performer name displayed to clients (e.g. DJ Chinna, Soul Strings).
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Contact Phone / WhatsApp <span className="text-rose-500 font-bold">*</span></label>
                  <input
                    type="tel"
                    required
                    value={formData.phone_no}
                    onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Email Address <span className="text-rose-500 font-bold">*</span></label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="artist@example.com"
                    className="form-input bg-white"
                  />
                </div>

                <div>
                  <label className="form-label">Primary Category <span className="text-rose-500 font-bold">*</span></label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-input"
                  >
                    <option value="">-- Select Your Performance Category * --</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Specialty / Sub-Category <span className="text-rose-500 font-bold">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                    placeholder="e.g. Bollywood Unplugged, Sufi Rock, Sangeet Specialist"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Base City <span className="text-rose-500 font-bold">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Delhi NCR, Mumbai, Bengaluru"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">State / Region <span className="text-rose-500 font-bold">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Delhi, Maharashtra, Karnataka"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Years of Live Stage Experience <span className="text-rose-500 font-bold">*</span></label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="50"
                    value={formData.experience_years ?? ''}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value === '' ? '' : Number(e.target.value) })}
                    placeholder="e.g. 3"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: REPERTOIRE & BIO ================= */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Musical Repertoire & Biography
                  </h2>
                  <p className="text-xs text-slate-500">Select genres, languages, and tell clients about your live act</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                <span>All sections in this step are <strong>strictly mandatory</strong>. You must select your genres, performance languages, coverage areas, and write your biography to proceed.</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label mb-0">Select Genres You Perform <span className="text-rose-500 font-bold">*</span></label>
                  {formData.genres.length === 0 ? (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                      At least 1 genre required *
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                      {formData.genres.length} Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-2">Click genres to select. All new profiles start with zero pre-selections.</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {GENRES.map((g) => {
                    const selected = formData.genres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          selected
                            ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label mb-0">Performance Languages <span className="text-rose-500 font-bold">*</span></label>
                  {formData.languages.length === 0 ? (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                      At least 1 language required *
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                      {formData.languages.length} Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-2">Select all languages you perform live in.</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {LANGUAGES.map((l) => {
                    const selected = formData.languages.includes(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleLanguage(l)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          selected
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Performance Coverage Locations (Where Artist Can Easily Perform) */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="form-label mb-0 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Performance Coverage Locations (Where You Can Easily Perform) <strong className="text-rose-500">*</strong></span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Select all cities or areas you easily travel to and cover for live gigs.
                    </p>
                  </div>
                  {formData.serviceable_cities.length === 0 ? (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                      At least 1 coverage city required *
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                      {formData.serviceable_cities.length} {formData.serviceable_cities.length === 1 ? 'Area' : 'Areas'} Selected
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...COVERAGE_LOCATIONS, ...formData.serviceable_cities])).map((loc) => {
                    const selected = formData.serviceable_cities.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => toggleCoverageLocation(loc)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selected
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {loc}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Add another city, district, or area (e.g. Noida, Manali, Shimla)..."
                    className="form-input flex-1 bg-white min-w-0"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCoverageLocation())}
                  />
                  <button
                    type="button"
                    onClick={addCustomCoverageLocation}
                    className="btn-secondary whitespace-nowrap w-full sm:w-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Location</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label mb-0">Artist Biography <span className="text-rose-500 font-bold">*</span></label>
                  {formData.bio.trim().length < 20 ? (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Bio required (min 20 characters) *
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 font-bold">
                      {formData.bio.length} chars (Valid)
                    </span>
                  )}
                </div>
                <textarea
                  rows={5}
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Describe your musical journey, notable weddings/corporate gigs, signature songs, and what makes your live performance unforgettable..."
                  className="form-input leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 3: PRICING & LOGISTICS ================= */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Event Pricing & Stage Rider
                  </h2>
                  <p className="text-xs text-slate-500">Transparent performance rates and technical setup details</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                <span>All pricing tiers, set durations, technical rider, and travel policy in this step are <strong>strictly mandatory</strong>.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Solo / Starting Rate (₹) <span className="text-rose-500 font-bold">*</span></label>
                    {(!formData.starting_price || formData.starting_price <= 0) && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Required *
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    required
                    value={formData.starting_price ?? ''}
                    placeholder="e.g. 15000"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        starting_price: e.target.value === '' ? '' : Number(e.target.value),
                        solo_price: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="form-input font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Duo Act Rate (₹) <span className="text-rose-500 font-bold">*</span></label>
                    {(!formData.duo_price || formData.duo_price <= 0) && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Required *
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    required
                    value={formData.duo_price ?? ''}
                    placeholder="e.g. 25000"
                    onChange={(e) => setFormData({ ...formData, duo_price: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="form-input font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Full Band Show (₹) <span className="text-rose-500 font-bold">*</span></label>
                    {(!formData.band_price || formData.band_price <= 0) && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Required *
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    required
                    value={formData.band_price ?? ''}
                    placeholder="e.g. 45000"
                    onChange={(e) => setFormData({ ...formData, band_price: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="form-input font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Hourly Overtime (₹) <span className="text-rose-500 font-bold">*</span></label>
                    {(!formData.hourly_price || formData.hourly_price <= 0) && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Required *
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="500"
                    min="500"
                    required
                    value={formData.hourly_price ?? ''}
                    placeholder="e.g. 5000"
                    onChange={(e) => setFormData({ ...formData, hourly_price: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="form-input font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Min Set Duration (Minutes) <span className="text-rose-500 font-bold">*</span></label>
                    {(!formData.min_duration || formData.min_duration <= 0) && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Required *
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="15"
                    min="15"
                    required
                    value={formData.min_duration ?? ''}
                    placeholder="e.g. 60"
                    onChange={(e) => setFormData({ ...formData, min_duration: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="form-input font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Max Set Duration (Minutes) <span className="text-rose-500 font-bold">*</span></label>
                    {(!formData.max_duration || formData.max_duration <= 0) && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Required *
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="15"
                    min="15"
                    required
                    value={formData.max_duration ?? ''}
                    placeholder="e.g. 180"
                    onChange={(e) => setFormData({ ...formData, max_duration: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="form-input font-bold"
                  />
                </div>

                <div>
                  <label className="form-label">Travel Availability <span className="text-rose-500 font-bold">*</span></label>
                  <select
                    required
                    value={formData.travel_readiness}
                    onChange={(e) => setFormData({ ...formData, travel_readiness: e.target.value })}
                    className="form-input"
                  >
                    <option value="pan_india">Pan-India (Available for Outstation Gigs)</option>
                    <option value="state_wide">State-Wide Only</option>
                    <option value="local_only">Base City Only</option>
                    <option value="international">International Destination Events</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Sound Equipment Provided? <span className="text-rose-500 font-bold">*</span></label>
                  <select
                    required
                    value={formData.sound_system ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, sound_system: e.target.value === 'yes' })}
                    className="form-input"
                  >
                    <option value="no">No (Venue / Client arranges Sound PA)</option>
                    <option value="yes">Yes (I bring my own sound setup)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Technical Stage Rider <span className="text-rose-500 font-bold">*</span></label>
                    {!formData.tech_requirements?.trim() && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Rider Required *
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.tech_requirements}
                    onChange={(e) => setFormData({ ...formData, tech_requirements: e.target.value })}
                    placeholder="e.g. 2 Cordless Mics, Stage Monitor, Acoustic Guitar DI Input"
                    className="form-input"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Travel & Hospitality Policy <span className="text-rose-500 font-bold">*</span></label>
                    {!formData.travel_policy?.trim() && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Policy Required *
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.travel_policy}
                    onChange={(e) => setFormData({ ...formData, travel_policy: e.target.value })}
                    placeholder="e.g. Outstation travel & accommodation to be arranged by event host"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: PORTFOLIO, MEDIA & SOCIALS ================= */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-xs flex-shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Photos, Videos &amp; Social Links
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Upload your high-res stage photos, video showreels, and social profiles to showcase your talent
                  </p>
                </div>
              </div>

              {/* Cover Photo (Mandatory) & Profile Avatar (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="form-label mb-0 text-slate-900 font-bold">
                        Cover Banner (16:9) <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-[11px] text-slate-400">Header photo on your booking page</p>
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-xs font-bold text-white shadow-xs transition-all">
                      {uploadingField === 'cover_image_url' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Upload Banner</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'cover_image_url')}
                      />
                    </label>
                  </div>
                  <div className="relative">
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={formData.cover_image_url}
                      onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                      placeholder="Paste image link (e.g. https://...)"
                      className="form-input pl-10 bg-white"
                    />
                  </div>
                  {formData.cover_image_url && (
                    <div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs group">
                      <img src={formData.cover_image_url} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, cover_image_url: '' })}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition-colors"
                        title="Remove cover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <label className="form-label mb-0 text-slate-900 font-bold">
                        Profile Avatar <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <p className="text-[11px] text-slate-400">Headshot or stage avatar</p>
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-sky-400 text-xs font-bold text-slate-700 shadow-xs transition-all">
                      {uploadingField === 'profile_image_url' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Upload Avatar</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'profile_image_url')}
                      />
                    </label>
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={formData.profile_image_url}
                      onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
                      placeholder="Paste avatar image link (e.g. https://...)"
                      className="form-input pl-10 bg-white"
                    />
                  </div>
                  {formData.profile_image_url && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-xs group">
                      <img src={formData.profile_image_url} alt="Avatar Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, profile_image_url: '' })}
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/60 hover:bg-rose-600 text-white transition-colors"
                        title="Remove avatar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Artist Stage Photos (3-4+ images: 1 Mandatory, Extra Optional) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="form-label mb-0 text-slate-900 font-bold">Stage &amp; Live Photos</label>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-black uppercase">
                      1 Required &bull; Up to 15 Photos
                    </span>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all">
                    {uploadingField === 'gallery_images' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload Photos ({formData.gallery_images.length}/15)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: Math.max(4, formData.gallery_images.length) }).map((_, idx) => {
                    const photoUrl = formData.gallery_images[idx];
                    const isFirst = idx === 0;
                    if (photoUrl) {
                      return (
                        <div
                          key={`${idx}-${photoUrl}`}
                          className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-slate-200 bg-white shadow-xs group"
                        >
                          <img src={photoUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold">
                            {isFirst ? 'Primary Photo' : `Photo ${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeGalleryPhoto(idx)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition-colors"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <label
                        key={`onb-slot-${idx}`}
                        className={`cursor-pointer rounded-2xl aspect-[4/3] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 p-3 text-center transition-all ${
                          isFirst
                            ? 'border-sky-300 bg-sky-50/50 hover:bg-sky-50 text-sky-900'
                            : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isFirst ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {isFirst ? 'Primary Photo' : `Photo ${idx + 1}`}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            isFirst ? 'text-sky-600' : 'text-slate-400'
                          }`}
                        >
                          {isFirst ? 'Required *' : 'Optional'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleGalleryUpload}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Performance Videos & Reels */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="form-label mb-0 text-slate-900 font-bold">Performance Videos &amp; Reels</label>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-black uppercase">
                      1 Required
                    </span>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all">
                    {uploadingField === 'video_upload' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Video className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingField === 'video_upload' ? 'Uploading...' : 'Upload Video (.mp4, .mov)'}</span>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={handleVideoFileUpload}
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Youtube className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={newYoutubeLink}
                      onChange={(e) => setNewYoutubeLink(e.target.value)}
                      placeholder="Paste YouTube, Reel or Video URL (e.g. youtube.com/watch?v=... or youtu.be/...)"
                      className="form-input pl-10 w-full bg-white"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addYoutubeLink())}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addYoutubeLink}
                    className="btn-secondary whitespace-nowrap px-4 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Video</span>
                  </button>
                </div>

                {formData.youtube_links.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {formData.youtube_links.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex-shrink-0 ${
                              idx === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {idx === 0 ? 'Primary Video' : `Video ${idx + 1}`}
                          </span>
                          <span className="truncate font-medium text-slate-800">{link}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeYoutubeLink(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audio Tracks & Demos */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="form-label mb-0 text-slate-900 font-bold">Audio Tracks &amp; Voice Demos</label>
                    <p className="text-[11px] text-slate-400">Share SoundCloud, Spotify or direct MP3 audio tracks</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">Optional</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Music className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={newAudioUrl}
                      onChange={(e) => setNewAudioUrl(e.target.value)}
                      placeholder="SoundCloud track, MP3 or audio link (e.g. soundcloud.com/...)"
                      className="form-input pl-10 w-full bg-white"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAudioTrack())}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addAudioTrack}
                    className="btn-secondary whitespace-nowrap px-4 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Track</span>
                  </button>
                </div>
                {formData.audio_samples.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {formData.audio_samples.map((url, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <span className="truncate font-mono text-slate-700">{url}</span>
                        <button
                          type="button"
                          onClick={() => removeAudioTrack(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Social & Streaming Profiles */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="form-label mb-0 text-slate-900 font-bold">Social &amp; Streaming Profiles</label>
                    <p className="text-[11px] text-slate-400">Help event hosts explore your fan base and music releases</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">Optional</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-rose-500" />
                      <span>Instagram Profile <strong className="text-rose-500">*</strong></span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">@</span>
                      <input
                        type="text"
                        value={formData.instagram_url}
                        onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                        placeholder="yourhandle or instagram.com/..."
                        className="form-input pl-8 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-red-500" />
                      <span>YouTube Channel</span>
                    </label>
                    <input
                      type="url"
                      value={formData.youtube_url}
                      onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                      placeholder="youtube.com/@yourchannel"
                      className="form-input bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Music2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Spotify / Apple Music</span>
                    </label>
                    <input
                      type="url"
                      value={formData.spotify_url}
                      onChange={(e) => setFormData({ ...formData, spotify_url: e.target.value })}
                      placeholder="open.spotify.com/artist/..."
                      className="form-input bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-500" />
                      <span>Website / Linktree</span>
                    </label>
                    <input
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="yourwebsite.com or linktr.ee/..."
                      className="form-input bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Navigation Bar */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-100">
            <div className="w-full sm:w-auto">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep(step - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn-secondary w-full sm:w-auto px-5 py-2.5 text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Step</span>
                </button>
              ) : (
                <span className="text-[11px] font-medium text-slate-400">
                  Step {step} of {STEPS.length} — You can edit any detail later in your dashboard.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>Next: {STEPS[step]?.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || completed}
                  className="w-full sm:w-auto h-11 px-7 rounded-xl bg-emerald-500 hover:bg-emerald-600 border border-emerald-400 text-white text-[11px] font-black uppercase tracking-[0.15em] shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Profile & Enter Dashboard</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
