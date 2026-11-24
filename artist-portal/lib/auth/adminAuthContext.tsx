"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { ArtistProfile } from '../../types/artist';
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

export const INITIAL_REVIEW_ARTISTS: ArtistProfile[] = [];

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
  toggleArtistLive: (artistId: string, makeLive: boolean) => Promise<void>;
  addArtist: (
    artist: ArtistProfile,
    galleryImages?: string[]
  ) => Promise<{ success: boolean; savedToSupabase: boolean; artist: ArtistProfile }>;
  bulkAddArtists: (newArtists: ArtistProfile[]) => Promise<{ count: number; savedToSupabase: number }>;
  deleteArtist: (artistId: string) => Promise<{ success: boolean; error?: string }>;
  refreshAdminData: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Helper to automatically recover & sync any submitted local artists to Supabase
async function syncPendingLocalArtists(existingDbArtists: ArtistProfile[]): Promise<ArtistProfile[]> {
  if (typeof window === 'undefined') return [];
  const syncedList: ArtistProfile[] = [];

  const candidates: any[] = [];
  try {
    const regArtistRaw = localStorage.getItem('magnevents_registered_artist');
    if (regArtistRaw) {
      candidates.push(JSON.parse(regArtistRaw));
    }
  } catch (e) {}

  try {
    const adminArtistsRaw = localStorage.getItem('artist_admin_registered_artists');
    if (adminArtistsRaw) {
      const parsed = JSON.parse(adminArtistsRaw);
      if (Array.isArray(parsed)) candidates.push(...parsed);
    }
  } catch (e) {}

  for (const cand of candidates) {
    if (!cand || (!cand.name && !cand.stage_name)) continue;

    const candEmail = cand.email ? String(cand.email).toLowerCase().trim() : '';
    const candSlug = cand.slug ? String(cand.slug).toLowerCase().trim() : '';

    const alreadyInDb = existingDbArtists.some((a) => {
      if (cand.id && !String(cand.id).startsWith('local-') && !String(cand.id).startsWith('demo-') && a.id === cand.id) return true;
      if (candEmail && a.email && a.email.toLowerCase().trim() === candEmail) return true;
      if (candSlug && a.slug && a.slug.toLowerCase().trim() === candSlug) return true;
      return false;
    });

    if (alreadyInDb) continue;

    // Must be synced to Supabase
    try {
      const cleanSlug = candSlug || `${(cand.stage_name || cand.name || 'artist').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-5)}`;
      const syncPayload: Record<string, any> = {
        name: cand.name || cand.stage_name || 'Artist',
        stage_name: cand.stage_name || cand.name || '',
        slug: cleanSlug,
        email: cand.email || null,
        phone_no: cand.phone_no || '',
        category: cand.category || 'Performer',
        sub_category: cand.sub_category || '',
        genres: Array.isArray(cand.genres) ? cand.genres : [],
        city: cand.city || 'India',
        state: cand.state || '',
        country: 'India',
        languages: Array.isArray(cand.languages) && cand.languages.length > 0 ? cand.languages : ['Hindi', 'English'],
        bio: cand.bio || '',
        experience_years: Number(cand.experience_years) || 1,
        rating: 5.0,
        successful_bookings: 0,
        price_min: Number(cand.price_min) || Number(cand.submitted_pricing?.starting_price) || 15000,
        price_max: Number(cand.price_max) || (Number(cand.price_min) || 15000) * 3,
        cover_image_url: cand.cover_image_url || '',
        profile_image_url: cand.profile_image_url || cand.cover_image_url || '',
        video_url: cand.video_url || '',
        youtube_links: Array.isArray(cand.youtube_links) ? cand.youtube_links : [],
        audio_samples: Array.isArray(cand.audio_samples) ? cand.audio_samples : [],
        submitted_pricing: cand.submitted_pricing || {},
        performance_details: {
          ...(cand.performance_details || {}),
          is_onboarding_complete: true,
          onboarding_step: 4,
        },
        verification_documents: cand.verification_documents || {},
        verification_status: (cand.verification_status === 'approved' || cand.verification_status === 'under_review' || cand.verification_status === 'rejected') ? cand.verification_status : 'pending',
        profile_completion: Number(cand.profile_completion) || 100,
        profile_submitted_at: cand.profile_submitted_at || new Date().toISOString(),
        is_live: false,
        is_featured: false,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('artists')
        .insert([syncPayload])
        .select('*')
        .single();

      if (!insertErr && inserted) {
        syncedList.push(inserted as ArtistProfile);
        localStorage.setItem('magnevents_registered_artist', JSON.stringify(inserted));
      } else if (insertErr) {
        console.warn('Sync pending local artist error:', insertErr.message);
      }
    } catch (e) {
      console.warn('Failed auto-sync for artist candidate:', e);
    }
  }

  return syncedList;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [allowedAdminEmails, setAllowedAdminEmails] = useState<string[]>([]);
  const [artists, setArtists] = useState<ArtistProfile[]>([]);

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

      // Fetch real artists strictly from Supabase + auto-sync any pending local submissions
      try {
        const { data: dbArtists, error } = await supabase
          .from('artists')
          .select('*')
          .order('created_at', { ascending: false });

        let currentArtists: ArtistProfile[] = (!error && Array.isArray(dbArtists)) ? (dbArtists as ArtistProfile[]) : [];

        // Check if there are un-synced artists in local storage that need insertion into Supabase
        const newlySynced = await syncPendingLocalArtists(currentArtists);
        if (newlySynced.length > 0) {
          currentArtists = [...newlySynced, ...currentArtists];
        }

        if (mounted) {
          setArtists(currentArtists);
        }
      } catch (e) {
        console.warn('Could not sync live artists from Supabase:', e);
        if (mounted) setArtists([]);
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

  const toggleArtistLive = async (artistId: string, makeLive: boolean) => {
    // 1. Immediately update memory state for instantaneous UI reaction
    setArtists((prev) =>
      prev.map((a) => {
        if (a.id === artistId) {
          return {
            ...a,
            is_live: makeLive,
            verification_status: makeLive ? 'approved' : a.verification_status,
            verified_at: makeLive ? (a.verified_at || new Date().toISOString()) : a.verified_at,
            updated_at: new Date().toISOString(),
          };
        }
        return a;
      })
    );

    // 2. Sync to local storage caches if cached locally
    if (typeof window !== 'undefined') {
      try {
        const existingRaw = localStorage.getItem('artist_admin_registered_artists');
        if (existingRaw) {
          const existing: ArtistProfile[] = JSON.parse(existingRaw);
          const updated = existing.map((a) =>
            a.id === artistId
              ? {
                  ...a,
                  is_live: makeLive,
                  verification_status: makeLive ? 'approved' : a.verification_status,
                  verified_at: makeLive ? (a.verified_at || new Date().toISOString()) : a.verified_at,
                  updated_at: new Date().toISOString(),
                }
              : a
          );
          localStorage.setItem('artist_admin_registered_artists', JSON.stringify(updated));
        }
        const savedReg = localStorage.getItem('magnevents_registered_artist');
        if (savedReg) {
          const parsed = JSON.parse(savedReg);
          if (parsed.id === artistId) {
            parsed.is_live = makeLive;
            if (makeLive) {
              parsed.verification_status = 'approved';
              parsed.verified_at = parsed.verified_at || new Date().toISOString();
            }
            parsed.updated_at = new Date().toISOString();
            localStorage.setItem('magnevents_registered_artist', JSON.stringify(parsed));
          }
        }
      } catch (err) {
        console.warn('Local storage toggle live error:', err);
      }
    }

    // 3. Persist to Supabase
    try {
      const updates: Record<string, any> = {
        is_live: makeLive,
        updated_at: new Date().toISOString(),
      };
      if (makeLive) {
        updates.verification_status = 'approved';
        updates.verified_at = new Date().toISOString();
      }
      await supabase.from('artists').update(updates).eq('id', artistId);
    } catch (e) {
      console.warn('Supabase toggleArtistLive error:', e);
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

  const deleteArtist = async (artistId: string): Promise<{ success: boolean; error?: string }> => {
    // 1. Immediately remove from memory state for instant reactivity
    setArtists((prev) => prev.filter((a) => a.id !== artistId));

    // 2. Remove from local storage caches
    if (typeof window !== 'undefined') {
      try {
        const existingRaw = localStorage.getItem('artist_admin_registered_artists');
        if (existingRaw) {
          const existing: ArtistProfile[] = JSON.parse(existingRaw);
          const filtered = existing.filter((a) => a.id !== artistId);
          localStorage.setItem('artist_admin_registered_artists', JSON.stringify(filtered));
        }
        localStorage.removeItem(`magnevents_artist_gallery_${artistId}`);
        const savedReg = localStorage.getItem('magnevents_registered_artist');
        if (savedReg) {
          const parsed = JSON.parse(savedReg);
          if (parsed.id === artistId) {
            localStorage.removeItem('magnevents_registered_artist');
          }
        }
      } catch (err) {
        console.warn('Local storage delete error:', err);
      }
    }

    // 3. Delete from Supabase tables (both via server API with service role key & client fallback)
    try {
      fetch('/api/admin/artists/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId }),
      }).catch(() => {});
      await supabase.from('artist_images').delete().eq('artist_id', artistId);
      await supabase.from('artists').delete().eq('id', artistId);
      return { success: true };
    } catch (e: any) {
      console.warn('Supabase delete artist error:', e);
      return { success: true };
    }
  };

  const refreshAdminData = async () => {
    try {
      const { data: dbArtists, error } = await supabase
        .from('artists')
        .select('*')
        .order('created_at', { ascending: false });

      let currentArtists: ArtistProfile[] = (!error && Array.isArray(dbArtists)) ? (dbArtists as ArtistProfile[]) : [];
      const newlySynced = await syncPendingLocalArtists(currentArtists);
      if (newlySynced.length > 0) {
        currentArtists = [...newlySynced, ...currentArtists];
      }

      setArtists(currentArtists);
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
        toggleArtistLive,
        addArtist,
        bulkAddArtists,
        deleteArtist,
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
