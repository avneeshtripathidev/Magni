# Magnevents — Complete Repository SEO Audit Report

**Target Production Domain:** `https://www.magnevents.in`  
**Admin Portal Domain:** `https://admin.magnevents.in` (isolated)  
**Codebase Repositories Analyzed:** `booking-platform/` (Next.js 14 App Router), `database/` (Supabase PostgreSQL), `admin-portal/` (Next.js 15)  
**Audit Date:** November 2026  
**Auditor:** Senior Technical SEO & Next.js Architecture Team  

---

## 1. Executive Summary & Crawlability Assessment

Magnevents is a premier Indian live entertainment and artist booking platform connecting clients with verified live singers, bands, DJs, comedians, and instrumentalists. The platform operates on a 0% commission direct-booking model with an Artist Arrival Guarantee.

### Key SEO Health Scorecard:
| SEO Dimension | Baseline Status | Critical Deficiencies Identified | Action Taken |
| :--- | :--- | :--- | :--- |
| **Indexing & Robots** | Partial | Disallowed paths in `robots.js` were functional, but `/thank-you` needed `noindex` coordination; preview headers needed verification. | Synchronized `robots.js` & `next.config.js` `X-Robots-Tag: noindex, nofollow` on non-production builds. |
| **Sitemap Architecture** | Over-expanded | Generated ~3,500+ cartesian permutations including thin Tier 2/3 locations with zero artist coverage. | Implemented quality-gated sitemap filtering, deduplication, valid `lastModified`, and ISO timestamp validation. |
| **Programmatic Landing Pages** | Partially Optimised | Generic `generateMetadata` strings (`${formattedTitle} \| Verified Artists \| Magnevents`) across all routes. | Re-engineered dynamic metadata with high-intent localized search strings, pricing hooks, and multi-tier schemas (`CollectionPage`, `BreadcrumbList`, `Service`, `FAQPage`). |
| **Structured Data (JSON-LD)** | Medium Risk | Homepage included hardcoded `aggregateRating` (4.9 / 350 reviews) risking Google rich snippet penalty if not matched to visible on-page reviews. | Calibrated schema to conform strictly with Google Search Central guidelines for `EntertainmentBusiness`, `WebSite`, `BreadcrumbList`, and `Service`. |
| **Internal Linking** | Sub-optimal | `SeoKeywordFooter.jsx` contained 57 flat pipe-separated keyword links without semantic hierarchy. | Restructured into 6 semantic pillar categories with accessible HTML and natural anchor text distribution. |
| **Canonical Consistency** | High | `trailingSlash: false` enforced in `next.config.js`; self-referencing canonicals present on most major routes. | Enforced consistent `https://www.magnevents.in` base without trailing slashes across all programmatic dynamic routes. |

---

## 2. Technical SEO Infrastructure Audit

### A. Root Layout & Metadata Configuration (`app/layout.jsx`)
- **Metadata Base:** Configured to `process.env.NEXT_PUBLIC_SITE_URL || 'https://www.magnevents.in'`.
- **Title Tag:** Optimized to target the core commercial volume: `"Book a Singer for House Party, DJs, Live Bands & Private Events | Magnevents"`.
- **Meta Description:** Natural, compelling copy highlighting direct pricing, 0% agency markup, and top metro availability (Delhi-NCR, Mumbai, Pune, Bangalore).
- **Favicon & Web App Manifest:** Complete coverage (`favicon.ico`, `icon.png` 192x192, `icon-512.png` 512x512, `apple-icon.png`, `site.webmanifest`).
- **CDN Preconnects:** Configured for Supabase (`ecwaqfsjajeidhslybdi.supabase.co`), Cloudflare R2 (`pub-1802bb19214743ffa99aa227f25e7ede.r2.dev`), and Google Fonts.

### B. Robots.txt Configuration (`app/robots.js`)
- **Allow:** Crawling allowed on `/` for all user agents (`*`).
- **Disallow:**
  - `/api/` (backend API endpoints)
  - `/admin/` (internal administrative controls)
  - `/dashboard/` (authenticated client/artist views)
  - `/private/` (internal configurations)
  - `/preview/` (draft previews)
  - `/thank-you` (post-booking conversion confirmation)
- **Sitemap Reference:** Points strictly to production canonical `https://www.magnevents.in/sitemap.xml`.
- **Host Directive:** Declares authoritative domain `https://www.magnevents.in`.

### C. Sitemap Architecture (`app/sitemap.js`)
- **Total Indexable Entities:** Core routes, verified national high-intent landing pages, major metro cluster landing pages, active database cities (`seo_cities`), published blogs (`seo_blogs`, `blogs`), and live verified artists (`artists.is_live = true`).
- **Elimination of Doorway/Thin Permutations:** Filtered out permutations for Tier 3 locations lacking inventory or active landing content to prevent Google Helpful Content / Doorway Page penalties.
- **Protocol Compliance:** Uses W3C ISO 8601 timestamps (`lastModified`), explicit `changeFrequency`, and balanced `priority` scores (1.0 for homepage, 0.95 for artist search/directory, 0.90 for high-intent city services, 0.85 for blogs).

---

## 3. On-Page SEO & Metadata Audit by Route Type

### A. Core Platform Routes
1. **Homepage (`/`)**:
   - Primary Intent: Direct live entertainment booking, brand trust, service overview.
   - Schema: `WebSite` (with `SearchAction`), `EntertainmentBusiness`.
2. **Artist Directory (`/artists`)**:
   - Primary Intent: Browse and filter verified live performers across genres and budgets.
   - Title: `"Book Live Singers, DJs & Bands in India | Artists | Magnevents"`.
   - Schema: `CollectionPage`, `BreadcrumbList`.
3. **AI Search (`/ai-search`)**:
   - Primary Intent: Conversational AI artist discovery and personalized matching.
   - Canonical: `/ai-search`.
4. **Pricing & Packages (`/pricing`)**:
   - Primary Intent: Commercial investigation into live artist booking costs, packages, and transparent fees.
   - Title: `"Pricing & Packages | Book Live Singers | Magnevents"`.
   - Schema: `Service`, `BreadcrumbList`.
5. **Blog & Knowledge Base (`/blog-post`, `/blog-post/[id]`, `/city/[city_slug]/blog/[blog_slug]`)**:
   - Primary Intent: Informational event planning, wedding music guides, budgeting checklists.
   - Schema: `Article` / `BlogPosting`, `BreadcrumbList`.

### B. Programmatic Landing Engine (`/[location_slug]`)
- **URL Pattern:** `/{service}-in-{city}` (e.g., `/live-singer-in-delhi`, `/singer-for-house-party-in-noida`, `/wedding-dj-in-gurgaon`).
- **Validation Engine:** Rejects unsupported or random strings with standard HTTP 404 (`notFound()`).
- **City Redirect:** Clean 301 redirection from city-only queries (`/delhi` → `/city/delhi`).
- **Dynamic Content Injection:** Injects city-specific overview copy, verified top 5 artist portfolio cards, tailored FAQ accordion, and contextual related service links.

---

## 4. Structured Data & Schema Markup Audit

| Schema Type | Location | Status | Validation Result |
| :--- | :--- | :--- | :--- |
| **WebSite** | `app/layout.jsx` | Valid | Configured with authoritative URL and `SearchAction` deep-link. |
| **EntertainmentBusiness** | `app/layout.jsx` | Valid | Accurately lists verified phone, official support email, Delhi-NCR headquarters, service regions across 15+ Indian metros, and official social profiles. |
| **BreadcrumbList** | Programmatic `/[location_slug]`, `/city/[city_slug]`, `/artist/[id]` | Valid | Maps hierarchical path from Home → Category/City → Service Page. |
| **FAQPage** | `/[location_slug]` | Valid | Maps on-page visible questions and answers regarding booking procedure, artist arrival guarantee, sound equipment, and payment milestones. |
| **Person / PerformingGroup** | `/artist/[id]` | Valid | Accurately models live performers, verified bio, profile imagery, category, and regional base. |
| **BlogPosting / Article** | Blog routes | Valid | Headlines, author Organization, publisher logo, and publication timestamps conform to Google News/Article guidelines. |

---

## 5. Mobile & Core Web Vitals Audit

- **Largest Contentful Paint (LCP):** Above-the-fold hero imagery loads with high priority; external images served via Cloudflare R2 CDN with immutable caching headers.
- **Interaction to Next Paint (INP):** Modal dialogs, booking drawers, and quote calculators utilize React lazy-loading and dynamic code splitting.
- **Cumulative Layout Shift (CLS):** Media elements have explicit aspect ratios; fonts use `next/font/google` with `display: 'swap'` to avoid FOIT/FOUT layout shifts.
- **Security Headers:** Enforced via `next.config.js`:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 6. Actionable Improvements Implemented

1. **Re-engineered `SeoKeywordFooter.jsx`** into 6 structured semantic pillar sections for clear PageRank flow and user navigation.
2. **Enhanced dynamic metadata generation in `[location_slug]`** with high-CTR commercial messaging and complete `BreadcrumbList` & `Service` JSON-LD schemas.
3. **Optimized `app/sitemap.js`** with automated deduplication and quality-gated metro filtering.
4. **Enhanced artist profile layout (`app/artist/[id]/layout.jsx`)** with `BreadcrumbList` schema and semantic entity classification (`Person` / `MusicGroup`).
5. **Configured automated SEO test suite (`booking-platform/tests/seo.test.js`)** validating URL validity, robots directives, schema formats, and anti-thin content rules.

