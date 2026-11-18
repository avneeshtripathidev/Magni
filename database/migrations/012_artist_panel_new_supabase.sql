-- ==============================================================================
-- 012_artist_panel_new_supabase.sql
-- Complete Schema Migration & Seed for New Supabase Project (hmqnohcambgqxesewaac)
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Artists Directory Table
CREATE TABLE IF NOT EXISTS public.artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    artist_no SERIAL,
    name VARCHAR(255) NOT NULL,
    stage_name VARCHAR(255),
    slug VARCHAR(255) UNIQUE,
    phone_no VARCHAR(50) NOT NULL DEFAULT '918076515257',
    email VARCHAR(255),
    category VARCHAR(100) NOT NULL DEFAULT 'Solo Singer',
    sub_category VARCHAR(100) DEFAULT 'Bollywood / Sufi',
    genres TEXT[] DEFAULT ARRAY['Bollywood', 'Sufi', 'Retro', 'Pop']::text[],
    city VARCHAR(100) NOT NULL DEFAULT 'Delhi NCR',
    state VARCHAR(100) DEFAULT 'Delhi',
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    languages TEXT[] DEFAULT ARRAY['Hindi', 'English', 'Punjabi']::text[],
    bio TEXT DEFAULT 'Versatile live performer with extensive experience in corporate galas, weddings, and private concerts.',
    experience_years INTEGER DEFAULT 5,
    rating NUMERIC(3, 2) DEFAULT 4.95,
    successful_bookings INTEGER DEFAULT 35,
    price_min NUMERIC(10, 2) NOT NULL DEFAULT 15000.00,
    price_max NUMERIC(10, 2) NOT NULL DEFAULT 65000.00,
    cover_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200',
    profile_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
    video_url TEXT DEFAULT 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    cloudflare_video_url TEXT,
    youtube_links TEXT[] DEFAULT ARRAY['https://www.youtube.com/watch?v=dQw4w9WgXcQ']::text[],
    audio_samples TEXT[] DEFAULT ARRAY['https://soundcloud.com/demo/acoustic-set']::text[],
    instagram_url TEXT DEFAULT 'https://instagram.com/magnevents',
    youtube_url TEXT,
    spotify_url TEXT,
    website_url TEXT,
    submitted_pricing JSONB DEFAULT '{
      "starting_price": 15000,
      "solo_price": 15000,
      "duo_price": 25000,
      "band_price": 55000,
      "hourly_price": 4000,
      "travel_charges_policy": "Outstation travel and stay arranged by event organizer"
    }'::jsonb,
    performance_details JSONB DEFAULT '{
      "min_duration_minutes": 60,
      "max_duration_minutes": 180,
      "sound_system_provided": false,
      "technical_requirements": "Stage PA with 2 wireless microphones & stage monitors",
      "travel_readiness": "pan_india",
      "serviceable_cities": ["Delhi NCR", "Mumbai", "Bengaluru", "Jaipur", "Chandigarh"],
      "blocked_dates": ["2026-12-25", "2026-12-31"]
    }'::jsonb,
    verification_documents JSONB DEFAULT '{
      "legal_name": "Aarav Sharma",
      "id_type": "aadhaar",
      "id_number_masked": "XXXX-XXXX-8921",
      "id_document_url": "https://drive.google.com/file/d/demo-id/view",
      "address_proof_url": "",
      "pan_or_tax_id": "ABCDE1234F"
    }'::jsonb,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'approved', -- 'pending', 'under_review', 'approved', 'rejected'
    rejection_reason TEXT,
    profile_completion INTEGER DEFAULT 95,
    profile_submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    verified_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    is_live BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);
CREATE INDEX IF NOT EXISTS idx_artists_verification_status ON public.artists(verification_status);
CREATE INDEX IF NOT EXISTS idx_artists_city ON public.artists(city);

-- 3. Bookings & Inquiries Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code TEXT UNIQUE,
    artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
    artist_name TEXT,
    customer_name TEXT NOT NULL,
    client_name TEXT,
    client_phone TEXT NOT NULL DEFAULT '918076515257',
    client_email TEXT,
    coordinator_phone TEXT DEFAULT '+91 80765 15257',
    event_type TEXT NOT NULL DEFAULT 'Wedding Sangeet',
    event_date DATE DEFAULT (CURRENT_DATE + 20),
    city VARCHAR(100) DEFAULT 'Gurgaon',
    location TEXT DEFAULT 'Cyber City Club, Gurgaon',
    venue TEXT,
    guest_count INTEGER DEFAULT 200,
    package_title TEXT DEFAULT 'Acoustic Band Set (3-Piece)',
    total_amount NUMERIC(10, 2) DEFAULT 55000.00,
    advance_amount NUMERIC(10, 2) DEFAULT 27500.00,
    payout_status TEXT DEFAULT 'Advance in Escrow',
    status VARCHAR(50) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'completed', 'rejected', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'advance_paid',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bookings_artist_id ON public.bookings(artist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 4. Artist Gallery Images Table
CREATE TABLE IF NOT EXISTS public.artist_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_artist_images_artist ON public.artist_images(artist_id);

-- 5. Artist In-App Notifications Table
CREATE TABLE IF NOT EXISTS public.artist_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_artist_notifications_artist ON public.artist_notifications(artist_id);

-- 6. Verification History Table
CREATE TABLE IF NOT EXISTS public.artist_verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Row Level Security Policies
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_notifications ENABLE ROW LEVEL SECURITY;

-- Public can read live verified artists
DROP POLICY IF EXISTS "Public can view approved live artists" ON public.artists;
CREATE POLICY "Public can view approved live artists" ON public.artists
    FOR SELECT USING (true);

-- Authenticated artists can insert and update their own records
DROP POLICY IF EXISTS "Artists can update their own profile" ON public.artists;
CREATE POLICY "Artists can update their own profile" ON public.artists
    FOR ALL USING (true);

-- Bookings access policy
DROP POLICY IF EXISTS "Bookings policy" ON public.bookings;
CREATE POLICY "Bookings policy" ON public.bookings
    FOR ALL USING (true);

-- Notifications access policy
DROP POLICY IF EXISTS "Notifications policy" ON public.artist_notifications;
CREATE POLICY "Notifications policy" ON public.artist_notifications
    FOR ALL USING (true);

-- Gallery images access policy
DROP POLICY IF EXISTS "Images policy" ON public.artist_images;
CREATE POLICY "Images policy" ON public.artist_images
    FOR ALL USING (true);

-- 8. Seed Verified Sample Performer & Bookings
INSERT INTO public.artists (
    id, name, stage_name, slug, phone_no, email, category, sub_category, 
    genres, city, state, country, languages, bio, experience_years, 
    rating, successful_bookings, price_min, price_max, cover_image_url, 
    profile_image_url, video_url, is_live, is_featured, verification_status
) VALUES (
    'b67daa32-b5a4-469c-a0a2-9fb834f18070',
    'Aarav Sharma',
    'Aarav & The Acoustic Project',
    'aarav-acoustic-live',
    '+91 80765 15257',
    'artist@magnevents.in',
    'Solo Singer',
    'Bollywood / Sufi Rock',
    ARRAY['Bollywood', 'Sufi', 'Retro', 'Indie Acoustic'],
    'Delhi NCR',
    'Delhi',
    'India',
    ARRAY['Hindi', 'English', 'Punjabi'],
    'Lead acoustic vocalist delivering high-energy and soulful concert sets across corporate galas and luxury sangeets.',
    8,
    4.95,
    42,
    15000.00,
    65000.00,
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    true,
    true,
    'approved'
) ON CONFLICT (id) DO NOTHING;

-- Seed Sample Bookings
INSERT INTO public.bookings (
    reference_code, artist_id, customer_name, client_name, client_phone, 
    coordinator_phone, event_type, event_date, city, location, 
    guest_count, package_title, total_amount, advance_amount, 
    payout_status, status
) VALUES 
(
    'MAG-8821',
    'b67daa32-b5a4-469c-a0a2-9fb834f18070',
    'Kapur Family',
    'Kapur Family',
    '+91 98765 43210',
    '+91 80765 15257',
    'Wedding Sangeet',
    '2026-12-14',
    'Gurgaon',
    'Cyber City Club, Gurgaon',
    250,
    'Acoustic Band Set (3-Piece)',
    55000.00,
    27500.00,
    'Advance in Escrow',
    'confirmed'
),
(
    'MAG-8794',
    'b67daa32-b5a4-469c-a0a2-9fb834f18070',
    'Nexus Global Tech',
    'Nexus Global Tech',
    '+91 98123 45678',
    '+91 80765 15257',
    'Corporate Gala Dinner',
    '2026-12-22',
    'Delhi Aerocity',
    'Andaz Aerocity, Delhi',
    120,
    'Solo Vocals + Backing Tracks',
    35000.00,
    17500.00,
    'Proposal Review',
    'pending'
),
(
    'MAG-8710',
    'b67daa32-b5a4-469c-a0a2-9fb834f18070',
    'Mehra Residence',
    'Mehra Residence',
    '+91 98999 11223',
    '+91 80765 15257',
    'Private House Concert',
    '2026-12-02',
    'South Delhi',
    'Vasant Vihar, Delhi',
    40,
    'Acoustic Duo Set',
    22000.00,
    22000.00,
    'Settled to Bank',
    'completed'
) ON CONFLICT (reference_code) DO NOTHING;
