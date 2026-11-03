# Magnevents — Internal Linking & Topical Authority Architecture

---

## 1. Information Architecture & PageRank Distribution

```
                       ┌──────────────────────┐
                       │     Homepage (/)     │
                       └──────────┬───────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
┌────────▼─────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐
│ Category Hubs    │    │ Regional Hubs     │    │ Editorial Journal │
│ (/artists, etc.) │    │ (/city/[slug])    │    │ (/blog-post)      │
└────────┬─────────┘    └─────────┬─────────┘    └─────────┬─────────┘
         │                        │                        │
         └───────────┬────────────┘                        │
                     │                                     │
           ┌─────────▼─────────┐                           │
           │ Localized Service │◄──────────────────────────┘
           │ Pages (/[slug])   │ (Contextual in-content links)
           └─────────┬─────────┘
                     │
           ┌─────────▼─────────┐
           │ Individual Artist │
           │ Profiles (/artist)│
           └───────────────────┘
```

---

## 2. Footer Semantic Redesign (`SeoKeywordFooter.jsx`)

Rather than maintaining a flat, unstructured wall of keyword tags, Magnevents segments footer internal links into six thematic semantic pillars:
1. **Popular Artist Categories:** Live Singers, Wedding DJs, Live Bands, Acoustic Musicians, Sufi & Ghazal Singers, Event Anchors, Stand-up Comedians.
2. **Wedding Entertainment:** Wedding Singers, Sangeet Music, Live Bands for Wedding, Wedding DJs, Mehndi & Haldi Singers.
3. **Private & House Parties:** Singers for House Party, Birthday Party Singers, House Party DJs, Acoustic Guitarists.
4. **Corporate Events:** Corporate Event Singers, Office Party Live Bands, Gala Dinner Live Music, Annual Function Performers.
5. **Top Metros:** Live Music in Delhi NCR, Mumbai MMR, Bangalore, Pune, Hyderabad, Jaipur, Chandigarh, Lucknow.
6. **Pricing & Transparency:** Live Artist Booking Prices, 0% Commission Direct Booking, 100% Artist Arrival Guarantee.

---

## 3. Anchor Text Best Practices
- **Descriptive & Conversational:** Use natural phrases like *"Browse verified live singers in Delhi"* instead of repeated keyword stuffing.
- **Deep-Linking:** In-depth blog guides link directly to relevant transactional landing pages (e.g., a guide on *How to Plan Wedding Music* includes direct contextual links to `/wedding-singer-booking` and `/wedding-dj-booking`).

