import React from 'react';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { generateWeddingMetadata, buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';

export const metadata = generateWeddingMetadata({
  title: 'Haldi & Mehendi Invitations | Vibrant Yellow & Henna Card Designs',
  description: 'Bright, festive Haldi and Mehendi ceremony invitations featuring quirky illustrations, marigold flower garlands, dholak beats, and dress code palettes.',
  slug: 'haldi-mehendi-invitations',
  keywords: ['Haldi Mehendi Invitation', 'Mehndi Card Design', 'Haldi Ceremony Card', 'Quirky Indian Wedding Card', 'Yellow Haldi Invite'],
});

export default function HaldiMehendiInvitationsPage() {
  const structuredData = buildWeddingStructuredData({
    title: 'Haldi & Mehendi Ceremony Invitations',
    description: 'Vibrant marigold yellow cards, quirky illustrations, and festive daytime celebration announcements.',
    slug: 'haldi-mehendi-invitations',
  });

  return (
    <WeddingInvitationsView
      pageSlug="haldi-mehendi-invitations"
      h1Title="Haldi & Mehendi Ceremony Invitations"
      subtitle="Bright, festive celebration cards packed with marigold yellow charm, quirky henna artwork, and ceremony dress code guides."
      initialCategory="haldi-mehendi"
      structuredData={structuredData}
    />
  );
}
