import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  OAUTH_STATE_COOKIE,
  createAdminSessionToken,
  isServerAuthorizedAdminEmail,
  normalizeEmail,
} from '../../../../../../lib/auth/adminSessionServer';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/admin/auth/google/callback`;
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const oauthError = request.nextUrl.searchParams.get('error');
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  const failRedirect = (reason: string, email?: string) => {
    const url = new URL('/admin/login', origin);
    url.searchParams.set('error', reason);
    if (email) url.searchParams.set('email', email);
    const res = NextResponse.redirect(url.toString());
    res.cookies.delete(OAUTH_STATE_COOKIE);
    res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  };

  if (oauthError) {
    return failRedirect(oauthError === 'access_denied' ? 'cancelled' : 'oauth_failed');
  }

  if (!code || !state || !storedState || state !== storedState) {
    return failRedirect('invalid_state');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return failRedirect('config_missing');
  }

  try {
    // 1. Exchange authorization code for Google access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error('Google token exchange error:', tokenJson);
      return failRedirect('token_exchange_failed');
    }

    // 2. Fetch verified Google profile info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });

    const userInfo = await userRes.json();
    const email = normalizeEmail(userInfo?.email);

    if (!userRes.ok || !email || userInfo?.email_verified === false) {
      return failRedirect('email_unverified');
    }

    // 3. Enforce strict 3-Admin Google Email Whitelist on the server
    const allowed = await isServerAuthorizedAdminEmail(email);
    if (!allowed) {
      return failRedirect('unauthorized', email);
    }

    // 4. Issue signed HttpOnly admin session cookie
    const sessionToken = createAdminSessionToken({
      id: `google-${userInfo.sub || email}`,
      email,
      name: userInfo.name || email.split('@')[0],
      avatar_url: userInfo.picture || undefined,
      role: 'super_admin',
    });

    const res = NextResponse.redirect(new URL('/admin/dashboard', origin).toString());
    res.cookies.delete(OAUTH_STATE_COOKIE);
    res.cookies.set(ADMIN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;
  } catch (err) {
    console.error('Google OAuth callback exception:', err);
    return failRedirect('oauth_exception');
  }
}
