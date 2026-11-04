"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Nav from '@/app/components/layout/Nav';
import TopOfferAnnouncementStrip from '@/app/components/layout/TopOfferAnnouncementStrip';
import BottomNav from '@/app/components/layout/BottomNav';
import Footer from '@/app/components/common/Footer';

const HIDE_CHROME_ON = ['/checkout', '/confirmed', '/login', '/signup', '/onboarding', '/chat', '/f/'];

export function AppShellWrapper({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use pathname-based logic only after mount to avoid hydration mismatch
  const hideChrome = mounted && HIDE_CHROME_ON.some(p => pathname.startsWith(p));

  const routeTransitionClass = ['/artists', '/services', '/gallery', '/events', '/pricing', '/book', '/blog-post', '/contact', '/search', '/markets']
    .includes(pathname)
    ? 'route-showcase'
    : 'route-default';

  const hasNavOffset = !hideChrome && pathname !== '/' && pathname !== '/how-to-book';

  return (
    <div className="flow-unify-shell">
      {!hideChrome && (
        <div id="unified-header" className="unified-header-container">
          <TopOfferAnnouncementStrip />
          <Nav />
        </div>
      )}

      <div 
        className={`page-enter ${routeTransitionClass} ${hasNavOffset ? 'has-nav-offset' : ''}`} 
        style={{ minHeight: '100vh' }} 
        suppressHydrationWarning
      >
        <div className="flow-unify-page-wrap">
          {children}
        </div>
        {!hideChrome && <Footer />}
      </div>

      {!hideChrome && (
        <>
          <BottomNav />
        </>
      )}
    </div>
  );
}
