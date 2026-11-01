import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// 1. GET /api/campaigns - List all campaigns
export async function GET(req) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('campaign_offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet in DB; return graceful empty list
      return NextResponse.json({ success: true, campaigns: [], note: error.message });
    }

    return NextResponse.json({ success: true, campaigns: data || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. POST /api/campaigns - Create or Update a campaign
export async function POST(req) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    const {
      id,
      campaign_name,
      campaign_slug,
      headline,
      subheading,
      offer_badge,
      offer_title,
      offer_description,
      advance_amount,
      original_price,
      discount_text,
      cta_text,
      secondary_cta_text,
      terms,
      applicable_categories,
      target_locations,
      target_traffic_source,
      associated_utm_campaign,
      is_active,
      start_date,
      end_date
    } = body;

    if (!campaign_name || !headline) {
      return NextResponse.json({ success: false, error: 'Campaign name and headline are required.' }, { status: 400 });
    }

    const slug = campaign_slug || campaign_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const campaignPayload = {
      campaign_name,
      campaign_slug: slug,
      headline,
      subheading: subheading || '',
      offer_badge: offer_badge || 'LIMITED PERIOD OFFER',
      offer_title: offer_title || `Lock Your Event Booking at Just ₹${advance_amount || 2499}`,
      offer_description: offer_description || '',
      advance_amount: parseFloat(advance_amount) || 2499.00,
      original_price: parseFloat(original_price) || 10000.00,
      discount_text: discount_text || 'Special Promotional Pricing',
      cta_text: cta_text || 'Unlock My Offer & Lock Date',
      secondary_cta_text: secondary_cta_text || 'Explore Event Packages',
      terms: Array.isArray(terms) ? terms : [],
      applicable_categories: Array.isArray(applicable_categories) ? applicable_categories : ['Wedding', 'Birthday', 'Corporate Event'],
      target_locations: Array.isArray(target_locations) ? target_locations : ['All'],
      target_traffic_source: target_traffic_source || 'google_ads',
      associated_utm_campaign: associated_utm_campaign || 'all',
      is_active: is_active ?? true,
      start_date: start_date || new Date().toISOString(),
      end_date: end_date || null,
      updated_at: new Date().toISOString()
    };

    let result;
    if (id) {
      result = await supabase
        .from('campaign_offers')
        .update(campaignPayload)
        .eq('id', id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('campaign_offers')
        .insert([campaignPayload])
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({ success: true, campaign: result.data });
  } catch (error) {
    console.error('[CampaignAdminAPI] Error saving campaign:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 3. DELETE /api/campaigns - Delete campaign
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Campaign ID required' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });

    const { error } = await supabase.from('campaign_offers').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

