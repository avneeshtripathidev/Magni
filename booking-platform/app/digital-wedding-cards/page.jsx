import React from 'react';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { generateWeddingMetadata, buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';

export const metadata = generateWeddingMetadata({
  title: 'Digital Wedding Cards & E-Invitations | WhatsApp Ready with Maps & RSVP',
  description: 'Create interactive digital wedding invitations with clickable Google Maps venue links, RSVP buttons, and stunning mobile layouts. Fast delivery within 24-48 hours.',
  slug: 'digital-wedding-cards',
  keywords: ['Digital Wedding Cards', 'WhatsApp Wedding Invitation', 'Wedding E Invitation Cards', 'Online Wedding Card Maker', 'Interactive PDF Wedding Card'],
});

export default function DigitalWeddingCardsPage() {
  const structuredData = buildWeddingStructuredData({
    title: 'Digital Wedding Cards & WhatsApp E-Invitations',
    description: 'Interactive digital wedding cards with clickable Google Maps, RSVP buttons, and mobile-first layouts.',
    slug: 'digital-wedding-cards',
  });

  return (
    <WeddingInvitationsView
      pageSlug="digital-wedding-cards"
      h1Title="Interactive Digital Wedding Cards (WhatsApp Ready)"
      subtitle="Eco-friendly, modern digital wedding invitations with turn-by-turn Google Maps navigation and direct WhatsApp RSVP."
      initialCategory="digital-cards"
      structuredData={structuredData}
    />
  );
}
