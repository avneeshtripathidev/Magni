"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import PricingCard from '@/app/components/pricing/PricingCard'
import FaqSection from '@/app/components/home/FaqSection'
import SectionDivider from '@/app/components/common/SectionDivider'
import { PRICING_PLANS } from '@/app/constants'
import { supabase } from '@database/connection/supabase'
import '@/app/styles/pages/PricingPage.css'

export default function PricingPage() {
  const [plans, setPlans] = useState(PRICING_PLANS);
  const [loading, setLoading] = useState(true);
  const [activePlanIndex, setActivePlanIndex] = useState(() => {
    const popIdx = PRICING_PLANS.findIndex(p => p.popular);
    return popIdx >= 0 ? popIdx : 1;
  });
  const scrollRef = useRef(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('is_live', true)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching plans:', error);
        } else if (data && data.length > 0) {
          const formattedPlans = data.map(p => ({
            name: p.name,
            tagline: p.copy,
            price: `₹${p.price}`,
            originalPrice: p.original_price ? `₹${p.original_price}` : null,
            features: p.points || [],
            popular: p.featured || false
          }));
          setPlans(formattedPlans);
          const popIdx = formattedPlans.findIndex(p => p.popular);
          if (popIdx >= 0) {
            setActivePlanIndex(popIdx);
          }
        }
      } catch (err) {
        console.error('Error fetching pricing plans:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  // Center the Most Popular plan on mount for mobile viewports
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = scrollRef.current;
    if (!container) return;

    const centerPopularCard = () => {
      if (window.innerWidth > 768) return;
      const popIdx = plans.findIndex(p => p.popular);
      const targetIdx = popIdx >= 0 ? popIdx : 1;
      const cards = container.querySelectorAll('.pricing-card');
      const targetCard = cards[targetIdx] || container.querySelector('.pricing-card.is-popular');
      if (targetCard) {
        const cardCenter = targetCard.offsetLeft + (targetCard.offsetWidth / 2);
        const targetScrollLeft = cardCenter - (container.clientWidth / 2);
        container.scrollLeft = targetScrollLeft;
        setActivePlanIndex(targetIdx);
      }
    };

    centerPopularCard();
    const t1 = setTimeout(centerPopularCard, 80);
    const t2 = setTimeout(centerPopularCard, 250);
    const t3 = setTimeout(centerPopularCard, 500);

    const handleResize = () => {
      if (window.innerWidth <= 768) {
        centerPopularCard();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [plans, loading]);

  const scrollToCard = useCallback((index) => {
    setActivePlanIndex(index);
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.querySelectorAll('.pricing-card');
    if (cards[index]) {
      const card = cards[index];
      const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
      const targetScrollLeft = cardCenter - (container.clientWidth / 2);
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cards = container.querySelectorAll('.pricing-card');
    if (!cards || cards.length === 0) return;
    
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    setActivePlanIndex(closestIndex);
  }, []);

  return (
    <main className="pricing-pg">
      <div className="pricing-shell">
        <h1 className="sr-only">Live Artist Pricing & Packages</h1>

        {/* Mobile Quick Selector Tabs */}
        {!loading && plans.length > 1 && (
          <div className="pricing-mobile-tabs" role="tablist" aria-label="Pricing Packages">
            {plans.map((p, idx) => (
              <button
                key={`tab-${p.name}`}
                type="button"
                role="tab"
                aria-selected={activePlanIndex === idx}
                className={`pricing-mobile-tab ${activePlanIndex === idx ? 'is-active' : ''} ${p.popular ? 'is-popular-tab' : ''}`}
                onClick={() => scrollToCard(idx)}
              >
                <span>{p.name}</span>
                {p.popular && <span className="tab-popular-star">★</span>}
              </button>
            ))}
          </div>
        )}

        {/* Pricing Cards Track */}
        <div 
          className="pricing-grid" 
          ref={scrollRef} 
          onScroll={handleScroll}
        >
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={`skeleton-${i}`} 
                className="pricing-card" 
                style={{ background: '#0a0a0a', borderColor: 'rgba(255,255,255,0.05)', padding: '28px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div className="skeleton-pulse" style={{ height: '24px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '8px' }}></div>
                <div className="skeleton-pulse" style={{ height: '12px', width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '24px' }}></div>
                
                <div className="skeleton-pulse" style={{ height: '80px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', marginBottom: '20px' }}></div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={`li-${j}`} className="skeleton-pulse" style={{ height: '14px', width: `${60 + (j * 7) % 30}%`, background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                  ))}
                </div>
                
                <div className="skeleton-pulse" style={{ height: '46px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: 'auto' }}></div>
              </div>
            ))
          ) : (
            plans.map((plan, i) => (
              <PricingCard
                key={plan.name}
                plan={plan}
                index={i}
                isActive={activePlanIndex === i}
              />
            ))
          )}
        </div>

        {/* Mobile Swipe Cue & Indicator Dots */}
        {!loading && plans.length > 1 && (
          <div className="pricing-mobile-indicator">
            <span className="pricing-swipe-hint">← Swipe to compare packages →</span>
            <div className="pricing-dots">
              {plans.map((p, idx) => (
                <button
                  key={`dot-${p.name}`}
                  type="button"
                  aria-label={`Go to ${p.name}`}
                  className={`pricing-dot ${activePlanIndex === idx ? 'is-active' : ''} ${p.popular ? 'is-popular-dot' : ''}`}
                  onClick={() => scrollToCard(idx)}
                />
              ))}
            </div>
          </div>
        )}

        <SectionDivider style={{ margin: '48px auto' }} />

        <FaqSection
          eyebrow="💡 Common Questions"
          title="Everything you need to know"
          titleGradient={true}
        />
      </div>
    </main>
  )
}
