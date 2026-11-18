# Magnevents Artist Portal (`artist-portal`)

**Production URL**: `https://artists.magnevents.in`  
**Local Development**: `http://localhost:3002`  
**Brand Identity**: Magnevents Performer Suite (Deep Burgundy `#161112`, Coral `#E45F60`, Marigold Gold `#E8B943`)

The **Artist Portal** is a standalone, independent Next.js web application within the Magnevents monorepo. It enables live singers, musicians, acoustic duos, bands, DJs, and instrumentalists to register, manage their musical profiles, submit performance pricing and logistics, upload government identity verification documents, and track client gig bookings with 0% commission fees.

---

## 1. Core Architecture Principles

1. **Monorepo Independence**:
   - `artist-portal/` has its own `package.json`, `tsconfig.json`, `tailwind.config.ts`, and routing.
   - It is deployed as an independent project on Vercel with Root Directory set to `artist-portal`.
   - **`booking-platform/` is completely isolated and untouched.**

2. **Frictionless Authentication (NO OTP)**:
   - Performers can register or sign in via **Google OAuth** or standard **Email & Password**.
   - No phone OTP or email OTP gating.
   - Upon initial signup, an artist profile is automatically created in `public.artists` with `verification_status = 'pending'`.

3. **Admin Verification & Trust Control**:
   - All newly registered artists start with status `pending`.
   - Magnevents Admin team reviews artist identity documents, submitted pricing, audio demos, and stage showreels.
   - Admins can Approve, Reject with detailed feedback reason, or Suspend.
   - Artists cannot self-publish to the public booking platform until verified by Admin.

---

## 2. Directory Structure

```text
artist-portal/
├── app/
│   ├── (auth)/
│   │   ├── login/                 # Email/Password + Google sign-in (no OTP)
│   │   ├── register/              # Performer registration (no OTP)
│   │   └── forgot-password/       # Password recovery link
│   ├── (dashboard)/
│   │   ├── dashboard/             # Overview, metrics, onboarding meter, resubmit
│   │   ├── profile/               # Multi-section editor: Classifications, Genres, Logistics, Pricing
│   │   ├── portfolio/             # Photos, YouTube stage reels, Instagram/Spotify links
│   │   ├── media/                 # Audio samples, SoundCloud / MP3 player
│   │   ├── bookings/              # Gig calendar & inquiries
│   │   ├── payments/              # Settlement bank accounts, 50% token payouts
│   │   ├── verification/          # Govt ID upload & status tracker with admin feedback
│   │   └── settings/              # Password change & alert settings
│   ├── globals.css                # Magnevents dark palette & design tokens
│   ├── layout.tsx                 # Root layout with AuthProvider & metadata
│   └── page.tsx                   # Public Performer Welcome Landing Page
├── components/
│   ├── dashboard/                 # Sidebar, Topbar, StatusBadge, CompletionMeter
│   └── ui/
├── lib/
│   ├── auth/                      # AuthContext & Session management
│   ├── supabase/                  # Supabase browser client
│   └── utils.ts                   # Class merging & profile completion calculator
├── services/
│   └── artistService.ts           # Supabase CRUD for artists, notifications, media
├── types/
│   └── artist.ts                  # TypeScript interfaces for ArtistProfile, Docs, Pricing
├── middleware.ts                  # Edge route protection
├── next.config.mjs                # Image domains & Next.js config
├── package.json
└── tailwind.config.ts
```

---

## 3. Environment Variables

Create `.env.local` inside `artist-portal/` (or copy from `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

---

## 4. Local Development

```bash
# From workspace root:
cd artist-portal
npm install
npm run dev -- -p 3002

# Or run via root prefix:
npm run dev --prefix artist-portal -- -p 3002
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

---

## 5. Vercel Deployment Guide

To deploy `artists.magnevents.in`:
1. In Vercel, click **Add New Project** and select the `magnivercel` GitHub repository.
2. Under **Root Directory**, click Edit and select `artist-portal`.
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (`https://artists.magnevents.in`)
4. In Project Settings > Domains, assign `artists.magnevents.in` (configure DNS CNAME to `cname.vercel-dns.com`).

