# Magnevents — Robots.txt, Crawl Directives & Indexing Control

**Authoritative Production Location:** `https://www.magnevents.in/robots.txt`  
**File Origin:** `booking-platform/app/robots.js` (Next.js App Router metadata route)  

---

## 1. Production Directives

```text
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /private/
Disallow: /preview/
Disallow: /thank-you

Sitemap: https://www.magnevents.in/sitemap.xml
Host: https://www.magnevents.in
```

---

## 2. Crawl Directives vs. Noindex Distinction

In compliance with Google Search Central guidelines:
1. **Robots.txt Disallow** instructs Googlebot *not to fetch* the specified path. It preserves server crawl budget.
2. **X-Robots-Tag / meta robots noindex** instructs Googlebot *not to index* the page in search results.
3. For conversion thank-you pages (`/thank-you`), both `disallow` in `robots.txt` and `noindex` in page metadata are implemented so zero conversion attribution data or client confirmation screens leak to search.
4. Administrative portals (`https://admin.magnevents.in`) reside on a distinct origin, requiring Supabase RBAC authentication.

---

## 3. Preview & Staging Environment Protection

In `booking-platform/next.config.js`:
```javascript
if (process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development') {
  headers.push({
    headers: [
      {
        key: 'X-Robots-Tag',
        value: 'noindex, nofollow',
      },
    ],
    source: '/:path*',
  });
}
```
This guarantees that all ephemeral Vercel preview URLs (e.g. `*.vercel.app`) or testing branches emit an HTTP header `X-Robots-Tag: noindex, nofollow`, preventing search engine indexation of duplicate staging sites.

