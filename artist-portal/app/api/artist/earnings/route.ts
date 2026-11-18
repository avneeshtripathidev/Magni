import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');

    if (!artistId) {
      return NextResponse.json(
        { success: false, error: 'Missing artistId parameter' },
        { status: 400 }
      );
    }

    // 1. Fetch artist baseline rate using existing columns
    const { data: artist, error: artistErr } = await supabase
      .from('artists')
      .select('price_min, price_max')
      .eq('id', artistId)
      .single();

    if (artistErr) {
      return NextResponse.json(
        { success: false, error: artistErr.message },
        { status: 400 }
      );
    }

    const startingPrice = Number(artist?.price_min || 0);

    // 2. Fetch bookings to aggregate earnings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, total_amount, advance_amount, status, payment_status, event_type, event_date, created_at')
      .eq('artist_id', artistId);

    let totalSettled = 0;
    let escrowBalance = 0;
    const transactions: any[] = [];

    (bookings || []).forEach((b) => {
      const amount = Number(b.total_amount || 0);
      const advance = Number(b.advance_amount || 0);

      if (b.status === 'completed') {
        totalSettled += amount;
        transactions.push({
          id: b.id,
          event: b.event_type || 'Live Performance',
          date: b.event_date || b.created_at,
          amount: `₹${amount.toLocaleString('en-IN')}`,
          status: 'Settled to Bank',
          method: 'Direct IMPS Wire',
        });
      } else if (b.status === 'confirmed') {
        escrowBalance += advance;
        transactions.push({
          id: b.id,
          event: b.event_type || 'Upcoming Performance',
          date: b.event_date || b.created_at,
          amount: `₹${advance.toLocaleString('en-IN')}`,
          status: 'Held in Escrow',
          method: 'Advance Token Guarantee',
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalSettled,
        escrowBalance,
        startingPrice,
        currency: 'INR',
        transactions,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
