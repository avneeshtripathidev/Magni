import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      name,
      phone,
      email,
      amount,
      campaignId,
      campaignSlug,
      referenceCode,
      purpose
    } = body;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay API credentials not configured in environment.' },
        { status: 500 }
      );
    }

    // Server-side price resolution and validation
    let finalAmountInRupees = 2499; // Default advance price
    if (amount && Number(amount) > 0) {
      finalAmountInRupees = Number(amount);
    }

    // If campaign identifier is supplied, look up server-side campaign price for validation
    if (campaignId || campaignSlug) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          let q = supabase.from('campaign_offers').select('advance_amount');
          if (campaignId) q = q.eq('id', campaignId);
          else if (campaignSlug) q = q.eq('campaign_slug', campaignSlug);
          const { data: cData } = await q.single();
          if (cData && cData.advance_amount && Number(cData.advance_amount) > 0) {
            finalAmountInRupees = Number(cData.advance_amount);
          }
        } catch (e) {
          // If query fails, proceed with validated amount
        }
      }
    }

    // Convert rupees to paise for Razorpay API (e.g. ₹2499 -> 249900 paise, or ₹2 test -> 200 paise)
    const amountInPaise = Math.round(finalAmountInRupees * 100);

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const orderPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        customer_name: (name || '').slice(0, 40),
        customer_phone: (phone || '').slice(0, 15),
        customer_email: (email || '').slice(0, 40),
        reference_code: (referenceCode || '').slice(0, 30),
        campaign_id: (campaignId || campaignSlug || 'google_ads_advance').slice(0, 30),
        purpose: (purpose || `Lock Event Date Advance (₹${finalAmountInRupees})`).slice(0, 50)
      }
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Razorpay order creation failed:', data);
      return NextResponse.json(
        { error: data.error?.description || 'Failed to create Razorpay order' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      amount: finalAmountInRupees,
      amountInPaise: data.amount,
      currency: data.currency,
      keyId: keyId,
      referenceCode: referenceCode || null
    });
  } catch (error) {
    console.error('Razorpay API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
