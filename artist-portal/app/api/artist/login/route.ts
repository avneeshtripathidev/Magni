import { NextRequest, NextResponse } from 'next/server';
import {
  getServerSupabase,
  readLocalAccounts,
  sanitizeArtistForClient,
  verifyPassword,
} from '../../../../lib/auth/artistDirectAuthServer';

/**
 * Direct Database Artist Login — verifies email & password against
 * Supabase `public.artists` (or local fallback store) without requiring
 * Supabase email confirmation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both email and password.' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    let matchedArtist: Record<string, any> | null = null;

    // 1. Check Supabase `public.artists`
    if (supabase) {
      try {
        const { data: row } = await supabase
          .from('artists')
          .select('*')
          .ilike('email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const storedHash = row?.performance_details?._auth_hash;
        if (row && storedHash && verifyPassword(password, storedHash)) {
          matchedArtist = sanitizeArtistForClient(row);
        }
      } catch {
        // Fallback below
      }
    }

    // 2. Check local fallback store
    if (!matchedArtist) {
      const localAccounts = readLocalAccounts();
      const account = localAccounts.find((a) => a.email === email);
      if (account && verifyPassword(password, account.password_hash)) {
        matchedArtist = sanitizeArtistForClient(account.artist);
      }
    }

    if (!matchedArtist) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const userPayload = {
      id: matchedArtist.id,
      email,
      app_metadata: { provider: 'direct_db' },
      user_metadata: {
        full_name: matchedArtist.name,
        phone: matchedArtist.phone_no,
        role: 'artist',
      },
      aud: 'authenticated',
      role: 'authenticated',
    };

    const response = NextResponse.json(
      {
        ok: true,
        user: userPayload,
        artist: matchedArtist,
      },
      { status: 200 }
    );

    response.cookies.set('artist_session_active', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Sign in failed.' },
      { status: 500 }
    );
  }
}
