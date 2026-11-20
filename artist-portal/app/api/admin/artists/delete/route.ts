import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabases() {
  const clients = [];

  // Dedicated Artist Supabase
  const dedicatedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hmqnohcambgqxesewaac.supabase.co';
  const dedicatedKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_W8bQYSMS7Ch7HZSZaJQ8UA_kRg_Mc8r';
  clients.push(createClient(dedicatedUrl, dedicatedKey, { auth: { persistSession: false } }));

  // Main Production Supabase
  const mainUrl = process.env.MAIN_SUPABASE_URL || 'https://ecwaqfsjajeidhslybdi.supabase.co';
  const mainKey =
    process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd2FxZnNqYWplaWRoc2x5YmRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE3ODUyNiwiZXhwIjoyMDkxNzU0NTI2fQ.Pcanl1WQDZgXXXbpKdEqnK5xBQSBqFdWnegdVo9bV9Q';
  clients.push(createClient(mainUrl, mainKey, { auth: { persistSession: false } }));

  return clients;
}

export async function POST(req: NextRequest) {
  try {
    const { artistId } = await req.json().catch(() => ({}));
    if (!artistId) {
      return NextResponse.json({ success: false, error: 'artistId is required' }, { status: 400 });
    }

    const dbs = getSupabases();
    await Promise.all(
      dbs.map(async (db) => {
        try {
          await db.from('artist_images').delete().eq('artist_id', artistId);
          await db.from('artists').delete().eq('id', artistId);
        } catch (e) {
          console.warn('DB delete notice:', e);
        }
      })
    );

    return NextResponse.json({ success: true, message: `Artist ${artistId} deleted successfully` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
