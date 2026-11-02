# Magnevents Forms Architecture & Reference Guide

This document catalogs every active lead capture and booking form across the Magnevents production application, documenting their exact visual designs, component file paths, trigger conditions, and backend database integrations.

---

## 1. Universal Instant Offer & Date-Lock Form

- **Form Name (Component)**: `GoogleAdsOfferInstantForm`
- **Component File**: `booking-platform/app/components/campaign/GoogleAdsOfferInstantForm.jsx`
- **Primary Stylesheet**: `booking-platform/app/styles/components/DiwaliOfferBookingForm.css`
- **Database Form Name Tag**: `formName: 'GoogleAdsOfferInstantForm'`
- **Database Lead Type**:
  - `type: 'google_ads_lead'` (when Google Ads tracking params like `gclid`, `gbraid`, `wbraid`, or `utm_campaign` are present)
  - `type: 'instant_lead'` (when visitor arrives via organic search or direct traffic)

### Visual Layout & Copy
1. **Wine Red Promotional Hero Banner**:
   - Tag: `🪔 VALID ONLY UNTIL DIWALI!`
   - Modal Headline: `Your Dream Event Starts Here!`
   - **Spotlight Offer Card**:
     - Offer Tag: `LIMITED-TIME DIWALI OFFER`
     - Headline: **`Premium Singers at Best Price`**
     - Subheadline: `Verified Live Performers Starting from ₹5,999 · 0% Agency Fee`
     - Right Badge: Struck-through `₹10,000` -> **`₹5,999`** (`STARTING FROM`)

2. **3 Discount Cards Strip (`SAVE UP TO 65%`)**:
   - Card 1: `PACKAGE OFFER` · `45%–50% OFF` · `Event Booking`
   - Card 2 (Featured): `DIWALI SPECIAL 🪔` · `+10% EXTRA` · `Code: DIW100`
   - Card 3: `WELCOME GIFT 🎁` · `+5% FIRST OFF` · `1st Booking Bonus`

3. **Input Fields & Full Budget Range Mapping**:
   - **Full Name \***: Text input
   - **Mobile Number \***: 10-digit phone number with auto-sanitization
   - **Event Type \***: Dropdown (`Wedding Ceremony`, `Corporate Event`, `Birthday Celebration`, etc.)
   - **Estimated Event Budget \***: Dropdown with progressive discount indicators:
     - `₹10,000 - ₹20,000 (10% Extra OFF)`
     - `₹20,000 - ₹35,000 (Eligible for 16% Extra OFF)`
     - `₹35,000 - ₹50,000 (Eligible for 18% Extra OFF)`
     - `₹50,000 - ₹80,000 (Eligible for 20% Extra OFF)`
     - `₹80,000 - ₹1,20,000 (Eligible for 22% Extra OFF)`
     - `₹1,20,000 - ₹2,00,000 (Eligible for 24% Extra OFF)`
     - `₹2,00,000+ (Eligible for 28% Extra OFF)`
   - Primary CTA: **`Unlock My Offer & Lock Date ➔`**

### Trigger Logic & Auto-Popup Timers
- **Google Ads Visitors**: Displays automatically after **4 seconds** on any page.
- **Organic / Direct Visitors (Homepage)**: Displays automatically after **6 seconds**.
- **Organic / Direct Visitors (Other Pages)**: Displays automatically after **4 seconds**.
- **Manual Trigger**: Click on any hero CTA button: `Book Verified Artists (Confirmed) ➔`.

---

## 2. High-Converting Split-Hero SEO Booking Card

- **Form Name (Component)**: `SEOLandingHero` (Right Column Card `#hero-book-99`)
- **Component File**: `booking-platform/app/components/common/SEOLandingHero.jsx`
- **Primary Stylesheet**: `booking-platform/app/styles/components/SEOLandingHero.css`
- **Database Form Name Tag**: `formName: 'Hero ₹6,9xx Booking - <Category> in <City>'`
- **Database Lead Type**: `type: 'quick_booking'`
- **Target Pages**:
  - Direct SEO Location Pages: `booking-platform/app/[location_slug]/page.jsx` via `SEOLandingPage.jsx`
  - City Blog Pages: `booking-platform/app/city/[city_slug]/blog/[blog_slug]/page.jsx`

### Visual Layout & Copy
1. **Split-Screen Desktop Architecture**:
   - **Left Column**:
     - Ivory-Marigold Gradient Title (`Top <Category> in <City>`)
     - Subtitle (`Book verified performers directly for your next grand event.`)
     - Category pills (`💍 Wedding / Reception`, `🍷 Ghazal / Sufi Mehfil`, etc.)
     - Social proof strip: `5,000+ Shows Executed` · `4.9 ★ Average Rating` · `10 Mins Fast Response`
   - **Right Column Card (`.hero-tok99-card`)**:
     - Price Pill: `FROM ₹6,9xx* BEST VALUE`
     - Heading: `Book <Category> in <City> from ₹6,9xx`
     - Fields:
       - `👤 Your Full Name`
       - `📱 Phone / WhatsApp *` (with `🇮🇳 +91` flag prefix)
       - `🎭 Event Type` (dropdown)
       - `📅 Event Date *` (native datepicker)
     - Submit Button: **`🔒 Lock <Category> from ₹6,9xx ➔`**

---

## 3. Dedicated Diwali Special Offer Form

- **Form Name (Component)**: `DiwaliOfferBookingForm`
- **Component File**: `booking-platform/app/components/campaign/DiwaliOfferBookingForm.jsx`
- **Primary Stylesheet**: `booking-platform/app/styles/components/DiwaliOfferBookingForm.css`
- **Database Form Name Tag**: `formName: 'DiwaliOfferBookingForm'`
- **Database Lead Type**: `type: 'diwali_offer_lead'`
- **Trigger**: Click on top notification announcement strip (`TopOfferAnnouncementStrip.jsx`) or clicking any promo banner with code `DIW100`.

---

## 4. Summary Matrix of All Magnevents Forms

| Form Display Name | Component Name | File Location | Database Lead Type | Trigger Condition |
| :--- | :--- | :--- | :--- | :--- |
| **Instant Offer & Date-Lock Form** | `GoogleAdsOfferInstantForm` | `app/components/campaign/GoogleAdsOfferInstantForm.jsx` | `google_ads_lead` / `instant_lead` | Timed popup (4s Ads / 6s Home) & Hero CTA button |
| **Split-Hero SEO Booking Card** | `SEOLandingHero` | `app/components/common/SEOLandingHero.jsx` | `quick_booking` | Static above-the-fold on all `[location_slug]` & city blog pages |
| **Diwali Special Offer Modal** | `DiwaliOfferBookingForm` | `app/components/campaign/DiwaliOfferBookingForm.jsx` | `diwali_offer_lead` | Top announcement bar & DIW100 links |
| **General Contact Modal** | `ContactModal` | `app/components/common/ContactModal.jsx` | `contact_inquiry` | "Contact Us" buttons in Nav, Footer, and Mobile Drawer |
| **Quick Artist Booking Modal** | `QuickBookingModal` | `app/components/common/QuickBookingModal.jsx` | `artist_quick_book` | "Book Now" buttons on individual artist profile cards |
| **Artist Registration Form** | `RegisterModal` | `app/components/common/RegisterModal.jsx` | `artist_registration` | "Are you an Artist?" navigation header button |

---

## 5. Centralized Lead Submission Pipeline

```text
User Submits Form
       │
       ▼
bookingService.submitInstantRequest()
       │
       ▼
POST /api/contact
       ├──> Supabase `bookings` table (Stores full budget label in `notes`)
       └──> Supabase `notifications_outbox` table
                 ├──> Admin Email Notification
                 └──> WhatsApp Concierge Alert
```

