import { redirect } from 'next/navigation';
import { supabase } from '@database/connection/supabase';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import SEOArtistsGrid from '@/app/components/common/SEOArtistsGrid';
import { CityQuickSearch, CitySpecialistButton } from '@/app/components/city/CityQuickSearch';
import { MAJOR_CITIES, getCityBySlug } from '@/app/utils/seoUrlParser';
import { getTopArtistsForSEO } from '@/app/utils/fetchTopArtists';
import '../../seo-pages.css';

const DIRECTORY_CITIES = [
  { name: 'Delhi NCR', slug: 'delhi' },
  { name: 'Noida', slug: 'noida' },
  { name: 'Gurgaon', slug: 'gurgaon' },
  { name: 'Ghaziabad', slug: 'ghaziabad' },
  { name: 'Mumbai', slug: 'mumbai' },
  { name: 'Bengaluru', slug: 'bangalore' },
  { name: 'Hyderabad', slug: 'hyderabad' },
  { name: 'Pune', slug: 'pune' },
  { name: 'Kolkata', slug: 'kolkata' },
  { name: 'Ahmedabad', slug: 'ahmedabad' },
  { name: 'Gandhinagar', slug: 'gandhinagar' },
  { name: 'Jaipur', slug: 'jaipur' },
  { name: 'Udaipur', slug: 'udaipur' },
  { name: 'Chandigarh', slug: 'chandigarh' },
  { name: 'Lucknow', slug: 'lucknow' },
  { name: 'Bareilly', slug: 'bareilly' },
  { name: 'Goa', slug: 'goa' },
  { name: 'Indore', slug: 'indore' },
  { name: 'Bhopal', slug: 'bhopal' },
  { name: 'Surat', slug: 'surat' },
  { name: 'Varanasi', slug: 'varanasi' },
  { name: 'Bhubaneswar', slug: 'bhubaneswar' },
  { name: 'Patna', slug: 'patna' },
  { name: 'Agra', slug: 'agra' },
  { name: 'Kanpur', slug: 'kanpur' },
  { name: 'Dehradun', slug: 'dehradun' },
  { name: 'Guwahati', slug: 'guwahati' },
  { name: 'Ranchi', slug: 'ranchi' },
  { name: 'Coimbatore', slug: 'coimbatore' },
  { name: 'Kochi', slug: 'kochi' },
  { name: 'Amritsar', slug: 'amritsar' },
  { name: 'Raipur', slug: 'raipur' },
  { name: 'Vadodara', slug: 'vadodara' },
  { name: 'Nagpur', slug: 'nagpur' },
];

function slugToName(slug) {
  if (slug === 'delhi-ncr') return 'Delhi NCR';
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const revalidate = 86400; // Cache at Edge CDN for 24 hours

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const { city_slug } = awaitedParams;
  const normalizedCitySlug = (city_slug || '').toLowerCase().trim();

  let city = null;
  try {
    const { data } = await supabase
      .from('seo_cities')
      .select('*')
      .eq('slug', normalizedCitySlug)
      .eq('is_active', true)
      .single();
    city = data;
  } catch (err) {
    console.error('Error in city generateMetadata:', err);
  }

  const isKnownCity = Boolean(city || MAJOR_CITIES.includes(normalizedCitySlug));
  if (!isKnownCity) {
    return {
      title: 'Browse Live Artists | Magnevents',
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    };
  }

  const matchedCity = getCityBySlug(normalizedCitySlug);
  const cityName = city?.name || matchedCity?.name || slugToName(normalizedCitySlug);
  const title = city?.seo_title || `Book Live Singers, DJs & Bands in ${cityName} | Magnevents`;
  const description =
    city?.meta_description ||
    `Book verified live singers, bands, and wedding DJs in ${cityName} starting from ₹5,999. Direct artist booking with 0% commission & 100% Artist Arrival Guarantee.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/city/${normalizedCitySlug}`,
    },
    openGraph: {
      title,
      description,
      url: `/city/${normalizedCitySlug}`,
      siteName: 'Magnevents',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `Live Artist Booking in ${cityName} - Magnevents`,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.jpg'],
    },
  };
}

export default async function CityLandingPage({ params }) {
  const awaitedParams = await params;
  const { city_slug } = awaitedParams;
  const normalizedCitySlug = (city_slug || '').toLowerCase().trim();

  if (city_slug !== normalizedCitySlug) {
    redirect(`/city/${normalizedCitySlug}`);
  }

  // 1. Fetch City
  let city = null;
  try {
    const { data } = await supabase
      .from('seo_cities')
      .select('*')
      .eq('slug', normalizedCitySlug)
      .eq('is_active', true)
      .single();
    city = data;
  } catch (err) {
    console.error('Error fetching city landing page data:', err);
  }

  const isKnownCity = Boolean(city || MAJOR_CITIES.includes(normalizedCitySlug));
  if (!isKnownCity) {
    redirect('/artists');
  }

  // 1b. Fallback if city not in database
  if (!city) {
    const matchedCity = getCityBySlug(normalizedCitySlug);
    city = {
      id: null,
      name: matchedCity?.name || slugToName(normalizedCitySlug),
      state: matchedCity?.state || '',
      slug: normalizedCitySlug,
      seo_title: '',
      meta_description: '',
      h1: '',
      content: '',
    };
  }

  // 2. Fetch SEO Blogs & Fallback Top Artists for this city in parallel
  const [blogsResult, topArtists] = await Promise.all([
    city.id
      ? supabase
          .from('seo_blogs')
          .select('title, slug, created_at, featured_image_url')
          .eq('city_id', city.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    getTopArtistsForSEO({
      category: 'All',
      city: city.name,
      limit: 8,
    }),
  ]);
  const blogs = blogsResult?.data || [];

  // 3. City FAQs & Schema Markup
  const cityFaqs = [
    {
      q: `How much does it cost to book a live singer or band in ${city.name}?`,
      a: `Verified solo singers and acoustic guitarists in ${city.name} typically start from ₹5,999 to ₹15,000 for house parties. Full 4-piece to 6-piece live bands and wedding orchestras range between ₹25,000 and ₹1,50,000+, depending on duration and stage production rider.`
    },
    {
      q: `How does artist arrival and sound setup work in ${city.name}?`,
      a: `Every booking in ${city.name} is covered by our 100% Artist Arrival Guarantee. Performers arrive 90 to 120 minutes prior to showtime for thorough soundchecks. Full sound engineering and acoustic management are coordinated directly with your venue.`
    },
    {
      q: `Can I book Bollywood singers, Sufi ensembles, and wedding DJs in ${city.name}?`,
      a: `Yes! Magnevents manages a curated local roster in ${city.name} spanning Bollywood playback vocalists, soulful Sufi qawwals, Punjabi folk singers, wedding DJs, corporate anchors, and instrumentalists.`
    },
    {
      q: `How do I confirm a booking for my event in ${city.name}?`,
      a: `Search available artists in ${city.name}, listen to showreels, review transparent prices, and submit your event date. Our concierge confirms availability within 2-6 hours and issues a direct booking agreement with 0% agency fees.`
    }
  ];

  const cityCategoryLinks = [
    { label: `Bollywood Singers in ${city.name}`, href: `/bollywood-singer-in-${city.slug}` },
    { label: `Sufi Singers in ${city.name}`, href: `/sufi-singer-in-${city.slug}` },
    { label: `Live Bands in ${city.name}`, href: `/live-band-in-${city.slug}` },
    { label: `Wedding DJs in ${city.name}`, href: `/wedding-dj-in-${city.slug}` },
    { label: `House Party Singers in ${city.name}`, href: `/singer-for-house-party-in-${city.slug}` },
    { label: `Corporate Musicians in ${city.name}`, href: `/corporate-musician-in-${city.slug}` },
  ];

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: city.seo_title || `Hire Singers in ${city.name}`,
      description: city.meta_description || `Book live singers in ${city.name}`,
      url: `https://www.magnevents.in/city/${city.slug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `Live Artist Booking in ${city.name}`,
      serviceType: 'Live Entertainment Booking',
      provider: {
        '@type': 'EntertainmentBusiness',
        name: 'Magnevents',
        url: 'https://www.magnevents.in',
      },
      areaServed: {
        '@type': 'City',
        name: city.name,
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: '5999',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: cityFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.magnevents.in',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: city.name,
          item: `https://www.magnevents.in/city/${city.slug}`,
        },
      ],
    },
  ];

  const otherCities = DIRECTORY_CITIES.filter(
    (c) => c.slug !== city.slug && c.name.toLowerCase() !== city.name.toLowerCase()
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="city-landing-page">
        {/* 1. Clean Editorial Hero */}
        <header className="city-hero">
          <div className="city-hero-inner">
            <div className="city-hero-left">
              <nav className="city-breadcrumb" aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/artists">Cities</Link>
                <span aria-hidden="true">/</span>
                <span className="city-breadcrumb-current">{city.name}</span>
              </nav>

              <h1>
                {city.h1 || (
                  <>
                    Book live singers, bands &amp; DJs in{' '}
                    <span className="city-title-accent">{city.name}</span>
                  </>
                )}
              </h1>

              <p className="city-subtitle">
                Browse vetted performers, compare direct artist pricing, and confirm bookings for weddings, corporate events, and private gatherings in {city.name}.
              </p>

              <CityQuickSearch cityName={city.name} citySlug={city.slug} />
            </div>

            <aside className="city-summary-panel" aria-label="Booking overview">
              <div className="city-summary-head">
                <span className="city-summary-kicker">0% Commission · Verified Roster</span>
                <h2>Direct booking in {city.name}</h2>
                <p>No agency middlemen. Transparent quotes before you pay.</p>
              </div>

              <dl className="city-summary-list">
                <div className="city-summary-row">
                  <dt>Starting fee</dt>
                  <dd className="city-summary-price">₹5,999 onwards</dd>
                </div>
                <div className="city-summary-row">
                  <dt>Booking fee</dt>
                  <dd>0% agency markup</dd>
                </div>
                <div className="city-summary-row">
                  <dt>Reliability</dt>
                  <dd>100% arrival guarantee</dd>
                </div>
                <div className="city-summary-row">
                  <dt>Coordination</dt>
                  <dd>Sound &amp; rider support included</dd>
                </div>
              </dl>

              <div className="city-summary-actions">
                <Link href="/artists" className="city-summary-primary-btn">
                  Browse all artists
                </Link>
                <CitySpecialistButton cityName={city.name} />
              </div>
            </aside>
          </div>
        </header>

        {/* 2. Dark Soft Charcoal Showcase Band: Verified Live Artists */}
        <section className="city-artists-band" aria-label={`Available artists in ${city.name}`}>
          <div className="city-band-inner">
            <div className="city-artists-section">
              <SEOArtistsGrid category="All" city={city.name} fallbackArtists={topArtists} />
            </div>
          </div>
        </section>

        <div className="city-content-container">
          {/* 3. Practical Booking Guide on Warm Ivory */}
          <section className="city-guide-section">
            {city.content ? (
              <div
                className="seo-content"
                dangerouslySetInnerHTML={{ __html: city.content }}
              />
            ) : (
              <div className="city-guide-grid">
                <div className="city-guide-narrative">
                  <h2>How live artist booking works in {city.name}</h2>
                  <p>
                    Booking live music for an event in {city.name} usually means dealing with unclear agency markups and last-minute cancellations. Magnevents connects you directly with verified solo singers, acoustic duos, full wedding bands, and DJs with upfront pricing.
                  </p>
                  <p>
                    Once you shortlist performers, our team confirms date availability, coordinates sound and stage rider requirements with your venue, and secures your booking with milestone-based payment protection.
                  </p>
                </div>

                <div className="city-formats-panel">
                  <h3>Common event formats</h3>
                  <ul className="city-formats-list">
                    <li>
                      <strong>Weddings &amp; Sangeet</strong>
                      <span>Acoustic singers for mehendi, Sufi ensembles, or full Bollywood bands (90–180 mins).</span>
                    </li>
                    <li>
                      <strong>Corporate dinners &amp; offsites</strong>
                      <span>Instrumentalists, lounge vocalists, and club DJs suited for hotel ballrooms and venues.</span>
                    </li>
                    <li>
                      <strong>Private parties &amp; house gatherings</strong>
                      <span>Unplugged solo or duo setups with compact sound gear for intimate 25–100 guest events.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* 4. City Guides (only when real published articles exist) */}
          {blogs.length > 0 && (
            <section className="blogs-section">
              <div className="city-section-heading">
                <h2>Event guides for {city.name}</h2>
                <Link href="/blog-post" className="city-section-link">
                  All articles
                </Link>
              </div>

              <div className="blogs-grid">
                {blogs.map((blog, idx) => (
                  <Link href={`/city/${city.slug}/blog/${blog.slug}`} key={idx} className="blog-card">
                    {blog.featured_image_url && (
                      <div className="blog-card-img">
                        <img src={blog.featured_image_url} alt={blog.title} />
                      </div>
                    )}
                    <div className="blog-card-content">
                      <h3>{blog.title}</h3>
                      <span className="read-more">Read guide</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Popular Categories in this City */}
          <section className="city-categories-section" style={{ margin: '40px 0' }}>
            <div className="city-section-heading">
              <div>
                <h2>Popular artist categories in {city.name}</h2>
                <p className="city-section-sub">
                  Find specialized live singers, Bollywood bands, and wedding DJs performing locally in {city.name}.
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              marginTop: '16px'
            }}>
              {cityCategoryLinks.map((cat, idx) => (
                <Link
                  key={idx}
                  href={cat.href}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FAF7F2',
                    fontSize: '13px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{cat.label}</span>
                  <span style={{ color: '#E8B943' }}>→</span>
                </Link>
              ))}
            </div>
          </section>

          {/* City FAQs with rich question & answer layout */}
          <section className="city-faqs-section" style={{ margin: '48px 0' }}>
            <div className="city-section-heading">
              <div>
                <h2>Frequently asked questions about booking in {city.name}</h2>
                <p className="city-section-sub">
                  Essential booking details, pricing transparency, and artist logistics for events in {city.name}.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
              {cityFaqs.map((faq, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '18px 20px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#FAF7F2', margin: '0 0 8px' }}>
                    {faq.q}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'rgba(245, 240, 233, 0.72)', lineHeight: 1.5, margin: 0 }}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Other Cities Directory (clean, understated link grid) */}
          <section className="city-directory-section" aria-label="Other Indian cities">
            <div className="city-section-heading">
              <div>
                <h2>Other cities we serve</h2>
                <p className="city-section-sub">
                  Verified performers and touring acts available across major Indian cities.
                </p>
              </div>
              <Link href="/artists" className="city-section-link">
                View full roster
              </Link>
            </div>

            <div className="city-directory-grid">
              {otherCities.map((item) => (
                <Link key={item.slug} href={`/city/${item.slug}`} className="city-directory-link">
                  <span>{item.name}</span>
                  <ChevronRight size={14} className="city-directory-arrow" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
