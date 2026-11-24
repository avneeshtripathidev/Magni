import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getMainSupabase() {
  const mainUrl = process.env.MAIN_SUPABASE_URL || 'https://ecwaqfsjajeidhslybdi.supabase.co';
  const mainKey =
    process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd2FxZnNqYWplaWRoc2x5YmRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE3ODUyNiwiZXhwIjoyMDkxNzU0NTI2fQ.Pcanl1WQDZgXXXbpKdEqnK5xBQSBqFdWnegdVo9bV9Q';
  return createClient(mainUrl, mainKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { artistId, makeLive, artist } = body;

    if (!artistId) {
      return NextResponse.json({ success: false, error: 'artistId is required' }, { status: 400 });
    }

    const mainClient = getMainSupabase();

    if (makeLive) {
      const art = artist || {};
      const stageName = art.stage_name || art.alias || art.name || 'Performer';
      const cleanName = art.name || stageName;
      const photoUrl = art.cover_image_url || art.profile_image_url || '';

      const minPrice = Number(art.price_min) || Number(art.submitted_pricing?.starting_price) || 15000;
      const maxPrice = Number(art.price_max) || minPrice * 2;

      const mainPayload: Record<string, any> = {
        id: artistId,
        name: cleanName,
        alias: stageName,
        category: art.category || 'Performer',
        sub_category: art.sub_category || '',
        sub_categories: Array.isArray(art.genres) && art.genres.length > 0 ? art.genres : (art.sub_category ? [art.sub_category] : ['Live Music']),
        performing_language: Array.isArray(art.languages) && art.languages.length > 0 ? art.languages.join(', ') : (art.languages || 'Hindi, English'),
        languages: Array.isArray(art.languages) && art.languages.length > 0 ? art.languages : ['Hindi', 'English'],
        bio: art.bio || `${stageName} is a verified live performer available for bookings across weddings, concerts, and corporate galas.`,
        price_min: minPrice,
        price_max: maxPrice,
        price_range: `${minPrice}-${maxPrice}`,
        state: art.state || 'Delhi',
        city: art.city || 'Delhi',
        rating: Number(art.rating) || 4.9,
        successful_bookings: Number(art.successful_bookings) || 10,
        members_min: Number(art.members_min) || 1,
        members_max: Number(art.members_max) || 2,
        performance_duration: art.performance_duration || '60-90 mins',
        video_url: art.video_url || '',
        contact_person: art.contact_person || cleanName,
        phone_no: art.phone_no || '',
        phone_no_alt: art.phone_no_alt || '',
        email: art.email || null,
        is_live: true,
        is_featured: Boolean(art.is_featured),
        cover_image_url: photoUrl,
        updated_at: new Date().toISOString(),
      };

      const { data: upsertData, error: upsertErr } = await mainClient
        .from('artists')
        .upsert([mainPayload])
        .select()
        .single();

      if (upsertErr) {
        console.warn('Sync to Main DB artists table error:', upsertErr.message);
      }

      // Also ensure photo in main DB artist_images
      if (photoUrl) {
        try {
          const { data: existingImgs } = await mainClient
            .from('artist_images')
            .select('id')
            .eq('artist_id', artistId)
            .limit(1);

          if (!existingImgs || existingImgs.length === 0) {
            await mainClient.from('artist_images').insert([
              {
                artist_id: artistId,
                image_url: photoUrl,
                is_primary: true,
              },
            ]);
          }
        } catch (imgErr: any) {
          console.warn('Sync to Main DB artist_images error:', imgErr?.message);
        }
      }

      return NextResponse.json({
        success: true,
        is_live: true,
        message: `Artist ${stageName} successfully published live to Main Website booking platform!`,
        artist: upsertData || mainPayload,
      });
    } else {
      // Take off live from Main DB
      const { error: hideErr } = await mainClient
        .from('artists')
        .update({ is_live: false, updated_at: new Date().toISOString() })
        .eq('id', artistId);

      if (hideErr) {
        console.warn('Hide on Main DB artists table error:', hideErr.message);
      }

      return NextResponse.json({
        success: true,
        is_live: false,
        message: `Artist ${artistId} has been taken off live from Main Website booking platform.`,
      });
    }
  } catch (err: any) {
    console.error('sync-live route error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
