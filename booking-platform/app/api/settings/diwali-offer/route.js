import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

const DEFAULT_SETTINGS = {
  isVisible: true,
  leftText: "🎄 Christmas & Wedding Special! Get 30%–70% OFF",
  rightText: "Use Code: XMAS15 →",
  couponCode: "XMAS15",
  discountPercent: 15,
  minBookingValue: 10000,
  campaignName: "Christmas & Wedding Special",
  formHeading: "Your Festive Offer Is Waiting! 🎄💍",
  supportingMessage: "Make Your Celebration Special, Spend a Little Less!",
  offerHighlight: "Enjoy up to 70% total savings on your live artist booking.",
  ctaText: "CLAIM MY FESTIVE DISCOUNT",
  startDate: "2026-11-01",
  expiryDate: "2026-12-31"
};

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }

  try {
    const { data, error } = await supabase
      .from('top_ad_settings')
      .select('*')
      .eq('id', 3)
      .single();

    if (error || !data) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    let parsedConfig = {};
    try {
      if (data.text_desktop && data.text_desktop.startsWith('{')) {
        parsedConfig = JSON.parse(data.text_desktop);
      }
    } catch (e) {}

    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      ...parsedConfig,
      isVisible: typeof data.is_visible === 'boolean' ? data.is_visible : true,
      updatedAt: data.updated_at
    });
  } catch (err) {
    console.error('[DiwaliOfferAPI] GET error:', err);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(req) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Merge incoming changes
    const updatedConfig = {
      ...DEFAULT_SETTINGS,
      ...body
    };

    const isVisible = typeof body.isVisible === 'boolean' ? body.isVisible : true;
    const jsonStr = JSON.stringify(updatedConfig);

    const { data, error } = await supabase
      .from('top_ad_settings')
      .upsert({
        id: 3,
        is_visible: isVisible,
        text_desktop: jsonStr,
        text_mobile: jsonStr,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...updatedConfig,
        isVisible: data.is_visible
      }
    });
  } catch (err) {
    console.error('[DiwaliOfferAPI] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

