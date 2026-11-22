import React from 'react';
import WeddingInvitationsView from '@/wedding-invitations/pages/WeddingInvitationsView';
import { generateWeddingMetadata, buildWeddingStructuredData } from '@/wedding-invitations/utils/weddingSeoHelper';

export const metadata = generateWeddingMetadata({
  title: 'Custom Wedding Card Design Services | Professional Wedding Designers',
  description: 'Looking for custom wedding card designers? We create bespoke wedding invitation designs, royal monograms, and print-ready stationery tailored to your wedding decor.',
  slug: 'wedding-card-design',
  keywords: ['Wedding Card Design Services', 'Custom Wedding Invitation Design', 'Online Wedding Card Designer', 'Bespoke Wedding Stationery'],
});

export default function WeddingCardDesignPage() {
  const structuredData = buildWeddingStructuredData({
    title: 'Custom Wedding Card Design Services',
    description: 'Bespoke custom wedding invitation design, royal monograms, and print-ready vector stationery.',
    slug: 'wedding-card-design',
  });

  return (
    <WeddingInvitationsView
      pageSlug="wedding-card-design"
      h1Title="Custom Wedding Card Design Services"
      subtitle="Hand-crafted wedding stationery and bespoke layouts created from scratch by our senior graphic designers."
      initialCategory="royal-wedding"
      structuredData={structuredData}
    />
  );
}
