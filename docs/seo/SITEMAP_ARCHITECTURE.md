# Magnevents — Advanced Sitemap Architecture & Crawlability Specification

**Production Canonical Sitemap:** `https://www.magnevents.in/sitemap.xml`  
**Framework Implementation:** Next.js 14 App Router Dynamic Sitemap (`app/sitemap.js`)  
**Cache Header:** Edge CDN revalidate = 86400 (24 hours)  

---

## 1. Architectural Principles

1. **Protocol Compliance:** Strictly respects the Sitemap XML standard (maximum 50,000 URLs per file, UTF-8 encoding, W3C ISO 8601 `<lastmod>` timestamps).
2. **Canonical Exclusivity:** Every URL emitted in the sitemap is the 100% self-referencing canonical URL (`https://www.magnevents.in/path`). No redirect targets, no trailing slashes, no query parameters, and no HTTP or non-www variants.
3. **HTTP 200 Guarantee:** Only live, publicly crawlable pages returning HTTP 200 are included.
4. **Anti-Thin Content Quality Gate:**
   - Permutations for Tier 2/3 locations lacking inventory or active landing content are filtered out to protect site-wide crawl quality and domain authority.
   - Core metros (Delhi NCR, Mumbai MMR, Bangalore, Pune, Hyderabad, Jaipur, Chandigarh, Lucknow) are prioritized with high crawl frequency (`daily`) and priorities (0.90 – 0.98).

---

## 2. Sitemap Tier Hierarchy & Inclusions

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Core Platform Pages (Priority 0.75 - 1.0)                │
│    /, /artists, /ai-search, /pricing, /services, etc.       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 2. High-Intent National Target Routes (Priority 0.94)       │
│    /singers-near-me, /singer-for-house-party,               │
│    /wedding-singer-booking, /wedding-dj-booking, etc.       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. Metro Cluster Landing Pages (Priority 0.88 - 0.98)       │
│    Delhi NCR, Mumbai MMR, Pune, Bangalore, Hyderabad, Jaipur │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 4. Dynamic Database Entities (Priority 0.80 - 0.90)         │
│    Active Cities (/city/[city_slug])                        │
│    Verified Live Artists (/artist/[slug_or_id])              │
│    Published SEO Blogs & Editorial Posts                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Exclusion Rules (Zero Tolerance for Leakage)

The following route classes are strictly excluded from the sitemap:
- `/api/*` (Internal backend endpoints)
- `/admin/*` (Administrative control panel)
- `/dashboard/*` (Authenticated dashboards)
- `/private/*` (Internal configuration files)
- `/preview/*` (Unpublished previews)
- `/thank-you` (Post-checkout inquiry confirmation)
- Inactive artist records (`is_live = false`)
- Inactive city pages (`is_active = false`)
- Draft or unpublished blog posts (`status != 'published'`)

---

## 4. Deduplication & Verification Pipeline

In `booking-platform/app/sitemap.js`, all entries pass through an automated `Set` deduplication pass:
```javascript
const seenUrls = new Set();
const deduplicated = [];

for (const entry of allEntries) {
  if (entry.url && !seenUrls.has(entry.url)) {
    seenUrls.add(entry.url);
    deduplicated.push(entry);
  }
}
return deduplicated;
```
This guarantees zero duplicate URL entries, preventing Googlebot from expending crawl budget on redundant nodes.

