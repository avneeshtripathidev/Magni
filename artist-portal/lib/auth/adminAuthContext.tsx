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

      // Fetch real artists strictly from Supabase
      try {
        const { data: dbArtists, error } = await supabase
          .from('artists')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(dbArtists)) {
          if (mounted) setArtists(dbArtists as ArtistProfile[]);
        } else if (mounted) {
          setArtists([]);
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
      const { data: dbArtists, error } = await supabase
        .from('artists')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(dbArtists)) {
        setArtists(dbArtists as ArtistProfile[]);
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
