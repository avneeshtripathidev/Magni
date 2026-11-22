-- ==============================================================================
-- Migration 015: Wedding Invitation & Digital Wedding Card Inquiries Schema
-- Magnevents Platform & Artist Portal
-- Safe, idempotent creation for public.wedding_inquiries
-- ==============================================================================

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.wedding_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  wedding_date DATE,
  invitation_type TEXT NOT NULL DEFAULT 'Digital Wedding Card',
  design_category TEXT NOT NULL DEFAULT 'Royal Wedding Invitations',
  budget TEXT,
  requirements TEXT,
  reference_url TEXT,
  reference_file TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'CONTACTED', 'DISCUSSION', 'DESIGNING', 'REVIEW', 'COMPLETED', 'CANCELLED')),
  assigned_artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  assigned_artist_name TEXT,
  admin_notes TEXT,
  artist_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for fast dashboard filtering & sorting
CREATE INDEX IF NOT EXISTS idx_wedding_inquiries_status ON public.wedding_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_wedding_inquiries_wedding_date ON public.wedding_inquiries(wedding_date);
CREATE INDEX IF NOT EXISTS idx_wedding_inquiries_assigned_artist ON public.wedding_inquiries(assigned_artist_id);
CREATE INDEX IF NOT EXISTS idx_wedding_inquiries_created_at ON public.wedding_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wedding_inquiries_inquiry_id ON public.wedding_inquiries(inquiry_id);

-- 3. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_wedding_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wedding_inquiries_updated_at ON public.wedding_inquiries;
CREATE TRIGGER trg_wedding_inquiries_updated_at
  BEFORE UPDATE ON public.wedding_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_wedding_inquiries_updated_at();

-- 4. Enable Row Level Security (RLS) & Grant Access
ALTER TABLE public.wedding_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public insert (anon customer inquiry submission)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wedding_inquiries' AND policyname = 'Allow public insert of wedding inquiries'
  ) THEN
    CREATE POLICY "Allow public insert of wedding inquiries"
      ON public.wedding_inquiries
      FOR INSERT
      TO anon, authenticated, service_role
      WITH CHECK (true);
  END IF;
END $$;

-- Allow read and write for authenticated service role and dashboard users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wedding_inquiries' AND policyname = 'Allow full management for service_role'
  ) THEN
    CREATE POLICY "Allow full management for service_role"
      ON public.wedding_inquiries
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Allow read for authenticated artists / admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wedding_inquiries' AND policyname = 'Allow select for authenticated users'
  ) THEN
    CREATE POLICY "Allow select for authenticated users"
      ON public.wedding_inquiries
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

GRANT ALL ON TABLE public.wedding_inquiries TO postgres, service_role;
GRANT SELECT, INSERT ON TABLE public.wedding_inquiries TO anon;
GRANT SELECT, UPDATE, INSERT ON TABLE public.wedding_inquiries TO authenticated;
