# Magnevents — Canonicalization, Redirection & Duplicate Content Architecture

**Authoritative Production Canonical:** `https://www.magnevents.in`  

---

## 1. Canonical Normalization Standards

To eliminate duplicate content penalties, Magnevents enforces single authoritative URLs across all routes:
1. **Protocol:** Strict HTTPS (`https://`).
2. **Subdomain:** Canonical `www.` subdomain (`https://www.magnevents.in`). Non-www requests redirect automatically at DNS / CDN edge.
3. **Trailing Slashes:** Strictly removed (`trailingSlash: false` in `next.config.js`). Any URL ending in `/` is normalized to the non-trailing-slash equivalent without redirect loops.
4. **Casing:** Strictly lowercased kebab-case. Programmatic routes (`[location_slug]`) intercept uppercase characters and redirect to the normalized lowercase string.
5. **Self-Referencing Metadata:** Every indexable layout and page component includes `alternates: { canonical: '/current-path' }`, which Next.js resolves against `metadataBase`.

---

## 2. Permanent 301 Redirect Registry (`next.config.js`)

| Source Path | Canonical Destination | Type | Reason |
| :--- | :--- | :--- | :--- |
| `/about` | `/blog-post` | 301 Permanent | Content migration to editorial journal |
| `/artist-registration` | `/register/artist` | 301 Permanent | URL restructuring |
| `/search` | `/ai-search` | 301 Permanent | Rebrand to AI Search engine |
| `/how-to-book-a-singrs-in-delhi` | `/artists` | 301 Permanent | Typo elimination |
| `/how-to-book-a-singer-in-delhi` | `/artists` | 301 Permanent | Consolidation into directory |
| `/book` | `/` | 301 Permanent | Old booking modal anchor fallback |
| `/contact` | `/` | 301 Permanent | Unified inquiry flow on homepage |
| `/null` | `/` | 301 Permanent | Protection against malformed client hits |

---

## 3. Dynamic Programmatic Redirect Rules

In `booking-platform/app/[location_slug]/page.jsx`:
- **City-Only Queries:** If a user or bot accesses a bare city slug via root (e.g., `/delhi`, `/gurgaon`, `/mumbai`), it triggers an automated redirect to the dedicated regional hub (`/city/delhi`, `/city/gurgaon`, `/city/mumbai`).
- **Sanitized URL Redirects:** If a slug contains raw whitespace (`%20`) or underscores, it immediately redirects to the normalized hyphenated slug (`/${normalized_slug}`).

