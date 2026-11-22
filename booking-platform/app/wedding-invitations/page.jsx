import React from 'react';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { generateWeddingMetadata, buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';

export const metadata = generateWeddingMetadata({
  title: 'Wedding Invitations & Digital Wedding Card Design Service',
  description: 'Explore bespoke digital wedding cards, royal video invitations, and traditional Indian wedding stationery. Clickable Google Maps, WhatsApp ready, and express delivery.',
  slug: 'wedding-invitations',
  keywords: ['Luxury Wedding Invitations', 'Digital Wedding Card Design', 'Indian Wedding Invitation Suite', 'WhatsApp Wedding Card'],
});

export default function WeddingInvitationsPage() {
  const structuredData = buildWeddingStructuredData({
    title: 'Wedding Invitations & Digital Wedding Card Design Service',
    description: 'Explore bespoke digital wedding cards, royal video invitations, and traditional Indian wedding stationery.',
    slug: 'wedding-invitations',
  });

  return (
    <WeddingInvitationsView
      pageSlug="wedding-invitations"
      initialCategory="all"
      structuredData={structuredData}
    />
  );
}
