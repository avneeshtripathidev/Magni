import React from 'react';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { generateWeddingMetadata, buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';

export const metadata = generateWeddingMetadata({
  title: 'Traditional Wedding Card Design | Heritage Indian Wedding Patrika',
  description: 'Timeless traditional Indian wedding card designs featuring Vedic shlokas, royal palace borders, Ganesha blessings, and 300 DPI print-ready vector PDF files.',
  slug: 'traditional-wedding-cards',
  keywords: ['Traditional Wedding Card Design', 'Indian Wedding Patrika', 'Hindu Wedding Card Design', 'Heritage Wedding Card', 'Print Ready Wedding Card'],
});

export default function TraditionalWeddingCardsPage() {
  const structuredData = buildWeddingStructuredData({
    title: 'Traditional Wedding Card Design & Print Suite',
    description: 'Auspicious traditional Indian wedding cards with Sanskrit shlokas, temple borders, and vector print-ready files.',
    slug: 'traditional-wedding-cards',
  });

  return (
    <WeddingInvitationsView
      pageSlug="traditional-wedding-cards"
      h1Title="Traditional Indian Wedding Card Design (Lagna Patrika)"
      subtitle="Timeless cultural elegance, Sanskrit blessings, family pedigree layouts, and vector print-ready files for luxury paper printing."
      initialCategory="traditional-cards"
      structuredData={structuredData}
    />
  );
}
