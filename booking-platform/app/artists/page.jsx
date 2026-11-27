"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Check, 
  Sparkles, 
  Mic2, 
  Music, 
  Flame, 
  Wand2, 
  Radio, 
  Smile, 
  Guitar, 
  Headphones 
} from 'lucide-react'
import ArtistCard from '@/app/components/artists/ArtistCard'
import { ARTISTS_CAT_FILTER } from '@/app/constants'
import { useArtists } from '@/app/hooks/useArtists'
import '@/app/styles/pages/Artists.css'

const CATEGORY_CONFIG = [
  { id: 'All', label: 'All Artists', icon: Sparkles },
  { id: 'Singer', label: 'Singers', icon: Mic2 },
  { id: 'Live band', label: 'Live Bands', icon: Music },
  { id: 'Rapper / Hip-Hop', label: 'Rap & Hip-Hop', icon: Flame },
  { id: 'Magician', label: 'Magicians', icon: Wand2 },
  { id: 'Anchor', label: 'Anchors & MCs', icon: Radio },
  { id: 'Comedian', label: 'Comedians', icon: Smile },
  { id: 'Instrumentalist', label: 'Instrumentalists', icon: Guitar },
  { id: 'Djs', label: 'DJs & Sound', icon: Headphones },
]

const CITIES_LIST = [
  'All Cities',
  'Delhi NCR',
  'Mumbai',
  'Bangalore',
  'Hyderabad',
  'Pune',
  'Jaipur',
  'Goa',
  'Chandigarh',
  'Lucknow',
  'Varanasi',
  'Kolkata',
  'Ahmedabad',
  'Chennai',
  'Indore',
  'Dehradun'
]

export default function ArtistsPage() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeCity, setActiveCity] = useState('All Cities')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const trackRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  const { artists, loading, totalPages, fetchArtists, fallbackNotice } = useArtists(16)

  const checkScroll = useCallback(() => {
    if (!trackRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = trackRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true })
    }
    window.addEventListener('resize', checkScroll)
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  const handleScroll = (distance) => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({ left: distance, behavior: 'smooth' })
  }

  const handleCategorySelect = (cat, e) => {
    setActiveCategory(cat)
    setCurrentPage(1)
    if (e && e.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const catParam = params.get('category')
      if (catParam) {
        const match = ARTISTS_CAT_FILTER.find(
          c => c.toLowerCase() === catParam.toLowerCase() ||
               c.toLowerCase() === catParam.toLowerCase() + 's' ||
               c.toLowerCase().replace(/s$/, '') === catParam.toLowerCase()
        )
        if (match) {
          setActiveCategory(match)
          return
        }
      }
    }
  }, [])

  useEffect(() => {
    fetchArtists(currentPage, activeCategory, activeCity)
  }, [currentPage, activeCategory, activeCity, fetchArtists])

  const handleBook = (name) => {
    router.push(`/book?artist=${encodeURIComponent(name)}`)
  }

  const handleCityChange = (city) => {
    setActiveCity(city)
    setCurrentPage(1)
  }

  return (
    <main className="artists-page">
      <div className="lux-container">
        
        {/* Luxury Glassmorphic Filter & City Toolbar */}
        <div className="artists-filter-shell">
          {/* Scrollable Track Wrapper with Soft Fade Mask and Navigation Chevrons */}
          <div className={`artists-filter-scroll-wrapper ${canScrollLeft ? 'has-scroll-left' : ''} ${canScrollRight ? 'has-scroll-right' : ''}`}>
            {canScrollLeft && (
              <button 
                type="button" 
                className="filter-scroll-btn scroll-left" 
                onClick={() => handleScroll(-220)}
                aria-label="Scroll left categories"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            <div 
              className="artists-filter-track"
              ref={trackRef}
            >
              {CATEGORY_CONFIG.map(({ id, label, icon: Icon }, idx) => {
                const isActive = activeCategory === id
                return (
                  <motion.button
                    key={id}
                    type="button"
                    className={`luxury-pill-btn ${isActive ? 'is-active' : ''}`}
                    onClick={(e) => handleCategorySelect(id, e)}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.18 }}
                  >
                    <span className="luxury-pill-icon-wrap">
                      <Icon size={14} className="luxury-pill-icon" />
                    </span>
                    <span className="luxury-pill-text">{label}</span>
                    {isActive && (
                      <span className="luxury-pill-sparkle" />
                    )}
                  </motion.button>
                )
              })}
            </div>

            {canScrollRight && (
              <button 
                type="button" 
                className="filter-scroll-btn scroll-right" 
                onClick={() => handleScroll(220)}
                aria-label="Scroll right categories"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Elegant Vertical Divider */}
          <div className="artists-filter-divider" />

          {/* Fancy City Selector Dropdown */}
          <div className="artists-city-selector-wrap" ref={dropdownRef}>
            <button 
              type="button"
              className={`luxury-city-btn ${isDropdownOpen ? 'is-open' : ''} ${activeCity !== 'All Cities' ? 'has-filter' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Filter artists by city"
            >
              <div className="luxury-city-btn-left">
                <MapPin size={15} className="luxury-city-pin" />
                <div className="luxury-city-label-group">
                  <span className="luxury-city-eyebrow">LOCATION</span>
                  <span className="luxury-city-current">{activeCity}</span>
                </div>
              </div>
              <ChevronDown 
                size={16} 
                className={`luxury-city-chevron ${isDropdownOpen ? 'is-rotated' : ''}`} 
              />
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  className="luxury-city-dropdown-menu"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <div className="luxury-city-menu-header">
                    <span className="luxury-city-menu-title">SELECT CITY</span>
                    {activeCity !== 'All Cities' && (
                      <button 
                        type="button" 
                        className="luxury-city-reset"
                        onClick={() => { handleCityChange('All Cities'); setIsDropdownOpen(false); }}
                      >
                        Reset All
                      </button>
                    )}
                  </div>
                  <div className="luxury-city-menu-list">
                    {CITIES_LIST.map((city) => {
                      const isSelected = activeCity === city
                      return (
                        <button
                          key={city}
                          type="button"
                          className={`luxury-city-item ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => { handleCityChange(city); setIsDropdownOpen(false); }}
                        >
                          <span className="luxury-city-item-name">{city}</span>
                          {isSelected && <Check size={14} className="luxury-city-item-check" />}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Nearby & Travel-Ready Notice Banner */}
        {fallbackNotice && (
          <motion.div 
            className="luxury-proximity-banner"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="luxury-proximity-banner-left">
              <span className="luxury-proximity-pulse-dot" />
              <div className="luxury-proximity-text-group">
                <span className="luxury-proximity-badge-tag">✈️ TRAVEL-READY ARTISTS</span>
                <p className="luxury-proximity-banner-text">{fallbackNotice}</p>
              </div>
            </div>
            <div className="luxury-proximity-guarantee-pill">
              <span>🛡️ 100% Artist Arrival Guarantee</span>
            </div>
          </motion.div>
        )}

        {/* Artists Grid */}
        <div className="artists-grid">
          {loading ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="modern-artist-card artist-card-skeleton">
                   <div className="skeleton-pulse" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)' }}></div>
                   <div className="modern-overlay-gradient"></div>
                   
                   <div className="modern-info-overlay">
                     <div className="skeleton-pulse" style={{ height: '20px', width: '65%', background: 'rgba(255,255,255,0.12)', borderRadius: '6px', marginBottom: '6px' }}></div>
                     
                     <div className="modern-badges-container">
                       <div className="skeleton-pulse" style={{ height: '14px', width: '50px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}></div>
                       <div className="skeleton-pulse" style={{ height: '14px', width: '60px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}></div>
                     </div>
                     
                     <div className="modern-location-row">
                       <div className="skeleton-pulse" style={{ height: '13px', width: '45%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}></div>
                     </div>
                     
                     <div className="modern-footer-row">
                        <div className="modern-rating-box">
                          <div className="skeleton-pulse" style={{ height: '14px', width: '55px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
                        </div>
                        <div className="modern-booking-badge skeleton-pulse" style={{ width: '80px', height: '20px' }}></div>
                     </div>
                   </div>
                </div>
              ))}
            </>
          ) : (
            <AnimatePresence mode='popLayout'>
              {artists.length > 0 ? (
                artists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onBook={handleBook}
                  />
                ))
              ) : (
                <p style={{ textAlign: 'center', width: '100%', color: 'white', gridColumn: '1 / -1', padding: '40px 0' }}>No artists found in this category.</p>
              )}
            </AnimatePresence>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <div className="fancy-pagination-wrapper">
              <button 
                className="fancy-pagination-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                aria-label="Previous page"
              >
                ← Previous
              </button>
              <span className="fancy-pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="fancy-pagination-btn is-active"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
