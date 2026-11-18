import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase/client';
import { calculateCompletion } from '../../../../lib/utils';

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

    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Artist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
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
    const { artistId, updates } = body;

    if (!artistId || !updates) {
      return NextResponse.json(
        { success: false, error: 'artistId and updates are required' },
        { status: 400 }
      );
    }

    const newCompletion = calculateCompletion(updates);
    const payload = {
      ...updates,
      profile_completion: newCompletion,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('artists')
      .update(payload)
      .eq('id', artistId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
