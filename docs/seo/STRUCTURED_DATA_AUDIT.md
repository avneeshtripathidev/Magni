# Magnevents — Structured Data & Schema Markup Specification

**Standard:** Schema.org JSON-LD  
**Target Search Engine:** Google Search (Rich Results Compliant)  

---

## 1. Schema Inventory by Page Type

| Page Type | Primary Schema | Secondary Schemas | Purpose |
| :--- | :--- | :--- | :--- |
| **Root (`/`)** | `WebSite` | `EntertainmentBusiness` | Establishes brand entity, search action, headquarters, service areas, and customer support points. |
| **Artist Directory (`/artists`)** | `CollectionPage` | `BreadcrumbList` | Models artist directory hierarchy. |
| **Artist Profile (`/artist/[id]`)** | `Person` / `MusicGroup` | `BreadcrumbList` | Defines the specific artist, bio, image, genre/category, and verified regional availability. |
| **Programmatic Page (`/[location_slug]`)** | `CollectionPage` | `BreadcrumbList`, `FAQPage`, `Service` | Models localized service offerings, FAQs, and breadcrumbs. |
| **City Hub (`/city/[city_slug]`)** | `WebPage` | `BreadcrumbList` | Regional landing hub. |
| **Blog Posts (`/blog-post/[id]`, `/city/[city_slug]/blog/[blog_slug]`)** | `Article` / `BlogPosting` | `BreadcrumbList` | Editorial authority, datePublished, dateModified, and author organization. |

---

## 2. Truthful Representation & Penalty Mitigation

In accordance with Google Search Central guidelines:
1. **AggregateRating Compliance:** Unsubstantiated or purely hardcoded review counts that do not correspond to visible on-page user reviews have been audited to avoid algorithmic manual action flags. When `rating` and `reviewCount` are output on artist profiles, they reflect the database values (`successful_bookings` / verified ratings).
2. **PostalAddress Integrity:** `EntertainmentBusiness` accurately reflects Magnevents' operations across Delhi-NCR and India with genuine customer support channels.
3. **Valid Context:** All blocks declare `"@context": "https://schema.org"`.

