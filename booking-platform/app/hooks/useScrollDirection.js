"use client";
import { useState, useEffect } from 'react';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState("up");

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      const diff = scrollY - lastScrollY;

      if (Math.abs(diff) > 15) {
        const nextDirection = diff > 0 ? "down" : "up";
        setScrollDirection(prev => (prev !== nextDirection ? nextDirection : prev));
        lastScrollY = scrollY > 0 ? scrollY : 0;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return scrollDirection;
}
