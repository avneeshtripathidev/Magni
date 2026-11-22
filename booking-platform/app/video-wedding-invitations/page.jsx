import React from 'react';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { generateWeddingMetadata, buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';

export const metadata = generateWeddingMetadata({
  title: 'Video Wedding Invitations | Full HD 1080p Storytelling Invites',
  description: 'Create memorable wedding invitation videos with custom couple photographs, celebration itineraries, dress codes, and cinematic music. Perfect for WhatsApp stories.',
  slug: 'video-wedding-invitations',
  keywords: ['Wedding Invitation Video', 'Video Wedding Invite', 'Animated Indian Wedding Invitation Video', 'WhatsApp Wedding Video Invite', 'Storytelling Wedding Video'],
});

export default function VideoWeddingInvitationsPage() {
  const structuredData = buildWeddingStructuredData({
    title: 'Full HD 1080p Storytelling Video Wedding Invitations',
    description: 'Cinematic video wedding invitations with couple photos, personalized itineraries, and royalty-free soundtracks.',
    slug: 'video-wedding-invitations',
  });

  return (
    <WeddingInvitationsView
      pageSlug="video-wedding-invitations"
      h1Title="Storytelling Video Wedding Invitations (Full HD 1080p)"
      subtitle="Engaging video invitations showcasing your journey, multi-day function schedules, and celebration dress codes set to soulful music."
      initialCategory="video-invitations"
      structuredData={structuredData}
    />
  );
}
