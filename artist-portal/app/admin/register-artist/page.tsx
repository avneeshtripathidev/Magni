"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '../../../lib/auth/adminAuthContext';
import { ArtistProfile } from '../../../types/artist';
import { compressImageFile } from '../../../lib/imageCompressor';
import {
  ARTIST_CATEGORIES,
  INDIAN_LANGUAGES,
  INDIA_STATES_CITIES,
  INDIAN_STATES,
} from '../../../lib/indiaStatesCities';
import {
  UserPlus,
  Download,
  Upload,
  User,
  Music,
  IndianRupee,
  MapPin,
  ImageIcon,
  PlayCircle,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Globe,
  Star,
  Trash2,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

const CSV_TEMPLATE_HEADERS = [
  'contact_person',
  'email',
  'phone_no',
  'phone_no_alt',
  'name',
  'stage_name',
  'category',
  'genres',
  'languages',
  'price_min',
  'price_max',
  'original_price',
  'exclusive_price',
  'members_min',
  'members_max',
  'rating',
  'duration',
  'successful_bookings',
  'available_bookings',
  'state',
  'city',
  'locality',
  'address',
  'bio',
  'cover_image_url',
  'cloudflare_video_url',
  'youtube_url',
  'spotlight_status',
  'is_artist_of_month',
  'is_live',
];

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `artist-${Date.now()}`
  );
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export default function AdminArtistRegistrationPage() {
  const { artists, addArtist, bulkAddArtists } = useAdminAuth();
  const excelInputRef = useRef<HTMLInputElement>(null);

  // 1. Management Details
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [phoneAlt, setPhoneAlt] = useState('');

  // 2. Artist Profile Details
  const [fullName, setFullName] = useState('');
  const [stageName, setStageName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [customGenre, setCustomGenre] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Hindi', 'English']);
  const [customLanguage, setCustomLanguage] = useState('');
  const [showOtherLanguage, setShowOtherLanguage] = useState(false);

  // 3. Performance Metrics
  const [priceMin, setPriceMin] = useState('50000');
  const [priceMax, setPriceMax] = useState('150000');
  const [originalPrice, setOriginalPrice] = useState('');
  const [exclusivePrice, setExclusivePrice] = useState('');
  const [membersMin, setMembersMin] = useState('1');
  const [membersMax, setMembersMax] = useState('1');
  const [rating, setRating] = useState('5.0');
  const [duration, setDuration] = useState('60-90 mins');
  const [bookings, setBookings] = useState('0');
  const [availBookings, setAvailBookings] = useState('0');

  // 4. Location & Narrative
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [locality, setLocality] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [bio, setBio] = useState('');

  // 5. Digital Assets (Cloudflare R2: artist-basic-details/)
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [cloudflareVideos, setCloudflareVideos] = useState<string[]>(['']);
  const [youtubeVideos, setYoutubeVideos] = useState<string[]>(['']);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingCfVideoIdx, setUploadingCfVideoIdx] = useState<number | null>(null);
  const [dragOverGallery, setDragOverGallery] = useState(false);

  // 6. Private KYC Documents (Cloudflare R2: artist-private-kyc/)
  const [kycIdType, setKycIdType] = useState<'aadhaar' | 'pan' | 'passport' | 'voter_id' | 'driving_license' | ''>('');
  const [kycIdMasked, setKycIdMasked] = useState('');
  const [kycPan, setKycPan] = useState('');
  const [kycDocUrl, setKycDocUrl] = useState('');
  const [kycAddressUrl, setKycAddressUrl] = useState('');
  const [uploadingKycField, setUploadingKycField] = useState<'id' | 'address' | null>(null);

  // 7. Spotlight Status & Visibility
  const [spotlightStatus, setSpotlightStatus] = useState<'standard' | 'featured' | 'trending'>('standard');
  const [isArtistOfMonth, setIsArtistOfMonth] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // UI feedback
  const [submitting, setSubmitting] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const availableGenres = category ? ARTIST_CATEGORIES[category] || [] : [];
  const availableCities = stateName ? INDIA_STATES_CITIES[stateName] || [] : [];
  const bioWordCount = bio.trim() ? bio.trim().split(/\s+/).filter(Boolean).length : 0;

  // All language options (built-in + custom added)
  const allLanguageOptions = Array.from(new Set([...INDIAN_LANGUAGES, ...selectedLanguages]));

  // Upload helper routed cleanly into R2 two-folder structure with auto-compression
  const uploadToR2 = async (
    file: File,
    folder: 'basic' | 'private',
    categoryTag: string
  ): Promise<string> => {
    const fileToUpload = file.type.startsWith('image/')
      ? await compressImageFile(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 })
      : file;

    const fd = new FormData();
    fd.append('file', fileToUpload);
    fd.append('folder', folder);
    fd.append('category', categoryTag);
    fd.append('artistId', slugify(fullName || stageName || 'new-artist'));

    let res: Response;
    try {
      res = await fetch('/api/upload', { method: 'POST', body: fd });
    } catch {
      if (fileToUpload.size < 3 * 1024 * 1024) {
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(fileToUpload);
        });
      }
      throw new Error('Upload failed due to connection error.');
    }

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { error: `Server error (${res.status}).` };
    }

    if (!res.ok || !data.url) {
      if (fileToUpload.size < 3 * 1024 * 1024) {
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(fileToUpload);
        });
      }
      throw new Error(data.error || 'Cloudflare R2 upload failed');
    }
    return data.url as string;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const url = await uploadToR2(file, 'basic', 'cover');
      setCoverPhotoUrl(url);
    } catch (err: any) {
      setError(err.message || 'Cover photo upload failed.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const uploadGalleryFiles = async (files: File[]) => {
    const remainingSlots = Math.max(0, 15 - galleryPhotos.length);
    if (remainingSlots === 0) {
      setError('Maximum 15 photos allowed in Photos Registry.');
      return;
    }

    const batch = files.slice(0, remainingSlots);
    setUploadingGallery(true);
    setError(null);

    try {
      const uploaded: string[] = [];
      for (const file of batch) {
        const url = await uploadToR2(file, 'basic', 'gallery');
        uploaded.push(url);
      }
      setGalleryPhotos((prev) => [...prev, ...uploaded].slice(0, 15));
    } catch (err: any) {
      setError(err.message || 'Some gallery photos could not be uploaded.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadGalleryFiles(files);
    }
    e.target.value = '';
  };

  const handleCloudflareVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCfVideoIdx(idx);
    setError(null);
    try {
      const url = await uploadToR2(file, 'basic', 'showcase-videos');
      setCloudflareVideos((prev) => prev.map((v, i) => (i === idx ? url : v)));
    } catch (err: any) {
      setError(err.message || 'Video upload failed.');
    } finally {
      setUploadingCfVideoIdx(null);
      e.target.value = '';
    }
  };

  const handleKycUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'id' | 'address'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKycField(type);
    setError(null);
    try {
      const url = await uploadToR2(
        file,
        'private',
        type === 'id' ? kycIdType || 'aadhaar' : 'address-proof'
      );
      if (type === 'id') setKycDocUrl(url);
      else setKycAddressUrl(url);
    } catch (err: any) {
      setError(err.message || 'Private KYC upload failed.');
    } finally {
      setUploadingKycField(null);
      e.target.value = '';
    }
  };

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  };

  const handleAddCustomGenre = () => {
    const trimmed = customGenre.trim();
    if (!trimmed) return;
    if (!selectedGenres.includes(trimmed)) {
      setSelectedGenres((prev) => [...prev, trimmed]);
    }
    setCustomGenre('');
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((item) => item !== lang) : [...prev, lang]
    );
  };

  const handleAddCustomLanguage = () => {
    const trimmed = customLanguage.trim();
    if (!trimmed) return;
    if (!selectedLanguages.includes(trimmed)) {
      setSelectedLanguages((prev) => [...prev, trimmed]);
    }
    setCustomLanguage('');
    setShowOtherLanguage(false);
  };

  // Download Excel-compatible CSV Template
  const handleDownloadTemplate = () => {
    const sampleRow = [
      'Rohan Mehta',
      'rohan.live@example.com',
      '9876543210',
      '9811122233',
      'Rohan Mehta',
      'RohanLive',
      'Singer',
      'Bollywood|Sufi',
      'Hindi|English|Punjabi',
      '50000',
      '150000',
      '175000',
      '45000',
      '1',
      '4',
      '5.0',
      '60-90 mins',
      '12',
      '5',
      'Delhi',
      'New Delhi',
      'Connaught Place',
      'Block B, Connaught Place, New Delhi',
      'Acclaimed live vocalist performing soulful Sufi and Bollywood sets for weddings, corporate galas, and private concerts across India.',
      '',
      '',
      'https://youtube.com/watch?v=dQw4w9WgXcQ',
      'standard',
      'false',
      'true',
    ];

    const escapeCsv = (val: string) =>
      val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;

    const csvContent = [
      CSV_TEMPLATE_HEADERS.join(','),
      sampleRow.map(escapeCsv).join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'magnevents_artist_registration_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Upload Excel / CSV bulk import
  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingExcel(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error(
          'Please upload a valid CSV template file with a header row and at least 1 artist row.'
        );
      }

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
      const parsedArtists: ArtistProfile[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] || '';
        });

        const artistName = row.name || row.full_name || row.contact_person;
        if (!artistName) continue;

        const nowIso = new Date().toISOString();
        const minP = Number(row.price_min) || 50000;
        const maxP = Number(row.price_max) || 150000;
        const liveFlag = String(row.is_live).toLowerCase() === 'true';

        parsedArtists.push({
          id: `artist-csv-${Date.now()}-${i}`,
          name: artistName,
          stage_name: row.stage_name || artistName,
          slug: `${slugify(artistName)}-${Date.now().toString().slice(-4)}`,
          phone_no: row.phone_no || '',
          email: row.email || '',
          category: row.category || 'Singer',
          sub_category: (row.genres || '').split('|')[0] || '',
          genres: (row.genres || 'Bollywood')
            .split(/[|;]/)
            .map((s) => s.trim())
            .filter(Boolean),
          city: row.city || 'Delhi NCR',
          state: row.state || 'Delhi',
          country: 'India',
          languages: (row.languages || 'Hindi|English')
            .split(/[|;]/)
            .map((s) => s.trim())
            .filter(Boolean),
          bio:
            row.bio ||
            `Verified ${row.category || 'Singer'} available for weddings, corporate galas, and private events.`,
          experience_years: 3,
          rating: Number(row.rating) || 5.0,
          successful_bookings: Number(row.successful_bookings) || 0,
          price_min: minP,
          price_max: maxP,
          cover_image_url: row.cover_image_url || '',
          profile_image_url:
            row.cover_image_url ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
          cloudflare_video_url: row.cloudflare_video_url || '',
          youtube_links: row.youtube_url ? [row.youtube_url] : [],
          audio_samples: [],
          submitted_pricing: {
            starting_price: minP,
            solo_price: minP,
            duo_price: Math.round((minP + maxP) / 2),
            band_price: maxP,
            hourly_price: Math.round(minP / 4),
            travel_charges_policy: 'Outstation travel & hospitality by organizer',
          },
          performance_details: {
            min_duration_minutes: 60,
            max_duration_minutes: 90,
            sound_system_provided: false,
            technical_requirements: `Duration: ${row.duration || '60-90 mins'} • Members: ${row.members_min || 1}-${row.members_max || 1}`,
            travel_readiness: 'pan_india',
            serviceable_cities: [row.city || 'Delhi NCR'],
          },
          verification_documents: {
            legal_name: artistName,
            id_type: '',
            id_number_masked: '',
            id_document_url: '',
            address_proof_url: '',
            pan_or_tax_id: '',
          },
          verification_status: liveFlag ? 'approved' : 'pending',
          profile_completion: 85,
          is_live: liveFlag,
          is_featured:
            String(row.is_artist_of_month).toLowerCase() === 'true' ||
            row.spotlight_status === 'featured',
          created_at: nowIso,
          updated_at: nowIso,
        });
      }

      if (parsedArtists.length === 0) {
        throw new Error('No valid artist rows found in file. Download the template to check column headers.');
      }

      const res = await bulkAddArtists(parsedArtists);
      setSuccessMsg(
        `Successfully imported ${res.count} artist${res.count > 1 ? 's' : ''} into Performer Directory${
          res.savedToSupabase > 0 ? ` (${res.savedToSupabase} synced to Supabase)` : ''
        }.`
      );
    } catch (err: any) {
      setError(err.message || 'Could not parse uploaded spreadsheet. Use the CSV template format.');
    } finally {
      setImportingExcel(false);
      e.target.value = '';
    }
  };

  const resetForm = () => {
    setContactPerson('');
    setEmail('');
    setPhoneNo('');
    setPhoneAlt('');
    setFullName('');
    setStageName('');
    setCategory('');
    setSelectedGenres([]);
    setSelectedLanguages(['Hindi', 'English']);
    setPriceMin('50000');
    setPriceMax('150000');
    setOriginalPrice('');
    setExclusivePrice('');
    setMembersMin('1');
    setMembersMax('1');
    setRating('5.0');
    setDuration('60-90 mins');
    setBookings('0');
    setAvailBookings('0');
    setStateName('');
    setCity('');
    setCustomCity('');
    setLocality('');
    setFullAddress('');
    setBio('');
    setCoverPhotoUrl('');
    setGalleryPhotos([]);
    setCloudflareVideos(['']);
    setYoutubeVideos(['']);
    setKycIdType('');
    setKycIdMasked('');
    setKycPan('');
    setKycDocUrl('');
    setKycAddressUrl('');
    setSpotlightStatus('standard');
    setIsArtistOfMonth(false);
    setIsLive(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanPhone = phoneNo.replace(/[^\d]/g, '');
    const finalCity = (city === '__custom__' ? customCity : city).trim();

    if (!contactPerson.trim()) return setError('Primary Contact Person is required.');
    if (!email.trim() || !email.includes('@')) return setError('Valid unique Email Address is required.');

    const duplicateEmail = artists.find(
      (a) => a.email && a.email.toLowerCase().trim() === email.toLowerCase().trim()
    );
    if (duplicateEmail) {
      return setError(`Email ${email} is already registered under "${duplicateEmail.name}".`);
    }

    if (cleanPhone.length < 10) return setError('Primary Phone must be at least 10 digits.');
    if (!fullName.trim()) return setError('Artist Full Name is required.');
    if (!category) return setError('Please select a Main Category.');
    if (selectedGenres.length === 0) return setError('Please select at least one Genre / Sub-category.');
    if (selectedLanguages.length === 0) return setError('Please select at least one Language.');
    if (!stateName) return setError('Please select a State.');
    if (!finalCity) return setError('Please select or enter a City.');
    if (bioWordCount < 10 || bioWordCount > 1500) {
      return setError(`Professional Bio must be between 10 and 1500 words (currently ${bioWordCount} words).`);
    }

    setSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const minP = Number(priceMin) || 50000;
      const maxP = Number(priceMax) || 150000;
      const cleanCfVideos = cloudflareVideos.map((v) => v.trim()).filter(Boolean);
      const cleanYtVideos = youtubeVideos.map((v) => v.trim()).filter(Boolean);

      const durationNums = duration.match(/\d+/g);
      const minDur = durationNums?.[0] ? Number(durationNums[0]) : 60;
      const maxDur = durationNums?.[1] ? Number(durationNums[1]) : 90;

      const newArtist: ArtistProfile = {
        id: `artist-reg-${Date.now()}`,
        name: fullName.trim(),
        stage_name: stageName.trim() ? `@${stageName.trim().replace(/^@/, '')}` : fullName.trim(),
        slug: `${slugify(stageName || fullName)}-${Date.now().toString().slice(-4)}`,
        phone_no: phoneNo.trim(),
        email: email.trim().toLowerCase(),
        category,
        sub_category: selectedGenres.slice(0, 2).join(' & '),
        genres: selectedGenres,
        city: finalCity,
        state: stateName,
        country: 'India',
        languages: selectedLanguages,
        bio: bio.trim(),
        experience_years: 3,
        rating: Number(rating) || 5.0,
        successful_bookings: Number(bookings) || 0,
        price_min: minP,
        price_max: maxP,
        cover_image_url: coverPhotoUrl || galleryPhotos[0] || '',
        profile_image_url:
          galleryPhotos[0] ||
          coverPhotoUrl ||
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
        video_url: cleanYtVideos[0] || cleanCfVideos[0] || '',
        cloudflare_video_url: cleanCfVideos.join(', '),
        youtube_links: cleanYtVideos,
        audio_samples: [],
        submitted_pricing: {
          starting_price: exclusivePrice ? Number(exclusivePrice) : minP,
          solo_price: minP,
          duo_price: Math.round((minP + maxP) / 2),
          band_price: maxP,
          hourly_price: Math.round(minP / 4),
          travel_charges_policy: [
            originalPrice ? `Original: ₹${Number(originalPrice).toLocaleString('en-IN')}` : '',
            exclusivePrice ? `Exclusive: ₹${Number(exclusivePrice).toLocaleString('en-IN')}` : '',
            `Contact: ${contactPerson.trim()}${phoneAlt ? ` • Alt: ${phoneAlt}` : ''}`,
          ]
            .filter(Boolean)
            .join(' | '),
        },
        performance_details: {
          min_duration_minutes: minDur,
          max_duration_minutes: maxDur,
          sound_system_provided: false,
          technical_requirements: `Members: ${membersMin}-${membersMax} • Duration: ${duration} • Avail. Bookings: ${availBookings} • Address: ${[locality, fullAddress].filter(Boolean).join(', ')}`,
          travel_readiness: 'pan_india',
          serviceable_cities: [finalCity, stateName].filter(Boolean),
        },
        verification_documents: {
          legal_name: fullName.trim(),
          id_type: (kycDocUrl.trim() || kycIdMasked.trim()) ? kycIdType : '',
          id_number_masked: kycIdMasked.trim(),
          id_document_url: kycDocUrl.trim(),
          address_proof_url: kycAddressUrl.trim(),
          pan_or_tax_id: kycPan.trim().toUpperCase(),
        },
        verification_status: isLive ? 'approved' : 'pending',
        profile_completion: Math.min(
          100,
          75 +
            (coverPhotoUrl ? 5 : 0) +
            (galleryPhotos.length > 0 ? 10 : 0) +
            (cleanYtVideos.length > 0 || cleanCfVideos.length > 0 ? 5 : 0) +
            (kycDocUrl ? 5 : 0)
        ),
        is_live: isLive,
        is_featured: isArtistOfMonth || spotlightStatus !== 'standard',
        created_at: nowIso,
        updated_at: nowIso,
      };

      const res = await addArtist(newArtist, galleryPhotos);
      setSuccessMsg(
        `Registered "${res.artist.name}" successfully! ${
          res.savedToSupabase
            ? 'Synced to Supabase & live in Artist Directory.'
            : 'Added to Artist Directory & Profiles.'
        }`
      );
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Could not register artist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header + Template / Excel Upload */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-bold mb-2">
            <UserPlus className="w-3.5 h-3.5 text-sky-600" />
            <span>Admin Artist Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Artist Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register a new artist into the system by providing their profile details and media.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Template</span>
          </button>

          <button
            type="button"
            onClick={() => excelInputRef.current?.click()}
            disabled={importingExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs disabled:opacity-60"
          >
            {importingExcel ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload Excel</span>
              </>
            )}
          </button>
          <input
            ref={excelInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleUploadExcel}
            className="hidden"
          />
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/profiles"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1"
            >
              <span>View Profiles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/artists"
              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold text-xs"
            >
              Directory
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. MANAGEMENT DETAILS */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/70 flex items-center justify-center text-sky-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Management Details</h2>
              <p className="text-xs text-slate-500">Direct contact info for bookings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Primary Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Full name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address (Unique) <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="artist@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Primary Phone (Mandatory) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phoneNo}
                onChange={(e) => setPhoneNo(e.target.value)}
                placeholder="00000 00000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Secondary Phone (Optional)
              </label>
              <input
                type="tel"
                value={phoneAlt}
                onChange={(e) => setPhoneAlt(e.target.value)}
                placeholder="00000 00000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>
        </section>

        {/* 2. ARTIST PROFILE DETAILS */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-600">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Artist Profile details</h2>
              <p className="text-xs text-slate-500">Visible stage presence and genre</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Artist full name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Artist Stage Name
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 overflow-hidden">
                <span className="px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-500">
                  @
                </span>
                <input
                  type="text"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  placeholder="StageName"
                  className="flex-1 px-3 py-2.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Main Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSelectedGenres([]);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Select Category</option>
                {Object.keys(ARTIST_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Genres / Sub-categories */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Genres / Sub-categories <span className="text-rose-500">*</span>
            </label>
            {!category ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                Select a category first to see genres
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set([...availableGenres, ...selectedGenres])).map((genre) => {
                    const active = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          active
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomGenre();
                      }
                    }}
                    placeholder="Add custom genre..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomGenre}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Languages <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {allLanguageOptions.map((lang) => {
                const active = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowOtherLanguage((v) => !v)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-sky-300 bg-sky-50/70 text-sky-700 hover:bg-sky-100"
              >
                + Add Other...
              </button>
            </div>

            {showOtherLanguage && (
              <div className="flex gap-2 max-w-sm pt-1">
                <input
                  type="text"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomLanguage();
                    }
                  }}
                  placeholder="Enter other language (e.g. French, Maithili)..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomLanguage}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 3. PERFORMANCE METRICS */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Performance Metrics</h2>
              <p className="text-xs text-slate-500">Commercials and band configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Price Range (₹) — Minimum <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                required
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="50000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Price Range (₹) — Maximum <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                required
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="150000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Original Price
              </label>
              <input
                type="number"
                min={0}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Exclusive Price
              </label>
              <input
                type="number"
                min={0}
                value={exclusivePrice}
                onChange={(e) => setExclusivePrice(e.target.value)}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Band Members — Min
              </label>
              <input
                type="number"
                min={1}
                value={membersMin}
                onChange={(e) => setMembersMin(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Band Members — Max
              </label>
              <input
                type="number"
                min={1}
                value={membersMax}
                onChange={(e) => setMembersMax(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                System Rating
              </label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="5.0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60-90 mins"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bookings
              </label>
              <input
                type="number"
                min={0}
                value={bookings}
                onChange={(e) => setBookings(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Avail. Bookings
              </label>
              <input
                type="number"
                min={0}
                value={availBookings}
                onChange={(e) => setAvailBookings(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </section>

        {/* 4. LOCATION & NARRATIVE */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Location &amp; Narrative</h2>
              <p className="text-xs text-slate-500">Geography and artist story</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                State <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={stateName}
                onChange={(e) => {
                  setStateName(e.target.value);
                  setCity('');
                  setCustomCity('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                City <span className="text-rose-500">*</span>
              </label>
              <select
                required={city !== '__custom__'}
                disabled={!stateName}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-semibold disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-sky-500"
              >
                <option value="">{stateName ? 'Select City' : 'Select State First'}</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {stateName && <option value="__custom__">+ Enter Other City</option>}
              </select>
              {city === '__custom__' && (
                <input
                  type="text"
                  required
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Type city name..."
                  className="mt-2 w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Locality / Landmark
              </label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Near Taj Hotel"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Address
              </label>
              <input
                type="text"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="House no, Street name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Professional Bio / Description <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-bold ${
                  bioWordCount >= 10 && bioWordCount <= 1500
                    ? 'text-emerald-600'
                    : 'text-slate-400'
                }`}
              >
                {bioWordCount} / 1500 words (Min 10)
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe the artist's journey, achievements, and performance style..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </section>

        {/* 5. DIGITAL ASSETS (Cloudflare R2 -> artist-basic-details/) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200/70 flex items-center justify-center text-violet-600">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Digital Assets</h2>
                <p className="text-xs text-slate-500">
                  Media gallery and video showcase (stored in Cloudflare R2 <code className="text-[11px]">artist-basic-details/</code>)
                </p>
              </div>
            </div>
          </div>

          {/* Cover Photo */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Cover Photo</label>
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              {coverPhotoUrl ? (
                <div className="flex items-center gap-4 w-full">
                  <img
                    src={coverPhotoUrl}
                    alt="Cover preview"
                    className="w-40 h-24 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-emerald-700">Cover Photo Uploaded</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{coverPhotoUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCoverPhotoUrl('')}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Upload Cover Photo</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Landscape images only (16:9)</p>
                  </div>
                  <label className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
                    {uploadingCover ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        <span>Browse Files</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                      disabled={uploadingCover}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Photos Registry (0 / 15 Photos Selected) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Photos Registry — {galleryPhotos.length} / 15 Photos Selected
              </label>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                {galleryPhotos.length}/15 Slots
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverGallery(true);
              }}
              onDragLeave={() => setDragOverGallery(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setDragOverGallery(false);
                const dropped = Array.from(e.dataTransfer.files || []).filter((f) =>
                  f.type.startsWith('image/')
                );
                if (dropped.length > 0) await uploadGalleryFiles(dropped);
              }}
              className={`p-5 rounded-2xl border-2 border-dashed text-center transition-colors ${
                dragOverGallery
                  ? 'border-sky-400 bg-sky-50/50'
                  : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <p className="text-xs font-bold text-slate-700">Click or Drag images here</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload up to 15 high-resolution artist photos directly to Cloudflare R2
              </p>
              <label className="mt-3 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
                {uploadingGallery ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    <span>Uploading Photos...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-sky-600" />
                    <span>Browse Files</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryInputChange}
                  className="hidden"
                  disabled={uploadingGallery || galleryPhotos.length >= 15}
                />
              </label>

              {galleryPhotos.length > 0 && (
                <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-5 gap-2.5 mt-4 text-left">
                  {galleryPhotos.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square">
                      <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryPhotos((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-slate-900/80 text-white hover:bg-rose-600"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-sky-600 text-white text-[9px] font-bold">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Work Showcase (Cloudflare) + Work Showcase (YouTube) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            {/* Cloudflare Videos */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5 text-sky-600" />
                  <span>Work Showcase (Cloudflare)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCloudflareVideos((prev) => [...prev, ''])}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </button>
              </div>
              <div className="space-y-2">
                {cloudflareVideos.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={val}
                      onChange={(e) =>
                        setCloudflareVideos((prev) =>
                          prev.map((item, i) => (i === idx ? e.target.value : item))
                        )
                      }
                      placeholder="https://pub-...r2.dev/video.mp4"
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                    <label
                      className="px-2.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 flex-shrink-0"
                      title="Upload video directly to Cloudflare R2"
                    >
                      {uploadingCfVideoIdx === idx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleCloudflareVideoUpload(e, idx)}
                        className="hidden"
                        disabled={uploadingCfVideoIdx !== null}
                      />
                    </label>
                    {cloudflareVideos.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setCloudflareVideos((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* YouTube Videos */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Work Showcase (YouTube)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setYoutubeVideos((prev) => [...prev, ''])}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </button>
              </div>
              <div className="space-y-2">
                {youtubeVideos.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={val}
                      onChange={(e) =>
                        setYoutubeVideos((prev) =>
                          prev.map((item, i) => (i === idx ? e.target.value : item))
                        )
                      }
                      placeholder="https://youtube.com/watch?v=..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                    {youtubeVideos.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setYoutubeVideos((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. PRIVATE KYC & AADHAAR (Cloudflare R2 -> artist-private-kyc/) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Private KYC Documents (Optional)</h2>
              <p className="text-xs text-slate-500">
                Aadhaar, PAN &amp; Address Proof stored separately in Cloudflare R2 <code className="text-[11px]">artist-private-kyc/</code>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ID Type</label>
              <select
                value={kycIdType}
                onChange={(e) => setKycIdType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-semibold"
              >
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="passport">Passport</option>
                <option value="voter_id">Voter ID</option>
                <option value="driving_license">Driving License</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ID Number (Masked)</label>
              <input
                type="text"
                value={kycIdMasked}
                onChange={(e) => setKycIdMasked(e.target.value)}
                placeholder="XXXX-XXXX-1234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">PAN / Tax ID</label>
              <input
                type="text"
                value={kycPan}
                onChange={(e) => setKycPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Aadhaar / Govt ID File</label>
                <label className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1">
                  {uploadingKycField === 'id' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  <span>Upload to R2 Private</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleKycUpload(e, 'id')}
                    className="hidden"
                    disabled={uploadingKycField !== null}
                  />
                </label>
              </div>
              <input
                type="url"
                value={kycDocUrl}
                onChange={(e) => setKycDocUrl(e.target.value)}
                placeholder="Uploaded private R2 URL or link..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Address Proof File</label>
                <label className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1">
                  {uploadingKycField === 'address' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  <span>Upload to R2 Private</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleKycUpload(e, 'address')}
                    className="hidden"
                    disabled={uploadingKycField !== null}
                  />
                </label>
              </div>
              <input
                type="url"
                value={kycAddressUrl}
                onChange={(e) => setKycAddressUrl(e.target.value)}
                placeholder="Uploaded private R2 URL or link..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
            </div>
          </div>
        </section>

        {/* 7. SPOTLIGHT STATUS & LIVE ON WEBSITE */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Spotlight Status */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Spotlight Status</span>
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  {spotlightStatus === 'standard' ? 'Standard Profile' : spotlightStatus}
                </span>
              </div>
              <select
                value={spotlightStatus}
                onChange={(e) => setSpotlightStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800"
              >
                <option value="standard">Standard — Standard Profile</option>
                <option value="featured">Featured — Priority Spotlight</option>
                <option value="trending">Trending — Top Charting Act</option>
              </select>
            </div>

            {/* Artist Of Month */}
            <label className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Artist Of Month</span>
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Featured placement</span>
              </div>
              <input
                type="checkbox"
                checked={isArtistOfMonth}
                onChange={(e) => setIsArtistOfMonth(e.target.checked)}
                className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
              />
            </label>

            {/* Live on Website */}
            <label className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live on Website</span>
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Show to public users</span>
              </div>
              <input
                type="checkbox"
                checked={isLive}
                onChange={(e) => setIsLive(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Sticky Submit Footer */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Media saves automatically to Cloudflare R2 (<strong className="text-slate-700">artist-basic-details/</strong> &amp; <strong className="text-slate-700">artist-private-kyc/</strong>).
          </span>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Reset Form
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Artist...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register Artist</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
