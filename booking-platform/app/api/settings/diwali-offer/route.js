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
  leftText: "🎄 Christmas & Wedding Pre-Booking Offer: Get 30%–70% OFF on Live Artists!",
  rightText: "Use Code: XMAS15 →",
  couponCode: "XMAS15",
  discountPercent: 15,
  minBookingValue: 10000,
  campaignName: "Christmas & Wedding Pre-Booking Offer",
  formHeading: "Christmas & Wedding Pre-Booking Offer 🎄💍",
  supportingMessage: "Lock Your 2026–2027 Wedding or Festive Date at Best Price!",
  offerHighlight: "Enjoy 30% to 70% total savings on your live artist booking.",
  ctaText: "UNLOCK MY OFFER & LOCK DATE",
  startDate: "2026-11-01",
  expiryDate: "2027-12-31"
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

    // Sanitize any legacy DIW100 or outdated strings from old database records
    if (parsedConfig.couponCode === 'DIW100' || !parsedConfig.couponCode) {
      parsedConfig.couponCode = 'XMAS15';
    }
    if (parsedConfig.rightText && parsedConfig.rightText.includes('DIW100')) {
      parsedConfig.rightText = 'Use Code: XMAS15 →';
    }
    if (parsedConfig.leftText && (parsedConfig.leftText.includes('Diwali') || parsedConfig.leftText.includes('First Booking'))) {
      parsedConfig.leftText = '🎄 Christmas & Wedding Pre-Booking Offer: Get 30%–70% OFF on Live Artists!';
    }

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

