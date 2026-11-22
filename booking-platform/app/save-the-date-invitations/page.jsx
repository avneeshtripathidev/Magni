import React from 'react';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { generateWeddingMetadata, buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';

export const metadata = generateWeddingMetadata({
  title: 'Save The Date Wedding Invitations | Photo Teaser Cards & Countdown',
  description: 'Announce your wedding date with stylish Save The Date cards, calendar teaser graphics, and photo countdown reels. Delivered in 24 hours.',
  slug: 'save-the-date-invitations',
  keywords: ['Save The Date Wedding Invitation', 'Save The Date Card Design', 'Wedding Countdown Card', 'Pre Wedding Announcement Card', 'Save The Date WhatsApp'],
});

export default function SaveTheDateInvitationsPage() {
  const structuredData = buildWeddingStructuredData({
    title: 'Save The Date Cards & Photo Teaser Announcements',
    description: 'Chic Save The Date invitations with couple photos, calendar highlights, and instant WhatsApp delivery.',
    slug: 'save-the-date-invitations',
  });

  return (
    <WeddingInvitationsView
      pageSlug="save-the-date-invitations"
      h1Title="Save The Date Cards & Countdown Teasers"
      subtitle="Lock your wedding date on your guests’ calendars with eye-catching photo announcement cards and countdown reels."
      initialCategory="save-the-date"
      structuredData={structuredData}
    />
  );
}
