-- Live Event Start & 4-Step Proof Verification Table
-- Shared between Admin Panel (Start Event & Inspect Proofs) and Artist Panel (Upload Proofs & Auto-Verify)

CREATE TABLE IF NOT EXISTS public.event_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL,
  event_title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  assigned_artists JSONB NOT NULL DEFAULT '[]'::jsonb,
  client_name TEXT NOT NULL,
  city TEXT,
  venue TEXT,
  event_date DATE,
  budget NUMERIC DEFAULT 0,

  -- Admin-triggered live event lifecycle: 'not_started' -> 'started' -> 'verified'
  event_live_status TEXT NOT NULL DEFAULT 'not_started' CHECK (event_live_status IN ('not_started', 'started', 'verified')),
  started_at TIMESTAMPTZ,
  started_by TEXT,

  -- 4 Mandatory Artist Proofs
  start_image_url TEXT,
  event_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  artist_location JSONB,
  event_video_url TEXT,

  -- Auto-populated once all 4 items are uploaded
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_verifications_status ON public.event_verifications (event_live_status);
CREATE INDEX IF NOT EXISTS idx_event_verifications_booking_id ON public.event_verifications (booking_id);
