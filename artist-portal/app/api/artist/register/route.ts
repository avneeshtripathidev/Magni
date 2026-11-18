import { NextRequest, NextResponse } from 'next/server';
import {
  buildNewArtistRecord,
  generateFallbackId,
  getServerSupabase,
  hashPassword,
  readLocalAccounts,
  sanitizeArtistForClient,
  writeLocalAccounts,
} from '../../../../lib/auth/artistDirectAuthServer';

/**
 * Direct Database Artist Registration — NO confirmation email sent.
 * Stores artist name, email, phone & hashed credentials directly in Supabase `public.artists`
 * (with local fallback store if DB tables are not yet initialized).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name or stage name.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit phone number.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    const newRecord = buildNewArtistRecord({
      fullName,
      email,
      phone,
      passwordHash,
    });

    const supabase = getServerSupabase();
    let storedInSupabase = false;
    let savedArtist: Record<string, any> | null = null;

    if (supabase) {
      try {
        // Check if this email already exists in public.artists
        const { data: existing, error: lookupErr } = await supabase
          .from('artists')
          .select('id, email')
          .ilike('email', email)
          .limit(1)
          .maybeSingle();

        if (!lookupErr && existing) {
          return NextResponse.json(
            {
              error:
                'This email is already registered in our system. Please sign in instead.',
            },
            { status: 409 }
          );
        }

        // Insert directly into Supabase `public.artists` — NO confirmation email sent
        const { data: inserted, error: insertErr } = await supabase
          .from('artists')
          .insert([newRecord])
          .select('*')
          .single();

        if (!insertErr && inserted) {
          storedInSupabase = true;
          savedArtist = inserted;
        } else if (insertErr) {
          console.warn('Supabase direct insert fallback:', insertErr.message);
        }
      } catch (dbErr: any) {
        console.warn('Supabase registration exception (using fallback):', dbErr?.message);
      }
    }

    // Check duplicate in local fallback store too (when Supabase isn't populated yet)
    const localAccounts = readLocalAccounts();
    if (!storedInSupabase) {
      const existingLocal = localAccounts.find((a) => a.email === email);
      if (existingLocal) {
        return NextResponse.json(
          {
            error:
              'This email is already registered. Please sign in with your email and password.',
          },
          { status: 409 }
        );
      }
    }

    const finalArtist = savedArtist || {
      id: generateFallbackId(),
      ...newRecord,
    };

    // Always mirror in local fallback store so sign-in works reliably
    const cleanArtist = sanitizeArtistForClient(finalArtist);
    const updatedLocal = [
      ...localAccounts.filter((a) => a.email !== email),
      {
        id: cleanArtist.id,
        email,
        password_hash: passwordHash,
        artist: cleanArtist,
        created_at: new Date().toISOString(),
      },
    ];
    writeLocalAccounts(updatedLocal);

    const userPayload = {
      id: cleanArtist.id,
      email,
      app_metadata: { provider: 'direct_db' },
      user_metadata: {
        full_name: fullName,
        phone,
        role: 'artist',
      },
      aud: 'authenticated',
      role: 'authenticated',
    };

    const response = NextResponse.json(
      {
        ok: true,
        storedInDb: storedInSupabase,
        user: userPayload,
        artist: cleanArtist,
      },
      { status: 201 }
    );

    response.cookies.set('artist_session_active', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
