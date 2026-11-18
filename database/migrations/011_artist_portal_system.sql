-- ==============================================================================
-- 011_artist_portal_system.sql
-- Magnevents Artist Portal & Admin Verification Workflow Schema Extension
-- ==============================================================================

-- 1. Extend public.artists with Artist Portal specific fields
ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS stage_name VARCHAR(255);

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) NOT NULL DEFAULT 'pending'; 
-- Allowed: 'pending', 'under_review', 'approved', 'rejected', 'suspended'

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}'::text[];

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT '{}'::text[];

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS spotify_url TEXT;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS website_url TEXT;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS youtube_links TEXT[] DEFAULT '{}'::text[];

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS audio_samples TEXT[] DEFAULT '{}'::text[];

-- Private pricing proposals (solo, duo, band, travel charges - not publicly visible until approved)
ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS submitted_pricing JSONB DEFAULT '{
  "starting_price": 5999,
  "solo_price": 5999,
  "duo_price": 9999,
  "band_price": 19999,
  "hourly_price": 3000,
  "travel_charges_policy": "Included within base city; actuals outside base city"
}'::jsonb;

-- Performance logistics & requirements
ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS performance_details JSONB DEFAULT '{
  "min_duration_minutes": 60,
  "max_duration_minutes": 240,
  "sound_system_provided": false,
  "technical_requirements": "Basic PA system with 2 vocal mics and stage monitors",
  "travel_readiness": "pan_india",
  "serviceable_cities": ["Delhi NCR", "Mumbai", "Bengaluru", "Jaipur", "Chandigarh"]
}'::jsonb;

-- Sensitive verification documents (Govt ID, Legal Name, Address Proof - private to Admin)
ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS verification_documents JSONB DEFAULT '{
  "legal_name": "",
  "id_type": "",
  "id_number_masked": "",
  "id_document_url": "",
  "address_proof_url": "",
  "pan_or_tax_id": ""
}'::jsonb;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 25;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS profile_submitted_at TIMESTAMPTZ;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE public.artists 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);
CREATE INDEX IF NOT EXISTS idx_artists_verification_status ON public.artists(verification_status);

-- 2. Create Artist Verification History Table
CREATE TABLE IF NOT EXISTS public.artist_verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_artist_verification_history_artist ON public.artist_verification_history(artist_id);

-- 3. Create Artist In-App Notifications Table
CREATE TABLE IF NOT EXISTS public.artist_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'verification', 'booking', 'system', 'info'
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_artist_notifications_artist ON public.artist_notifications(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_notifications_user ON public.artist_notifications(user_id);

-- 4. Row Level Security (RLS) Setup
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read ONLY for approved & published live artists
DROP POLICY IF EXISTS "Public can view approved live artists" ON public.artists;
CREATE POLICY "Public can view approved live artists" ON public.artists
    FOR SELECT
    USING (is_live = true AND verification_status = 'approved');

-- Allow authenticated artists to view & update their own record
DROP POLICY IF EXISTS "Artists can view their own record" ON public.artists;
CREATE POLICY "Artists can view their own record" ON public.artists
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Artists can update their own profile" ON public.artists;
CREATE POLICY "Artists can update their own profile" ON public.artists
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Allow artists to read their own notifications
DROP POLICY IF EXISTS "Artists read own notifications" ON public.artist_notifications;
CREATE POLICY "Artists read own notifications" ON public.artist_notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Artists update own notifications" ON public.artist_notifications;
CREATE POLICY "Artists update own notifications" ON public.artist_notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Service role bypasses all RLS policies automatically.

