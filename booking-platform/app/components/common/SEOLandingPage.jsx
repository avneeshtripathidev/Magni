"use client";

import SEODynamicContent from '@/app/components/common/SEODynamicContent';
import SEOLandingHero from '@/app/components/common/SEOLandingHero';
import ContactSection from '@/app/components/home/ContactSection';
import SectionDivider from '@/app/components/common/SectionDivider';
import '@/app/styles/pages/HomePage.css';

export default function SEOLandingPage({ 
  locationSlug,
  heroTitle, 
  heroSubtitle, 
  schema, 
  category, 
  city,
  subCategory,
  topArtists = [],
  overviewHtml,
  services,
  faqs,
  relatedLinks
}) {
  const rawSlug = locationSlug || '';
  const slugNormalized = decodeURIComponent(rawSlug).toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/\/+$/, '');
  const isDJ = (category || '').toLowerCase().includes('dj') || slugNormalized.includes('dj') || (heroTitle || '').toLowerCase().includes('dj');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className={`hp ${isDJ ? 'hp-dj-night-theme' : ''}`}>
        {/* Luxury Hero with Interactive Booking Engine, Top 5 Verified Artists, & Experience the Vibe Videos */}
        <SEOLandingHero
          heroTitle={heroTitle}
          heroSubtitle={heroSubtitle}
          category={category}
          city={city}
          subCategory={subCategory}
          topArtists={topArtists}
          isSpecialTokenPage={true}
          locationSlug={slugNormalized}
        />

        <SectionDivider />

        {overviewHtml && faqs && relatedLinks ? (
          <>
            <SEODynamicContent 
              category={category}
              city={city}
              overviewHtml={overviewHtml}
              faqs={faqs}
              relatedLinks={relatedLinks}
            />
            <SectionDivider />
          </>
        ) : null}

        <ContactSection />
      </div>
    </>
  );
}
