# Magnevents — Final Cleaned Project Folder Structure

**Authoritative Structure Document**  
**Date:** November 2026  

---

```
magni3/
├── .github/                      # CI/CD workflows for automated testing and Vercel deployments
│   └── workflows/
├── admin-portal/                 # Next.js 15 Admin Portal application
│   ├── src/
│   │   ├── app/                  # App Router routes (/dashboard, /login, /share, etc.)
│   │   │   ├── actions/          # Server actions for database operations
│   │   │   └── api/              # Internal admin API endpoints
│   │   ├── components/           # Admin UI components
│   │   │   ├── admins/           # Admin user management dialogs
│   │   │   ├── artists/          # Artist creation, Cloudflare R2 image & video uploaders
│   │   │   ├── blog/             # SEO blog generator and editor
│   │   │   ├── bookings/         # Booking inquiry approval and calendar management
│   │   │   ├── categories/       # Category management
│   │   │   ├── dashboard/        # Analytics charts and metrics overview
│   │   │   ├── pricing/          # Live pricing plan editor
│   │   │   └── ui/               # Reusable Tailwind / Radix UI design system primitives
│   │   ├── lib/                  # Presigned URL generators, Supabase client, utils
│   │   └── types/                # TypeScript type definitions
│   ├── tests/                    # Admin portal automated tests
│   └── package.json
│
├── booking-platform/             # Next.js 14 Public Booking Marketplace (Primary SEO Target)
│   ├── app/                      # App Router public routes and dynamic engines
│   │   ├── (desktop)/            # Desktop layout overrides
│   │   ├── [location_slug]/      # Dynamic programmatic landing engine (Service-in-City)
│   │   ├── ai-search/            # Conversational AI artist search and discovery
│   │   ├── api/                  # Backend endpoints (contact, campaigns, razorpay, cron)
│   │   ├── artist/[id]/          # Dynamic artist profile with schema markup & media player
│   │   ├── artists/              # Full artist directory with genre/budget filters
│   │   ├── blog-post/            # Editorial journal and event planning guides
│   │   ├── city/[city_slug]/     # Regional city hubs and localized city blogs
│   │   ├── components/           # Public frontend UI components
│   │   │   ├── artists/          # Filter chips, artist cards, sound gear checklists
│   │   │   ├── booking/          # Quick booking and inquiry modals
│   │   │   ├── campaign/         # Universal instant offer and attribution forms
│   │   │   ├── common/           # Navigation, footer, modals, trust badges, SEO grids
│   │   │   ├── forms/            # Client inquiry and date-lock forms
│   │   │   ├── home/             # Hero, video reels, FAQ, reviews, semantic footer
│   │   │   ├── layout/           # AppShell, headers, footers
│   │   │   └── search/           # Search input and autocomplete
│   │   ├── constants/            # Event posters, SEO keyword taxonomy, pricing tiers
│   │   ├── layouts/              # AppShellWrapper and React context providers
│   │   ├── services/             # Client-side booking and database service layers
│   │   ├── styles/               # CSS modules, design tokens, and page stylesheets
│   │   ├── utils/                # Geolocation, attribution, SEO URL parser, schema templates
│   │   ├── layout.jsx            # Root layout with WebSite and EntertainmentBusiness JSON-LD
│   │   ├── robots.js             # Robots.txt crawl rules and sitemap declaration
│   │   └── sitemap.js            # Dynamic, deduplicated XML sitemap generator
│   ├── components/
│   │   └── mobile/               # Mobile-first optimized components for /mobile-home
│   ├── public/                   # Static assets, webmanifest, icons, video reels, posters
│   ├── tests/                    # Automated testing suite (32 unit/integration/SEO tests)
│   ├── next.config.js            # Headers, security policies, 301 redirects, PWA config
│   └── package.json
│
├── database/                     # Shared database infrastructure
│   ├── connection/               # Supabase client and administrative connection configs
│   ├── migrations/               # Production PostgreSQL database migrations (.sql)
│   └── package.json
│
├── docs/                         # Centralized documentation repository
│   ├── codebase/                 # CLEANUP-REPORT.md and PROJECT-STRUCTURE.md
│   ├── seo/                      # Complete SEO architecture, keyword maps, audits, schemas
│   ├── ARCHITECTURE.md           # System architecture overview
│   ├── DATABASE.md               # Supabase data dictionary and relationships
│   ├── FORMS_REFERENCE.md        # Reference guide for campaign and client booking forms
│   └── SECURITY.md               # Security protocols, input sanitization, payment verification
│
├── helpers/                      # Shared helper utilities
│   ├── formatters.js             # Currency, price, and string formatting utilities
│   └── validation.js             # Form input sanitization and regex validators
│
├── .gitignore                    # Git ignore specifications
├── PROJECT_DOCUMENTATION.md      # Comprehensive 60KB architectural documentation
└── README.md                     # GitHub repository overview and quickstart guide
```

---

## Directory Purpose Summary

| Directory | Core Purpose & Production Role |
| :--- | :--- |
| `booking-platform/` | The customer-facing web application. Serves the homepage, artist profiles, SEO landing pages, AI search, and handles booking inquiries and advance payments via Razorpay. |
| `admin-portal/` | The internal administration portal. Used by the Magnevents team to review incoming booking requests, manage artist rosters, upload media to Cloudflare R2, and publish SEO city blogs. |
| `database/` | Houses the authoritative Supabase PostgreSQL connection clients and sequential SQL schema migrations for payments, outbox delivery, and campaign tracking. |
| `helpers/` | Minimal, shared helper utilities (formatters and input sanitizers) imported by both the booking platform and tests. |
| `docs/` | The centralized knowledge base containing codebase cleanup reports, SEO strategy, database dictionaries, and form routing specifications. |

