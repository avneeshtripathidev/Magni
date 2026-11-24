import HeroSection from '@/app/components/home/HeroSection'
import HeroVideosSection from '@/app/components/home/HeroVideosSection'
import TopPerformerSection from '@/app/components/home/TopPerformerSection'
import FeaturedArtistsSection from '@/app/components/home/FeaturedArtistsSection'
import { OccasionsSection, CategoriesSection, PopularCitiesSection } from '@/app/components/home/HomeSeoSections'
import WhyChooseSection from '@/app/components/home/WhyChooseSection'
import HowToBookSection from '@/app/components/home/HowToBookSection'
import TestimonialsSection from '@/app/components/home/TestimonialsSection'
import FaqSection from '@/app/components/home/FaqSection'
import ContactSection from '@/app/components/home/ContactSection'
import SeoCardsSection from '@/app/components/home/SeoCardsSection'
import SectionDivider from '@/app/components/common/SectionDivider'
import '@/app/styles/pages/HomePage.css'

export const metadata = {
  title: 'Book Singer Online | Live Singers, Bands & DJs for Events | Magnevents',
  description: 'Book verified live singers for weddings, house parties, and corporate events across India. Hire Bollywood singers, Sufi ensembles, DJs, and live bands with direct pricing and 0% agency fees.',
  keywords: [
    'Book Singer Online',
    'Live Singer Booking',
    'Singer for Events',
    'Artist Booking Platform India',
    'Book Artists for Events',
    'Live Music Booking',
    'Book Live Band',
    'Hire Musicians for Events',
    'Event Entertainment Booking',
    'Singer for Wedding',
    'Live Band for Wedding',
    'Bollywood Singer for Wedding',
    'Sufi Singer for Wedding',
    'Wedding Musician Booking',
    'Live Music for Sangeet',
    'Wedding DJ Booking',
    'Singer for Birthday Party',
    'Singer for House Party',
    'Live Music for Private Parties',
    'DJ for Birthday Party',
    'Acoustic Singer for Private Events',
    'Ghazal Singer for Private Party',
    'Singer for Corporate Events',
    'Live Band for Corporate Events',
    'Corporate Event Entertainment',
    'Musicians for Corporate Parties',
    'Professional Event Performers',
    'Bollywood Singer Booking',
    'Punjabi Singer Booking',
    'Sufi Singer Booking',
    'Ghazal Singer Booking',
    'Live Band Booking',
    'DJ Booking',
    'Instrumentalist Booking',
    'Event Anchor Booking',
    'Stand-up Comedian Booking'
  ],
  alternates: {
    canonical: 'https://www.magnevents.in',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Book Singer Online | Live Singers, Bands & DJs for Events | Magnevents',
    description: 'Book verified live singers for weddings, house parties, and corporate events across India. Direct artist booking with 0% agency fees & 100% Artist Arrival Guarantee.',
    url: 'https://www.magnevents.in',
    siteName: 'Magnevents',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Magnevents - Premium Live Artist Booking Platform'
      }
    ],
    locale: 'en_IN',
    type: 'website'
  }
};

export const revalidate = 86400; // Cache on Edge CDN for instant loading

export default function HomePage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Magnevents",
    "url": "https://www.magnevents.in",
    "logo": "https://www.magnevents.in/logo.webp",
    "sameAs": [
      "https://www.instagram.com/magnevents.in?igsh=MXY2NmtjMm82bTFnaA==",
      "https://facebook.com/magnevents"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="hp">
        <HeroSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <HeroVideosSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <TopPerformerSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <FeaturedArtistsSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <WhyChooseSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <HowToBookSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <TestimonialsSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <FaqSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <ContactSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <OccasionsSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <CategoriesSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <PopularCitiesSection />
        <SectionDivider className="hp-section-divider--mobile-only" />
        <SeoCardsSection />
      </div>

    </>
  )
}
