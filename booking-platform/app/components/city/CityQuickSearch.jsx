"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';

const EVENT_OCCASIONS = [
  'Any occasion',
  'Wedding & Sangeet',
  'Corporate Event',
  'Private House Party',
  'Cocktail & Reception',
  'Birthday / Anniversary',
];

export function CityQuickSearch({ cityName, citySlug }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [occasion, setOccasion] = useState('Any occasion');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    const occasionPart = occasion !== 'Any occasion' ? ` for ${occasion}` : '';
    const finalQuery = trimmed
      ? `${trimmed}${trimmed.toLowerCase().includes(cityName.toLowerCase()) ? '' : ` in ${cityName}`}${occasionPart}`
      : `Live singer or band in ${cityName}${occasionPart}`;
    router.push(`/ai-search?q=${encodeURIComponent(finalQuery)}`);
  };

  const quickLinks = [
    { label: 'Wedding Singers', href: `/wedding-singer-in-${citySlug}` },
    { label: 'Live Bands', href: `/live-band-in-${citySlug}` },
    { label: 'Sufi & Ghazal', href: `/sufi-singer-in-${citySlug}` },
    { label: 'Event DJs', href: `/dj-in-${citySlug}` },
  ];

  return (
    <div className="city-search-block">
      <form onSubmit={handleSubmit} className="city-search-form" role="search">
        <div className="city-search-field">
          <Search size={16} className="city-search-icon" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Genre, artist type, or budget in ${cityName}...`}
            aria-label={`Search live artists in ${cityName}`}
            className="city-search-input"
          />
        </div>

        <select
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          aria-label="Select event occasion"
          className="city-search-select"
        >
          {EVENT_OCCASIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button type="submit" className="city-search-submit">
          <span>Find Artists</span>
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </form>

      <div className="city-quick-categories" aria-label="Popular categories">
        <span className="city-quick-label">Popular:</span>
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href} className="city-quick-link">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CitySpecialistButton({ cityName }) {
  const handleOpenContact = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-contact-modal', {
          detail: {
            type: 'booking',
            artist: null,
            service: `Live Artist Booking in ${cityName}`,
          },
        })
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpenContact}
      className="city-summary-secondary-btn"
    >
      Request a custom quote
    </button>
  );
}
