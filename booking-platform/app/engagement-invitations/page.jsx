import React from 'react';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { generateWeddingMetadata, buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';

export const metadata = generateWeddingMetadata({
  title: 'Engagement Invitations | Ring Ceremony & Sagai Card Design',
  description: 'Design elegant engagement invitations and ring ceremony cards. Digital and print-ready formats with cocktail party themes and RSVP tracking.',
  slug: 'engagement-invitations',
  keywords: ['Engagement Invitation Card', 'Ring Ceremony Invitation', 'Sagai Card Design', 'Roka Ceremony Card', 'Cocktail Engagement Invite'],
});

export default function EngagementInvitationsPage() {
  const structuredData = buildWeddingStructuredData({
    title: 'Engagement & Ring Ceremony Invitations',
    description: 'Bespoke engagement ceremony cards, cocktail evening themes, and intimate family announcements.',
    slug: 'engagement-invitations',
  });

  return (
    <WeddingInvitationsView
      pageSlug="engagement-invitations"
      h1Title="Engagement & Ring Ceremony Invitations (Sagai & Roka)"
      subtitle="Romantic stationery celebrating your ring exchange, cocktail evening, and family blessings with custom RSVP links."
      initialCategory="engagement"
      structuredData={structuredData}
    />
  );
}
