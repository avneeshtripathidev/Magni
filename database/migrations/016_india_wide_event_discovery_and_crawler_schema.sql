-- ============================================================================
-- 016_india_wide_event_discovery_and_crawler_schema.sql
-- Magnevents India-Wide Event Discovery, Google Crawling & SEO Expansion
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. HIERARCHICAL GEOGRAPHICAL LOCATION DATABASE
-- Country (India) -> State (28 States + 8 UTs) -> District -> City -> Locality -> Venue
-- ============================================================================

-- States and Union Territories (36 Total)
CREATE TABLE IF NOT EXISTS public.states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code VARCHAR(5) NOT NULL UNIQUE, -- e.g. DL, UP, MH, KA
    slug TEXT NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL DEFAULT 'state', -- 'state' or 'union_territory'
    zone VARCHAR(20) NOT NULL, -- 'North', 'South', 'West', 'East', 'Central', 'North-East'
    capital TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Districts
CREATE TABLE IF NOT EXISTS public.districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_id UUID NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    headquarters TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(state_id, slug)
);

-- Cities & Towns (Comprehensive Coverage: 1,063+ Cities across all Tiers)
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_id UUID NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
    district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tier VARCHAR(10) NOT NULL DEFAULT 'Tier 3', -- 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'
    population_est INTEGER,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    seo_title TEXT,
    meta_description TEXT,
    h1 TEXT,
    city_guide TEXT,
    is_metro BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Localities & Neighborhoods (e.g. South Delhi, Indiranagar, Bandra, Gomti Nagar)
CREATE TABLE IF NOT EXISTS public.localities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    pincode VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(city_id, slug)
);

-- Event Venues (Banquet Halls, Farmhouses, Luxury Hotels, Convention Centers, Clubs)
CREATE TABLE IF NOT EXISTS public.event_venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    locality_id UUID REFERENCES public.localities(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    venue_type VARCHAR(50) NOT NULL, -- 'Banquet Hall', 'Luxury Hotel', 'Farmhouse', 'Resort', 'Auditorium', 'Club/Lounge'
    address TEXT,
    capacity_min INTEGER,
    capacity_max INTEGER,
    has_live_music_license BOOLEAN DEFAULT true,
    contact_phone TEXT,
    contact_email TEXT,
    website_url TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    source_url TEXT,
    verification_status VARCHAR(20) DEFAULT 'unverified', -- 'verified', 'unverified', 'claimed'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(city_id, slug)
);

-- ============================================================================
-- 2. DYNAMIC EVENT CATEGORIES & TAXONOMY
-- ============================================================================

-- Core Event Categories
CREATE TABLE IF NOT EXISTS public.event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- 'Wedding', 'Corporate', 'Birthday', 'College', 'Live Music', 'Religious', 'Other'
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Granular Event Types
CREATE TABLE IF NOT EXISTS public.event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.event_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    booking_intent_weight DECIMAL(3, 2) DEFAULT 0.85, -- 0.00 to 1.00 high-converting indicator
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. ADVANCED BOOKING-INTENT KEYWORD ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.booking_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    event_category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
    event_type_id UUID REFERENCES public.event_types(id) ON DELETE SET NULL,
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    intent_tier VARCHAR(20) NOT NULL DEFAULT 'transactional', -- 'transactional', 'evaluative', 'navigational', 'informational'
    intent_action VARCHAR(30) NOT NULL DEFAULT 'book', -- 'book', 'hire', 'cost', 'price', 'near_me', 'best', 'top'
    language VARCHAR(10) NOT NULL DEFAULT 'en', -- 'en', 'hi', 'hinglish'
    estimated_monthly_searches INTEGER DEFAULT 500,
    priority_score DECIMAL(3, 2) DEFAULT 0.90, -- 0.00 to 1.00
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 4. GOOGLE & PUBLIC SEARCH CRAWLER INFRASTRUCTURE
-- ============================================================================

-- Approved Crawler Sources & Registry
CREATE TABLE IF NOT EXISTS public.crawler_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'google_custom_search', 'google_places', 'public_directory', 'press_listing', 'venue_portal'
    crawl_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'every_3_days', 'weekly', 'monthly'
    rate_limit_delay_ms INTEGER DEFAULT 1500,
    concurrency_limit INTEGER DEFAULT 2,
    robots_txt_allowed BOOLEAN DEFAULT true,
    last_crawled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'blocked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crawler Job Execution Tracker
CREATE TABLE IF NOT EXISTS public.crawler_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(50) NOT NULL, -- 'gsc_inspection', 'custom_search_discovery', 'places_discovery', 'keyword_audit', 'sitemap_sync'
    status VARCHAR(20) NOT NULL DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed', 'paused'
    source_id UUID REFERENCES public.crawler_sources(id) ON DELETE SET NULL,
    target_city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    target_category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
    urls_discovered INTEGER DEFAULT 0,
    urls_processed INTEGER DEFAULT 0,
    duplicates_detected INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    error_summary TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Discovered URLs
CREATE TABLE IF NOT EXISTS public.discovered_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL UNIQUE,
    canonical_url TEXT NOT NULL,
    url_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of canonical URL for instant duplicate detection
    source_id UUID REFERENCES public.crawler_sources(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.crawler_jobs(id) ON DELETE SET NULL,
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    event_category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
    http_status INTEGER,
    title TEXT,
    meta_description TEXT,
    detected_artist_name TEXT,
    detected_venue_name TEXT,
    detected_event_type TEXT,
    has_booking_intent BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'discovered', -- 'discovered', 'processed', 'verified', 'rejected', 'archived'
    last_crawled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Publicly Discovered Artists (Strictly separated from Magnevents registered artists)
CREATE TABLE IF NOT EXISTS public.discovered_artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Singer',
    genres TEXT[] DEFAULT '{}',
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    state_id UUID REFERENCES public.states(id) ON DELETE SET NULL,
    source_url TEXT NOT NULL,
    source_name TEXT,
    public_contact TEXT, -- Publicly published booking email/phone only
    starting_price DECIMAL(10, 2), -- Only when explicitly published on public listing
    verification_status VARCHAR(20) DEFAULT 'pending_review', -- 'pending_review', 'approved', 'rejected'
    discovery_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Publicly Discovered Events
CREATE TABLE IF NOT EXISTS public.discovered_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    event_type_id UUID REFERENCES public.event_types(id) ON DELETE SET NULL,
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES public.event_venues(id) ON DELETE SET NULL,
    event_date DATE,
    source_url TEXT NOT NULL,
    source_name TEXT,
    status VARCHAR(20) DEFAULT 'pending_review', -- 'pending_review', 'verified', 'past', 'rejected'
    discovery_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Programmatic SEO Landing Pages Registry
CREATE TABLE IF NOT EXISTS public.seo_landing_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    page_type VARCHAR(50) NOT NULL, -- 'city_service', 'city_hub', 'category_city', 'event_city', 'invitation_city'
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    event_category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
    event_type_id UUID REFERENCES public.event_types(id) ON DELETE SET NULL,
    h1 TEXT NOT NULL,
    seo_title TEXT NOT NULL,
    meta_description TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    content_overview TEXT,
    is_published BOOLEAN DEFAULT true,
    last_indexed_at TIMESTAMP WITH TIME ZONE,
    indexing_state VARCHAR(20) DEFAULT 'submitted', -- 'submitted', 'indexed', 'discovered_not_indexed', 'excluded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Google Search Console & Indexing Health
CREATE TABLE IF NOT EXISTS public.indexing_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL UNIQUE,
    landing_page_id UUID REFERENCES public.seo_landing_pages(id) ON DELETE CASCADE,
    google_index_status VARCHAR(50) DEFAULT 'submitted', -- 'indexed', 'discovered_not_indexed', 'crawled_not_indexed', 'error'
    last_gsc_check TIMESTAMP WITH TIME ZONE,
    gsc_impressions INTEGER DEFAULT 0,
    gsc_clicks INTEGER DEFAULT 0,
    gsc_ctr DECIMAL(5, 4) DEFAULT 0.0000,
    gsc_position DECIMAL(5, 2) DEFAULT 0.00,
    top_query TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crawl Logs & Audit Trails
CREATE TABLE IF NOT EXISTS public.crawl_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.crawler_jobs(id) ON DELETE CASCADE,
    log_level VARCHAR(10) DEFAULT 'INFO', -- 'INFO', 'WARN', 'ERROR'
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cities_state_id ON public.cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON public.cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_tier ON public.cities(tier);
CREATE INDEX IF NOT EXISTS idx_districts_state_id ON public.districts(state_id);
CREATE INDEX IF NOT EXISTS idx_localities_city_id ON public.localities(city_id);
CREATE INDEX IF NOT EXISTS idx_event_venues_city_id ON public.event_venues(city_id);
CREATE INDEX IF NOT EXISTS idx_event_types_category_id ON public.event_types(category_id);
CREATE INDEX IF NOT EXISTS idx_booking_keywords_city_id ON public.booking_keywords(city_id);
CREATE INDEX IF NOT EXISTS idx_booking_keywords_slug ON public.booking_keywords(slug);
CREATE INDEX IF NOT EXISTS idx_discovered_urls_url_hash ON public.discovered_urls(url_hash);
CREATE INDEX IF NOT EXISTS idx_discovered_urls_city_id ON public.discovered_urls(city_id);
CREATE INDEX IF NOT EXISTS idx_discovered_artists_city_id ON public.discovered_artists(city_id);
CREATE INDEX IF NOT EXISTS idx_discovered_artists_status ON public.discovered_artists(verification_status);
CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_slug ON public.seo_landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_city_id ON public.seo_landing_pages(city_id);
CREATE INDEX IF NOT EXISTS idx_indexing_status_url ON public.indexing_status(url);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_job_id ON public.crawl_logs(job_id);
