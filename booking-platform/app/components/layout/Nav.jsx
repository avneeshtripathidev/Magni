"use client";

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/app/contexts/ThemeContext';
import BrandMark from '@/app/components/common/BrandMark';
import { AIIcon } from '@/app/components/icons/NavigationIcons';
import { NAV_LINKS } from '@/app/constants';
import { trackArtistCtaClick } from '@/app/utils/artistCtaTracker';
import MobilePanel from './MobilePanel';
import { resolveSearchQueryToRoute } from '@/app/utils/seoUrlParser';
import '@/app/styles/components/Nav.css';

const SearchOverlay = dynamic(() => import('./SearchOverlay'), { ssr: false });

function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isPassed = window.scrollY > threshold;
          setScrolled(prev => (prev !== isPassed ? isPassed : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);

  return scrolled;
}

export default function Nav() {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchRef = useRef(null);
  const scrolled = useScrolled(20);
  const isLight = false;
  // Nav bar stays sticky and visible when scrolling down (only ad bar scrolls up out of view)
  const isHidden = false;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOpenModal = () => {
      setMenuOpen(false);
    };
    window.addEventListener('open-contact-modal', handleOpenModal);
    return () => window.removeEventListener('open-contact-modal', handleOpenModal);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const currentQuery = searchRef.current?.value || '';
    if (!currentQuery.trim()) return;
    setSearchOpen(false);
    const targetRoute = resolveSearchQueryToRoute(currentQuery.trim());
    router.push(targetRoute);
    if (searchRef.current) searchRef.current.value = '';
  }

  const openContactModal = (type) => {
    window.dispatchEvent(new CustomEvent('open-contact-modal', { detail: { type } }));
  };

  return (
    <>
      <nav className={`lux-nav ${isLight ? 'is-light' : 'is-dark'} ${scrolled ? 'is-scrolled' : ''} ${isHidden ? 'nav-hidden' : ''}`}>
        <div className="lux-nav-glow" aria-hidden="true" />
        <div className="lux-nav-inner">

          <Link href="/" className="lux-nav-brand">
            <BrandMark size="md" light={false} />
          </Link>

          <div className="lux-nav-center">
            {NAV_LINKS.map(link => {
              const isArtists = link.label.toLowerCase() === 'artists';
              return (
                <React.Fragment key={link.label}>
                  <div className={`lux-nav-dropdown-wrap ${link.isMega ? 'is-mega' : ''}`}>
                    <Link
                      href={link.path || '#'}
                      className={`lux-nav-link ${pathname === link.path ? 'is-active' : ''}`}
                    >
                      {link.label} {link.children && <span className="lux-dropdown-icon">▾</span>}
                    </Link>

                    {link.children && (
                      <div className={`lux-nav-dropdown ${link.isMega ? 'lux-mega-menu' : ''}`}>
                        <div className="lux-dropdown-grid">
                          {link.children.map(child => (
                            <Link key={child.path} href={child.path} className="lux-nav-dropdown-link">
                              <span>{child.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Search button in the middle of desktop navigation */}
                  {isArtists && (
                    <Link
                      href="/ai-search"
                      className={`lux-nav-ai-btn ${pathname === '/ai-search' ? 'is-active' : ''}`}
                      aria-label="Open Full AI Search Page"
                    >
                      <AIIcon color="var(--color-marigold, #E8B943)" size={16} />
                      <span>AI Search</span>
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="lux-nav-right">
            <button onClick={() => openContactModal('contact')} className="lux-nav-cta">
              Contact Us
            </button>
            <a
              href="https://artists.magnevents.in/register"
              onClick={() => trackArtistCtaClick('desktop_top_nav')}
              className="lux-nav-register-btn"
              aria-label="Are you an Artist? Join Magnevents"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span className="cta-long-text">Are you an Artist?</span>
              <span className="cta-short-text">Artist?</span>
            </a>

            <button aria-label="Toggle navigation menu" className={`lux-hamburger ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
              <span />
              <span />
              <span />
            </button>
          </div>

        </div>
      </nav>

      <MobilePanel
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        isLight={isLight}
        pathname={pathname}
        onOpenContactModal={openContactModal}
      />

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSubmit={handleSearchSubmit}
        searchRef={searchRef}
      />
    </>
  );
}
