"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { ArtistProfile } from '../../types/artist';
import { DEMO_ARTIST } from './authContext';
import {
  getAllowedAdminEmails,
  isAuthorizedAdminEmail,
  MAX_ADMIN_EMAILS,
  normalizeEmail,
  saveAllowedAdminEmails,
} from './adminWhitelist';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'artist_manager';
  avatar_url?: string;
}

export const DEFAULT_ADMIN: AdminUser = {
  id: 'admin-director-001',
  name: 'Magnevents Artist Director',
  email: 'director@magnevents.in',
  role: 'super_admin',
};

// Seed sample artists for the admin verification queue to ensure rich testing
export const INITIAL_REVIEW_ARTISTS: ArtistProfile[] = [
  {
    ...DEMO_ARTIST,
    id: 'artist-rev-001',
    name: 'Aarav Sharma',
    stage_name: 'Aarav & The Acoustic Project',
    verification_status: 'approved',
    is_live: true,
  },
  {
    id: 'artist-rev-002',
    user_id: 'user-kabir-002',
    name: 'Kabir Verma',
    stage_name: 'The Kabir Trio (Sufi & Bollywood)',
    slug: 'the-kabir-trio',
    phone_no: '+91 98112 34567',
    email: 'kabir.music@gmail.com',
    category: 'Live Band',
    sub_category: 'Sufi & Bollywood Fusion',
    genres: ['Sufi', 'Bollywood Retro', 'Fusion', 'Acoustic'],
    city: 'Delhi NCR',
    state: 'Delhi',
    country: 'India',
    languages: ['Hindi', 'Urdu', 'Punjabi'],
    bio: 'Dynamic 3-piece live acoustic band specializing in soulful Sufi mehfils and energetic Bollywood sangeet medleys. Performed at 80+ luxury weddings across Rajasthan, Delhi, and Goa.',
    experience_years: 6,
    rating: 4.95,
    successful_bookings: 54,
    price_min: 25000,
    price_max: 75000,
    profile_image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1200&auto=format&fit=crop',
    youtube_links: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=kXYiU_JCYtU'
    ],
    audio_samples: [
      'https://soundcloud.com/demo/sufi-rock-live-set'
    ],
    submitted_pricing: {
      starting_price: 25000,
      solo_price: 15000,
      duo_price: 22000,
      band_price: 45000,
      hourly_price: 6000,
      travel_charges_policy: 'Actual flights/train tickets + 1 double room at event hotel.'
    },
    performance_details: {
      min_duration_minutes: 90,
      max_duration_minutes: 180,
      sound_system_provided: false,
      technical_requirements: 'Stage with 3 direct inputs, 2 monitor wedges, 2 Shure SM58 mics.',
      travel_readiness: 'pan_india',
      serviceable_cities: ['Delhi NCR', 'Jaipur', 'Udaipur', 'Chandigarh', 'Mumbai']
    },
    verification_documents: {
      legal_name: 'Kabir Verma',
      id_type: 'aadhaar',
      id_number_masked: 'XXXX-XXXX-4512',
      id_document_url: 'https://drive.google.com/file/d/kabir-aadhaar-doc/view',
      address_proof_url: 'https://drive.google.com/file/d/kabir-passport/view',
      pan_or_tax_id: 'KABVR9812K'
    },
    verification_status: 'pending', // Pending manual admin review!
    profile_completion: 95,
    is_live: false,
    is_featured: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'artist-rev-003',
    user_id: 'user-riya-003',
    name: 'Riya Sengupta',
    stage_name: 'Riya Sen (Acoustic Pop & Jazz)',
    slug: 'riya-sen-acoustic',
    phone_no: '+91 97123 98765',
    email: 'riya.vocals@yahoo.com',
    category: 'Singer',
    sub_category: 'Western & Bollywood Pop',
    genres: ['Western Pop', 'Bollywood Acoustic', 'Jazz', 'Indie'],
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    languages: ['English', 'Hindi', 'Bengali'],
    bio: 'Berklee-trained vocalist and songwriter. Intimate sundowner performances, cocktail nights, and corporate gala events. Ambient pop, jazz standards, and modern Bollywood.',
    experience_years: 5,
    rating: 4.88,
    successful_bookings: 38,
    price_min: 18000,
    price_max: 45000,
    profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    youtube_links: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    ],
    audio_samples: [
      'https://soundcloud.com/demo/riya-live-lounge'
    ],
    submitted_pricing: {
      starting_price: 18000,
      solo_price: 18000,
      duo_price: 26000,
      band_price: 45000,
      hourly_price: 4500,
      travel_charges_policy: 'Economy flights and airport cabs for outstation gigs.'
    },
    performance_details: {
      min_duration_minutes: 60,
      max_duration_minutes: 150,
      sound_system_provided: false,
      technical_requirements: '1 wireless condenser vocal mic and in-ear monitor transmitter.',
      travel_readiness: 'pan_india',
      serviceable_cities: ['Mumbai', 'Pune', 'Goa', 'Delhi NCR', 'Bengaluru']
    },
    verification_documents: {
      legal_name: 'Riya Sengupta',
      id_type: 'passport',
      id_number_masked: 'XXXXXX89',
      id_document_url: 'https://drive.google.com/file/d/riya-passport/view',
      address_proof_url: '',
      pan_or_tax_id: 'RSENG5432M'
    },
    verification_status: 'pending', // Pending manual admin review!
    profile_completion: 90,
    is_live: false,
    is_featured: false,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'artist-rev-004',
    user_id: 'user-rohan-004',
    name: 'DJ Rohan K',
    stage_name: 'DJ Rohan (Club & Sangeet Specialist)',
    slug: 'dj-rohan-live',
    phone_no: '+91 99887 66554',
    email: 'rohan.dj@hotmail.com',
    category: 'DJ',
    sub_category: 'Commercial EDM & Punjabi Sangeet',
    genres: ['Commercial EDM', 'Bollywood Club', 'Punjabi Dhol Mixes', 'Tech House'],
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    languages: ['English', 'Hindi', 'Kannada'],
    bio: 'Resident DJ with 10+ years of high-octane club, wedding sangeet, and corporate music curation. Pioneer CDJ-3000 certified with masterclass audio delivery.',
    experience_years: 10,
    rating: 4.92,
    successful_bookings: 112,
    price_min: 30000,
    price_max: 90000,
    profile_image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    youtube_links: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    ],
    audio_samples: [
      'https://soundcloud.com/demo/dj-rohan-mixtape'
    ],
    submitted_pricing: {
      starting_price: 30000,
      solo_price: 30000,
      duo_price: 45000,
      band_price: 0,
      hourly_price: 8000,
      travel_charges_policy: 'Extra charges apply for outstation console shipping if Pioneer setup is not available locally.'
    },
    performance_details: {
      min_duration_minutes: 120,
      max_duration_minutes: 300,
      sound_system_provided: false,
      technical_requirements: 'Pioneer DJM-900NXS2 mixer + 2x CDJ-2000NXS2 or CDJ-3000 decks.',
      travel_readiness: 'pan_india',
      serviceable_cities: ['Bengaluru', 'Hyderabad', 'Chennai', 'Goa', 'Mumbai']
    },
    verification_documents: {
      legal_name: 'Rohan Krishnan',
      id_type: 'aadhaar',
      id_number_masked: 'XXXX-XXXX-1934',
      id_document_url: 'https://drive.google.com/file/d/rohan-aadhaar/view',
      address_proof_url: '',
      pan_or_tax_id: 'ROHKR7821B'
    },
    verification_status: 'under_review',
    profile_completion: 85,
    is_live: false,
    is_featured: false,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'artist-rev-005',
    user_id: 'user-ananya-005',
    name: 'Ananya Joshi',
    stage_name: 'Ananya Live Violin & Fusion',
    slug: 'ananya-joshi-violin',
    phone_no: '+91 98290 55412',
    email: 'ananya.strings@gmail.com',
    category: 'Instrumentalist',
    sub_category: 'Electric Violin & Classical Fusion',
    genres: ['Classical Fusion', 'Bollywood Instrumental', 'Sufi Strings', 'Ambient Lounge'],
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    languages: ['Hindi', 'English'],
    bio: 'Concert-trained electric violinist blending classical ragas with contemporary Bollywood melodies for royal palace weddings, receptions, and luxury cocktail evenings.',
    experience_years: 4,
    rating: 4.91,
    successful_bookings: 18,
    price_min: 20000,
    price_max: 55000,
    profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    youtube_links: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    ],
    audio_samples: [
      'https://soundcloud.com/demo/ananya-violin-fusion'
    ],
    submitted_pricing: {
      starting_price: 20000,
      solo_price: 20000,
      duo_price: 32000,
      band_price: 55000,
      hourly_price: 5500,
      travel_charges_policy: 'Flights and 4-star accommodation for destination weddings outside Jaipur.'
    },
    performance_details: {
      min_duration_minutes: 60,
      max_duration_minutes: 150,
      sound_system_provided: false,
      technical_requirements: '1 DI box, cordless pickup input, and 1 stage monitor.',
      travel_readiness: 'pan_india',
      serviceable_cities: ['Jaipur', 'Udaipur', 'Delhi NCR', 'Jodhpur', 'Mumbai']
    },
    verification_documents: {
      legal_name: 'Ananya Joshi',
      id_type: 'aadhaar',
      id_number_masked: 'XXXX-XXXX-8210',
      id_document_url: 'https://drive.google.com/file/d/ananya-aadhaar/view',
      address_proof_url: '',
      pan_or_tax_id: 'ANJOS4129P'
    },
    verification_status: 'approved',
    profile_completion: 92,
    is_live: true,
    is_featured: true,
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  }
];

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  allowedAdminEmails: string[];
  updateAllowedAdminEmails: (emails: string[]) => Promise<{ success: boolean; error?: string }>;
  artists: ArtistProfile[];
  signInAdminWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  updateArtistStatus: (
    artistId: string, 
    newStatus: 'approved' | 'rejected' | 'under_review' | 'pending', 
    reason?: string
  ) => Promise<void>;
  addArtist: (
    artist: ArtistProfile,
    galleryImages?: string[]
  ) => Promise<{ success: boolean; savedToSupabase: boolean; artist: ArtistProfile }>;
  bulkAddArtists: (newArtists: ArtistProfile[]) => Promise<{ count: number; savedToSupabase: number }>;
  refreshAdminData: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [allowedAdminEmails, setAllowedAdminEmails] = useState<string[]>([]);
  const [artists, setArtists] = useState<ArtistProfile[]>(INITIAL_REVIEW_ARTISTS);

  const clearAuthError = () => setAuthError(null);

  // Load verified Google Admin session from HttpOnly server cookie + artists directory
  useEffect(() => {
    let mounted = true;

    const initAdmin = async () => {
      if (typeof window === 'undefined') return;

      // Clear any legacy insecure bypass session key
      localStorage.removeItem('artist_admin_director_session');

      try {
        const meRes = await fetch('/api/admin/auth/me', { cache: 'no-store' });
        const meData = await meRes.json();
        if (mounted) {
          if (Array.isArray(meData.allowedEmails) && meData.allowedEmails.length > 0) {
            setAllowedAdminEmails(meData.allowedEmails);
          } else {
            setAllowedAdminEmails(getAllowedAdminEmails());
          }
          if (meData.admin) {
            setAdmin(meData.admin);
          } else {
            setAdmin(null);
            if (meData.error) setAuthError(meData.error);
          }
        }
      } catch (e) {
        console.warn('Could not read admin session from /api/admin/auth/me:', e);
        if (mounted) setAllowedAdminEmails(getAllowedAdminEmails());
      }

      // Load any locally registered admin artists first
      let localRegistered: ArtistProfile[] = [];
      try {
        const stored = localStorage.getItem('artist_admin_registered_artists');
        if (stored) {
          localRegistered = JSON.parse(stored) as ArtistProfile[];
        }
      } catch {
        localRegistered = [];
      }

      // Try fetching real artists from Supabase
      try {
        const { data: dbArtists, error } = await supabase
          .from('artists')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && dbArtists && dbArtists.length > 0) {
          const dbIds = new Set(dbArtists.map(a => a.id));
          const uniqueLocal = localRegistered.filter(l => !dbIds.has(l.id));
          const localIds = new Set(uniqueLocal.map(l => l.id));
          const uniqueSeeds = INITIAL_REVIEW_ARTISTS.filter(s => !dbIds.has(s.id) && !localIds.has(s.id));
          if (mounted) setArtists([...(dbArtists as ArtistProfile[]), ...uniqueLocal, ...uniqueSeeds]);
        } else if (localRegistered.length > 0) {
          const localIds = new Set(localRegistered.map(l => l.id));
          const uniqueSeeds = INITIAL_REVIEW_ARTISTS.filter(s => !localIds.has(s.id));
          if (mounted) setArtists([...localRegistered, ...uniqueSeeds]);
        }
      } catch (e) {
        console.warn('Could not sync live artists from Supabase, using local directory:', e);
        if (localRegistered.length > 0 && mounted) {
          const localIds = new Set(localRegistered.map(l => l.id));
          const uniqueSeeds = INITIAL_REVIEW_ARTISTS.filter(s => !localIds.has(s.id));
          setArtists([...localRegistered, ...uniqueSeeds]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  const signInAdminWithGoogle = async () => {
    setAuthError(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/api/admin/auth/google';
    }
    return { success: true };
  };

  const logoutAdmin = async () => {
    await fetch('/api/admin/auth/me', { method: 'DELETE' }).catch(() => {});
    await supabase.auth.signOut().catch(() => {});
    localStorage.removeItem('artist_admin_director_session');
    setAdmin(null);
  };

  const updateAllowedAdminEmails = async (emails: string[]) => {
    const cleaned = Array.from(
      new Set(emails.map((e) => normalizeEmail(e)).filter((e) => e.includes('@')))
    );

    if (cleaned.length === 0) {
      return { success: false, error: 'At least 1 authorized admin email is required.' };
    }

    if (cleaned.length > MAX_ADMIN_EMAILS) {
      return { success: false, error: `Maximum ${MAX_ADMIN_EMAILS} authorized admin emails are allowed.` };
    }

    if (admin?.email && !cleaned.includes(normalizeEmail(admin.email))) {
      return {
        success: false,
        error: `You cannot remove your own active admin email (${admin.email}).`,
      };
    }

    try {
      const res = await fetch('/api/admin/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Could not update allowed admin emails.' };
      }
      const saved = saveAllowedAdminEmails(data.allowedEmails || cleaned);
      setAllowedAdminEmails(saved);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error saving admin emails.' };
    }
  };

  const updateArtistStatus = async (
    artistId: string, 
    newStatus: 'approved' | 'rejected' | 'under_review' | 'pending', 
    reason?: string
  ) => {
    // 1. Update in local state for instant responsive feedback
    setArtists(prev => prev.map(a => {
      if (a.id === artistId) {
        return {
          ...a,
          verification_status: newStatus,
          is_live: newStatus === 'approved',
          rejection_reason: reason || a.rejection_reason,
          verified_at: newStatus === 'approved' ? new Date().toISOString() : a.verified_at,
          updated_at: new Date().toISOString()
        };
      }
      return a;
    }));

    // 2. Persist to Supabase if the record exists there
    try {
      await supabase
        .from('artists')
        .update({
          verification_status: newStatus,
          is_live: newStatus === 'approved',
          rejection_reason: reason || null,
          verified_at: newStatus === 'approved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', artistId);
    } catch (e) {
      console.warn('Supabase update failed, kept in local state:', e);
    }
  };

  const persistLocalRegistered = (newItems: ArtistProfile[]) => {
    try {
      const existingRaw = localStorage.getItem('artist_admin_registered_artists');
      const existing: ArtistProfile[] = existingRaw ? JSON.parse(existingRaw) : [];
      const newIds = new Set(newItems.map((i) => i.id));
      const merged = [...newItems, ...existing.filter((e) => !newIds.has(e.id))];
      localStorage.setItem('artist_admin_registered_artists', JSON.stringify(merged));
    } catch {
      // ignore storage quota errors
    }
  };

  const addArtist = async (artist: ArtistProfile, galleryImages: string[] = []) => {
    let savedToSupabase = false;
    let finalArtist = artist;

    try {
      const { data, error } = await supabase
        .from('artists')
        .insert([
          {
            name: artist.name,
            stage_name: artist.stage_name || artist.name,
            slug: artist.slug,
            phone_no: artist.phone_no,
            email: artist.email || null,
            category: artist.category,
            sub_category: artist.sub_category || '',
            genres: artist.genres || [],
            city: artist.city,
            state: artist.state || '',
            country: artist.country || 'India',
            languages: artist.languages || ['Hindi', 'English'],
            bio: artist.bio || '',
            experience_years: artist.experience_years || 1,
            rating: artist.rating || 5.0,
            successful_bookings: artist.successful_bookings || 0,
            price_min: artist.price_min || 15000,
            price_max: artist.price_max || 50000,
            cover_image_url: artist.cover_image_url || '',
            profile_image_url: artist.profile_image_url || artist.cover_image_url || '',
            video_url: artist.video_url || '',
            cloudflare_video_url: artist.cloudflare_video_url || '',
            youtube_links: artist.youtube_links || [],
            audio_samples: artist.audio_samples || [],
            submitted_pricing: artist.submitted_pricing,
            performance_details: artist.performance_details,
            verification_documents: artist.verification_documents,
            verification_status: artist.verification_status,
            profile_completion: artist.profile_completion || 90,
            is_live: artist.is_live,
            is_featured: artist.is_featured,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        savedToSupabase = true;
        finalArtist = data as ArtistProfile;

        if (galleryImages.length > 0) {
          await supabase.from('artist_images').insert(
            galleryImages.map((imgUrl, idx) => ({
              artist_id: data.id,
              image_url: imgUrl,
              is_primary: idx === 0,
              display_order: idx + 1,
            }))
          );
        }
      }
    } catch (e) {
      console.warn('Supabase artist insert unavailable, saving locally:', e);
    }

    setArtists((prev) => [finalArtist, ...prev.filter((a) => a.id !== finalArtist.id)]);
    persistLocalRegistered([finalArtist]);

    return { success: true, savedToSupabase, artist: finalArtist };
  };

  const bulkAddArtists = async (newArtists: ArtistProfile[]) => {
    let savedToSupabase = 0;
    const finalList: ArtistProfile[] = [];

    for (const a of newArtists) {
      const res = await addArtist(a);
      finalList.push(res.artist);
      if (res.savedToSupabase) savedToSupabase += 1;
    }

    return { count: finalList.length, savedToSupabase };
  };

  const refreshAdminData = async () => {
    try {
      const { data: dbArtists } = await supabase
        .from('artists')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbArtists && dbArtists.length > 0) {
        const dbIds = new Set(dbArtists.map(a => a.id));
        const uniqueSeeds = INITIAL_REVIEW_ARTISTS.filter(s => !dbIds.has(s.id));
        setArtists([...(dbArtists as ArtistProfile[]), ...uniqueSeeds]);
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        authError,
        clearAuthError,
        allowedAdminEmails,
        updateAllowedAdminEmails,
        artists,
        signInAdminWithGoogle,
        logoutAdmin,
        updateArtistStatus,
        addArtist,
        bulkAddArtists,
        refreshAdminData
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
