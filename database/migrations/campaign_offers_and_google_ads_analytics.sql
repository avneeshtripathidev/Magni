-- ==============================================================================
-- Migration: Google Ads Campaign Offers & Conversion Analytics
-- ==============================================================================

-- 1. Campaign & Offers Management Table
CREATE TABLE IF NOT EXISTS public.campaign_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name TEXT NOT NULL,
    campaign_slug TEXT NOT NULL UNIQUE,
    headline TEXT NOT NULL,
    subheading TEXT,
    offer_badge TEXT DEFAULT 'LIMITED PERIOD OFFER',
    offer_title TEXT,
    offer_description TEXT,
    advance_amount NUMERIC(10, 2) NOT NULL DEFAULT 2499.00,
    original_price NUMERIC(10, 2) DEFAULT 10000.00,
    discount_text TEXT DEFAULT 'Flat 60% OFF',
    cta_text TEXT DEFAULT 'Unlock My Offer & Lock Date',
    secondary_cta_text TEXT DEFAULT 'Explore Event Packages',
    terms JSONB DEFAULT '["Advance payment locks your date and artist category instantly.", "Advance amount is 100% adjusted against the final event booking quote.", "Free date rescheduling up to 7 days prior to the event.", "Transparent refund policy: Full refund if artist availability cannot be confirmed."]'::jsonb,
    applicable_categories JSONB DEFAULT '["Wedding", "Engagement", "Birthday", "Corporate Event", "Anniversary", "Private Party", "Other"]'::jsonb,
    target_locations JSONB DEFAULT '["All"]'::jsonb,
    target_traffic_source TEXT DEFAULT 'google_ads',
    associated_utm_campaign TEXT DEFAULT 'all',
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Extend Bookings Table with Google Ads & Attribution Columns
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS gclid TEXT,
ADD COLUMN IF NOT EXISTS gbraid TEXT,
ADD COLUMN IF NOT EXISTS wbraid TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS campaign_id TEXT,
ADD COLUMN IF NOT EXISTS campaign_name TEXT,
ADD COLUMN IF NOT EXISTS offer_id TEXT,
ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- 3. Dedicated Campaign Funnel Events Table for Lightning-Fast Analytics
CREATE TABLE IF NOT EXISTS public.campaign_funnel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_name TEXT NOT NULL, -- 'offer_form_view', 'offer_form_start', 'offer_form_submit', 'qualified_lead', 'advance_payment_initiated', 'advance_payment_success', 'booking_confirmed'
    campaign_id TEXT,
    campaign_name TEXT,
    session_id TEXT,
    reference_code TEXT,
    ip_address TEXT,
    city TEXT,
    region TEXT,
    country TEXT,
    device_type TEXT,
    gclid TEXT,
    gbraid TEXT,
    wbraid TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_offers_slug ON public.campaign_offers(campaign_slug);
CREATE INDEX IF NOT EXISTS idx_campaign_offers_active ON public.campaign_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_campaign_funnel_event_name ON public.campaign_funnel_events(event_name);
CREATE INDEX IF NOT EXISTS idx_campaign_funnel_campaign_id ON public.campaign_funnel_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_funnel_created_at ON public.campaign_funnel_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_funnel_city ON public.campaign_funnel_events(city);
CREATE INDEX IF NOT EXISTS idx_campaign_funnel_gclid ON public.campaign_funnel_events(gclid);
CREATE INDEX IF NOT EXISTS idx_bookings_gclid ON public.bookings(gclid);
CREATE INDEX IF NOT EXISTS idx_bookings_campaign_id ON public.bookings(campaign_id);

-- Row Level Security (RLS)
ALTER TABLE public.campaign_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_funnel_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads for active campaigns
DROP POLICY IF EXISTS "Public can view active campaigns" ON public.campaign_offers;
CREATE POLICY "Public can view active campaigns"
ON public.campaign_offers FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow admins full access to campaign offers
DROP POLICY IF EXISTS "Admins have full access to campaign offers" ON public.campaign_offers;
CREATE POLICY "Admins have full access to campaign offers"
ON public.campaign_offers FOR ALL
TO service_role, authenticated
USING (true)
WITH CHECK (true);

-- Allow anonymous inserts to funnel events
DROP POLICY IF EXISTS "Anonymous can insert funnel events" ON public.campaign_funnel_events;
CREATE POLICY "Anonymous can insert funnel events"
ON public.campaign_funnel_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow admins full access to funnel events
DROP POLICY IF EXISTS "Admins have full access to funnel events" ON public.campaign_funnel_events;
CREATE POLICY "Admins have full access to funnel events"
ON public.campaign_funnel_events FOR ALL
TO service_role, authenticated
USING (true)
WITH CHECK (true);

-- 4. Seed Default Campaigns
INSERT INTO public.campaign_offers (
    campaign_name,
    campaign_slug,
    headline,
    subheading,
    offer_badge,
    offer_title,
    offer_description,
    advance_amount,
    original_price,
    discount_text,
    cta_text,
    secondary_cta_text,
    terms,
    applicable_categories,
    target_locations,
    target_traffic_source,
    associated_utm_campaign,
    is_active
) VALUES (
    'Diwali Special Offer',
    'diwali-special',
    'Your Dream Event Starts Here!',
    'Book your event now and unlock exclusive seasonal benefits.',
    'LIMITED PERIOD OFFER',
    'Lock Your Event Booking at Just ₹2,499',
    'Special Diwali Booking Benefits: 100% Artist Arrival Guarantee, Free Soundcheck Pass & Zero Broker Commission.',
    2499.00,
    10000.00,
    'Special Diwali Booking Benefits Available!',
    'Unlock My Offer & Lock Date',
    'Explore Event Packages',
    '["Advance payment locks your event date & artist category.", "100% of advance is adjusted in your final booking quote.", "Free date rescheduling up to 7 days prior to event.", "Full refund if requested artist availability cannot be confirmed."]'::jsonb,
    '["Wedding", "Engagement", "Birthday", "Corporate Event", "Anniversary", "Private Party", "Other"]'::jsonb,
    '["All"]'::jsonb,
    'google_ads',
    'all',
    true
) ON CONFLICT (campaign_slug) DO UPDATE SET
    headline = EXCLUDED.headline,
    advance_amount = EXCLUDED.advance_amount,
    offer_title = EXCLUDED.offer_title,
    updated_at = NOW();

INSERT INTO public.campaign_offers (
    campaign_name,
    campaign_slug,
    headline,
    subheading,
    offer_badge,
    offer_title,
    offer_description,
    advance_amount,
    original_price,
    discount_text,
    cta_text,
    secondary_cta_text,
    terms,
    applicable_categories,
    target_locations,
    target_traffic_source,
    associated_utm_campaign,
    is_active
) VALUES (
    'Wedding Season Offer',
    'wedding-season',
    'Make Your Wedding Unforgettable!',
    'Reserve premium live singers, bands & DJs with zero broker markup.',
    'WEDDING SPECIAL',
    'Lock Your Wedding Artist at Just ₹2,999',
    'Exclusive Wedding Season Package: Guaranteed verified artist arrival, complimentary rehearsal session, and priority concierge.',
    2999.00,
    15000.00,
    'Flat 50% OFF Artist Coordination Fee',
    'Lock My Wedding Date',
    'Explore Wedding Artists',
    '["Advance lock valid across all verified wedding artist categories.", "100% advance amount credited towards final artist payment.", "Priority backup artist guarantee included at zero extra cost.", "Full transparent refund policy."]'::jsonb,
    '["Wedding", "Sangeet", "Cocktail", "Reception", "Engagement"]'::jsonb,
    '["All"]'::jsonb,
    'google_ads',
    'wedding',
    false
) ON CONFLICT (campaign_slug) DO NOTHING;

INSERT INTO public.campaign_offers (
    campaign_name,
    campaign_slug,
    headline,
    subheading,
    offer_badge,
    offer_title,
    offer_description,
    advance_amount,
    original_price,
    discount_text,
    cta_text,
    secondary_cta_text,
    terms,
    applicable_categories,
    target_locations,
    target_traffic_source,
    associated_utm_campaign,
    is_active
) VALUES (
    'Special Google Ads Offer',
    'google-ads-default',
    'Your Dream Event Starts Here!',
    'Exclusive promotional benefits for our Google visitors.',
    'GOOGLE SPECIAL OFFER',
    'Lock Your Event Booking at Just ₹2,000',
    'Book verified live artists directly with transparent pricing and zero middlemen markups.',
    2000.00,
    8000.00,
    'Save Up to 60% with Instant Date Lock',
    'Unlock My Offer Now',
    'Explore Event Packages',
    '["Advance payment locks your date instantly.", "100% of advance adjusted in final invoice.", "Zero broker commissions guaranteed.", "Full refund if date cannot be confirmed."]'::jsonb,
    '["Wedding", "Engagement", "Birthday", "Corporate Event", "Anniversary", "Private Party", "Other"]'::jsonb,
    '["All"]'::jsonb,
    'google_ads',
    'all',
    false
) ON CONFLICT (campaign_slug) DO NOTHING;

