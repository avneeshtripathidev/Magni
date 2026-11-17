import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawCoupon = (body.couponCode || body.coupon || '').trim().toUpperCase();
    const rawAmount = Number(body.bookingAmount || body.amount || 0);

    // Currently active coupon definition
    const ACTIVE_COUPONS = {
      'FIRST15': {
        code: 'FIRST15',
        discountPercent: 15,
        minBookingValue: 10000,
        campaign: 'First Booking Welcome Offer',
        description: 'Extra 15% OFF on your first event booking.'
      },
      'WELCOME15': {
        code: 'WELCOME15',
        discountPercent: 15,
        minBookingValue: 10000,
        campaign: 'First Booking Welcome Offer',
        description: 'Extra 15% OFF on your first event booking.'
      },
      'SHAADI15': {
        code: 'SHAADI15',
        discountPercent: 15,
        minBookingValue: 10000,
        campaign: 'First Booking Welcome Offer',
        description: 'Extra 15% OFF on your event booking.'
      },
      'UTSAV15': {
        code: 'UTSAV15',
        discountPercent: 15,
        minBookingValue: 10000,
        campaign: 'Shaadi Season & Wedding Pre-Booking Offer',
        description: 'Extra 15% OFF on Shaadi season & wedding pre-bookings.'
      },
      'XMAS15': {
        code: 'XMAS15',
        discountPercent: 15,
        minBookingValue: 10000,
        campaign: 'Christmas & Wedding Pre-Booking Offer',
        description: 'Extra 15% OFF on Christmas & Wedding pre-bookings.'
      },
      'DIW100': {
        code: 'DIW100',
        discountPercent: 10,
        minBookingValue: 10000,
        campaign: 'Festive Special',
        description: 'Extra 10% OFF on event bookings of ₹10,000 or more.'
      }
    };

    if (!rawCoupon) {
      return NextResponse.json({
        valid: false,
        error: 'Please enter a coupon code.'
      }, { status: 400 });
    }

    const coupon = ACTIVE_COUPONS[rawCoupon];

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        couponCode: rawCoupon,
        error: 'Invalid or expired coupon code. Use FIRST15 for 15% Extra OFF on your first booking.'
      }, { status: 200 });
    }

    // Check minimum booking value eligibility
    if (rawAmount > 0 && rawAmount < coupon.minBookingValue) {
      return NextResponse.json({
        valid: false,
        couponCode: coupon.code,
        discountPercent: coupon.discountPercent,
        minBookingValue: coupon.minBookingValue,
        originalAmount: rawAmount,
        discountAmount: 0,
        finalAmount: rawAmount,
        error: `Minimum booking value of ₹${coupon.minBookingValue.toLocaleString('en-IN')} required to claim this offer.`,
        isBelowMinimum: true
      }, { status: 200 });
    }

    // Tiered calculation (+2% as price ascends)
    let discountPercent = coupon.discountPercent || 10;
    if (rawAmount >= 200000) discountPercent = 28;
    else if (rawAmount >= 150000) discountPercent = 26;
    else if (rawAmount >= 120000) discountPercent = 24;
    else if (rawAmount >= 80000) discountPercent = 22;
    else if (rawAmount >= 50000) discountPercent = 20;
    else if (rawAmount >= 35000) discountPercent = 18;
    else if (rawAmount >= 25000) discountPercent = 16;
    else if (rawAmount >= 20000) discountPercent = 14;
    else if (rawAmount >= 15000) discountPercent = 12;
    else discountPercent = 10;

    const discountAmount = rawAmount > 0 ? Math.round(rawAmount * (discountPercent / 100)) : 0;
    const finalAmount = rawAmount > 0 ? rawAmount - discountAmount : 0;

    return NextResponse.json({
      valid: true,
      couponCode: coupon.code,
      campaign: coupon.campaign,
      discountPercent: discountPercent,
      minBookingValue: coupon.minBookingValue,
      originalAmount: rawAmount,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      savingsText: discountAmount > 0 ? `You save ₹${discountAmount.toLocaleString('en-IN')} (${discountPercent}% OFF) with code ${coupon.code}!` : `${discountPercent}% Extra Discount applied!`,
      description: coupon.description
    }, { status: 200 });

  } catch (error) {
    console.error('[CouponValidateAPI] Error:', error);
    return NextResponse.json({
      valid: false,
      error: 'An error occurred validating the coupon code.'
    }, { status: 500 });
  }
}

