import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Never intercept static assets, internal paths, API routes, or admin portal
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Read Supabase auth session token and onboarding completion from cookies
  const cookies = request.cookies.getAll();
  const hasAuthToken = cookies.some((c) => 
    c.name.includes('-auth-token') || 
    c.name === 'sb-access-token' ||
    c.name.startsWith('sb:') ||
    c.name === 'artist_bypass_session' ||
    c.name === 'artist_session_active'
  );

  const onboardingCookie = request.cookies.get('artist_onboarding_complete')?.value;
  const isOnboardingComplete = onboardingCookie === 'true';
  const hasSkippedCookie = request.cookies.get('artist_onboarding_skipped')?.value === 'true';

  const isAuthRoute = 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/forgot-password';

  const isOnboardingRoute = pathname === '/onboarding';

  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/portfolio') ||
    pathname.startsWith('/media') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/payments') ||
    pathname.startsWith('/verification') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/home');

  const isRootRoute = pathname === '/';

  // =========================================================================
  // STRICT ROUTE GUARD & REDIRECT STATE MACHINE:
  // 1. Unauthenticated (!user)
  //    - /login, /register, / -> Allow
  //    - /onboarding, /dashboard/* -> Redirect to /login
  // 2. Authenticated + Incomplete (user && !user.isOnboardingComplete)
  //    - /login, /register -> Redirect to /onboarding
  //    - /onboarding -> ALLOW (NEVER auto-redirect to /home or /dashboard)
  //    - /dashboard/*, / -> Force Redirect to /onboarding
  // 3. Authenticated + Complete (user && user.isOnboardingComplete)
  //    - /login, /register, / -> Redirect to /dashboard
  //    - /onboarding -> Redirect to /dashboard (unless ?edit=1 or ?review=1)
  //    - /dashboard/* -> Allow
  // =========================================================================

  // Case 1: Unauthenticated
  if (!hasAuthToken) {
    if (isDashboardRoute || isOnboardingRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Case 2: Authenticated + Incomplete Onboarding
  if (!isOnboardingComplete) {
    // If the user opted to "Skip for all", allow access to the dashboard and home
    if (hasSkippedCookie) {
      if (isAuthRoute || isRootRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    // If attempting to access login or register, bounce back into onboarding
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // If attempting to access home or dashboard routes before 100% completion (and not skipped), force redirect to onboarding
    if (isDashboardRoute || isRootRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // Crucial: Allow accessing /onboarding!
    if (isOnboardingRoute) {
      return NextResponse.next();
    }
  }

  // Case 3: Authenticated + Complete Onboarding
  if (isOnboardingComplete) {
    // Redirect away from login / register / root to dashboard
    if (isAuthRoute || isRootRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    // Allow re-visiting onboarding only if explicitly requested for editing
    if (isOnboardingRoute) {
      const isEditing = searchParams.get('edit') === '1' || searchParams.get('review') === '1';
      if (!isEditing) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/profile/:path*',
    '/portfolio/:path*',
    '/media/:path*',
    '/bookings/:path*',
    '/payments/:path*',
    '/verification/:path*',
    '/settings/:path*',
    '/calendar/:path*',
    '/home/:path*',
    '/onboarding',
    '/login',
    '/register',
    '/forgot-password',
  ],
};

