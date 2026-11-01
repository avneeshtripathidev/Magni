import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer_name,
      customer_phone,
      customer_email,
      reference_code,
      referenceCode,
      amount,
      campaign_id,
      campaignId,
      campaign_name,
      campaignName,
      gclid,
      utm_campaign
    } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { error: 'Razorpay secret not configured in environment.' },
        { status: 500 }
      );
    }

    // Verify signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json(
        { error: 'Payment signature verification failed.' },
        { status: 400 }
      );
    }

    const refCode = reference_code || referenceCode || `MAG-${Date.now().toString().slice(-6)}`;
    const paidAmount = Number(amount) > 0 ? Number(amount) : 2499.00;
    const activeCampaignId = campaign_id || campaignId || 'google_ads_offer';
    const activeCampaignName = campaign_name || campaignName || 'Google Ads Advance Booking';

    const supabase = getSupabaseAdmin();

    // 1. Insert into dedicated payments table (Idempotent: payment_id is UNIQUE)
    if (supabase) {
      try {
        await supabase.from('payments').insert([
          {
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            signature: razorpay_signature,
            amount: paidAmount,
            currency: 'INR',
            status: 'captured',
            customer_name: customer_name || '',
            customer_phone: customer_phone || '',
            customer_email: customer_email || '',
            reference_code: refCode,
            notes: `₹${paidAmount} Advance Payment Date-Lock [${activeCampaignName}]`,
            gateway: 'razorpay'
          }
        ]);
      } catch (payDbErr) {
        console.warn('[VerifyPayment] Payments table note:', payDbErr.message);
      }
    }

    // 2. Update existing booking or insert confirmed booking
    if (supabase) {
      try {
        // Try to update existing lead with this referenceCode
        const { data: updatedBooking, error: updateErr } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            advance_amount: paidAmount,
            payment_id: razorpay_payment_id,
            notes: `[ADVANCE PAYMENT VERIFIED VIA RAZORPAY ₹${paidAmount}] Payment ID: ${razorpay_payment_id}, Order ID: ${razorpay_order_id}. Date locked under ${activeCampaignName}.`,
            updated_at: new Date().toISOString()
          })
          .eq('reference_code', refCode)
          .select();

        // If no row updated, insert new confirmed booking
        if (!updatedBooking || updatedBooking.length === 0 || updateErr) {
          await supabase.from('bookings').insert([
            {
              client_name: customer_name || 'Event Host',
              client_phone: customer_phone || '',
              client_email: customer_email || '',
              event_type: 'Event Booking (Advance Confirmed)',
              budget: paidAmount,
              notes: `[ADVANCE PAYMENT VERIFIED VIA RAZORPAY ₹${paidAmount}] Payment ID: ${razorpay_payment_id}, Order ID: ${razorpay_order_id}. Date locked under ${activeCampaignName}.`,
              status: 'confirmed',
              booking_source: 'Google Ads Offer Instant Form',
              source_form: 'GoogleAdsOfferInstantForm',
              reference_code: refCode,
              advance_amount: paidAmount,
              payment_status: 'paid',
              payment_id: razorpay_payment_id,
              campaign_id: activeCampaignId,
              campaign_name: activeCampaignName,
              gclid: gclid || null,
              utm_campaign: utm_campaign || null
            }
          ]);
        }
      } catch (bookDbErr) {
        console.warn('[VerifyPayment] Bookings table note:', bookDbErr.message);
      }
    }

    // 3. Record Funnel Events: 'advance_payment_success' and 'booking_confirmed'
    if (supabase) {
      try {
        const events = [
          {
            event_name: 'advance_payment_success',
            campaign_id: activeCampaignId,
            campaign_name: activeCampaignName,
            reference_code: refCode,
            gclid: gclid || null,
            utm_campaign: utm_campaign || null,
            metadata: {
              orderId: razorpay_order_id,
              paymentId: razorpay_payment_id,
              amount: paidAmount,
              customerName: customer_name
            }
          },
          {
            event_name: 'booking_confirmed',
            campaign_id: activeCampaignId,
            campaign_name: activeCampaignName,
            reference_code: refCode,
            gclid: gclid || null,
            utm_campaign: utm_campaign || null,
            metadata: {
              paymentId: razorpay_payment_id,
              amount: paidAmount,
              dateLocked: true
            }
          }
        ];

        await supabase.from('campaign_funnel_events').insert(events);
      } catch (evErr) {}

      // Also record in analytics table
      try {
        await supabase.from('analytics').insert([{
          path: '/advance-payment-success',
          type: 'advance_payment_success',
          details: {
            isAd: true,
            conversionEvent: 'advance_payment_success',
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            amount: paidAmount,
            referenceCode: refCode,
            campaignName: activeCampaignName
          }
        }]);
      } catch (aErr) {}
    }

    return NextResponse.json({
      success: true,
      message: 'Advance payment verified and event date confirmed!',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      referenceCode: refCode,
      amount: paidAmount
    });
  } catch (error) {
    console.error('Payment verification API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
