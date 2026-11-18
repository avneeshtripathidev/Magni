import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OAUTH_STATE_COOKIE } from '../../../../../lib/auth/adminSessionServer';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL('/admin/login?error=config_missing', request.url)
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/admin/auth/google/callback`;
  const state = crypto.randomBytes(24).toString('hex');

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', clientId);
  googleUrl.searchParams.set('redirect_uri', redirectUri);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('prompt', 'select_account');
  googleUrl.searchParams.set('access_type', 'online');
  googleUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(googleUrl.toString());
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
