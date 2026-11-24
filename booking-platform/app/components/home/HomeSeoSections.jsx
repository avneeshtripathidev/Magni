import React from 'react';
import Link from 'next/link';
import '@/app/styles/components/HomeSeoSections.css';

/* ==========================================================================
   Section A: Book Artists for Every Occasion
   ========================================================================== */
export const OCCASIONS_DATA = [
  {
    title: 'Weddings',
    slug: '/wedding-singer-booking',
    tag: 'Wedding Special',
    icon: '💍',
    description: 'Soulful live singers, Sufi ensembles, and high-energy wedding bands for memorable sangeet, pheras, and grand receptions.',
    cta: 'Explore Wedding Artists'
  },
  {
    title: 'Birthday Parties',
    slug: '/singer-for-birthday-party',
    tag: 'Private Party',
    icon: '🎂',
    description: 'Acoustic solo singers, guitarists, and DJs to make intimate house parties and milestone celebrations unforgettable.',
    cta: 'Book Birthday Singer'
  },
  {
    title: 'Corporate Events',
    slug: '/corporate-event-singer',
    tag: 'Corporate Elite',
    icon: '🏢',
    description: 'Sophisticated jazz bands, gala vocalists, and interactive anchors to elevate company annual days and corporate offsites.',
    cta: 'Hire Corporate Musicians'
  },
  {
    title: 'Private Parties',
    slug: '/singer-for-house-party',
    tag: 'House Gig',
    icon: '🏡',
    description: 'Unplugged singers and boutique music setups tailored for terrace gatherings, cocktail evenings, and anniversaries.',
    cta: 'Book House Party Singer'
  },
  {
    title: 'College Events',
    slug: '/live-band-booking',
    tag: 'Campus Fest',
    icon: '🎸',
    description: 'Celebrity rock bands, indie acts, and youth festival performers for electrifying campus crowds.',
    cta: 'Book College Band'
  },
  {
    title: 'Engagement Ceremonies',
    slug: '/engagement-party-singer',
    tag: 'Ring Ceremony',
    icon: '✨',
    description: 'Romantic acoustic duos and Bollywood singers to create a magical atmosphere for your ring ceremony.',
    cta: 'Book Engagement Singer'
  },
  {
    title: 'Sangeet Functions',
    slug: '/sangeet-singer-booking',
    tag: 'Dance & Beats',
    icon: '💃',
    description: 'Electrifying Punjabi singers, live Bollywood music bands, and DJs for non-stop dance celebrations.',
    cta: 'Explore Sangeet Bands'
  }
];

export function OccasionsSection() {
  return (
    <section className="hp-shell hp-seo-block" aria-label="Book Artists for Every Occasion">
      <div className="hp-seo-head">
        <span className="hp-seo-eyebrow">✨ Curated Live Entertainment</span>
        <h2 className="hp-seo-title">
          Book Artists for <span>Every Occasion</span>
        </h2>
        <p className="hp-seo-subtitle">
          From intimate living-room house gigs to grand destination weddings and corporate galas, hire verified performers tailored to your event vibe.
        </p>
      </div>

      <div className="hp-occasions-grid">
        {OCCASIONS_DATA.map((item) => (
          <Link key={item.title} href={item.slug} className="hp-occasion-card">
            <div className="hp-occasion-top">
              <span className="hp-occasion-tag">{item.tag}</span>
              <span className="hp-occasion-icon">{item.icon}</span>
            </div>
            <h3 className="hp-occasion-h3">{item.title}</h3>
            <p className="hp-occasion-desc">{item.description}</p>
            <span className="hp-occasion-cta">
              {item.cta} <span>→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ==========================================================================
   Section B: Explore Artist Categories
   ========================================================================== */
export const CATEGORIES_DATA = [
  {
    title: 'Bollywood Singers',
    slug: '/bollywood-singer-for-event',
    count: '150+ Verified',
    icon: '🎤',
    subtitle: 'Playback vocalists, retro melodies, and contemporary chartbusters.'
  },
  {
    title: 'Sufi Singers',
    slug: '/sufi-singer-booking',
    count: '80+ Soulful Acts',
    icon: '🕊️',
    subtitle: 'Soul-stirring spiritual melodies, qawwalis, and fusion poetry.'
  },
  {
    title: 'Punjabi Singers',
    slug: '/punjabi-singer-booking',
    count: '90+ High Energy',
    icon: '🥁',
    subtitle: 'High-octane folk, bhangra anthems, and modern Punjabi beats.'
  },
  {
    title: 'DJs & Stage Artists',
    slug: '/dj-booking-near-me',
    count: '120+ Club & Stage',
    icon: '🎧',
    subtitle: 'Club, commercial, electronic, wedding beats, and retro mashups.'
  },
  {
    title: 'Live Bands',
    slug: '/live-band-booking',
    count: '110+ Live Groups',
    icon: '🎸',
    subtitle: 'Multi-genre rock, pop, Bollywood fusion, and acoustic indie bands.'
  },
  {
    title: 'Instrumentalists',
    slug: '/guitarist-for-private-party',
    count: '75+ Musicians',
    icon: '🎷',
    subtitle: 'Acoustic guitarists, violinists, saxophonists, and flute maestros.'
  },
  {
    title: 'Event Anchors',
    slug: '/wedding-anchor-booking',
    count: '60+ Emcees',
    icon: '🎙️',
    subtitle: 'Charismatic emcees, bilingual corporate hosts, and wedding anchors.'
  },
  {
    title: 'Stand-up Comedians',
    slug: '/standup-comedian-booking',
    count: '45+ Comedians',
    icon: '🎭',
    subtitle: 'Clean comedy, crowd work, and corporate entertainment headliners.'
  }
];

export function CategoriesSection() {
  return (
    <section className="hp-shell hp-seo-block" aria-label="Explore Artist Categories">
      <div className="hp-seo-head">
        <span className="hp-seo-eyebrow">🎵 Sound &amp; Genre Specialists</span>
        <h2 className="hp-seo-title">
          Explore Artist <span>Categories</span>
        </h2>
        <p className="hp-seo-subtitle">
          Discover verified singers, acoustic duos, high-energy wedding bands, and club DJs with transparent direct pricing and 0% agency fees.
        </p>
      </div>

      <div className="hp-categories-grid">
        {CATEGORIES_DATA.map((cat) => (
          <Link key={cat.title} href={cat.slug} className="hp-category-card">
            <div className="hp-cat-top">
              <span className="hp-cat-badge">{cat.count}</span>
              <span className="hp-cat-icon">{cat.icon}</span>
            </div>
            <h3 className="hp-cat-name">{cat.title}</h3>
            <p className="hp-cat-sub">{cat.subtitle}</p>
            <span className="hp-cat-link">
              Browse Artists <span>→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ==========================================================================
   Section D: Popular Cities
   ========================================================================== */
export const POPULAR_CITIES_DATA = [
  { name: 'Delhi NCR', slug: 'delhi', meta: '350+ Verified Artists' },
  { name: 'Mumbai', slug: 'mumbai', meta: '280+ Verified Artists' },
  { name: 'Bangalore', slug: 'bangalore', meta: '220+ Verified Artists' },
  { name: 'Jaipur', slug: 'jaipur', meta: '160+ Wedding Artists' },
  { name: 'Hyderabad', slug: 'hyderabad', meta: '180+ Verified Artists' },
  { name: 'Pune', slug: 'pune', meta: '140+ Live Performers' },
  { name: 'Chandigarh', slug: 'chandigarh', meta: '130+ Live Bands & Singers' },
  { name: 'Lucknow', slug: 'lucknow', meta: '120+ Sufi & Ghazal Singers' },
  { name: 'Noida', slug: 'noida', meta: '150+ Party & Event Artists' },
  { name: 'Gurgaon', slug: 'gurgaon', meta: '170+ Corporate & House Gigs' },
  { name: 'Ghaziabad', slug: 'ghaziabad', meta: '95+ Verified Singers' },
  { name: 'Bareilly', slug: 'bareilly', meta: '70+ Wedding Musicians' },
];

export function PopularCitiesSection() {
  return (
    <section className="hp-shell hp-seo-block" aria-label="Popular Cities for Live Artists">
      <div className="hp-seo-head">
        <span className="hp-seo-eyebrow">📍 Verified Local Roster</span>
        <h2 className="hp-seo-title">
          Popular Cities for <span>Live Artists</span>
        </h2>
        <p className="hp-seo-subtitle">
          Book top-rated local performers with zero intercity travel surcharges and 100% Artist Arrival Guarantee across India&apos;s leading hubs.
        </p>
      </div>

      <div className="hp-cities-grid">
        {POPULAR_CITIES_DATA.map((city) => (
          <Link key={city.slug} href={`/city/${city.slug}`} className="hp-city-pill">
            <div className="hp-city-pill-info">
              <span className="hp-city-pill-name">{city.name}</span>
              <span className="hp-city-pill-meta">{city.meta}</span>
            </div>
            <span className="hp-city-pill-arrow">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
