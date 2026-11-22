import React from 'react';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { generateWeddingMetadata, buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';

export const metadata = generateWeddingMetadata({
  title: 'Animated Wedding Invitations | Motion Graphics E-Cards with Music',
  description: 'Dazzle your guests with animated wedding invitation cards. Features falling floral petals, romantic reveal effects, and synchronized background shehnai music.',
  slug: 'animated-wedding-invitations',
  keywords: ['Animated Wedding Invitation', 'Motion Wedding Card', 'Animated Indian Wedding Invitation Video', 'GIF Wedding Invite', 'Music Wedding Invitation'],
});

export default function AnimatedWeddingInvitationsPage() {
  const structuredData = buildWeddingStructuredData({
    title: 'Animated Wedding Invitations & Motion Graphics Suites',
    description: 'Dynamic animated wedding invitations with falling floral petals, romantic motion graphics, and background music.',
    slug: 'animated-wedding-invitations',
  });

  return (
    <WeddingInvitationsView
      pageSlug="animated-wedding-invitations"
      h1Title="Animated Wedding Invitations (Motion Graphics E-Cards)"
      subtitle="Captivating motion graphics, romantic text transitions, and synchronized instrumental music tailored for WhatsApp & Instagram."
      initialCategory="animated-invites"
      structuredData={structuredData}
    />
  );
}
