import React from 'react';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { generateWeddingMetadata, buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';

export const metadata = generateWeddingMetadata({
  title: 'Wedding Reception Invitations | Gala Night & Banquet Card Design',
  description: 'Sophisticated wedding reception invitations featuring midnight blue, champagne gold art-deco borders, live music program timelines, and banquet valet maps.',
  slug: 'reception-invitations',
  keywords: ['Reception Invitation Card', 'Wedding Reception Invite', 'Grand Gala Wedding Card', 'Banquet Invitation Design', 'Cocktail Reception Card'],
});

export default function ReceptionInvitationsPage() {
  const structuredData = buildWeddingStructuredData({
    title: 'Wedding Reception Invitations & Gala Evening Suites',
    description: 'Black-tie and evening banquet reception invitations with champagne accents, dinner programs, and valet navigation.',
    slug: 'reception-invitations',
  });

  return (
    <WeddingInvitationsView
      pageSlug="reception-invitations"
      h1Title="Wedding Reception Invitations (Grand Gala Night)"
      subtitle="Sophisticated evening banquet themes featuring champagne gold art-deco borders, program timelines, and banquet map directions."
      initialCategory="reception"
      structuredData={structuredData}
    />
  );
}
