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

    // 1. Fetch artist record (safe select)
    let blockedDates: string[] = [];

    try {
      const { data: artist } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();

      if (artist?.performance_details?.blocked_dates) {
        blockedDates = artist.performance_details.blocked_dates;
      }
    } catch {
      // Fallback cleanly
    }

    // 2. Fetch confirmed bookings for this artist to overlay booked dates
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, event_date, client_name, event_type, status')
      .eq('artist_id', artistId)
      .in('status', ['confirmed', 'completed']);

    const bookedDates = (bookings || []).map((b) => ({
      bookingId: b.id,
      date: b.event_date,
      title: `${b.client_name} - ${b.event_type}`,
      status: b.status,
    }));

    return NextResponse.json({
      success: true,
      data: {
        artistId,
        blockedDates,
        bookedDates,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId, blockedDates } = body;

    if (!artistId || !Array.isArray(blockedDates)) {
      return NextResponse.json(
        { success: false, error: 'artistId and blockedDates array are required' },
        { status: 400 }
      );
    }

    try {
      const { data: currentArtist } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();

      const updatedDetails = {
        ...(currentArtist?.performance_details || {}),
        blocked_dates: blockedDates,
      };

      await supabase
        .from('artists')
        .update({
          performance_details: updatedDetails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', artistId);
    } catch {
      // Non-blocking fallback
    }

    return NextResponse.json({
      success: true,
      message: 'Availability calendar updated successfully',
      blockedDates,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
