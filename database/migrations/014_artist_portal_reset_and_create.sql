-- ==============================================================================
-- Magnevents Artist Portal — FULL WIPE (public schema) & FRESH CREATE
-- Note: Supabase does not allow DROP DATABASE postgres on the active connection.
-- DROP SCHEMA public CASCADE wipes EVERY existing table, view, function & type
-- in public cleanly, then recreates everything fresh.
-- Run in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. COMPLETELY WIPE EVERYTHING IN PUBLIC SCHEMA & RECREATE IT FRESH
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- 2. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- 3. AUTO-UPDATE updated_at TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. AUTHORIZED ADMIN GOOGLE ACCOUNTS TABLE (HARD-CAPPED AT MAX 3 EMAILS)
CREATE TABLE public.admin_allowed_emails (
  slot_number SMALLINT PRIMARY KEY CHECK (slot_number BETWEEN 1 AND 3),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_admin_allowed_emails_updated_at
  BEFORE UPDATE ON public.admin_allowed_emails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. ARTISTS TABLE (Profiles, R2 Basic Details + R2 Private KYC)
CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  artist_no SERIAL,
  name VARCHAR(255) NOT NULL,
  stage_name VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  phone_no VARCHAR(50) NOT NULL DEFAULT '',
  phone_no_alt VARCHAR(50) DEFAULT '',
  contact_person VARCHAR(255) DEFAULT '',
  email VARCHAR(255),
  category VARCHAR(100) NOT NULL DEFAULT 'Singer',
  sub_category VARCHAR(100) DEFAULT '',
  genres TEXT[] DEFAULT ARRAY[]::text[],
  city VARCHAR(100) NOT NULL DEFAULT 'Delhi NCR',
  state VARCHAR(100) DEFAULT '',
  locality VARCHAR(255) DEFAULT '',
  address TEXT DEFAULT '',
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  languages TEXT[] DEFAULT ARRAY['Hindi', 'English']::text[],
  bio TEXT DEFAULT '',
  experience_years INTEGER DEFAULT 1,
  rating NUMERIC(3, 2) DEFAULT 4.90,
  successful_bookings INTEGER DEFAULT 0,
  available_bookings INTEGER DEFAULT 0,
  members_min INTEGER DEFAULT 1,
  members_max INTEGER DEFAULT 1,
  performance_duration VARCHAR(100) DEFAULT '60-90 mins',
  price_min NUMERIC(10, 2) NOT NULL DEFAULT 15000.00,
  price_max NUMERIC(10, 2) NOT NULL DEFAULT 50000.00,
  original_price NUMERIC(10, 2),
  exclusive_price NUMERIC(10, 2),

  -- Cloudflare R2 Basic Details URLs (folder: artist-basic-details/)
  cover_image_url TEXT DEFAULT '',
  profile_image_url TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  cloudflare_video_url TEXT DEFAULT '',
  youtube_links TEXT[] DEFAULT ARRAY[]::text[],
  audio_samples TEXT[] DEFAULT ARRAY[]::text[],

  -- Social Links
  instagram_url TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',
  spotify_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',

  -- Pricing & Stage Details
  submitted_pricing JSONB NOT NULL DEFAULT '{
    "starting_price": 15000,
    "solo_price": 15000,
    "duo_price": 25000,
    "band_price": 50000,
    "hourly_price": 4000,
    "travel_charges_policy": "Outstation travel and stay arranged by event organizer"
  }'::jsonb,

  performance_details JSONB NOT NULL DEFAULT '{
    "min_duration_minutes": 60,
    "max_duration_minutes": 180,
    "sound_system_provided": false,
    "technical_requirements": "",
    "travel_readiness": "pan_india",
    "serviceable_cities": [],
    "blocked_dates": []
  }'::jsonb,

  -- Cloudflare R2 Private KYC URLs (folder: artist-private-kyc/)
  verification_documents JSONB NOT NULL DEFAULT '{
    "legal_name": "",
    "id_type": "",
    "id_number_masked": "",
    "id_document_url": "",
    "address_proof_url": "",
    "pan_or_tax_id": ""
  }'::jsonb,

  spotlight_status VARCHAR(30) NOT NULL DEFAULT 'standard'
    CHECK (spotlight_status IN ('standard', 'featured', 'trending')),
  is_artist_of_month BOOLEAN NOT NULL DEFAULT false,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  profile_completion INTEGER NOT NULL DEFAULT 40,
  profile_submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  is_live BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_artists_user_id ON public.artists(user_id);
CREATE INDEX idx_artists_verification_status ON public.artists(verification_status);
CREATE INDEX idx_artists_city ON public.artists(city);
CREATE INDEX idx_artists_category ON public.artists(category);
CREATE INDEX idx_artists_successful_bookings ON public.artists(successful_bookings DESC);

CREATE TRIGGER trg_artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. BOOKINGS TABLE (Single & Multi-Artist Event Bookings)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT UNIQUE NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  artist_name TEXT,
  assigned_artists JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_name TEXT NOT NULL,
  client_name TEXT,
  client_phone TEXT NOT NULL DEFAULT '',
  client_email TEXT,
  coordinator_phone TEXT DEFAULT '+91 80765 15257',
  event_type TEXT NOT NULL DEFAULT 'Wedding Sangeet',
  event_date DATE DEFAULT (CURRENT_DATE + 15),
  city VARCHAR(100) DEFAULT 'Delhi NCR',
  location TEXT DEFAULT '',
  venue TEXT,
  guest_count INTEGER DEFAULT 150,
  package_title TEXT DEFAULT 'Live Performance Set',
  total_amount NUMERIC(10, 2) DEFAULT 35000.00,
  advance_amount NUMERIC(10, 2) DEFAULT 17500.00,
  payout_status TEXT DEFAULT 'Advance in Escrow',
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'rejected', 'cancelled')),
  payment_status VARCHAR(50) DEFAULT 'advance_paid',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_bookings_artist_id ON public.bookings(artist_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_city ON public.bookings(city);

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. EVENT VERIFICATIONS TABLE (Admin Live Start + Multi-Artist + 4 Mandatory Proofs)
CREATE TABLE public.event_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL,
  event_title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  assigned_artists JSONB NOT NULL DEFAULT '[]'::jsonb,
  client_name TEXT NOT NULL,
  city TEXT,
  venue TEXT,
  event_date DATE,
  budget NUMERIC(10, 2) DEFAULT 0,
  payout_status TEXT DEFAULT 'Advance in Escrow',

  -- Lifecycle: 'not_started' -> 'started' -> 'verified'
  event_live_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (event_live_status IN ('not_started', 'started', 'verified')),
  started_at TIMESTAMPTZ,
  started_by TEXT,

  -- 4 Mandatory Artist Proofs (stored in Cloudflare R2: artist-basic-details/)
  start_image_url TEXT,
  event_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  artist_location JSONB,
  event_video_url TEXT,

  -- Auto-verified once all 4 items are uploaded
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_event_verifications_status ON public.event_verifications(event_live_status);
CREATE INDEX idx_event_verifications_booking_id ON public.event_verifications(booking_id);
CREATE INDEX idx_event_verifications_city ON public.event_verifications(city);

CREATE TRIGGER trg_event_verifications_updated_at
  BEFORE UPDATE ON public.event_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. ARTIST GALLERY IMAGES TABLE (Photos Registry: up to 15 photos per artist)
CREATE TABLE public.artist_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  r2_key TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_artist_images_artist ON public.artist_images(artist_id);

-- 9. ARTIST NOTIFICATIONS TABLE
CREATE TABLE public.artist_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info'
    CHECK (type IN ('verification', 'booking', 'system', 'info')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_artist_notifications_artist ON public.artist_notifications(artist_id);

-- 10. ARTIST VERIFICATION HISTORY (AUDIT LOG)
CREATE TABLE public.artist_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  reason TEXT,
  changed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_artist_verification_history_artist ON public.artist_verification_history(artist_id);

-- 11. ROW LEVEL SECURITY & PERMISSIONS
ALTER TABLE public.admin_allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_verification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to admin_allowed_emails"
  ON public.admin_allowed_emails FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to artists"
  ON public.artists FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to bookings"
  ON public.bookings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to event_verifications"
  ON public.event_verifications FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to artist_images"
  ON public.artist_images FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to artist_notifications"
  ON public.artist_notifications FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to artist_verification_history"
  ON public.artist_verification_history FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 12. SEED AUTHORIZED ADMIN EMAILS (SLOTS 1-3)
INSERT INTO public.admin_allowed_emails (slot_number, email, role) VALUES
  (1, 'magneventsdotin@gmail.com', 'super_admin'),
  (2, 'avanishtripathiavanish79921170@gmail.com', 'super_admin');

-- 13. SEED INITIAL PERFORMER & SAMPLE BOOKINGS
INSERT INTO public.artists (
  id, name, stage_name, slug, phone_no, contact_person, email, category, sub_category,
  genres, city, state, country, languages, bio, experience_years,
  rating, successful_bookings, price_min, price_max,
  profile_image_url, cover_image_url, youtube_links, audio_samples,
  verification_status, profile_completion, is_live, is_featured
) VALUES (
  'b67daa32-b5a4-469c-a0a2-9fb834f18070',
  'Aarav Sharma',
  'Aarav & The Acoustic Project',
  'aarav-acoustic-live',
  '+91 80765 15257',
  'Aarav Sharma',
  'artist@magnevents.in',
  'Singer',
  'Bollywood / Sufi Acoustic',
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
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
  ARRAY['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
  ARRAY['https://soundcloud.com/demo/acoustic-set'],
  'approved',
  95,
  true,
  true
);

INSERT INTO public.bookings (
  reference_code, artist_id, artist_name, customer_name, client_name, client_phone,
  event_type, event_date, city, location, venue, guest_count,
  package_title, total_amount, advance_amount, payout_status, status
) VALUES
(
  'MAG-8821',
  'b67daa32-b5a4-469c-a0a2-9fb834f18070',
  'Aarav Sharma',
  'Kapur Family',
  'Kapur Family',
  '+91 98765 43210',
  'Wedding Sangeet Night',
  '2026-12-14',
  'Gurgaon',
  'The Oberoi Courtyard, Gurgaon, DLF Phase 5',
  'The Oberoi Courtyard',
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
  'Aarav Sharma',
  'Nexus Global Tech',
  'Nexus Global Tech',
  '+91 98123 45678',
  'Corporate Gala Dinner',
  '2026-12-22',
  'Delhi NCR',
  'JW Marriott Grand Ballroom, Delhi Aerocity',
  'JW Marriott Grand Ballroom',
  120,
  'Solo Vocals + Backing Tracks',
  35000.00,
  17500.00,
  'Proposal Review',
  'pending'
);

INSERT INTO public.event_verifications (
  booking_id, event_title, artist_name, assigned_artists, client_name,
  city, venue, event_date, budget, payout_status, event_live_status
) VALUES
(
  'MAG-8821',
  'Wedding Sangeet Night',
  'Aarav Sharma',
  '[{"artist_id":"b67daa32-b5a4-469c-a0a2-9fb834f18070","name":"Aarav Sharma","category":"Singer","city":"Delhi NCR"}]'::jsonb,
  'Kapur Family',
  'Gurgaon',
  'The Oberoi Courtyard, DLF Phase 5',
  '2026-12-14',
  55000,
  'Advance in Escrow',
  'not_started'
),
(
  'MAG-8794',
  'Corporate Gala Dinner',
  'Aarav Sharma',
  '[{"artist_id":"b67daa32-b5a4-469c-a0a2-9fb834f18070","name":"Aarav Sharma","category":"Singer","city":"Delhi NCR"}]'::jsonb,
  'Nexus Global Tech',
  'Delhi NCR',
  'JW Marriott Grand Ballroom, Delhi Aerocity',
  '2026-12-22',
  35000,
  'Proposal Review',
  'not_started'
);

-- 14. REFRESH SUPABASE REST API SCHEMA CACHE IMMEDIATELY
NOTIFY pgrst, 'reload schema';
