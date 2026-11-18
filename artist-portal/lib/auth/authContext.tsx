"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { ArtistProfile } from '../../types/artist';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  artist: ArtistProfile | null;
  loading: boolean;
  refreshArtist: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  updateLocalArtist: (updates: Partial<ArtistProfile>) => void;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: any }>;
  signUpWithEmail: (data: { email: string; password: string; fullName: string; phone: string }) => Promise<{ error: any }>;
  signInWithEmail: (data: { email: string; password: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  loginAsDemoArtist: () => void;
}

export const DEMO_ARTIST: ArtistProfile = {
  id: 'demo-artist-001',
  user_id: 'demo-user-001',
  name: 'Aarav Sharma',
  stage_name: 'Aarav & The Acoustic Project',
  slug: 'aarav-sharma-live',
  phone_no: '+91 98765 43210',
  email: 'artist.demo@magnevents.in',
  category: 'Singer',
  sub_category: 'Bollywood & Sufi Rock',
  genres: ['Bollywood', 'Sufi', 'Retro', 'Indie Pop'],
  city: 'Delhi NCR',
  state: 'Delhi',
  country: 'India',
  languages: ['Hindi', 'English', 'Punjabi'],
  bio: 'Lead vocalist and acoustic performer with 8+ years of live experience across Delhi NCR, Mumbai, and destination weddings.',
  experience_years: 8,
  rating: 4.9,
  successful_bookings: 42,
  price_min: 15000,
  price_max: 65000,
  cover_image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
  profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  youtube_links: [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  ],
  audio_samples: [
    'https://soundcloud.com/demo/acoustic-sufi-live'
  ],
  instagram_url: 'https://instagram.com/magnevents',
  spotify_url: 'https://open.spotify.com/artist/demo',
  submitted_pricing: {
    starting_price: 15000,
    solo_price: 15000,
    duo_price: 25000,
    band_price: 55000,
    hourly_price: 5000,
    travel_charges_policy: 'Outstation flights/train and twin-sharing hotel room to be arranged by organizer.'
  },
  performance_details: {
    min_duration_minutes: 60,
    max_duration_minutes: 180,
    sound_system_provided: false,
    technical_requirements: 'Stage PA with 2 wireless mics and DI box for acoustic guitar',
    travel_readiness: 'pan_india',
    serviceable_cities: ['Delhi NCR', 'Jaipur', 'Chandigarh', 'Mumbai', 'Bengaluru']
  },
  verification_documents: {
    legal_name: 'Aarav Sharma',
    id_type: 'aadhaar',
    id_number_masked: 'XXXX-XXXX-8921',
    id_document_url: 'https://drive.google.com/file/d/demo-aadhaar-doc/view',
    address_proof_url: 'https://drive.google.com/file/d/demo-electricity-bill/view',
    pan_or_tax_id: 'ABCDE1234F'
  },
  verification_status: 'approved',
  profile_completion: 95,
  is_live: true,
  is_featured: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const DEMO_USER: any = {
  id: 'demo-user-001',
  email: 'artist.demo@magnevents.in',
  app_metadata: { provider: 'demo_bypass' },
  user_metadata: { full_name: 'Aarav Sharma' },
  aud: 'authenticated',
  role: 'authenticated'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const syncOrCreateArtist = async (currentUser: User) => {
    try {
      // 1. Check if artist record exists for this user_id
      const { data: existingArtist, error: fetchErr } = await supabase
        .from('artists')
        .select('*')
        .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingArtist) {
        // Link user_id if not linked yet
        if (!existingArtist.user_id) {
          await supabase
            .from('artists')
            .update({ user_id: currentUser.id })
            .eq('id', existingArtist.id);
          existingArtist.user_id = currentUser.id;
        }
        setArtist(existingArtist as ArtistProfile);
        return existingArtist;
      }

      // 2. Create initial pending artist profile
      const rawName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Artist';
      const cleanSlug = `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
      
      const newArtistPayload = {
        user_id: currentUser.id,
        name: rawName,
        stage_name: rawName,
        slug: cleanSlug,
        email: currentUser.email,
        phone_no: currentUser.user_metadata?.phone || '',
        category: 'Live Singer',
        city: 'Delhi NCR',
        country: 'India',
        languages: ['Hindi', 'English'],
        genres: ['Bollywood', 'Retro'],
        verification_status: 'pending',
        is_live: false,
        profile_completion: 25,
        submitted_pricing: {
          starting_price: 5999,
          solo_price: 5999,
          duo_price: 9999,
          band_price: 19999,
          hourly_price: 3000,
          travel_charges_policy: "Standard outstation travel & stay to be provided by client"
        },
        performance_details: {
          min_duration_minutes: 60,
          max_duration_minutes: 240,
          sound_system_provided: false,
          technical_requirements: "Stage PA with 2 vocal microphones & monitoring",
          travel_readiness: "pan_india",
          serviceable_cities: ["Delhi NCR", "Mumbai", "Bengaluru", "Jaipur", "Chandigarh"]
        },
        verification_documents: {
          legal_name: rawName,
          id_type: "",
          id_number_masked: "",
          id_document_url: "",
          address_proof_url: "",
          pan_or_tax_id: ""
        }
      };

      const { data: createdArtist, error: insertErr } = await supabase
        .from('artists')
        .insert([newArtistPayload])
        .select()
        .single();

      if (!insertErr && createdArtist) {
        setArtist(createdArtist as ArtistProfile);
        return createdArtist;
      }

      // Fallback when remote Supabase artists table is not yet migrated
      const fallbackArtist: ArtistProfile = {
        ...(newArtistPayload as any),
        id: `local-${currentUser.id}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setArtist(fallbackArtist);
      if (typeof window !== 'undefined') {
        localStorage.setItem('magnevents_registered_artist', JSON.stringify(fallbackArtist));
      }
      return fallbackArtist;
    } catch (err) {
      console.error('Error syncing artist profile:', err);
    }
    return null;
  };

  const updateLocalArtist = (updates: Partial<ArtistProfile>) => {
    setArtist((prev) => {
      const merged = {
        ...(prev || DEMO_ARTIST),
        ...updates,
        updated_at: new Date().toISOString(),
      } as ArtistProfile;
      if (typeof window !== 'undefined') {
        localStorage.setItem('magnevents_registered_artist', JSON.stringify(merged));
      }
      return merged;
    });
  };

  const refreshArtist = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setArtist(data as ArtistProfile);
        if (typeof window !== 'undefined') {
          localStorage.setItem('magnevents_registered_artist', JSON.stringify(data));
        }
        return;
      }
    } catch (err) {
      console.error('Failed to refresh artist:', err);
    }
  };

  useEffect(() => {
    async function initAuth() {
      try {
        // Check for Demo Artist Bypass flag
        if (typeof window !== 'undefined') {
          const isDemoBypass = localStorage.getItem('magnevents_demo_artist') === 'true' || 
            document.cookie.includes('artist_bypass_session=true');
          if (isDemoBypass) {
            setUser(DEMO_USER);
            const savedDemoArtist = localStorage.getItem('magnevents_registered_artist');
            setArtist(savedDemoArtist ? JSON.parse(savedDemoArtist) : DEMO_ARTIST);
            setLoading(false);
            return;
          }
        }

        const { data: { session: initSession } } = await supabase.auth.getSession();
        if (initSession?.user) {
          setSession(initSession);
          setUser(initSession.user);
          if (typeof document !== 'undefined') {
            document.cookie = "artist_session_active=true; path=/; max-age=604800";
          }
          await syncOrCreateArtist(initSession.user);
        } else if (typeof window !== 'undefined') {
          // Restore newly registered artist session (e.g. if Supabase email confirmation is pending)
          const savedUser = localStorage.getItem('magnevents_registered_user');
          const savedArtist = localStorage.getItem('magnevents_registered_artist');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
            if (savedArtist) setArtist(JSON.parse(savedArtist));
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      // Do not override if in demo bypass mode or local newly registered flow
      if (typeof window !== 'undefined' && (localStorage.getItem('magnevents_demo_artist') === 'true' || (!newSession && localStorage.getItem('magnevents_registered_user')))) {
        return;
      }
      setSession(newSession);
      setUser(newSession?.user || null);
      if (newSession?.user) {
        if (typeof document !== 'undefined') {
          document.cookie = "artist_session_active=true; path=/; max-age=604800";
        }
        await syncOrCreateArtist(newSession.user);
      } else {
        setArtist(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Demo Artist Bypass function
  const loginAsDemoArtist = () => {
    if (typeof document !== 'undefined') {
      document.cookie = "artist_bypass_session=true; path=/; max-age=604800";
      localStorage.setItem('magnevents_demo_artist', 'true');
    }
    setUser(DEMO_USER);
    setArtist(DEMO_ARTIST);
    setLoading(false);
    router.push('/dashboard');
  };

  // Google OAuth Login (routes via clean /auth/callback without query params so Supabase Redirect URLs always match)
  const signInWithGoogle = async (redirectPath = '/dashboard') => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://artists.magnevents.in';
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('magnevents_oauth_next', redirectPath);
      } catch {}
    }
    const callbackUrl = `${origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });
    return { error };
  };

  // Email/Password Signup -> Direct DB storage (NO confirmation email sent) -> Step 2 (/onboarding)
  const signUpWithEmail = async ({ email, password, fullName, phone }: { email: string; password: string; fullName: string; phone: string }) => {
    try {
      const res = await fetch('/api/artist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { error: { message: data.error || 'Failed to create artist account.' } };
      }

      if (typeof document !== 'undefined') {
        document.cookie = "artist_session_active=true; path=/; max-age=604800";
        localStorage.removeItem('magnevents_demo_artist');
        localStorage.setItem('magnevents_registered_user', JSON.stringify(data.user));
        localStorage.setItem('magnevents_registered_artist', JSON.stringify(data.artist));
      }

      setUser(data.user);
      setArtist(data.artist as ArtistProfile);
      setLoading(false);

      return { error: null };
    } catch (err: any) {
      return { error: { message: err?.message || 'Registration failed. Please try again.' } };
    }
  };

  // Email/Password Login -> Checks Direct DB first, falls back to Supabase Auth
  const signInWithEmail = async ({ email, password }: { email: string; password: string }) => {
    try {
      const res = await fetch('/api/artist/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user && data.artist) {
          if (typeof document !== 'undefined') {
            document.cookie = "artist_session_active=true; path=/; max-age=604800";
            localStorage.removeItem('magnevents_demo_artist');
            localStorage.setItem('magnevents_registered_user', JSON.stringify(data.user));
            localStorage.setItem('magnevents_registered_artist', JSON.stringify(data.artist));
          }
          setUser(data.user);
          setArtist(data.artist as ArtistProfile);
          setLoading(false);
          return { error: null };
        }
      }
    } catch {
      // Fall back to Supabase Auth below
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      if (typeof document !== 'undefined') {
        document.cookie = "artist_session_active=true; path=/; max-age=604800";
      }
      setUser(data.user);
      await syncOrCreateArtist(data.user);
    }

    return { error };
  };

  // Sign out
  const signOut = async () => {
    if (typeof document !== 'undefined') {
      document.cookie = "artist_bypass_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "artist_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem('magnevents_demo_artist');
      localStorage.removeItem('magnevents_registered_user');
      localStorage.removeItem('magnevents_registered_artist');
    }
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
    setArtist(null);
    router.push('/login');
  };

  // Forgot password
  const resetPassword = async (email: string) => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://artists.magnevents.in';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/settings`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        artist,
        loading,
        refreshArtist,
        reloadProfile: refreshArtist,
        updateLocalArtist,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signOut,
        resetPassword,
        loginAsDemoArtist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useArtistAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useArtistAuth must be used within an AuthProvider');
  }
  return context;
}

export const useAuth = useArtistAuth;
