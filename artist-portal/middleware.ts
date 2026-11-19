import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read Supabase auth session token from cookies
  // Supabase stores tokens in cookies like sb-<project-ref>-auth-token or sb-access-token
  const cookies = request.cookies.getAll();
  const hasAuthToken = cookies.some((c) => 
    c.name.includes('-auth-token') || 
    c.name === 'sb-access-token' ||
    c.name.startsWith('sb:') ||
    c.name === 'artist_bypass_session' ||
    c.name === 'artist_session_active'
  );

  const isAuthRoute = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') || 
    pathname.startsWith('/forgot-password');

  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/portfolio') ||
    pathname.startsWith('/media') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/payments') ||
    pathname.startsWith('/verification') ||
    pathname.startsWith('/settings');

  // If visiting dashboard routes without token, redirect to login
  if (isDashboardRoute && !hasAuthToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Allow auth routes (/login, /register, etc.) to always render cleanly.
  // Never redirect away from /login in edge middleware based on raw cookie presence,
  // which causes infinite redirect loops if tokens are expired, revoked, or signed out on other devices.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/portfolio/:path*',
    '/media/:path*',
    '/bookings/:path*',
    '/payments/:path*',
    '/verification/:path*',
    '/settings/:path*',
    '/login',
    '/register',
    '/forgot-password',
  ],
};

