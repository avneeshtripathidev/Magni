import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const status = searchParams.get('status');

    if (!artistId) {
      return NextResponse.json(
        { success: false, error: 'Missing artistId parameter' },
        { status: 400 }
      );
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artistId);
    let query = supabase.from('bookings').select('*');

    if (isUuid) {
      query = query.eq('artist_id', artistId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, count: data?.length || 0, data: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, status, notes } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: 'bookingId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['confirmed', 'cancelled', 'completed', 'rejected', 'pending'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes) updatePayload.notes = notes;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId);
    let query = supabase.from('bookings').update(updatePayload);

    if (isUuid) {
      query = query.eq('id', bookingId);
    } else {
      query = query.eq('reference_code', bookingId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Booking ${bookingId} updated to ${status}`,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
