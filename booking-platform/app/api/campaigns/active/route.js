import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// Built-in resilient fallback campaigns ensuring zero downtime
const DEFAULT_CAMPAIGNS = [
  {
    id: 'diwali-special-2026',
    campaign_name: 'Christmas & Wedding Pre-Booking Offer',
    campaign_slug: 'festive-prebooking',
    headline: 'Your Dream Event Starts Here!',
    subheading: 'Book your event now and unlock 30% to 70% off with exclusive seasonal benefits.',
    offer_badge: 'CHRISTMAS & WEDDING PRE-BOOKING OFFER',
    offer_title: 'Lock Your Event Booking at Just ₹2,499',
    offer_description: 'Special Festive Booking Benefits: 100% Artist Arrival Guarantee, Complimentary Soundcheck Pass & Zero Broker Commission.',
    advance_amount: 2499.00,
    original_price: 10000.00,
    discount_text: 'FESTIVE & PRE-BOOKING DEAL',
    cta_text: 'Unlock My Offer & Lock Date',
    secondary_cta_text: 'Explore Event Packages',
    terms: [
      'Advance payment locks your event date & artist category instantly.',
      'Advance amount is 100% adjusted against the final event booking quote.',
      'Free date rescheduling up to 7 days prior to the event.',
      'Full refund if requested artist availability cannot be confirmed.'
    ],
    applicable_categories: ['Wedding', 'Engagement', 'Birthday', 'Corporate Event', 'Anniversary', 'Private Party', 'Other'],
    target_locations: ['All'],
    target_traffic_source: 'google_ads',
    associated_utm_campaign: 'all',
    is_active: true
  },
  {
    id: 'wedding-season-2026',
    campaign_name: 'Wedding Season Offer',
    campaign_slug: 'wedding-season',
    headline: 'Make Your Wedding Unforgettable!',
    subheading: 'Reserve verified singers, live bands & DJs with zero broker markup.',
    offer_badge: 'WEDDING SPECIAL',
    offer_title: 'Lock Your Wedding Artist at Just ₹2,999',
    offer_description: 'Exclusive Wedding Season Package: Guaranteed arrival, backup artist priority, and personal concierge.',
    advance_amount: 2999.00,
    original_price: 15000.00,
    discount_text: 'Flat 50% OFF Artist Coordination Fee',
    cta_text: 'Lock My Wedding Date',
    secondary_cta_text: 'Explore Wedding Artists',
    terms: [
      'Valid across all wedding ceremonies (Sangeet, Cocktail, Reception).',
      '100% advance amount credited towards final artist payment.',
      'Priority backup artist guarantee included at zero extra cost.',
      'Full transparent refund policy.'
    ],
    applicable_categories: ['Wedding', 'Engagement', 'Anniversary'],
    target_locations: ['All'],
    target_traffic_source: 'google_ads',
    associated_utm_campaign: 'wedding',
    is_active: false
  },
  {
    id: 'google-ads-default',
    campaign_name: 'Special Google Ads Offer',
    campaign_slug: 'google-ads-default',
    headline: 'Your Dream Event Starts Here!',
    subheading: 'Exclusive promotional booking incentives for our Google visitors.',
    offer_badge: 'GOOGLE SPECIAL OFFER',
    offer_title: 'Lock Your Event Booking at Just ₹2,000',
    offer_description: 'Book verified live artists directly with transparent pricing and zero middlemen markups.',
    advance_amount: 2000.00,
    original_price: 8000.00,
    discount_text: 'Save Up to 60% with Instant Date Lock',
    cta_text: 'Unlock My Offer Now',
    secondary_cta_text: 'Explore Event Packages',
    terms: [
      'Advance payment locks your date instantly.',
      '100% of advance adjusted in final invoice.',
      'Zero broker commissions guaranteed.',
      'Full refund if date cannot be confirmed.'
    ],
    applicable_categories: ['Wedding', 'Engagement', 'Birthday', 'Corporate Event', 'Anniversary', 'Private Party', 'Other'],
    target_locations: ['All'],
    target_traffic_source: 'google_ads',
    associated_utm_campaign: 'all',
    is_active: false
  }
];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const utmCampaign = (searchParams.get('utm_campaign') || '').toLowerCase();
    const city = (searchParams.get('city') || '').toLowerCase();
    const slug = searchParams.get('slug');

    const supabase = getSupabase();

    if (supabase) {
      try {
        let query = supabase
          .from('campaign_offers')
          .select('*')
          .eq('is_active', true);

        if (slug) {
          query = query.eq('campaign_slug', slug);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          // If utm_campaign provided, try finding matching campaign
          if (utmCampaign) {
            const matched = data.find(c => 
              c.associated_utm_campaign && 
              c.associated_utm_campaign.toLowerCase() !== 'all' &&
              utmCampaign.includes(c.associated_utm_campaign.toLowerCase())
            );
            if (matched) {
              return NextResponse.json({ success: true, campaign: matched, source: 'database_matched' });
            }
          }

          // Return the first active campaign
          return NextResponse.json({ success: true, campaign: data[0], source: 'database' });
        }
      } catch (dbErr) {
        console.warn('[CampaignAPI] DB query note:', dbErr.message);
      }
    }

    // Fallback to in-memory active default campaign
    let selected = DEFAULT_CAMPAIGNS[0];
    if (utmCampaign.includes('wedding')) {
      selected = DEFAULT_CAMPAIGNS[1] || selected;
    }

    return NextResponse.json({
      success: true,
      campaign: selected,
      source: 'fallback_default'
    });
  } catch (error) {
    console.error('[CampaignAPI] Error:', error);
    return NextResponse.json({
      success: true,
      campaign: DEFAULT_CAMPAIGNS[0],
      source: 'emergency_fallback'
    });
  }
}

