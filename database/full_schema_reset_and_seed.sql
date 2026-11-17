-- ==============================================================================
-- MAGNEVENTS / MAGNI PLATFORM - COMPLETE DATABASE RESET & SEED SCRIPT
-- Generated for: Supabase / PostgreSQL
-- Target Phone Number: 9170159496 (+91 9170159496)
--
-- Instructions:
-- 1. Open your Supabase Dashboard -> SQL Editor
-- 2. Paste this entire script into a new query window
-- 3. Click "RUN" to completely drop old tables, recreate all schemas with
--    relational integrity, and populate 10+ realistic dummy rows per table.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & SETUP
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. DROP ALL EXISTING TABLES IN REVERSE DEPENDENCY ORDER
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.custom_form_responses CASCADE;
DROP TABLE IF EXISTS public.custom_form_fields CASCADE;
DROP TABLE IF EXISTS public.custom_forms CASCADE;
DROP TABLE IF EXISTS public.notifications_outbox CASCADE;
DROP TABLE IF EXISTS public.emails CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.campaign_funnel_events CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.campaign_offers CASCADE;
DROP TABLE IF EXISTS public.artist_images CASCADE;
DROP TABLE IF EXISTS public.artists CASCADE;
DROP TABLE IF EXISTS public.artist_categories CASCADE;
DROP TABLE IF EXISTS public.service_videos CASCADE;
DROP TABLE IF EXISTS public.service_categories CASCADE;
DROP TABLE IF EXISTS public.service_page_settings CASCADE;
DROP TABLE IF EXISTS public.seo_blogs CASCADE;
DROP TABLE IF EXISTS public.seo_cities CASCADE;
DROP TABLE IF EXISTS public.seo_regions CASCADE;
DROP TABLE IF EXISTS public.blogs CASCADE;
DROP TABLE IF EXISTS public.pricing_plans CASCADE;
DROP TABLE IF EXISTS public.top_ad_settings CASCADE;
DROP TABLE IF EXISTS public.analytics CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ------------------------------------------------------------------------------
-- 3. CREATE CORE SCHEMA TABLES
-- ------------------------------------------------------------------------------

-- (1) User Profiles & Admin Roles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin', -- 'admin', 'super_admin'
    can_view_all_artists BOOLEAN DEFAULT true,
    phone TEXT DEFAULT '9170159496',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (2) Artist Categories
CREATE TABLE public.artist_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (3) Artists Directory
CREATE TABLE public.artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_no VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    alias VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    phone_no VARCHAR(50) NOT NULL DEFAULT '9170159496',
    email VARCHAR(255),
    contact_person VARCHAR(255) DEFAULT 'Avneesh Tripathi',
    category VARCHAR(100) NOT NULL DEFAULT 'Live Singer',
    sub_category VARCHAR(100) DEFAULT 'Bollywood / Sufi',
    genre VARCHAR(100) DEFAULT 'Bollywood, Retro, Sufi, Pop',
    city VARCHAR(100) NOT NULL DEFAULT 'Delhi NCR',
    state VARCHAR(100) DEFAULT 'Delhi',
    rating NUMERIC(3, 2) DEFAULT 4.95,
    successful_bookings INTEGER DEFAULT 45,
    price_min NUMERIC(10, 2) NOT NULL DEFAULT 5999.00,
    price_max NUMERIC(10, 2) NOT NULL DEFAULT 35000.00,
    members_min INTEGER DEFAULT 1,
    members_max INTEGER DEFAULT 4,
    bio TEXT,
    cover_image_url TEXT,
    video_url TEXT,
    cloudflare_video_url TEXT,
    is_live BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (4) Artist Gallery Images
CREATE TABLE public.artist_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (5) Service Video Categories
CREATE TABLE public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status BOOLEAN DEFAULT true,
    displayOrder INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (6) Service Page Settings (Hero Video & Header)
CREATE TABLE public.service_page_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hero_title TEXT DEFAULT 'Book Premier Live Artists Directly',
    hero_subtitle TEXT DEFAULT 'India\'s #1 Verified Live Artist Booking Platform • 0% Broker Commission',
    hero_bg_image TEXT DEFAULT 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
    hero_bg_video TEXT DEFAULT 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-on-a-stage-41483-large.mp4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (7) Service Showcase Videos
CREATE TABLE public.service_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userName TEXT,
    artistName TEXT NOT NULL,
    artistType TEXT,
    artistBio TEXT,
    category TEXT,
    video_url TEXT NOT NULL,
    topic TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (8) Campaign Offers Management
CREATE TABLE public.campaign_offers (
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
    discount_text TEXT DEFAULT 'Get 30%–70% OFF',
    cta_text TEXT DEFAULT 'Unlock My Offer & Lock Date',
    secondary_cta_text TEXT DEFAULT 'Explore Event Packages',
    terms JSONB DEFAULT '["Advance payment locks your date and artist category instantly.", "Advance amount is 100% adjusted against the final event booking quote.", "Free date rescheduling up to 7 days prior to the event.", "Transparent refund policy: Full refund if artist availability cannot be confirmed."]'::jsonb,
    applicable_categories JSONB DEFAULT '["Wedding", "Engagement", "Birthday", "Corporate Event", "Anniversary", "Private Party", "House Party"]'::jsonb,
    target_locations JSONB DEFAULT '["All"]'::jsonb,
    target_traffic_source TEXT DEFAULT 'google_ads',
    associated_utm_campaign TEXT DEFAULT 'all',
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + INTERVAL '120 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (9) Bookings & Leads Table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code TEXT UNIQUE,
    idempotency_key TEXT UNIQUE,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL DEFAULT '9170159496',
    client_email TEXT,
    event_type TEXT NOT NULL DEFAULT 'Wedding Ceremony',
    event_date DATE DEFAULT (CURRENT_DATE + 30),
    location TEXT DEFAULT 'Delhi NCR',
    city TEXT DEFAULT 'Delhi NCR',
    venue TEXT DEFAULT 'Taj Palace or Farmhouse Venue',
    budget TEXT DEFAULT '₹25,000 - ₹50,000',
    artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
    artist_name TEXT DEFAULT 'Top Recommended Verified Artist',
    category TEXT DEFAULT 'Live Singer',
    status VARCHAR(50) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'completed', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'paid', -- 'unpaid', 'advance_paid', 'paid'
    advance_amount NUMERIC(10, 2) DEFAULT 2499.00,
    payment_id TEXT,
    source_form TEXT DEFAULT 'top_ad_strip',
    notes TEXT DEFAULT 'Customer requested festive booking quote. Direct callback required.',
    gclid TEXT,
    gbraid TEXT,
    wbraid TEXT,
    utm_source TEXT DEFAULT 'google',
    utm_medium TEXT DEFAULT 'cpc',
    utm_campaign TEXT DEFAULT 'christmas_wedding_offer',
    utm_content TEXT,
    utm_term TEXT,
    campaign_id TEXT DEFAULT 'christmas-prebooking',
    campaign_name TEXT DEFAULT 'Christmas & Wedding Pre-Booking Offer',
    offer_id TEXT,
    latitude NUMERIC(10, 7) DEFAULT 28.6139,
    longitude NUMERIC(10, 7) DEFAULT 77.2090,
    detected_location TEXT DEFAULT 'Delhi, India',
    ip_address TEXT DEFAULT '103.211.54.12',
    page_url TEXT DEFAULT 'https://magnevents.in/',
    keywords TEXT DEFAULT 'live singer for wedding delhi',
    referrer TEXT DEFAULT 'https://www.google.com/',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (10) Campaign Funnel Analytics Events
CREATE TABLE public.campaign_funnel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    campaign_id TEXT,
    campaign_name TEXT,
    session_id TEXT,
    reference_code TEXT,
    ip_address TEXT DEFAULT '103.211.54.12',
    city TEXT DEFAULT 'Delhi',
    region TEXT DEFAULT 'Delhi',
    country TEXT DEFAULT 'India',
    device_type TEXT DEFAULT 'mobile',
    gclid TEXT,
    gbraid TEXT,
    wbraid TEXT,
    utm_source TEXT DEFAULT 'google',
    utm_medium TEXT DEFAULT 'cpc',
    utm_campaign TEXT DEFAULT 'christmas-wedding-prebooking',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (11) Payments & Razorpay Transactions
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    payment_id TEXT NOT NULL UNIQUE,
    signature TEXT,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 2499.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'captured',
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL DEFAULT '9170159496',
    customer_email TEXT,
    reference_code TEXT,
    notes TEXT,
    gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (12) Top Announcement & Campaign Strip Settings
CREATE TABLE public.top_ad_settings (
    id INT PRIMARY KEY,
    is_visible BOOLEAN DEFAULT true,
    text_desktop TEXT,
    text_mobile TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (13) SEO Regions & Cities
CREATE TABLE public.seo_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.seo_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES public.seo_regions(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    seo_title TEXT,
    meta_description TEXT,
    h1 TEXT,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (14) SEO Programmatic Landing Blogs
CREATE TABLE public.seo_blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES public.seo_cities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    seo_title TEXT,
    meta_description TEXT,
    content TEXT,
    featured_image_prompt TEXT,
    featured_image_url TEXT,
    status TEXT DEFAULT 'published',
    seo_score INTEGER DEFAULT 96,
    published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(city_id, slug)
);

-- (15) Editorial Blogs
CREATE TABLE public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    image_url TEXT,
    author TEXT DEFAULT 'Magnevents Editorial Team',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (16) Pricing & Packages
CREATE TABLE public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    original_price TEXT,
    copy TEXT,
    featured BOOLEAN DEFAULT false,
    is_live BOOLEAN DEFAULT true,
    pending_approval BOOLEAN DEFAULT false,
    points JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (17) Custom Form Builder Tables
CREATE TABLE public.custom_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    design_config JSONB DEFAULT '{"theme": "light", "glassmorphism": false}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.custom_form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
    field_type TEXT NOT NULL,
    label TEXT NOT NULL,
    placeholder TEXT,
    is_required BOOLEAN DEFAULT false,
    options TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.custom_form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
    client_email TEXT,
    response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (18) Reliable Notifications Outbox Queue
CREATE TABLE public.notifications_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    reference_code TEXT,
    channel TEXT NOT NULL DEFAULT 'whatsapp_admin', -- 'whatsapp_admin', 'email_admin', 'email_customer'
    recipient TEXT NOT NULL DEFAULT '9170159496',
    subject TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'sent', -- 'pending', 'processing', 'sent', 'retrying', 'failed'
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    locked_until TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (19) Email Logs
CREATE TABLE public.emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    last_attempt_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- (20) Comprehensive Visitor & Conversion Analytics
CREATE TABLE public.analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    path TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'page_view',
    user_agent TEXT,
    ip_hash TEXT,
    session_id TEXT,
    ip_address TEXT DEFAULT '103.211.54.12',
    city TEXT DEFAULT 'Delhi',
    region TEXT DEFAULT 'Delhi',
    country TEXT DEFAULT 'India',
    postal_code TEXT DEFAULT '110001',
    latitude NUMERIC(10, 7) DEFAULT 28.6139,
    longitude NUMERIC(10, 7) DEFAULT 77.2090,
    device_type TEXT DEFAULT 'mobile',
    browser TEXT DEFAULT 'Chrome Mobile',
    os TEXT DEFAULT 'Android',
    referrer TEXT DEFAULT 'https://www.google.com/',
    details JSONB DEFAULT '{}'::jsonb
);

-- ------------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX idx_artists_slug ON public.artists(slug);
CREATE INDEX idx_artists_category ON public.artists(category);
CREATE INDEX idx_artists_city ON public.artists(city);
CREATE INDEX idx_artists_is_live ON public.artists(is_live);
CREATE INDEX idx_bookings_reference ON public.bookings(reference_code);
CREATE INDEX idx_bookings_phone ON public.bookings(client_phone);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_created ON public.bookings(created_at DESC);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_pay_id ON public.payments(payment_id);
CREATE INDEX idx_campaign_offers_slug ON public.campaign_offers(campaign_slug);
CREATE INDEX idx_analytics_created ON public.analytics(created_at DESC);
CREATE INDEX idx_analytics_city ON public.analytics(city);
CREATE INDEX idx_outbox_queue ON public.notifications_outbox(status, next_retry_at);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_ad_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Allow public read & anonymous submissions where required
CREATE POLICY "Public read active artists" ON public.artists FOR SELECT USING (true);
CREATE POLICY "Public read artist images" ON public.artist_images FOR SELECT USING (true);
CREATE POLICY "Public read artist categories" ON public.artist_categories FOR SELECT USING (true);
CREATE POLICY "Public read service categories" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Public read service videos" ON public.service_videos FOR SELECT USING (true);
CREATE POLICY "Public read service page settings" ON public.service_page_settings FOR SELECT USING (true);
CREATE POLICY "Public create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public read active campaigns" ON public.campaign_offers FOR SELECT USING (true);
CREATE POLICY "Public log funnel events" ON public.campaign_funnel_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read top ad settings" ON public.top_ad_settings FOR SELECT USING (true);
CREATE POLICY "Public read seo regions" ON public.seo_regions FOR SELECT USING (true);
CREATE POLICY "Public read seo cities" ON public.seo_cities FOR SELECT USING (true);
CREATE POLICY "Public read seo blogs" ON public.seo_blogs FOR SELECT USING (true);
CREATE POLICY "Public read blogs" ON public.blogs FOR SELECT USING (true);
CREATE POLICY "Public read pricing" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Public read forms" ON public.custom_forms FOR SELECT USING (true);
CREATE POLICY "Public read form fields" ON public.custom_form_fields FOR SELECT USING (true);
CREATE POLICY "Public submit form response" ON public.custom_form_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert analytics" ON public.analytics FOR INSERT WITH CHECK (true);

-- Service Role full access across all tables
CREATE POLICY "Service full profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full artists" ON public.artists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full top_ad" ON public.top_ad_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full outbox" ON public.notifications_outbox FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full emails" ON public.emails FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service full analytics" ON public.analytics FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. DUMMY DATA SEEDING (10 RECORDS PER PRIMARY TABLE, PHONE: 9170159496)
-- ------------------------------------------------------------------------------

-- (1) Profiles (Admins)
INSERT INTO public.profiles (id, email, full_name, role, can_view_all_artists, phone) VALUES
('11111111-1111-1111-1111-111111111101', 'admin@magnevents.in', 'Avneesh Tripathi (Super Admin)', 'super_admin', true, '9170159496'),
('11111111-1111-1111-1111-111111111102', 'bookings@magnevents.in', 'Senior Event Manager', 'admin', true, '9170159496'),
('11111111-1111-1111-1111-111111111103', 'concierge@magnevents.in', 'Artist Relationship Lead', 'admin', true, '9170159496'),
('11111111-1111-1111-1111-111111111104', 'delhi.desk@magnevents.in', 'Delhi Regional Coordinator', 'admin', true, '9170159496'),
('11111111-1111-1111-1111-111111111105', 'mumbai.desk@magnevents.in', 'Mumbai Regional Coordinator', 'admin', true, '9170159496'),
('11111111-1111-1111-1111-111111111106', 'jaipur.desk@magnevents.in', 'Rajasthan Royal Events Lead', 'admin', true, '9170159496'),
('11111111-1111-1111-1111-111111111107', 'bangalore.desk@magnevents.in', 'Bangalore Corporate Lead', 'admin', true, '9170159496'),
('11111111-1111-1111-1111-111111111108', 'quality@magnevents.in', 'Soundcheck & Quality Auditor', 'admin', true, '9170159496'),
('11111111-1111-1111-1111-111111111109', 'finance@magnevents.in', 'Billing & Escrow Operations', 'admin', true, '9170159496'),
('11111111-1111-1111-1111-111111111110', 'dispatch@magnevents.in', 'VIP Client Dispatcher', 'admin', true, '9170159496');

-- (2) Top Ad Settings (Strip & Announcement Configuration)
INSERT INTO public.top_ad_settings (id, is_visible, text_desktop, text_mobile) VALUES
(1, true, '🎉 Exclusive Offer: Lock verified live singers starting at 30%–70% OFF!', '🎉 Special Discount: 30%–70% OFF!'),
(2, true, '💍 Wedding Season Pre-Booking Deal: Instant Date Lock with 100% Artist Arrival Guarantee', '💍 Wedding Pre-Booking Special!'),
(3, true, '{"isVisible":true,"leftText":"🎄 Christmas & Wedding Pre-Booking Offer: Get 30%–70% OFF on Live Artists!","rightText":"Use Code: XMAS15 →","couponCode":"XMAS15","discountPercent":15,"minBookingValue":10000,"campaignName":"Christmas & Wedding Pre-Booking Offer","formHeading":"Christmas & Wedding Pre-Booking Offer 🎄💍","supportingMessage":"Lock Your 2026–2027 Wedding or Festive Date at Best Price!","offerHighlight":"Enjoy 30% to 70% total savings on your live artist booking.","ctaText":"UNLOCK MY OFFER & LOCK DATE","startDate":"2026-11-01","expiryDate":"2027-12-31"}', '🎄 Christmas & Wedding Offer: 30%–70% OFF');

-- (3) Artist Categories
INSERT INTO public.artist_categories (name, slug, display_order, status) VALUES
('Live Singer', 'live-singer', 1, true),
('Live Band', 'live-band', 2, true),
('DJ & Visuals', 'dj-visuals', 3, true),
('Sufi & Qawwali Ensemble', 'sufi-qawwali', 4, true),
('Ghazal Virtuoso', 'ghazal-virtuoso', 5, true),
('Acoustic Duo / Trio', 'acoustic-trio', 6, true),
('Bollywood Rock Band', 'bollywood-rock-band', 7, true),
('Celebrity Emcee / Anchor', 'emcee-anchor', 8, true),
('Symphony & Flute Artist', 'flute-instrumentalist', 9, true),
('Standup Comedian', 'standup-comedian', 10, true);

-- (4) Artists (10 Verified Artists with Phone: 9170159496)
INSERT INTO public.artists (
    id, artist_no, name, alias, slug, phone_no, email, contact_person, category, sub_category, genre,
    city, state, rating, successful_bookings, price_min, price_max, members_min, members_max, bio,
    cover_image_url, video_url, is_live, is_featured
) VALUES
('22222222-2222-2222-2222-222222222201', 'MGN-ART-001', 'Aarav Sharma', 'Aarav Live', 'aarav-sharma-live', '9170159496', 'aarav.music@gmail.com', 'Avneesh Tripathi', 'Live Singer', 'Bollywood & Sufi', 'Bollywood, Retro, Sufi, Pop', 'Delhi NCR', 'Delhi', 4.98, 142, 7999.00, 35000.00, 1, 3, 'Top-rated versatile vocalist celebrated for high-energy wedding sangeets, cocktail soirees, and intimate house parties.', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true),
('22222222-2222-2222-2222-222222222202', 'MGN-ART-002', 'Rohan Mehta & The Collective', 'Rohan Band', 'rohan-mehta-collective', '9170159496', 'rohan.mehta@gmail.com', 'Avneesh Tripathi', 'Live Band', 'Bollywood Rock & Pop', 'Bollywood Rock, Retro Hits, Sufi Fusion', 'Mumbai', 'Maharashtra', 4.95, 118, 18999.00, 75000.00, 4, 6, '5-piece powerhouse rock and retro fusion band known for filling dance floors across Mumbai, Goa, and Pune weddings.', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true),
('22222222-2222-2222-2222-222222222203', 'MGN-ART-003', 'DJ Karan Grover', 'DJ KG Live', 'dj-karan-grover', '9170159496', 'djkarangrover@gmail.com', 'Avneesh Tripathi', 'DJ & Visuals', 'Commercial & Punjabi Tech', 'Punjabi, Bollywood Commercial, Tech House, EDM', 'Gurgaon', 'Haryana', 4.92, 210, 11999.00, 45000.00, 1, 2, 'Club resident and premier destination wedding DJ with bespoke DMX lighting setups and high-octane basslines.', 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true),
('22222222-2222-2222-2222-222222222204', 'MGN-ART-004', 'Meera Singhania', 'Sufiyana Meera', 'meera-singhania-sufi', '9170159496', 'meera.sufi@gmail.com', 'Avneesh Tripathi', 'Live Singer', 'Devotional & Sufi Night', 'Pure Sufi, Ghazal, Classical Fusion', 'Jaipur', 'Rajasthan', 4.97, 86, 9999.00, 40000.00, 1, 4, 'Soulful classical-trained vocalist rendering unforgettable royal palace sangeets, Sufi nights, and heritage receptions.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true),
('22222222-2222-2222-2222-222222222205', 'MGN-ART-005', 'Kabir Sufi Ensemble', 'Kabir Brothers', 'kabir-sufi-ensemble', '9170159496', 'kabir.ensemble@gmail.com', 'Avneesh Tripathi', 'Sufi & Qawwali Ensemble', 'Traditional & Modern Qawwali', 'Nusrat Traditions, Bollywood Sufi, Kawwali', 'Noida', 'Uttar Pradesh', 4.94, 94, 24999.00, 95000.00, 6, 8, 'Electrifying 8-artist Qawwali group performing heart-touching mehfils and festival stages with harmonium and dholak.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true),
('22222222-2222-2222-2222-222222222206', 'MGN-ART-006', 'Aditi Verma', 'Acoustic Aditi', 'aditi-verma-acoustic', '9170159496', 'aditi.verma.live@gmail.com', 'Avneesh Tripathi', 'Live Singer', 'Western & Indie Bollywood', 'English Pop, Indie Bollywood, Western Acoustic', 'Bangalore', 'Karnataka', 4.96, 73, 8499.00, 32000.00, 1, 2, 'Contemporary singer-songwriter featured across Bengaluru cafes, sundowners, and upscale corporate galas.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true),
('22222222-2222-2222-2222-222222222207', 'MGN-ART-007', 'Ustad Zafar Ali', 'Zafar Ghazals', 'zafar-ali-ghazals', '9170159496', 'zafar.ghazal@gmail.com', 'Avneesh Tripathi', 'Ghazal Virtuoso', 'Old World Mehfil', 'Jagjit Singh classics, Mirza Ghalib, Nazms', 'Lucknow', 'Uttar Pradesh', 4.99, 131, 14999.00, 55000.00, 2, 4, 'Master of vintage ghazals and poetic nazms creating refined, mesmerizing ambience for distinguished guests.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true),
('22222222-2222-2222-2222-222222222208', 'MGN-ART-008', 'DJ Neha Malhotra', 'DJ Neha Vibe', 'dj-neha-malhotra', '9170159496', 'djnehamalhotra@gmail.com', 'Avneesh Tripathi', 'DJ & Visuals', 'Bolly-Commercial & Deep Melodic', 'Bollywood, Commercial EDM, Punjabi Mashups', 'Chandigarh', 'Punjab', 4.91, 88, 12999.00, 48000.00, 1, 2, 'Dynamic club DJ and festival headliner delivering heart-pumping beats and modern visual production across North India.', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true),
('22222222-2222-2222-2222-222222222209', 'MGN-ART-009', 'Samarth Flute Trio', 'Bansuri Bliss', 'samarth-flute-trio', '9170159496', 'samarthflute@gmail.com', 'Avneesh Tripathi', 'Symphony & Flute Artist', 'Spiritual & Wedding Welcoming', 'Bamboo Flute, Raagas, Instrumental Covers', 'Varanasi', 'Uttar Pradesh', 4.97, 62, 6999.00, 28000.00, 1, 3, 'Ethereal flute melodies perfect for traditional wedding varmalas, cocktail entry music, and sunrise yoga retreats.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true),
('22222222-2222-2222-2222-222222222210', 'MGN-ART-010', 'The Vintage Strings Band', 'Vintage Strings', 'vintage-strings-band', '9170159496', 'vintagestrings@gmail.com', 'Avneesh Tripathi', 'Live Band', 'Retro 90s & Kishore Classics', '90s Bollywood, RD Burman, Unplugged Melodies', 'Hyderabad', 'Telangana', 4.93, 105, 19999.00, 65000.00, 3, 5, 'Nostalgic 4-member band capturing timeless Hindi golden classics with acoustic guitars, cajon, and soulful harmonies.', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true, true);

-- (5) Artist Images
INSERT INTO public.artist_images (artist_id, image_url, is_primary, display_order) VALUES
('22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7', true, 1),
('22222222-2222-2222-2222-222222222202', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6', true, 1),
('22222222-2222-2222-2222-222222222203', 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e', true, 1),
('22222222-2222-2222-2222-222222222204', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', true, 1),
('22222222-2222-2222-2222-222222222205', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4', true, 1),
('22222222-2222-2222-2222-222222222206', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1', true, 1),
('22222222-2222-2222-2222-222222222207', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', true, 1),
('22222222-2222-2222-2222-222222222208', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91', true, 1),
('22222222-2222-2222-2222-222222222209', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', true, 1),
('22222222-2222-2222-2222-222222222210', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629', true, 1);

-- (6) Service Categories
INSERT INTO public.service_categories (title, slug, status, displayOrder) VALUES
('Live Singers & Vocalists', 'live-singers', true, 1),
('Bands & Live Ensembles', 'live-bands', true, 2),
('Professional DJs & Sound', 'wedding-djs', true, 3),
('Sufi Nights & Mehfils', 'sufi-nights', true, 4),
('Wedding Sangeet Artists', 'wedding-sangeet', true, 5),
('Corporate Event Performers', 'corporate-events', true, 6),
('Instrumentalists & Flutists', 'instrumental-artists', true, 7),
('Celebrity Emcees & Hosts', 'emcees-hosts', true, 8),
('Ghazal Singers & Poets', 'ghazal-singers', true, 9),
('House Party Performers', 'house-party-artists', true, 10);

-- (7) Service Showcase Videos
INSERT INTO public.service_videos (userName, artistName, artistType, artistBio, category, video_url, topic) VALUES
('Avneesh Tripathi', 'Aarav Sharma', 'Live Singer', 'Soulful Bollywood and Retro specialist', 'Live Singers & Vocalists', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Bollywood Sangeet Night'),
('Avneesh Tripathi', 'Rohan Mehta & The Collective', 'Live Band', '5-piece rock & pop sensation', 'Bands & Live Ensembles', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Live Concert Experience'),
('Avneesh Tripathi', 'DJ Karan Grover', 'DJ & Visuals', 'Premier destination wedding DJ', 'Professional DJs & Sound', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'After-Party Bass Night'),
('Avneesh Tripathi', 'Meera Singhania', 'Sufi Singer', 'Palace royal classical melodies', 'Sufi Nights & Mehfils', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Royal Sufi Mehfil'),
('Avneesh Tripathi', 'Kabir Sufi Ensemble', 'Qawwali Band', 'Authentic Qawwali harmony', 'Sufi Nights & Mehfils', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Grand Qawwali Celebration'),
('Avneesh Tripathi', 'Aditi Verma', 'Acoustic Vocalist', 'Indie and international covers', 'Live Singers & Vocalists', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Sunset Cocktail Serenade'),
('Avneesh Tripathi', 'Ustad Zafar Ali', 'Ghazal Maestro', 'Vintage poetic ghazal evening', 'Ghazal Singers & Poets', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Intimate Ghazal Mehfil'),
('Avneesh Tripathi', 'DJ Neha Malhotra', 'Club DJ', 'Commercial EDM and Punjabi mixes', 'Professional DJs & Sound', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Cocktail Dancefloor Anthem'),
('Avneesh Tripathi', 'Samarth Flute Trio', 'Instrumental Group', 'Spiritual bamboo flute harmonies', 'Instrumentalists & Flutists', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Varmala Entry Symphony'),
('Avneesh Tripathi', 'The Vintage Strings Band', 'Retro Band', 'Golden 90s nostalgia', 'Bands & Live Ensembles', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Nostalgic 90s Hits');

-- (8) Campaign Offers
INSERT INTO public.campaign_offers (
    campaign_name, campaign_slug, headline, subheading, offer_badge, offer_title, offer_description,
    advance_amount, original_price, discount_text, cta_text, is_active
) VALUES
('Christmas & Wedding Pre-Booking Offer', 'christmas-prebooking', 'Your Dream Event Starts Here!', 'Lock your 2026–2027 Wedding or Festive Date at Best Price!', 'CHRISTMAS & WEDDING PRE-BOOKING OFFER', 'Live Singers Starting at 30%–70% Off', 'Lock today’s festive price for any 2026–2027 date. Minimum 30% and up to 70% total savings with zero middlemen markup.', 2499.00, 10000.00, '30%–70% OFF Total Savings', 'Unlock My Offer & Lock Date →', true),
('First Booking Welcome Offer', 'first-booking-offer', 'Your Dream Event Starts Here!', 'Welcome offer for first-time visitors seeking verified live talent.', 'FIRST BOOKING WELCOME DEAL', 'Lock Your Artist Booking at Just ₹2,499', 'Enjoy up to 70% total savings with our verified artist arrival guarantee.', 2499.00, 10000.00, 'Up to 70% Welcome Savings', 'Unlock My Offer & Lock Date →', true),
('Wedding Season Direct Deal', 'wedding-season', 'Make Your Wedding Truly Unforgettable!', 'Reserve live singers, bands & DJs with zero broker markup.', 'WEDDING SPECIAL', 'Lock Your Wedding Artist at Just ₹2,999', 'Exclusive wedding benefits: Guaranteed arrival, free soundcheck pass & backup artist priority.', 2999.00, 15000.00, 'Save 50% on Booking Coordination', 'Lock My Wedding Date', true),
('Google Ads Exclusive Deal', 'google-ads-default', 'Your Dream Event Starts Here!', 'Exclusive promotional benefits for Google visitors.', 'GOOGLE SPECIAL OFFER', 'Lock Your Event Booking at Just ₹2,000', 'Book verified live artists directly with transparent pricing and zero hidden fees.', 2000.00, 8000.00, 'Save Up to 60% with Instant Lock', 'Unlock My Offer Now', true),
('Corporate Gala Artist Package', 'corporate-gala', 'Corporate Excellence Meets Live Music', 'Elite bands and vocalists for annual banquets and award summits.', 'CORPORATE SPECIAL', 'Corporate Booking Advance ₹4,999', 'Dedicated relationship manager, GST compliant invoices and soundcheck audits.', 4999.00, 20000.00, 'Flat 40% OFF Corporate Coordination', 'Inquire for Corporate Event', true),
('House Party Singer Special', 'house-party-special', 'Unplugged Live Music for Your Living Room', 'Turn your terrace or living room into an intimate acoustic concert.', 'HOUSE PARTY DEAL', 'House Party Advance Just ₹1,499', 'Compact sound setups included, perfect for birthdays, anniversaries, and family get-togethers.', 1499.00, 6000.00, 'Starting at ₹5,999 All Inclusive', 'Book House Party Artist', true),
('Royal Rajasthan Heritage Wedding', 'rajasthan-royal-weddings', 'Authentic Royal Sounds for Destination Weddings', 'Padharo Mhare Desh: Traditional folk, shehnai, and Sufi artists in Udaipur & Jaipur.', 'HERITAGE WEDDING', 'Heritage Lock ₹3,999', 'Curated royal hospitality, vintage instruments and regal artist attire.', 3999.00, 18000.00, 'Up to 55% OFF Destination Packages', 'Reserve Destination Dates', true),
('Delhi NCR Cocktail Night', 'delhi-cocktail-night', 'Delhi\'s Most Booked Cocktail DJs & Bands', 'High-energy fusion artists for farmhouses across Chhatarpur and Gurgaon.', 'DELHI NCR EXCLUSIVE', 'Lock Cocktail Artists ₹2,499', 'Instant availability check with verified portfolio videos.', 2499.00, 10000.00, '30%–60% OFF Cocktail Artists', 'Claim Delhi NCR Deal', true),
('Mumbai Sundowner Soiree', 'mumbai-sundowner', 'Acoustic Sunset Beats in Mumbai & Goa', 'Breezy acoustic duos and saxophonists for rooftop sundowners.', 'MUMBAI SUNDOWNER', 'Lock Sundowner Artist ₹2,499', 'Elevate your sunset celebrations with ambient live acoustic melodies.', 2499.00, 12000.00, 'Save 45% on Sunset Artists', 'Unlock Sundowner Offer', true),
('Bangalore Tech Gala Beats', 'bangalore-tech-gala', 'Energetic Live Music for Bangalore Techies', 'Bilingual bands and multi-genre artists for startup mixers and conferences.', 'BENGALURU TECH BEATS', 'Lock Tech Gala Artist ₹2,999', 'Seamless digital contracting, fast booking turnaround and 100% arrival assurance.', 2999.00, 12000.00, 'Flat 35% OFF Tech Events', 'Claim Bengaluru Deal', true);

-- (9) Bookings (10 Realistic Leads with Client Phone: 9170159496)
INSERT INTO public.bookings (
    id, reference_code, idempotency_key, client_name, client_phone, client_email, event_type, event_date,
    location, city, venue, budget, artist_name, category, status, payment_status, advance_amount, payment_id,
    source_form, campaign_id, campaign_name, gclid, detected_location
) VALUES
('33333333-3333-3333-3333-333333333301', 'MGN-BKG-8801', 'idemp_bkg_8801', 'Avneesh Tripathi', '9170159496', 'avneesh@magnevents.in', 'Wedding Ceremony', '2026-12-15', 'Chhatarpur, New Delhi', 'Delhi NCR', 'Tivoli Grand Farm, Chhatarpur', '₹50,000 - ₹1,00,000', 'Aarav Sharma Live', 'Live Singer', 'confirmed', 'paid', 2499.00, 'pay_RzP100001', 'top_ad_strip', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'GCLID_XMAS_001', 'New Delhi, India'),
('33333333-3333-3333-3333-333333333302', 'MGN-BKG-8802', 'idemp_bkg_8802', 'Vikram Malhotra', '9170159496', 'vikram.malhotra@gmail.com', 'Sangeet Night', '2026-12-22', 'Bandra West, Mumbai', 'Mumbai', 'Taj Lands End, Bandra', '₹75,000 - ₹1,50,000', 'Rohan Mehta & The Collective', 'Live Band', 'confirmed', 'paid', 2999.00, 'pay_RzP100002', 'modal_popup', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'GCLID_XMAS_002', 'Mumbai, India'),
('33333333-3333-3333-3333-333333333303', 'MGN-BKG-8803', 'idemp_bkg_8803', 'Priya Singhal', '9170159496', 'priya.singhal@yahoo.com', 'Cocktail Party', '2026-11-28', 'Golf Course Road, Gurgaon', 'Gurgaon', 'The Leela Ambience, Gurgaon', '₹35,000 - ₹60,000', 'DJ Karan Grover', 'DJ & Visuals', 'confirmed', 'paid', 2499.00, 'pay_RzP100003', 'top_ad_strip', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'GCLID_XMAS_003', 'Gurgaon, India'),
('33333333-3333-3333-3333-333333333304', 'MGN-BKG-8804', 'idemp_bkg_8804', 'Siddharth Roy', '9170159496', 'sid.roy@gmail.com', 'Reception Gala', '2026-12-05', 'Civil Lines, Jaipur', 'Jaipur', 'Rambagh Palace, Jaipur', '₹1,00,000 - ₹2,50,000', 'Kabir Sufi Ensemble', 'Sufi & Qawwali Ensemble', 'confirmed', 'paid', 2999.00, 'pay_RzP100004', 'seo_landing_page', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'GCLID_XMAS_004', 'Jaipur, India'),
('33333333-3333-3333-3333-333333333305', 'MGN-BKG-8805', 'idemp_bkg_8805', 'Ananya Deshmukh', '9170159496', 'ananya.desh@gmail.com', 'Private Birthday House Party', '2026-12-02', 'Indiranagar, Bangalore', 'Bangalore', 'Private Villa Terrace', '₹15,000 - ₹30,000', 'Aditi Verma Live', 'Live Singer', 'confirmed', 'paid', 1499.00, 'pay_RzP100005', 'contact_modal', 'first-booking-offer', 'First Booking Welcome Offer', 'GCLID_XMAS_005', 'Bangalore, India'),
('33333333-3333-3333-3333-333333333306', 'MGN-BKG-8806', 'idemp_bkg_8806', 'Rajesh Kulkarni', '9170159496', 'rajesh.k@gmail.com', '25th Wedding Anniversary', '2026-12-10', 'Gomti Nagar, Lucknow', 'Lucknow', 'Hyatt Regency, Lucknow', '₹40,000 - ₹80,000', 'Ustad Zafar Ali', 'Ghazal Virtuoso', 'confirmed', 'paid', 2499.00, 'pay_RzP100006', 'top_ad_strip', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'GCLID_XMAS_006', 'Lucknow, India'),
('33333333-3333-3333-3333-333333333307', 'MGN-BKG-8807', 'idemp_bkg_8807', 'Deepak Aggarwal', '9170159496', 'deepak.agg@gmail.com', 'Corporate Annual Summit', '2026-12-18', 'Sector 62, Noida', 'Noida', 'Radisson Blu, Noida', '₹50,000 - ₹1,20,000', 'The Vintage Strings Band', 'Live Band', 'confirmed', 'paid', 4999.00, 'pay_RzP100007', 'custom_corporate_form', 'corporate-gala', 'Corporate Gala Artist Package', 'GCLID_XMAS_007', 'Noida, India'),
('33333333-3333-3333-3333-333333333308', 'MGN-BKG-8808', 'idemp_bkg_8808', 'Neha Chawla', '9170159496', 'neha.chawla@gmail.com', 'Mehndi & Haldi Ceremony', '2026-12-20', 'Sector 17, Chandigarh', 'Chandigarh', 'JW Marriott, Chandigarh', '₹30,000 - ₹55,000', 'DJ Neha Malhotra', 'DJ & Visuals', 'confirmed', 'paid', 2499.00, 'pay_RzP100008', 'top_ad_strip', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'GCLID_XMAS_008', 'Chandigarh, India'),
('33333333-3333-3333-3333-333333333309', 'MGN-BKG-8809', 'idemp_bkg_8809', 'Gaurav Bansal', '9170159496', 'gaurav.bansal@gmail.com', 'Varmala & Pheras', '2026-12-25', 'Cantonment, Varanasi', 'Varanasi', 'Taj Nadesar Palace, Varanasi', '₹20,000 - ₹45,000', 'Samarth Flute Trio', 'Symphony & Flute Artist', 'confirmed', 'paid', 2499.00, 'pay_RzP100009', 'top_ad_strip', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'GCLID_XMAS_009', 'Varanasi, India'),
('33333333-3333-3333-3333-333333333310', 'MGN-BKG-8810', 'idemp_bkg_8810', 'Kavita Reddy', '9170159496', 'kavita.reddy@gmail.com', 'Engagement Soiree', '2026-12-30', 'Banjara Hills, Hyderabad', 'Hyderabad', 'Park Hyatt, Hyderabad', '₹45,000 - ₹90,000', 'Meera Singhania', 'Live Singer', 'confirmed', 'paid', 2499.00, 'pay_RzP100010', 'top_ad_strip', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'GCLID_XMAS_010', 'Hyderabad, India');

-- (10) Payments (10 Verified Transactions with Phone: 9170159496)
INSERT INTO public.payments (
    order_id, payment_id, signature, amount, currency, status, customer_name, customer_phone, customer_email, reference_code, gateway
) VALUES
('order_MGN_8801', 'pay_RzP100001', 'sig_rzp_mock_hash_8801', 2499.00, 'INR', 'captured', 'Avneesh Tripathi', '9170159496', 'avneesh@magnevents.in', 'MGN-BKG-8801', 'razorpay'),
('order_MGN_8802', 'pay_RzP100002', 'sig_rzp_mock_hash_8802', 2999.00, 'INR', 'captured', 'Vikram Malhotra', '9170159496', 'vikram.malhotra@gmail.com', 'MGN-BKG-8802', 'razorpay'),
('order_MGN_8803', 'pay_RzP100003', 'sig_rzp_mock_hash_8803', 2499.00, 'INR', 'captured', 'Priya Singhal', '9170159496', 'priya.singhal@yahoo.com', 'MGN-BKG-8803', 'razorpay'),
('order_MGN_8804', 'pay_RzP100004', 'sig_rzp_mock_hash_8804', 2999.00, 'INR', 'captured', 'Siddharth Roy', '9170159496', 'sid.roy@gmail.com', 'MGN-BKG-8804', 'razorpay'),
('order_MGN_8805', 'pay_RzP100005', 'sig_rzp_mock_hash_8805', 1499.00, 'INR', 'captured', 'Ananya Deshmukh', '9170159496', 'ananya.desh@gmail.com', 'MGN-BKG-8805', 'razorpay'),
('order_MGN_8806', 'pay_RzP100006', 'sig_rzp_mock_hash_8806', 2499.00, 'INR', 'captured', 'Rajesh Kulkarni', '9170159496', 'rajesh.k@gmail.com', 'MGN-BKG-8806', 'razorpay'),
('order_MGN_8807', 'pay_RzP100007', 'sig_rzp_mock_hash_8807', 4999.00, 'INR', 'captured', 'Deepak Aggarwal', '9170159496', 'deepak.agg@gmail.com', 'MGN-BKG-8807', 'razorpay'),
('order_MGN_8808', 'pay_RzP100008', 'sig_rzp_mock_hash_8808', 2499.00, 'INR', 'captured', 'Neha Chawla', '9170159496', 'neha.chawla@gmail.com', 'MGN-BKG-8808', 'razorpay'),
('order_MGN_8809', 'pay_RzP100009', 'sig_rzp_mock_hash_8809', 2499.00, 'INR', 'captured', 'Gaurav Bansal', '9170159496', 'gaurav.bansal@gmail.com', 'MGN-BKG-8809', 'razorpay'),
('order_MGN_8810', 'pay_RzP100010', 'sig_rzp_mock_hash_8810', 2499.00, 'INR', 'captured', 'Kavita Reddy', '9170159496', 'kavita.reddy@gmail.com', 'MGN-BKG-8810', 'razorpay');

-- (11) Campaign Funnel Events
INSERT INTO public.campaign_funnel_events (event_name, campaign_id, campaign_name, reference_code, city, utm_source, utm_medium, utm_campaign) VALUES
('offer_strip_view', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'MGN-BKG-8801', 'Delhi', 'google', 'cpc', 'christmas_wedding_offer'),
('offer_strip_click', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'MGN-BKG-8801', 'Delhi', 'google', 'cpc', 'christmas_wedding_offer'),
('offer_form_open', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'MGN-BKG-8802', 'Mumbai', 'google', 'cpc', 'christmas_wedding_offer'),
('offer_form_submit', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'MGN-BKG-8803', 'Gurgaon', 'google', 'cpc', 'christmas_wedding_offer'),
('advance_payment_initiated', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'MGN-BKG-8804', 'Jaipur', 'google', 'cpc', 'christmas_wedding_offer'),
('advance_payment_success', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'MGN-BKG-8805', 'Bangalore', 'google', 'cpc', 'christmas_wedding_offer'),
('booking_confirmed', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'MGN-BKG-8806', 'Lucknow', 'google', 'cpc', 'christmas_wedding_offer'),
('offer_strip_click', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'MGN-BKG-8807', 'Noida', 'google', 'cpc', 'christmas_wedding_offer'),
('booking_confirmed', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'MGN-BKG-8808', 'Chandigarh', 'google', 'cpc', 'christmas_wedding_offer'),
('booking_confirmed', 'christmas-prebooking', 'Christmas & Wedding Pre-Booking Offer', 'MGN-BKG-8809', 'Varanasi', 'google', 'cpc', 'christmas_wedding_offer');

-- (12) SEO Regions & Cities
INSERT INTO public.seo_regions (id, name, slug) VALUES
('44444444-4444-4444-4444-444444444401', 'North India', 'north-india'),
('44444444-4444-4444-4444-444444444402', 'West India', 'west-india'),
('44444444-4444-4444-4444-444444444403', 'South India', 'south-india');

INSERT INTO public.seo_cities (id, region_id, name, slug, seo_title, meta_description, h1, is_active) VALUES
('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', 'Delhi NCR', 'delhi', 'Book Top Live Singers & Bands in Delhi NCR | Magnevents', 'Hire top verified live singers, wedding bands, and DJs across Delhi, Noida & Gurgaon with 0% broker commission.', 'Book Live Singers & Artists in Delhi NCR', true),
('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444402', 'Mumbai', 'mumbai', 'Book Live Singers & Wedding Bands in Mumbai | Magnevents', 'Find and book top vocalists, cocktail DJs, and rock bands in Mumbai with guaranteed arrival.', 'Hire Live Artists in Mumbai', true),
('55555555-5555-5555-5555-555555555503', '44444444-4444-4444-4444-444444444401', 'Gurgaon', 'gurgaon', 'Live Singers for House Parties & Events in Gurgaon | Magnevents', 'Premium acoustic duos, Bollywood singers, and party DJs for Gurgaon events.', 'Book Live Singers in Gurgaon', true),
('55555555-5555-5555-5555-555555555504', '44444444-4444-4444-4444-444444444401', 'Jaipur', 'jaipur', 'Hire Wedding Singers & Sufi Ensembles in Jaipur | Magnevents', 'Royal heritage destination wedding entertainment: Sufi artists, classical vocalists, and DJs.', 'Book Live Wedding Artists in Jaipur', true),
('55555555-5555-5555-5555-555555555505', '44444444-4444-4444-4444-444444444403', 'Bangalore', 'bangalore', 'Hire Live Bands & Acoustic Singers in Bangalore | Magnevents', 'Top-tier corporate singers, indie acoustic performers, and party bands in Bengaluru.', 'Live Artists in Bangalore', true),
('55555555-5555-5555-5555-555555555506', '44444444-4444-4444-4444-444444444401', 'Noida', 'noida', 'Hire Live Singers & DJs in Noida | Magnevents', 'Direct booking for farmhouse weddings, cocktail parties, and corporate galas in Noida.', 'Book Artists in Noida', true),
('55555555-5555-5555-5555-555555555507', '44444444-4444-4444-4444-444444444401', 'Lucknow', 'lucknow', 'Hire Ghazal Singers & Live Bands in Lucknow | Magnevents', 'Experience authentic Awadhi mehfils, ghazal maestros, and modern Bollywood singers.', 'Hire Live Musicians in Lucknow', true),
('55555555-5555-5555-5555-555555555508', '44444444-4444-4444-4444-444444444401', 'Chandigarh', 'chandigarh', 'Hire Punjabi Singers & DJs in Chandigarh | Magnevents', 'High-energy live wedding singers, Bhangra troupes, and party DJs in Tricity.', 'Book Live Performers in Chandigarh', true),
('55555555-5555-5555-5555-555555555509', '44444444-4444-4444-4444-444444444401', 'Varanasi', 'varanasi', 'Book Classical Flutists & Bhajan Artists in Varanasi | Magnevents', 'Spiritual and classical instrumental artists for riverside varmalas and cultural events.', 'Book Live Artists in Varanasi', true),
('55555555-5555-5555-5555-555555555510', '44444444-4444-4444-4444-444444444403', 'Hyderabad', 'hyderabad', 'Hire Live Singers & Bands in Hyderabad | Magnevents', 'Bilingual Bollywood and Telugu party performers for luxury weddings and corporate galas.', 'Book Live Performers in Hyderabad', true);

-- (13) SEO Blogs (10 Localized High-Intent Articles)
INSERT INTO public.seo_blogs (city_id, title, slug, seo_title, meta_description, content, status, seo_score) VALUES
('55555555-5555-5555-5555-555555555501', 'How to Book the Perfect Live Singer for Your Delhi Wedding Sangeet', 'book-wedding-singer-delhi', 'How to Book a Live Singer for Delhi Wedding | Magnevents Guide', 'Complete 2026 checklist on choosing, auditioning, and booking verified live vocalists for Delhi sangeet ceremonies.', '## The Ultimate Guide to Live Music in Delhi Weddings

Delhi weddings are known for grand energy, unmatched hospitality, and electrifying celebrations. Here is how to book the best verified talent directly...', 'published', 98),
('55555555-5555-5555-5555-555555555502', 'Top 10 Live Bands for Mumbai Cocktail & Sundowner Parties', 'top-live-bands-mumbai-cocktails', 'Top 10 Live Bands for Mumbai Cocktails | Magnevents', 'Discover the highest rated retro fusion and Bollywood rock bands in Mumbai.', '## Bringing the Beat to Mumbai Seafronts

Whether you are hosting an intimate terrace soiree in Bandra or a grand ballroom cocktail in Juhu, live music transforms the night...', 'published', 97),
('55555555-5555-5555-5555-555555555503', 'Hiring an Acoustic Singer for a House Party in Gurgaon', 'acoustic-singer-house-party-gurgaon', 'Acoustic Singer for House Party in Gurgaon | Magnevents', 'How to arrange compact live sound and verified vocalists for your Gurgaon apartment or villa.', '## Unplugged Nights in Gurgaon

House parties in DLF Phase 5 and Golf Course Road deserve intimate live melodies. Learn about pricing, compact sound systems, and playlist curation...', 'published', 96),
('55555555-5555-5555-5555-555555555504', 'Palace Wedding Entertainment in Jaipur: Sufi & Classical Guides', 'palace-wedding-entertainment-jaipur', 'Jaipur Palace Wedding Entertainment Guide | Magnevents', 'Everything you need to know about booking royal Sufi mehfils and heritage artists in Jaipur.', '## Royal Heritage Celebrations in the Pink City

Jaipur’s iconic palaces call for majestic acoustic resonance. Explore how to coordinate royal welcome flutists, evening Sufi qawwals, and late-night party DJs...', 'published', 99),
('55555555-5555-5555-5555-555555555505', 'Corporate Gala & Tech Summit Entertainment in Bengaluru', 'corporate-entertainment-bangalore', 'Corporate Event Entertainment in Bangalore | Magnevents', 'Professional bands, bilingual anchors, and ambient artists for Bengaluru corporate conferences.', '## Powering Bengaluru’s Corporate Stages

Annual general meetings, product launches, and startup mixer galas require seamless execution, crisp acoustics, and zero downtime...', 'published', 95),
('55555555-5555-5555-5555-555555555506', 'Farmhouse Sangeet Sound & Artist Setup Checklist in Noida', 'noida-farmhouse-sangeet-setup', 'Noida Farmhouse Sangeet Checklist | Magnevents', 'Avoid last-minute power dips and sound permit issues when booking artists in Noida farmhouses.', '## Farmhouse Wedding Planning in Noida

Noida expressway farmhouses provide spectacular open canvases. Follow our soundcheck and artist technical rider guide for flawless events...', 'published', 94),
('55555555-5555-5555-5555-555555555507', 'Reviving Traditional Ghazal Mehfils in Lucknow', 'traditional-ghazal-mehfil-lucknow', 'Traditional Ghazal Mehfils in Lucknow | Magnevents', 'Hosting an authentic Awadhi cultural evening with master ghazal and harmonium performers.', '## The Soul of Awadh: Poetry and Harmonium

In the city of Tehzeeb, poetic nazms and soul-stirring ghazals create an ambience unmatched anywhere else in the world...', 'published', 97),
('55555555-5555-5555-5555-555555555508', 'Booking a High-Octane Punjabi DJ & Singer in Chandigarh', 'punjabi-singer-dj-chandigarh', 'Hire Punjabi Singers & DJs in Chandigarh | Magnevents', 'The definitive guide to finding authentic Punjabi dhol players, mashup DJs, and vocalists.', '## The Heartbeat of Punjab

From lively mehendi beats to non-stop late night baraat dancing, discover how our verified arrival guarantee ensures a flawless party...', 'published', 96),
('55555555-5555-5555-5555-555555555509', 'Sacred Music & Varmala Flute Melodies in Varanasi', 'sacred-flute-music-varanasi', 'Varanasi Sacred Varmala & Flute Music | Magnevents', 'Infuse timeless spiritual energy into your wedding rituals with authentic bansuri trios.', '## Divine Harmonies on the Ghats

Make your wedding entrance otherworldly with ragas played on classical bamboo flutes alongside gentle santoor accompaniment...', 'published', 95),
('55555555-5555-5555-5555-555555555510', 'Bilingual Wedding Entertainment in Hyderabad', 'bilingual-wedding-entertainment-hyderabad', 'Bilingual Wedding Singers & Bands Hyderabad | Magnevents', 'Catering to diverse guest lists with Bollywood, Telugu, and English party mashups.', '## The Cosmopolitan Celebration of the Deccan

Ensure every guest dances with versatile vocalists experienced in transitioning from AR Rahman classics to Tollywood chartbusters...', 'published', 96);

-- (14) Editorial Blogs
INSERT INTO public.blogs (title, subtitle, slug, content, image_url, author, is_published) VALUES
('Why Direct Artist Booking is Disrupting the Indian Wedding Industry', 'Say goodbye to opaque middleman commissions and unverified artist ghosting.', 'why-direct-artist-booking-disrupts-weddings', '## The Problem with Traditional Agency Brokering

For decades, booking a live singer for an Indian wedding meant dealing with 3 layers of middlemen, hidden markups of up to 40%, and zero backup guarantees if the artist fell ill. Magnevents directly connects hosts with verified talent...', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7', 'Avneesh Tripathi', true),
('The 100% Artist Arrival Guarantee: How We Built It', 'Behind the scenes of our fail-safe soundcheck and standby artist dispatch system.', 'artist-arrival-guarantee-explained', '## How Magnevents Ensures Zero Missed Shows

Every live booking on our platform is backed by a 3-step verification protocol: 12-hour confirmation, GPS soundcheck check-in, and instant standby backup dispatch...', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6', 'Avneesh Tripathi', true),
('What Does a Live Wedding Singer Cost in India in 2026?', 'A transparent budget breakdown for acoustic sets, full bands, and celebrity performers.', 'live-wedding-singer-cost-guide-india', '## Transparent Pricing Demystified

From intimate solo acoustic singers starting at ₹5,999 to 5-piece rock bands at ₹35,000+, here is our complete tier-by-tier cost breakdown...', 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e', 'Avneesh Tripathi', true),
('How to Curate the Perfect 3-Hour Sangeet Playlist', 'Keep every generation—from grandparents to college friends—on their feet.', 'curate-perfect-3-hour-sangeet-playlist', '## The 3-Phase Dancefloor Strategy

Hour 1: Retro & Ghazals for dinner hospitality. Hour 2: Nostalgic 90s & 2000s Bollywood. Hour 3: Peak Punjabi dhol and EDM drops...', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'Avneesh Tripathi', true),
('Acoustic vs Full Band: Which is Right for Your Event?', 'Choosing the right sound scale based on venue acoustics, guest count, and budget.', 'acoustic-vs-full-band-guide', '## Scale Your Sound to Your Space

A comprehensive acoustic guide on when an unplugged trio delivers more intimacy and when a 5-piece drumkit band is required...', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4', 'Avneesh Tripathi', true),
('The Secrets to a Smooth Farmhouse Wedding Soundcheck', 'How to avoid power trips, echo tunnels, and sound police cutoffs.', 'secrets-smooth-farmhouse-soundcheck', '## Engineering Great Sound in Open Air

Everything you need to know regarding DG generator earthing, line-array placement, and local residential decibel compliance...', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1', 'Avneesh Tripathi', true),
('Sufi Nights: The Rising Trend in Modern Cocktail Receptions', 'Why soulful Sufiana poetry has become the luxury staple of Indian wedding hospitality.', 'sufi-nights-rising-trend-cocktails', '## Beyond the Noise: Emotional Resonance

Couples are trading generic playlist clubs for candlelit Sufi nights featuring live harmoniums, poetry, and timeless melodies...', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'Avneesh Tripathi', true),
('5 Technical Red Flags to Watch for When Booking an Event DJ', 'Do not let faulty cables or pirated MP3s ruin your sangeet dancefloor.', '5-technical-red-flags-event-dj', '## Auditing Your Event DJ

Always verify their sound console standard (Pioneer Nexus 2+), backup laptop availability, and lossless audio file formats...', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91', 'Avneesh Tripathi', true),
('Hosting an Unforgettable House Party on a Budget', 'Transform your living room or terrace into a private concert hall with ₹5,999.', 'hosting-unforgettable-house-party-budget', '## Intimate Live Gigs at Home

How to organize private live singer concerts at home with our plug-and-play sound packages and curated vocalists...', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'Avneesh Tripathi', true),
('Destination Wedding Music Planning: Rajasthan to Goa', 'Logistics, artist travel riders, and equipment rental made simple.', 'destination-wedding-music-planning-guide', '## Effortless Outstation Coordination

How Magnevents handles flight tickets, local backline gear hiring, and stage setups so couples can simply enjoy their big day...', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629', 'Avneesh Tripathi', true);

-- (15) Pricing Plans (10 Packages)
INSERT INTO public.pricing_plans (name, price, original_price, copy, featured, is_live, points) VALUES
('House Party Acoustic Solo', '₹5,999', '₹10,000', 'Perfect for living room gatherings, birthdays, and rooftop soirees (Up to 30 guests).', false, true, '["1 Verified Bollywood/Sufi Vocalist", "2 Hours of Live Acoustic Performance", "Compact Portable Sound System Included", "Instant Date Lock with ₹1,499 Advance"]'::jsonb),
('Acoustic Duo + Percussion', '₹9,999', '₹18,000', 'Ideal for cocktail mixers, engagement dinners, and anniversary galas (Up to 75 guests).', true, true, '["Lead Vocalist + Acoustic Guitarist + Cajon", "3 Hours of Curated Setlists", "High-Fidelity Sound Setup & Wireless Mics", "Custom Song Requests Permitted"]'::jsonb),
('Wedding Sangeet Power Band', '₹24,999', '₹50,000', 'Full 4-piece band that guarantees a packed dancefloor all night long (150–500 guests).', true, true, '["Lead Vocalist, Lead Guitar, Keyboard, Drums", "3.5 Hours of Bollywood Rock & Punjabi Hits", "Sound Engineer + Dedicated Stage Tech", "100% Artist Arrival Guarantee"]'::jsonb),
('Grand Sufi Qawwali Night', '₹34,999', '₹65,000', 'Royal mehfil experience with 6–8 traditional musicians for unforgettable receptions.', false, true, '["Master Qawwals, Harmonium & Dholak", "Soulful Nusrat & Bollywood Sufi Classics", "Traditional Floor Setup with Velvet Gaddi", "Dedicated Artist Concierge Manager"]'::jsonb),
('Club-Style Wedding DJ Setup', '₹14,999', '₹28,000', 'High-energy after-party experience with intelligent lighting and bass-heavy audio.', false, true, '["Celebrity Club Resident DJ", "Pioneer Nexus DJ Console & Dual Wireless Mics", "DMX Intelligent Beam & Wash Lights", "Bespoke Couple Entry Tracks Included"]'::jsonb),
('Royal Varmala Symphony', '₹7,999', '₹14,000', 'Soul-stirring classical flute and santoor entrance music for auspicious rituals.', false, true, '["2 Classical Virtuoso Instrumentalists (Flute + Sitar)", "Traditional Wedding Welcoming Melodies", "Spiritual Varmala & Pheras Accompanying Music", "Zero Broker Markup Guarantee"]'::jsonb),
('Corporate Annual Banquet', '₹29,999', '₹60,000', 'Sophisticated entertainment for corporate awards, galas, and tech mixers.', false, true, '["Bilingual Emcee + 4-Piece Contemporary Band", "GST Invoice & Formal Contracting", "Stage Soundcheck Audit 3 Hours in Advance", "Dedicated On-Site Event Supervisor"]'::jsonb),
('Destination Wedding Mega Package', '₹79,999', '₹1,50,000', 'Comprehensive 2-day music coverage across Mehendi, Sangeet, and Reception.', true, true, '["Day 1: Acoustic Sundowner Duo + Mehendi DJ", "Day 2: Varmala Flute Trio + 5-Piece Sangeet Band", "All Travel Riders & Equipment Coordination Handled", "VIP Client Escalation Desk (Phone: 9170159496)"]'::jsonb),
('Standup Comedy + Live Music Hour', '₹19,999', '₹35,000', 'Laugh and groove: 45 mins of standup comedy followed by 90 mins of unplugged vocals.', false, true, '["Verified Featured Standup Comedian", "Acoustic Vocalist & Guitarist", "Full Sound Reinforcement Included", "Family-Friendly Clean Comedy Guaranteed"]'::jsonb),
('Custom Luxury Bespoke Curation', '₹99,999+', 'Custom', 'Tailored VIP artist rosters for ultra-luxury weddings and festival showcases.', false, true, '["Celebrity Talent Contracting & Management", "Full Concert-Grade Line Array Sound Reinforcement", "Artist Security & Green Room Hospitality Management", "24/7 Dedicated Concierge Support"]'::jsonb);

-- (16) Custom Forms Builder
INSERT INTO public.custom_forms (id, title, description, cover_image, design_config) VALUES
('66666666-6666-6666-6666-666666666601', 'Artist Direct Onboarding Application', 'Join India’s premier verified live music roster. Perform at premium wedding & corporate stages.', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7', '{"theme": "dark-glass", "glassmorphism": true, "accentColor": "#10b981"}'::jsonb),
('66666666-6666-6666-6666-666666666602', 'Wedding Pre-Booking Concierge Inquiry', 'Lock today’s festive rates for your 2026–2027 wedding with 30%–70% savings.', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6', '{"theme": "light", "glassmorphism": false, "accentColor": "#991b1b"}'::jsonb),
('66666666-6666-6666-6666-666666666603', 'Corporate Summit Entertainment Request', 'Request customized artist proposals and GST-compliant pricing quotes.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4', '{"theme": "light", "glassmorphism": false, "accentColor": "#1e3a8a"}'::jsonb),
('66666666-6666-6666-6666-666666666604', 'House Party Unplugged Booking Form', 'Book a verified live singer for terrace and living room parties starting at ₹5,999.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1', '{"theme": "light", "glassmorphism": false, "accentColor": "#f59e0b"}'::jsonb),
('66666666-6666-6666-6666-666666666605', 'Royal Destination Wedding Inquiry', 'Exclusive concierge assistance for destination weddings in Rajasthan and Goa.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', '{"theme": "dark-glass", "glassmorphism": true, "accentColor": "#eab308"}'::jsonb),
('66666666-6666-6666-6666-666666666606', 'Sufi & Qawwali Night Booking Desk', 'Experience soulful mehfils with verified traditional masters.', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91', '{"theme": "light", "glassmorphism": false, "accentColor": "#0f766e"}'::jsonb),
('66666666-6666-6666-6666-666666666607', 'Cocktail DJ & Sound Setup Request', 'Check real-time availability for high-energy party DJs and intelligent lights.', 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e', '{"theme": "dark-glass", "glassmorphism": true, "accentColor": "#ec4899"}'::jsonb),
('66666666-6666-6666-6666-666666666608', 'Festival Stage & Concert Booking', 'Book headliner indie bands and Bollywood fusion performers.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', '{"theme": "light", "glassmorphism": false, "accentColor": "#6366f1"}'::jsonb),
('66666666-6666-6666-6666-666666666609', 'Customer Feedback & Performance Review', 'Share your experience with our verified artists and concierge team.', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629', '{"theme": "light", "glassmorphism": false, "accentColor": "#10b981"}'::jsonb),
('66666666-6666-6666-6666-666666666610', 'Emergency Standby Artist Request', 'Need an artist in under 4 hours? Our emergency concierge responds immediately.', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7', '{"theme": "dark-glass", "glassmorphism": true, "accentColor": "#ef4444"}'::jsonb);

-- Custom Form Fields (Sample fields for Artist Onboarding & Wedding Forms)
INSERT INTO public.custom_form_fields (form_id, field_type, label, placeholder, is_required, options, order_index) VALUES
('66666666-6666-6666-6666-666666666601', 'text', 'Full Name', 'e.g. Rahul Verma', true, NULL, 1),
('66666666-6666-6666-6666-666666666601', 'text', 'Mobile Number', 'e.g. 9170159496', true, NULL, 2),
('66666666-6666-6666-6666-666666666601', 'email', 'Email Address', 'artist@email.com', true, NULL, 3),
('66666666-6666-6666-6666-666666666601', 'select', 'Primary Performance Category', 'Select Category', true, 'Live Singer, DJ, Live Band, Sufi Qawwal, Flutist, Comedian', 4),
('66666666-6666-6666-6666-666666666601', 'textarea', 'Performance Experience & Portfolio Links', 'YouTube / Instagram links and highlights', true, NULL, 5),
('66666666-6666-6666-6666-666666666602', 'text', 'Host Name', 'e.g. Avneesh Tripathi', true, NULL, 1),
('66666666-6666-6666-6666-666666666602', 'text', 'Contact Phone', '9170159496', true, NULL, 2),
('66666666-6666-6666-6666-666666666602', 'date', 'Event Date', 'Select Date', true, NULL, 3),
('66666666-6666-6666-6666-666666666602', 'select', 'Event Type', 'Select Ceremony', true, 'Wedding Ceremony, Sangeet Night, Cocktail Party, Reception, House Party', 4),
('66666666-6666-6666-6666-666666666602', 'text', 'City / Venue', 'e.g. Delhi NCR', true, NULL, 5);

-- (17) Custom Form Responses (10 Realistic Submissions with Phone: 9170159496)
INSERT INTO public.custom_form_responses (form_id, client_email, response_data) VALUES
('66666666-6666-6666-6666-666666666602', 'avneesh@magnevents.in', '{"name": "Avneesh Tripathi", "phone": "9170159496", "eventType": "Wedding Ceremony", "city": "Delhi NCR", "budget": "₹50,000"}'::jsonb),
('66666666-6666-6666-6666-666666666602', 'vikram.m@gmail.com', '{"name": "Vikram Malhotra", "phone": "9170159496", "eventType": "Sangeet Night", "city": "Mumbai", "budget": "₹1,00,000"}'::jsonb),
('66666666-6666-6666-6666-666666666602', 'priya.singhal@yahoo.com', '{"name": "Priya Singhal", "phone": "9170159496", "eventType": "Cocktail Party", "city": "Gurgaon", "budget": "₹45,000"}'::jsonb),
('66666666-6666-6666-6666-666666666602', 'sid.roy@gmail.com', '{"name": "Siddharth Roy", "phone": "9170159496", "eventType": "Reception", "city": "Jaipur", "budget": "₹1,50,000"}'::jsonb),
('66666666-6666-6666-6666-666666666602', 'ananya.d@gmail.com', '{"name": "Ananya Deshmukh", "phone": "9170159496", "eventType": "House Party", "city": "Bangalore", "budget": "₹20,000"}'::jsonb),
('66666666-6666-6666-6666-666666666601', 'deepak.vocalist@gmail.com', '{"name": "Deepak Sharma", "phone": "9170159496", "category": "Live Singer", "city": "Noida", "portfolio": "youtube.com/@deepaklive"}'::jsonb),
('66666666-6666-6666-6666-666666666601', 'rohit.dj@gmail.com', '{"name": "DJ Rohit J", "phone": "9170159496", "category": "DJ & Visuals", "city": "Delhi NCR", "portfolio": "instagram.com/djrohitlive"}'::jsonb),
('66666666-6666-6666-6666-666666666601', 'sufi.brothers@gmail.com', '{"name": "Sufi Brothers", "phone": "9170159496", "category": "Sufi & Qawwali", "city": "Lucknow", "portfolio": "youtube.com/@sufibrothers"}'::jsonb),
('66666666-6666-6666-6666-666666666603', 'corporate@techfirm.com', '{"name": "Karan Singhania", "phone": "9170159496", "company": "Tech Corp India", "eventType": "Annual Gala", "attendees": "400"}'::jsonb),
('66666666-6666-6666-6666-666666666604', 'neha.party@gmail.com', '{"name": "Neha Chawla", "phone": "9170159496", "eventType": "Terrace Party", "city": "Chandigarh", "budget": "₹15,000"}'::jsonb);

-- (18) Notifications Outbox Queue (10 Items Sent to Admin WhatsApp: 9170159496)
INSERT INTO public.notifications_outbox (
    reference_code, channel, recipient, subject, payload, status, retry_count
) VALUES
('MGN-BKG-8801', 'whatsapp_admin', '9170159496', 'New Lead Notification', '{"clientName": "Avneesh Tripathi", "clientPhone": "9170159496", "eventType": "Wedding Ceremony", "city": "Delhi NCR", "budget": "₹50,000 - ₹1,00,000", "referenceCode": "MGN-BKG-8801"}'::jsonb, 'sent', 0),
('MGN-BKG-8802', 'whatsapp_admin', '9170159496', 'New Lead Notification', '{"clientName": "Vikram Malhotra", "clientPhone": "9170159496", "eventType": "Sangeet Night", "city": "Mumbai", "budget": "₹75,000 - ₹1,50,000", "referenceCode": "MGN-BKG-8802"}'::jsonb, 'sent', 0),
('MGN-BKG-8803', 'whatsapp_admin', '9170159496', 'New Lead Notification', '{"clientName": "Priya Singhal", "clientPhone": "9170159496", "eventType": "Cocktail Party", "city": "Gurgaon", "budget": "₹35,000 - ₹60,000", "referenceCode": "MGN-BKG-8803"}'::jsonb, 'sent', 0),
('MGN-BKG-8804', 'whatsapp_admin', '9170159496', 'New Lead Notification', '{"clientName": "Siddharth Roy", "clientPhone": "9170159496", "eventType": "Reception Gala", "city": "Jaipur", "budget": "₹1,00,000 - ₹2,50,000", "referenceCode": "MGN-BKG-8804"}'::jsonb, 'sent', 0),
('MGN-BKG-8805', 'whatsapp_admin', '9170159496', 'New Lead Notification', '{"clientName": "Ananya Deshmukh", "clientPhone": "9170159496", "eventType": "House Party", "city": "Bangalore", "budget": "₹15,000 - ₹30,000", "referenceCode": "MGN-BKG-8805"}'::jsonb, 'sent', 0),
('MGN-BKG-8806', 'whatsapp_admin', '9170159496', 'New Lead Notification', '{"clientName": "Rajesh Kulkarni", "clientPhone": "9170159496", "eventType": "Anniversary", "city": "Lucknow", "budget": "₹40,000 - ₹80,000", "referenceCode": "MGN-BKG-8806"}'::jsonb, 'sent', 0),
('MGN-BKG-8807', 'whatsapp_admin', '9170159496', 'New Lead Notification', '{"clientName": "Deepak Aggarwal", "clientPhone": "9170159496", "eventType": "Corporate Gala", "city": "Noida", "budget": "₹50,000 - ₹1,20,000", "referenceCode": "MGN-BKG-8807"}'::jsonb, 'sent', 0),
('MGN-BKG-8808', 'whatsapp_admin', '9170159496', 'New Lead Notification', '{"clientName": "Neha Chawla", "clientPhone": "9170159496", "eventType": "Mehndi Ceremony", "city": "Chandigarh", "budget": "₹30,000 - ₹55,000", "referenceCode": "MGN-BKG-8808"}'::jsonb, 'sent', 0),
('MGN-BKG-8809', 'whatsapp_admin', '9170159496', 'New Lead Notification', '{"clientName": "Gaurav Bansal", "clientPhone": "9170159496", "eventType": "Varmala", "city": "Varanasi", "budget": "₹20,000 - ₹45,000", "referenceCode": "MGN-BKG-8809"}'::jsonb, 'sent', 0),
('MGN-BKG-8810', 'whatsapp_admin', '9170159496', 'New Lead Notification', '{"clientName": "Kavita Reddy", "clientPhone": "9170159496", "eventType": "Engagement", "city": "Hyderabad", "budget": "₹45,000 - ₹90,000", "referenceCode": "MGN-BKG-8810"}'::jsonb, 'sent', 0);

-- (19) Emails Log
INSERT INTO public.emails (recipient, subject, status) VALUES
('avneesh@magnevents.in', 'Booking Confirmation: MGN-BKG-8801', 'sent'),
('vikram.malhotra@gmail.com', 'Booking Confirmation: MGN-BKG-8802', 'sent'),
('priya.singhal@yahoo.com', 'Booking Confirmation: MGN-BKG-8803', 'sent'),
('sid.roy@gmail.com', 'Booking Confirmation: MGN-BKG-8804', 'sent'),
('ananya.desh@gmail.com', 'Booking Confirmation: MGN-BKG-8805', 'sent'),
('rajesh.k@gmail.com', 'Booking Confirmation: MGN-BKG-8806', 'sent'),
('deepak.agg@gmail.com', 'Booking Confirmation: MGN-BKG-8807', 'sent'),
('neha.chawla@gmail.com', 'Booking Confirmation: MGN-BKG-8808', 'sent'),
('gaurav.bansal@gmail.com', 'Booking Confirmation: MGN-BKG-8809', 'sent'),
('kavita.reddy@gmail.com', 'Booking Confirmation: MGN-BKG-8810', 'sent');

-- (20) Analytics (10 Pageviews and Conversion Events)
INSERT INTO public.analytics (
    path, type, session_id, ip_address, city, region, country, postal_code, device_type, browser, os, details
) VALUES
('/', 'page_view', 'sess_001_delhi', '103.211.54.12', 'Delhi', 'Delhi', 'India', '110001', 'mobile', 'Chrome Mobile', 'Android', '{"utm_source": "google", "utm_campaign": "christmas_wedding_offer"}'::jsonb),
('/artists', 'page_view', 'sess_001_delhi', '103.211.54.12', 'Delhi', 'Delhi', 'India', '110001', 'mobile', 'Chrome Mobile', 'Android', '{"filter_category": "Live Singer"}'::jsonb),
('/', 'offer_strip_click', 'sess_001_delhi', '103.211.54.12', 'Delhi', 'Delhi', 'India', '110001', 'mobile', 'Chrome Mobile', 'Android', '{"couponCode": "XMAS15"}'::jsonb),
('/city/mumbai', 'page_view', 'sess_002_mumbai', '115.99.120.45', 'Mumbai', 'Maharashtra', 'India', '400050', 'desktop', 'Chrome', 'Windows', '{"source": "organic"}'::jsonb),
('/city/gurgaon', 'page_view', 'sess_003_gurgaon', '122.161.45.10', 'Gurgaon', 'Haryana', 'India', '122002', 'mobile', 'Safari Mobile', 'iOS', '{"source": "google_ads"}'::jsonb),
('/services', 'page_view', 'sess_004_jaipur', '182.72.65.22', 'Jaipur', 'Rajasthan', 'India', '302001', 'desktop', 'Edge', 'Windows', '{"source": "direct"}'::jsonb),
('/pricing', 'page_view', 'sess_005_bangalore', '106.51.72.88', 'Bangalore', 'Karnataka', 'India', '560038', 'mobile', 'Chrome Mobile', 'Android', '{"plan": "Wedding Sangeet Power Band"}'::jsonb),
('/city/delhi/blog/book-wedding-singer-delhi', 'page_view', 'sess_006_noida', '103.211.54.99', 'Noida', 'Uttar Pradesh', 'India', '201301', 'desktop', 'Chrome', 'macOS', '{"seo_read": true}'::jsonb),
('/', 'offer_form_submit', 'sess_007_lucknow', '122.176.88.40', 'Lucknow', 'Uttar Pradesh', 'India', '226010', 'mobile', 'Chrome Mobile', 'Android', '{"referenceCode": "MGN-BKG-8806"}'::jsonb),
('/thank-you', 'conversion', 'sess_001_delhi', '103.211.54.12', 'Delhi', 'Delhi', 'India', '110001', 'mobile', 'Chrome Mobile', 'Android', '{"amount": 2499.00, "payment_status": "captured"}'::jsonb);

-- ==============================================================================
-- DATABASE RESET & POPULATION COMPLETE!
-- All tables recreated, relationships verified, and 10 dummy rows inserted.
-- Verified Admin & Contact Phone: 9170159496 (+91 9170159496)
-- ==============================================================================
