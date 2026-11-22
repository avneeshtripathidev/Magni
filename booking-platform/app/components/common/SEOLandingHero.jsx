"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingService } from '@/app/services/bookingService';
import VideoGridSection from '@/app/components/home/VideoGridSection';
import '@/app/styles/components/SEOLandingHero.css';
import '@/app/styles/components/DiwaliOfferBookingForm.css';

const BUDGET_OPTIONS = [
  { value: 10000, label: '₹10,000 - ₹20,000 (Eligible for 30% Off)' },
  { value: 25000, label: '₹20,000 - ₹35,000 (Eligible for 35% Off)' },
  { value: 35000, label: '₹35,000 - ₹50,000 (Eligible for 40% Off)' },
  { value: 50000, label: '₹50,000 - ₹80,000 (Eligible for 50% Off)' },
  { value: 80000, label: '₹80,000 - ₹1,20,000 (Eligible for 55% Off)' },
  { value: 120000, label: '₹1,20,000 - ₹2,00,000 (Eligible for 60% Off)' },
  { value: 200000, label: '₹2,00,000+ (Eligible for 70% Total Off)' },
];

const MODAL_EVENT_TYPES = [
  'Wedding Ceremony',
  'Wedding Sangeet & Reception',
  'Private House Party',
  'Cocktail & Bachelor Party',
  'Birthday Celebration',
  'Corporate Event & Annual Gala',
  'College Fest / Concert',
  'Anniversary Celebration',
];

const DEFAULT_FALLBACK_IMAGE = "https://pub-1802bb19214743ffa99aa227f25e7ede.r2.dev/assets/lux-singer-session.webp";

// Helper to format default date to next week
const getNextWeekDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

const getMinDate = () => {
  return new Date().toISOString().split('T')[0];
};

export default function SEOLandingHero({
  heroTitle,
  heroSubtitle,
  category = "Artist",
  city = "Bhubaneswar",
  subCategory = "",
  topArtists = [],
  isSpecialTokenPage = true,
  locationSlug = ""
}) {
  const formRef = useRef(null);
  const mobFormRef = useRef(null);
  const phoneInputRef = useRef(null);
  const mobPhoneInputRef = useRef(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  const isDJ =
    (category || '').toLowerCase().includes('dj') ||
    (subCategory || '').toLowerCase().includes('dj') ||
    (locationSlug || '').toLowerCase().includes('dj') ||
    (heroTitle || '').toLowerCase().includes('dj');
  const isBand = (category || '').toLowerCase().includes('band');
  const isComedian = (category || '').toLowerCase().includes('comedian');

  const eventTypes = useMemo(() => {
    if (isDJ) {
      return [
        "Wedding DJ & Sangeet",
        "Club & After-Party",
        "Private House & Pool Party",
        "Corporate Gala & Cocktail",
        "College Fest & EDM Night"
      ];
    }
    if (isBand) {
      return [
        "Wedding Sangeet & Reception",
        "Corporate Annual Gala",
        "College Fest / Concert",
        "Private Farmhouse Gig",
        "Cocktail & Lounge"
      ];
    }
    if (isComedian) {
      return [
        "Corporate Standup Show",
        "Private Birthday & Gathering",
        "College Fest",
        "Club & Cafe Comedy Night",
        "Wedding Roast / MC"
      ];
    }
    return [
      "Wedding / Reception",
      "Ghazal / Sufi Mehfil",
      "Private House Party",
      "Corporate Event",
      "Cocktail & Sangeet"
    ];
  }, [isDJ, isBand, isComedian]);

  const [selectedEventType, setSelectedEventType] = useState(isDJ ? "Wedding DJ & Sangeet" : "Wedding / Reception");
  const [eventDate, setEventDate] = useState(getNextWeekDate());
  const [selectedBudget, setSelectedBudget] = useState(isDJ ? "₹30,000 - ₹60,000 (Most Popular)" : "₹20,000 - ₹45,000 (Most Popular)");
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Quick 1-step phone modal for pricing tier check availability
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [activeTier, setActiveTier] = useState(null);
  const [quickPhone, setQuickPhone] = useState("");
  const [quickPhoneError, setQuickPhoneError] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickSubmitted, setQuickSubmitted] = useState(false);
  const quickPhoneRef = useRef(null);

  // Basic Pop Form for Artist Booking (Opens whenever any person clicks the "Book" button)
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [modalArtist, setModalArtist] = useState(null);
  const [bookName, setBookName] = useState("");
  const [bookNameError, setBookNameError] = useState("");
  const [bookPhone, setBookPhone] = useState("");
  const [bookPhoneError, setBookPhoneError] = useState("");
  const [bookEventDate, setBookEventDate] = useState(getNextWeekDate());
  const [bookEventType, setBookEventType] = useState(isDJ ? "Wedding DJ & Sangeet" : "Wedding Ceremony");
  const [bookBudgetAmount, setBookBudgetAmount] = useState(25000);
  const [bookSubmitting, setBookSubmitting] = useState(false);
  const [bookSubmitted, setBookSubmitted] = useState(false);
  const [bookRefCode, setBookRefCode] = useState("");
  const [bookTokenCopied, setBookTokenCopied] = useState(false);
  const bookPhoneInputRef = useRef(null);
  const bookNameInputRef = useRef(null);

  const budgetTiers = useMemo(() => {
    if (isDJ) {
      return [
        {
          id: "party-dj",
          title: "Party & Club DJ Setup",
          price: "₹15,000 - ₹25,000",
          desc: "Pro DJ + Pioneer Console & Sound System. Perfect for intimate house parties, birthdays & sundowners.",
          features: ["Pro DJ + Pioneer DJ Console", "JBL/RCF Sound System (Up to 100 guests)", "Bollywood, EDM, Punjabi & Commercial set", "Dedicated sound technician"]
        },
        {
          id: "wedding-dj",
          title: "Grand Wedding & Sangeet DJ with Dhol",
          price: "₹30,000 - ₹60,000",
          isPopular: true,
          desc: "Celebrity Wedding DJ + Live Punjabi Dhol Duo + Intelligent Stage & Dancefloor Lighting.",
          features: ["High-Energy Wedding DJ + 2 Dhol Masters", "Moving Beam Intelligent Stage Lights", "Curated Sangeet & Baraat Playlist", "Stage Mic & Technical Coordination"]
        },
        {
          id: "concert-dj",
          title: "Mega Concert DJ & Stage Production",
          price: "₹65,000 - ₹1,50,000+",
          desc: "Full Concert Setup with Line Array Audio, LED Video Wall, Cold Pyro & Special Effects.",
          features: ["Top Festival/Club Headline DJ", "High-Wattage Line Array Sound Setup", "P3/P4 LED Video Backdrop & Trussing", "CO2 Jets, Cold Pyro & Spark Machines"]
        }
      ];
    }
    if (isBand) {
      return [
        {
          id: "acoustic-band",
          title: "Acoustic Unplugged Trio",
          price: "₹20,000 - ₹35,000",
          desc: "3-piece acoustic band with guitars, cajon/percussion & vocals for intimate gatherings.",
          features: ["Vocalist + Guitarist + Percussionist", "Up to 2.5 hrs live set", "Ideal for 30-100 guests", "Full acoustic PA setup"]
        },
        {
          id: "full-band",
          title: "Full Pop & Rock Live Band (5-Piece)",
          price: "₹45,000 - ₹85,000",
          isPopular: true,
          desc: "5-piece high-energy live band with drums, bass, keys, lead guitar & lead vocals.",
          features: ["5-Piece Complete Live Band", "Up to 3 hrs power-packed show", "Ideal for 100-500 guests", "Full digital sound mixing"]
        },
        {
          id: "celebrity-band",
          title: "Celebrity Concert Band Setup",
          price: "₹90,000 - ₹2,00,000+",
          desc: "Grand concert band with celebrity performers, brass section & stage lighting.",
          features: ["Headline Performers + 6-8 Musicians", "Concert Line Array Audio", "Ideal for 500+ guests & weddings", "Technical rider management"]
        }
      ];
    }
    if (isComedian) {
      return [
        {
          id: "rising-comic",
          title: "Rising Standup Comic",
          price: "₹15,000 - ₹30,000",
          desc: "Fresh, engaging standup comedian for private gatherings, birthdays & cafe shows.",
          features: ["30-45 mins standup set", "Crowd work & clean/adult humor as requested", "Ideal for 20-80 guests", "Wireless mic coordination"]
        },
        {
          id: "corporate-comic",
          title: "Featured Corporate & Wedding Standup",
          price: "₹35,000 - ₹75,000",
          isPopular: true,
          desc: "Experienced touring comedian tailored for corporate annual meets, award nights & sangeet.",
          features: ["45-60 mins curated performance", "Customized corporate/family jokes", "Ideal for 80-300 guests", "Professional audio rider check"]
        },
        {
          id: "headliner-comic",
          title: "Celebrity Headliner Comedian",
          price: "₹80,000 - ₹2,50,000+",
          desc: "Nationally recognized TV / YouTube celebrity comedian for flagship events.",
          features: ["60+ mins headline show", "Celebrity green room & flight coordination", "Ideal for large festivals & luxury galas", "Dedicated backstage manager"]
        }
      ];
    }
    return [
      {
        id: "solo",
        title: "Solo Acoustic / Harmonium",
        price: "₹10,000 - ₹20,000",
        desc: "Solo Ghazal & Sufi vocalist with harmonium or guitar. Perfect for intimate mehfils & home gatherings.",
        features: ["Vocalist + Instrument", "Up to 2.5 hrs live performance", "Ideal for 20-50 guests", "Direct sound guidance"]
      },
      {
        id: "trio",
        title: "Classic Ghazal & Sufi Trio",
        price: "₹20,000 - ₹45,000",
        isPopular: true,
        desc: "Lead Ghazal Singer + Tabla Master + Flute/Keyboardist. Most requested for wedding functions & Sangeet.",
        features: ["3-Piece Master Ensemble", "Up to 3 hrs live mehfil", "Ideal for 50-250 guests", "Full acoustic coordination"]
      },
      {
        id: "ensemble",
        title: "Grand Stage Ensemble / Band",
        price: "₹50,000 - ₹1,50,000+",
        desc: "Full 5-6 piece live ensemble with percussion, sound engineer & stage mics for grand celebrations.",
        features: ["Full 5-6 Piece Live Band", "Grand event sound setup", "Ideal for 250+ guests / luxury galas", "Celebrity performer option"]
      }
    ];
  }, [isDJ, isBand, isComedian]);

  // Mobile pricing carousel state & auto-centering
  const pricingGridRef = useRef(null);
  const [activeTierIndex, setActiveTierIndex] = useState(() => {
    const popIdx = budgetTiers.findIndex(t => t.isPopular);
    return popIdx >= 0 ? popIdx : 1;
  });

  const handleGridScroll = useCallback(() => {
    const grid = pricingGridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll('.seo-tier-card');
    if (!cards.length) return;

    const gridCenter = grid.scrollLeft + (grid.clientWidth / 2);
    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
      const distance = Math.abs(gridCenter - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    setActiveTierIndex(closestIndex);
  }, []);

  const scrollToTierIndex = useCallback((idx) => {
    const grid = pricingGridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll('.seo-tier-card');
    if (cards[idx]) {
      const card = cards[idx];
      const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
      const targetScrollLeft = cardCenter - (grid.clientWidth / 2);
      grid.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth'
      });
      setActiveTierIndex(idx);
    }
  }, []);

  // Center the Most Popular pricing card on mount for mobile viewports
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const grid = pricingGridRef.current;
    if (!grid) return;

    const centerPopularCard = () => {
      if (window.innerWidth > 768) return;
      const popularIdx = budgetTiers.findIndex(t => t.isPopular);
      const targetIdx = popularIdx >= 0 ? popularIdx : 1;
      const cards = grid.querySelectorAll('.seo-tier-card');
      const targetCard = cards[targetIdx] || grid.querySelector('.featured-tier');
      if (targetCard) {
        const cardCenter = targetCard.offsetLeft + (targetCard.offsetWidth / 2);
        const targetScrollLeft = cardCenter - (grid.clientWidth / 2);
        grid.scrollLeft = targetScrollLeft;
        setActiveTierIndex(targetIdx);
      }
    };

    // Run after paint and after layout stabilizes
    centerPopularCard();
    const t1 = setTimeout(centerPopularCard, 100);
    const t2 = setTimeout(centerPopularCard, 350);

    const handleResize = () => {
      if (window.innerWidth <= 768) {
        centerPopularCard();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [budgetTiers]);

  // WhatsApp click handler
  const handleWhatsAppQuote = () => {
    const artistText = selectedArtist ? ` Preferred Performer: ${selectedArtist.name} (Fee: ~₹${selectedArtist.price_min?.toLocaleString('en-IN')}).` : '';
    const text = `Hi Magnevents! I want to check availability & get a price list for a ${category} in ${city}.${artistText} Event Type: ${selectedEventType}, Tentative Date: ${eventDate}, Budget: ${selectedBudget}. Please share available profiles and performance clips.`;
    window.open(`https://wa.me/918076515257?text=${encodeURIComponent(text)}`, '_blank');
  };

  const [refCode, setRefCode] = useState("");

  // Direct 1-Step Form Submission
  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    setPhoneError("");

    // Validate 10-digit phone
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError("Please enter a valid 10-digit mobile number");
      if (mobPhoneInputRef.current) mobPhoneInputRef.current.focus();
      else if (phoneInputRef.current) phoneInputRef.current.focus();
      return;
    }

    const res = bookingService.submitInstantRequest({
      name: name.trim() || 'Event Host',
      phone: cleanPhone,
      eventType: selectedEventType,
      date: eventDate,
      budget: selectedBudget,
      selectedArtist: selectedArtist ? selectedArtist.name : null,
      category: category,
      city: city,
      service: `${category} in ${city}`,
      formName: `SEO Instant Lead Engine - ${category} in ${city}`,
      formLink: typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#instant-lead` : '',
      formType: 'booking',
      message: '',
      internalNotes: `Direct SEO Lead for ${category} in ${city}. Event: ${selectedEventType} on ${eventDate}. Budget: ${selectedBudget}.${selectedArtist ? ` Preferred Performer: ${selectedArtist.name}.` : ''}`
    });

    setRefCode(res?.referenceCode || '');
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  // Universal Availability Modal Opener (This 1-step form is the main booking form for this page)
  const handleOpenAvailabilityModal = (item = null) => {
    let tierObj = null;

    if (item && item.features && item.price) {
      // It's a pricing tier object
      tierObj = item;
    } else if (item && item.name) {
      // It's an artist object
      setSelectedArtist(item);
      const minFee = item.price_min ? `₹${item.price_min.toLocaleString('en-IN')}` : '₹10,000';
      const maxFee = item.price_max ? `₹${item.price_max.toLocaleString('en-IN')}` : '';
      const displayPrice = maxFee ? `${minFee} - ${maxFee}` : `${minFee}+`;

      tierObj = {
        id: `artist-${item.id || item.slug || 'selected'}`,
        title: item.name,
        price: displayPrice,
        desc: `Verified ${category} in ${city}`,
        features: [
          `Verified ${category} Performer`,
          `100% Artist Arrival Guarantee`,
          `Direct 0% Middleman Pricing`,
          `Complete Sound & Stage Coordination`
        ],
        artist: item,
        isArtist: true
      };
    } else {
      // General CTA / Main Form Button / Hero Click
      const defaultTier = budgetTiers?.[0] || {
        id: "solo",
        title: "Solo Acoustic / Harmonium",
        price: "₹10,000 - ₹20,000",
        desc: "Solo Ghazal & Sufi vocalist with harmonium or guitar. Perfect for intimate mehfils & home gatherings.",
        features: ["Vocalist + Instrument", "Up to 2.5 hrs live performance", "Ideal for 20-50 guests", "Direct sound guidance"]
      };

      if (selectedArtist) {
        const minFee = selectedArtist.price_min ? `₹${selectedArtist.price_min.toLocaleString('en-IN')}` : '₹10,000';
        const maxFee = selectedArtist.price_max ? `₹${selectedArtist.price_max.toLocaleString('en-IN')}` : '';
        const displayPrice = maxFee ? `${minFee} - ${maxFee}` : defaultTier.price;

        tierObj = {
          id: `artist-${selectedArtist.id || 'selected'}`,
          title: selectedArtist.name,
          price: displayPrice,
          desc: `Verified ${category} in ${city}`,
          features: defaultTier.features,
          artist: selectedArtist,
          isArtist: true
        };
      } else {
        tierObj = defaultTier;
      }
    }

    setActiveTier(tierObj);
    setSelectedBudget(`${tierObj.title} (${tierObj.price})`);
    setQuickPhone(phone || "");
    setQuickPhoneError("");
    setQuickSubmitted(false);
    setTierModalOpen(true);

    setTimeout(() => {
      if (quickPhoneRef.current) quickPhoneRef.current.focus();
    }, 150);
  };

  const handleToken99Submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPhoneError("");

    const cleanPhone = (phone || '').replace(/\D/g, '').slice(0, 10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError("Please enter a valid 10-digit mobile number");
      if (phoneInputRef.current) phoneInputRef.current.focus();
      return;
    }

    setIsSubmitting(true);
    const randomRef = `MGN-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const res = bookingService.submitInstantRequest({
        name: name.trim() || 'Event Host',
        phone: cleanPhone,
        eventType: selectedEventType,
        date: eventDate,
        budget: selectedBudget || 'From ₹6,9xx',
        selectedArtist: selectedArtist ? selectedArtist.name : null,
        category: category,
        city: city,
        service: `${category} in ${city}`,
        formName: `Hero Booking Card - ${category} in ${city}`,
        formLink: typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#hero-book-99` : '',
        formType: 'booking',
        referenceCode: randomRef,
        message: `Hero Booking Request for ${category} in ${city}. Event: ${selectedEventType} on ${eventDate}.${selectedArtist ? ` Target Performer: ${selectedArtist.name}` : ''}`,
        internalNotes: `Direct Hero Lead for ${category} in ${city}. Event: ${selectedEventType} on ${eventDate}.${selectedArtist ? ` Preferred Performer: ${selectedArtist.name}.` : ''}`
      });

      setRefCode(res?.referenceCode || randomRef);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting hero booking:', err);
      setPhoneError("Could not submit booking. Please try WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open the availability pop form when any "Book" button or card is clicked
  const handleOpenBookModal = (artist) => {
    handleOpenAvailabilityModal(artist);
  };

  // Select an artist opens the availability popup form
  const handleSelectArtist = (artist) => {
    handleOpenAvailabilityModal(artist);
  };

  // Submit handler for the artist booking popup form
  const handleBookModalSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setBookPhoneError("");
    setBookNameError("");

    if (!bookName || !bookName.trim()) {
      setBookNameError("Please enter your full name");
      if (bookNameInputRef.current) bookNameInputRef.current.focus();
      return;
    }

    const cleanPhone = (bookPhone || '').replace(/\D/g, '').slice(0, 10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setBookPhoneError("Please enter a valid 10-digit mobile number");
      if (bookPhoneInputRef.current) bookPhoneInputRef.current.focus();
      return;
    }

    setBookSubmitting(true);
    const randomRef = `MGN-BK-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const targetArtistName = modalArtist ? modalArtist.name : (selectedArtist ? selectedArtist.name : category);
      const chosenBudget = BUDGET_OPTIONS.find(b => b.value === Number(bookBudgetAmount))?.label || `₹${Number(bookBudgetAmount).toLocaleString('en-IN')}`;

      const res = bookingService.submitInstantRequest({
        name: bookName.trim(),
        phone: cleanPhone,
        eventType: bookEventType,
        date: bookEventDate || getNextWeekDate(),
        budget: chosenBudget,
        selectedArtist: targetArtistName,
        category: category,
        city: city,
        service: `${category} in ${city}`,
        formName: `Offer Booking Form - ${targetArtistName} in ${city}`,
        formLink: typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#offer-modal` : '',
        formType: 'booking',
        referenceCode: randomRef,
        message: `Booking Request with Special Offer (DIW100) for ${targetArtistName} in ${city}. Event: ${bookEventType}. Budget: ${chosenBudget}. Host: ${bookName.trim()}.`,
        internalNotes: `Offer Popup Lead: ${targetArtistName} for ${city}. Phone: ${cleanPhone}. Coupon: DIW100.`
      });

      setBookRefCode(res?.referenceCode || randomRef);
      setBookSubmitted(true);
      if (!phone) setPhone(cleanPhone);
      if (!name && bookName.trim()) setName(bookName.trim());
    } catch (err) {
      console.error('Error submitting booking modal request:', err);
      setBookPhoneError("Could not submit booking. Please try again.");
    } finally {
      setBookSubmitting(false);
    }
  };

  // Foolproof background scroll lock when popup form is open
  useEffect(() => {
    const isModalOpen = Boolean(bookModalOpen || tierModalOpen);
    if (isModalOpen) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      const prevBodyTouch = document.body.style.touchAction;

      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');

      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
        document.body.style.touchAction = prevBodyTouch;
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
      };
    }
  }, [bookModalOpen, tierModalOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (bookModalOpen) setBookModalOpen(false);
        if (tierModalOpen) setTierModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bookModalOpen, tierModalOpen]);

  // Listen for custom events 'open-artist-booking' and 'open-contact-modal'
  useEffect(() => {
    const handleOpenArtistBooking = (e) => {
      const art = e?.detail?.artist || null;
      handleOpenAvailabilityModal(art);
    };
    window.addEventListener('open-artist-booking', handleOpenArtistBooking);
    window.addEventListener('open-contact-modal', handleOpenArtistBooking);
    return () => {
      window.removeEventListener('open-artist-booking', handleOpenArtistBooking);
      window.removeEventListener('open-contact-modal', handleOpenArtistBooking);
    };
  }, []);

  // Select a tier and open 1-step quick phone modal
  const handleSelectTier = (tier) => {
    handleOpenAvailabilityModal(tier);
  };

  const handleQuickTierSubmit = (e) => {
    e.preventDefault();
    setQuickPhoneError("");

    const clean = (quickPhone || '').replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      setQuickPhoneError("Please enter a valid 10-digit mobile number");
      return;
    }

    setQuickSubmitting(true);
    const randomRef = `MGN-${Math.floor(100000 + Math.random() * 900000)}`;
    const targetArtistName = activeTier?.artist?.name || selectedArtist?.name || null;
    const planName = activeTier?.title || `${category} Booking`;
    const planPrice = activeTier?.price || 'TBD';

    bookingService.submitInstantRequest({
      name: name.trim() || 'Event Host',
      phone: clean,
      eventType: selectedEventType || `${planName} in ${city}`,
      date: eventDate,
      budget: planPrice,
      selectedPlan: activeTier ? {
        name: planName,
        price: planPrice,
        tagline: activeTier.desc,
        features: activeTier.features
      } : null,
      selectedArtist: targetArtistName,
      category: category,
      city: city,
      keywords: `${category}, ${planName}, ${city}`,
      formName: `Live Availability Check - ${planName} in ${city}`,
      formLink: typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '',
      formType: 'booking',
      referenceCode: randomRef,
      message: `Availability check for ${planName} (${planPrice}) in ${city}. Phone: +91 ${clean}. Date: ${eventDate}.${targetArtistName ? ` Artist: ${targetArtistName}` : ''}`,
      internalNotes: `Live Availability Inquiry: ${planName} (${planPrice}) in ${city}. Features: ${activeTier?.features?.join(', ') || 'Standard'}. Checking live artist availability.`
    });

    setRefCode(randomRef);
    setQuickSubmitted(true);
    setQuickSubmitting(false);
  };

  const handleImageError = (artistId) => {
    setImageErrors(prev => ({ ...prev, [artistId]: true }));
  };

  return (
    <section className={`seo-hero-root ${isDJ ? 'seo-hero-dj-theme' : ''}`}>
      {/* 1. HERO MASTHEAD: Celebratory concert stage atmosphere, ambient lights, 5k proof & quote engine */}
      <div className="seo-hero-masthead">
        {isDJ && (
          <div className="seo-dj-ambient-lights" aria-hidden="true">
            <div className="seo-dj-laser-beam seo-dj-laser-left" />
            <div className="seo-dj-laser-beam seo-dj-laser-right" />
            <div className="seo-dj-strobe-glow" />
            <div className="seo-dj-bass-aura" />
          </div>
        )}
        <div className="seo-hero-backdrop-glow" aria-hidden="true" />

        <div className="seo-hero-container">
        {/* ==========================================================================
           1. Top Trust & Social Proof: 5,000+ Events Done Across India Banner
           ========================================================================== */}
        <div className="seo-5k-badge-wrap">
          <div className="seo-5k-events-badge">
            <div className="seo-avatar-stack">
              {topArtists && topArtists.length > 0 ? (
                topArtists.slice(0, 4).map((a, i) => (
                  <img
                    key={a.id || i}
                    src={a.img || DEFAULT_FALLBACK_IMAGE}
                    alt={a.name}
                    className="seo-stack-avatar"
                  />
                ))
              ) : (
                <img
                  src={DEFAULT_FALLBACK_IMAGE}
                  alt="Artist"
                  className="seo-stack-avatar"
                />
              )}
              <span className="seo-avatar-count">+5k</span>
            </div>
            <div className="seo-5k-text">
              <strong className="seo-5k-title-desk">We Have Done 5,000+ Events Across India</strong>
              <strong className="seo-5k-title-mob">5,000+ Events Across India</strong>
              <span className="seo-5k-sub-desk">⭐ 4.9/5 Rating (5,000+ Live Bookings) · Verified Performers</span>
              <span className="seo-5k-sub-mob">⭐ 4.9 Rating · Verified Performers</span>
            </div>
          </div>
        </div>

        {/* Hero Header & Title / Split Layout with Right-Side ₹99 Form */}
        {isSpecialTokenPage ? (
          <div className="seo-hero-split-wrap">
            {/* Left Column: Heading, Subtitle & Event Category Pills */}
            <div className="seo-hero-split-left">
              <h1 className="seo-hero-title seo-hero-title-left seo-hero-gradient-text">
                {heroTitle}
              </h1>
              <p className="seo-hero-subtitle seo-hero-subtitle-left">
                {heroSubtitle || `Book verified performers directly for your next grand event.`}
              </p>

              {/* DJ Night Party Perks & Sound Setup Strip */}
              {isDJ && (
                <div className="seo-dj-perks-strip">
                  <div className="seo-dj-perk-item">
                    <span className="seo-dj-perk-icon">🔊</span>
                    <span>JBL / RCF Sound Setup</span>
                  </div>
                  <div className="seo-dj-perk-item">
                    <span className="seo-dj-perk-icon">💡</span>
                    <span>Club Lasers &amp; Moving Lights</span>
                  </div>
                  <div className="seo-dj-perk-item">
                    <span className="seo-dj-perk-icon">🎛️</span>
                    <span>Pioneer Pro DJ Console</span>
                  </div>
                  <div className="seo-dj-perk-item">
                    <span className="seo-dj-perk-icon">⚡</span>
                    <span>60-Min Fast Soundcheck</span>
                  </div>
                </div>
              )}

              <div className="seo-query-pills seo-query-pills-left" role="tablist" aria-label="Event category options">
                {eventTypes.map((type) => {
                  let icon = '🎵';
                  if (type.includes('Wedding') || type.includes('Sangeet')) icon = '💍';
                  else if (type.includes('Club') || type.includes('EDM') || type.includes('After-Party')) icon = '🎧';
                  else if (type.includes('House') || type.includes('Pool') || type.includes('Party')) icon = '🎉';
                  else if (type.includes('Ghazal') || type.includes('Mehfil')) icon = '🍷';
                  else if (type.includes('Corporate') || type.includes('Gala')) icon = '🏢';
                  else if (type.includes('Fest') || type.includes('Concert')) icon = '⚡';
                  else if (type.includes('Comedy') || type.includes('Standup')) icon = '🎙️';

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedEventType(type)}
                      className={`seo-query-chip ${selectedEventType === type ? 'active' : ''}`}
                    >
                      <span>{icon}</span>
                      <span>{type}</span>
                    </button>
                  );
                })}
              </div>

              {/* Micro Social Proof Bar */}
              <div className="hero-split-live-stats">
                <div className="hero-split-stat">
                  <strong>5,000+</strong>
                  <span>Shows Executed</span>
                </div>
                <div className="hero-split-stat-div" />
                <div className="hero-split-stat">
                  <strong>4.9 ★</strong>
                  <span>Average Rating</span>
                </div>
                <div className="hero-split-stat-div" />
                <div className="hero-split-stat">
                  <strong>10 Mins</strong>
                  <span>Fast Response</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Converting ₹6,9xx Booking Form Card */}
            <div className="seo-hero-split-right">
              <div ref={formRef} className="hero-tok99-card" id="hero-book-99">
                <div className="hero-tok99-glow" aria-hidden="true" />
                <div className="hero-tok99-top-row">
                  <div className="hero-tok99-price-box">
                    <span className="hero-tok99-old-price">From</span>
                    <span className="hero-tok99-now-price">₹6,9xx*</span>
                    <span className="hero-tok99-save-pill">BEST VALUE</span>
                  </div>
                </div>

                {!isSubmitted ? (
                  <form onSubmit={handleToken99Submit} className="hero-tok99-form">
                    <div className="hero-tok99-header-text">
                      <h3 className="hero-tok99-title">
                        Book {category} in {city} from ₹6,9xx
                      </h3>
                    </div>

                    {selectedArtist && (
                      <div className="seo-mob-selected-artist" style={{ marginBottom: '10px' }}>
                        <span>🎯 Selected: <strong>{selectedArtist.name}</strong> (~₹{selectedArtist.price_min ? selectedArtist.price_min.toLocaleString('en-IN') : '10,000'})</span>
                        <button type="button" onClick={() => setSelectedArtist(null)} aria-label="Clear artist selection">✕</button>
                      </div>
                    )}

                    <div className="hero-tok99-input-row">
                      <div className="hero-tok99-field hero-tok99-field-name">
                        <label htmlFor="h-tok-name" className="hero-tok99-label">
                          <span className="hero-tok99-label-icon">👤</span> Your Full Name
                        </label>
                        <div className="hero-tok99-input-box">
                          <input
                            id="h-tok-name"
                            type="text"
                            placeholder="e.g. Avneesh Tripathi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="hero-tok99-input"
                          />
                        </div>
                      </div>

                      <div className="hero-tok99-field hero-tok99-phone-field">
                        <label htmlFor="h-tok-phone" className="hero-tok99-label">
                          <span className="hero-tok99-label-icon">📱</span> Phone / WhatsApp *
                        </label>
                        <div className={`hero-tok99-input-box ${phoneError ? 'error' : ''}`}>
                          <span className="hero-tok99-prefix" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <svg className="seo-flag-svg" viewBox="0 0 30 20" width="18" height="12" aria-hidden="true">
                              <rect width="30" height="6.67" fill="#FF9933" />
                              <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
                              <rect y="13.34" width="30" height="6.67" fill="#138808" />
                              <circle cx="15" cy="10" r="2.2" fill="#000080" />
                            </svg>
                            <span>+91</span>
                          </span>
                          <input
                            ref={phoneInputRef}
                            id="h-tok-phone"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            required
                            placeholder="Enter 10-digit WhatsApp number"
                            aria-label="WhatsApp or mobile number"
                            value={phone}
                            onChange={(e) => {
                              const d = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPhone(d);
                              if (phoneError) setPhoneError('');
                            }}
                            className="hero-tok99-input"
                          />
                        </div>
                      </div>
                    </div>


                    {phoneError && (
                      <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>
                        {phoneError}
                      </span>
                    )}

                    <div className="hero-tok99-input-row hero-tok99-date-type-row">
                      <div className="hero-tok99-field hero-tok99-type-field">
                        <label htmlFor="h-tok-type" className="hero-tok99-label">
                          <span className="hero-tok99-label-icon">🎭</span> Event Type
                        </label>
                        <div className="hero-tok99-input-box">
                          <select
                            id="h-tok-type"
                            value={selectedEventType}
                            onChange={(e) => setSelectedEventType(e.target.value)}
                            className="hero-tok99-select"
                            aria-label="Select event type"
                          >
                            {eventTypes.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="hero-tok99-field hero-tok99-date-field">
                        <label htmlFor="h-tok-date" className="hero-tok99-label">
                          <span className="hero-tok99-label-icon">📅</span> Event Date *
                        </label>
                        <div className="hero-tok99-input-box">
                          <input
                            id="h-tok-date"
                            type="date"
                            required
                            min={getMinDate()}
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="hero-tok99-input"
                            style={{ colorScheme: 'dark' }}
                            aria-label="Select event date"
                            suppressHydrationWarning
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="hero-tok99-submit-btn"
                    >
                      <span>{isSubmitting ? '⏳ Checking Availability...' : 'Check Availability & Send Quotes ➔'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="hero-tok99-confirmed-box">
                    <div className="hero-tok99-conf-check">✓</div>
                    <h4 className="hero-tok99-conf-title">Slot Reserved from ₹6,9xx!</h4>
                    <span className="hero-tok99-conf-pill">Booking ID: {refCode}</span>

                    <div className="hero-tok99-conf-data">
                      <div className="hero-tok99-conf-row">
                        <span>Performer:</span>
                        <strong>{category} in {city}</strong>
                      </div>
                      <div className="hero-tok99-conf-row">
                        <span>Host:</span>
                        <strong>{name || 'Event Host'} (+91 {phone})</strong>
                      </div>
                      <div className="hero-tok99-conf-row">
                        <span>Date:</span>
                        <strong>{eventDate}</strong>
                      </div>
                      <div className="hero-tok99-conf-row">
                        <span>Starting Rate:</span>
                        <strong style={{ color: '#22c55e' }}>From ₹6,9xx (Adjustable)</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard && refCode) {
                            navigator.clipboard.writeText(refCode);
                            setTokenCopied(true);
                            setTimeout(() => setTokenCopied(false), 2000);
                          }
                        }}
                        style={{
                          padding: '9px 14px',
                          background: tokenCopied ? '#15803d' : 'rgba(232, 185, 67, 0.15)',
                          border: '1px solid rgba(232, 185, 67, 0.35)',
                          color: tokenCopied ? '#fff' : '#F8D36A',
                          borderRadius: '10px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {tokenCopied ? '✓ Copied Booking ID' : '📋 Copy Booking ID'}
                      </button>

                      <a
                        href={`https://wa.me/918076515257?text=${encodeURIComponent(
                          `Hi Magnevents, I requested a ${category} in ${city} (Pass ID: ${refCode}) starting from ₹6,9xx. Name: ${name || 'Host'}, Date: ${eventDate}. Please connect me with the artist coordinator!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hero-tok99-submit-btn"
                        style={{ textDecoration: 'none' }}
                      >
                        <span>Open WhatsApp with Pass ➔</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="seo-hero-header">
            <h1 className="seo-hero-title">
              <span className="seo-hero-gradient-text">{heroTitle}</span>
            </h1>
            <p className="seo-hero-subtitle">
              {heroSubtitle || `Book verified, celebrated ${category}s directly for weddings, private mehfils, corporate galas & celebrations in ${city}. Over 5,000+ live events successfully executed across India.`}
            </p>

            {/* Social Proof & Urgency Bar */}
            <div className="seo-live-social-proof">
              <span className="seo-live-dot" />
              <span className="seo-live-text">
                🔥 <strong>4 Event Hosts</strong> in {city} requested quotes this week · Avg reply <strong>6 mins</strong>
              </span>
            </div>

            {/* Quick Query Pills */}
            <div className="seo-query-pills" role="tablist" aria-label="Event category options">
              {eventTypes.map((type) => {
                let icon = '🎵';
                if (type.includes('Wedding') || type.includes('Sangeet')) icon = '💍';
                else if (type.includes('Club') || type.includes('EDM') || type.includes('After-Party')) icon = '🎧';
                else if (type.includes('House') || type.includes('Pool') || type.includes('Party')) icon = '🎉';
                else if (type.includes('Ghazal') || type.includes('Mehfil')) icon = '🍷';
                else if (type.includes('Corporate') || type.includes('Gala')) icon = '🏢';
                else if (type.includes('Fest') || type.includes('Concert')) icon = '⚡';
                else if (type.includes('Comedy') || type.includes('Standup')) icon = '🎙️';

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedEventType(type)}
                    className={`seo-query-chip ${selectedEventType === type ? 'active' : ''}`}
                  >
                    <span>{icon}</span>
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================================================
           1.5 MOBILE-ONLY INSTANT HERO LEAD FORM (Direct One-Tap Contact on Mobile)
           ========================================================================== */}
        {!isSpecialTokenPage && (
          <div ref={mobFormRef} className="seo-mob-hero-form-card">
          {!isSubmitted ? (
            <form onSubmit={handleInlineSubmit} className="seo-mob-form-inner">
              <div className="seo-mob-form-header">
                <div className="seo-mob-form-tag">
                  <span className="seo-mob-form-dot" />
                  <span>⚡ INSTANT AVAILABILITY &amp; QUOTE</span>
                </div>
                <h3 className="seo-mob-form-title">
                  Get Verified {category}s in {city}
                </h3>
                <p className="seo-mob-form-sub">
                  Direct artist rates sent to your WhatsApp in 5 mins
                </p>
              </div>

              {selectedArtist && (
                <div className="seo-mob-selected-artist">
                  <span>🎯 Selected: <strong>{selectedArtist.name}</strong> (~₹{selectedArtist.price_min ? selectedArtist.price_min.toLocaleString('en-IN') : '10,000'})</span>
                  <button type="button" onClick={() => setSelectedArtist(null)} aria-label="Clear artist selection">✕</button>
                </div>
              )}

              {/* Mobile Phone Input */}
              <div className="seo-mob-input-group">
                <label htmlFor="seo-mob-phone" className="sr-only">WhatsApp or Mobile Number</label>
                <div className="seo-mob-phone-wrap">
                  <span className="seo-mob-phone-prefix">🇮🇳 +91</span>
                  <input
                    ref={mobPhoneInputRef}
                    id="seo-mob-phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="Enter 10-digit WhatsApp number"
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(digits);
                      if (phoneError) setPhoneError("");
                    }}
                    className="seo-mob-phone-input"
                    required
                  />
                </div>
                {phoneError && <span className="seo-mob-input-error">{phoneError}</span>}
              </div>

              {/* Quick Select Row: Event Type & Date */}
              <div className="seo-mob-row-inputs">
                <div className="seo-mob-select-wrap">
                  <select
                    id="seo-mob-event-type"
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    className="seo-mob-select-control"
                    aria-label="Select event type"
                  >
                    {eventTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="seo-mob-date-wrap">
                  <input
                    id="seo-mob-date"
                    type="date"
                    min={getMinDate()}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="seo-mob-date-control"
                    aria-label="Select event date"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Direct Submit Action */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="seo-mob-btn-submit"
              >
                {isSubmitting ? (
                  <span>⏳ Checking Availability...</span>
                ) : (
                  <span>⚡ Get Verified {category} Quotes ➔</span>
                )}
              </button>

              {/* WhatsApp Secondary Fast Connect */}
              <button
                type="button"
                onClick={handleWhatsAppQuote}
                className="seo-mob-btn-whatsapp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.437 0 9.857-4.403 9.86-9.809.001-2.618-1.01-5.08-2.858-6.93C16.528 2.015 14.07 1.006 11.453 1.006c-5.434 0-9.852 4.403-9.855 9.81-.001 2.062.54 4.079 1.566 5.86l-.99 3.613 3.712-.977zm11.304-6.816c-.302-.15-1.788-.882-2.066-.983-.277-.101-.478-.15-.678.15-.2.3-.775.983-.95 1.185-.175.201-.35.227-.652.076-.302-.15-1.274-.469-2.427-1.498-.897-.8-1.502-1.788-1.678-2.09-.175-.302-.019-.465.132-.615.136-.135.302-.35.454-.526.15-.176.2-.302.302-.503.101-.2.05-.376-.026-.526-.075-.15-.678-1.636-.93-2.243-.244-.59-.493-.51-.678-.518-.176-.008-.377-.01-.578-.01-.2 0-.527.075-.803.376-.277.301-1.055 1.031-1.055 2.516 0 1.485 1.079 2.921 1.229 3.122.15.2 2.125 3.245 5.148 4.549.719.311 1.28.497 1.717.637.722.23 1.38.197 1.901.12.58-.087 1.788-.73 2.04-1.435.252-.703.252-1.306.176-1.435-.076-.13-.277-.201-.578-.352z"/>
                </svg>
                <span>Chat Directly on WhatsApp</span>
              </button>

              <div className="seo-mob-form-guarantee">
                <span>🔒 100% Free</span>
                <span>•</span>
                <span>🛡️ 100% Arrival</span>
                <span>•</span>
                <span>⚡ 0% Markup</span>
              </div>
            </form>
          ) : (
            <div className="seo-mob-success-card">
              <div className="seo-mob-success-badge">✓</div>
              <h4>Inquiry Received for {city}!</h4>
              {refCode && (
                <div className="seo-mob-success-ref">
                  REF: {refCode}
                </div>
              )}
              <p>
                Our artist coordinator will send available <strong>{category}</strong> profiles to your WhatsApp at <strong>+91 {phone}</strong> within 5 minutes.
              </p>
              <a
                href={`https://wa.me/918076515257?text=${encodeURIComponent(`Hi Magnevents, I just requested ${category} quotes in ${city} (Ref: ${refCode}). Please share available artist profiles!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="seo-mob-btn-whatsapp"
                style={{ marginTop: '8px' }}
              >
                <span>Open WhatsApp Now ➔</span>
              </a>
            </div>
          )}
        </div>
        )}
        </div>
      </div>

      {/* 2. MAIN CONTENT SECTIONS: Sit on seamless Velvet Obsidian background */}
      <div className="seo-sections-body">
        <div className="seo-hero-container">

        {/* ==========================================================================
           2. Top 5 Verified Artists Showcase Section OR Specialized DJ/Category Showcase
           ========================================================================== */}
        {topArtists && topArtists.length > 0 ? (
          <div className="seo-top-artists-section">
            <div className="seo-section-head-v2">
              <div>
                <span className="badge">👑 TOP 5 CURATED PERFORMERS</span>
                <h2>Top 5 Verified {category}s for {city}</h2>
                <p>Browse verified live performer profiles, authentic stage photos & client ratings.</p>
              </div>
              <Link href="/artists" className="seo-browse-all-link">
                <span>Browse All 500+ Artists</span>
                <span>→</span>
              </Link>
            </div>

            {/* 5 Cards Grid with Images */}
            <div className="seo-artists-cards-grid">
              {topArtists.map((artist, idx) => {
                const isSelected = selectedArtist?.id === artist.id;
                const imgSrc = (imageErrors[artist.id] || !artist.img)
                  ? DEFAULT_FALLBACK_IMAGE
                  : artist.img;

                return (
                  <article
                    key={artist.id || idx}
                    className={`seo-artist-card ${isSelected ? 'is-active-selection' : ''}`}
                    onClick={() => handleSelectArtist(artist)}
                  >
                    {/* Image Area */}
                    <div className="seo-card-img-wrap">
                      <Image
                        src={imgSrc}
                        alt={`Photo of ${artist.name}`}
                        fill
                        sizes="(max-width: 768px) 260px, (max-width: 1200px) 25vw, 20vw"
                        style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
                        onError={() => handleImageError(artist.id)}
                        loading={idx < 3 ? "eager" : "lazy"}
                        priority={idx < 2}
                      />
                      <div className="seo-card-gradient-overlay" />

                      {/* Floating Verified Performer Badge (No Location) */}
                      <span className="seo-card-verified-badge">
                        <span className="seo-verified-sparkle">✦</span>
                        <span>Verified Artist</span>
                      </span>

                      {/* Floating Rating Badge */}
                      <span className="seo-card-rating-badge">
                        <span className="seo-star-icon">★</span>
                        <span>{Number(artist.rating || 5).toFixed(1)}</span>
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="seo-card-body">
                      <div className="seo-card-info-wrap">
                        <span className="seo-card-category-tag" title={artist.subCategory || artist.category}>
                          {artist.subCategory ? artist.subCategory.split(',').slice(0, 2).join(' · ') : artist.category}
                        </span>
                        <h3 className="seo-card-name" title={artist.name}>
                          {artist.name}
                        </h3>
                        <div className="seo-card-trust-row">
                          <span className="seo-card-live-dot" />
                          <span className="seo-card-events-count">
                            {artist.successful_bookings || 25}+ Verified Shows
                          </span>
                          <span className="seo-card-divider-bullet">•</span>
                          <span className="seo-card-guarantee-tag">Stage Verified</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="seo-card-actions">
                        <button
                          type="button"
                          className="seo-card-btn-book"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBookModal(artist);
                          }}
                        >
                          <span>Book Now</span>
                          <span className="seo-card-btn-arrow">→</span>
                        </button>

                        <Link
                          href={`/artist/${artist.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="seo-card-btn-profile"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Profile
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="seo-top-artists-section">
            <div className="seo-section-head-v2">
              <div>
                <span className="badge">🎧 DIRECT {category.toUpperCase()} CURATION & SOUND PRODUCTION</span>
                <h2>{isDJ ? `Top Verified DJs & Sound Systems for ${city}` : `Top Verified ${category}s for ${city}`}</h2>
                <p>
                  {isDJ
                    ? `Get customized DJ quotes tailored to your exact music taste with Pioneer CDJ consoles, high-output line arrays & live Punjabi dhol.`
                    : `Direct artist pricing, verified performance ratings, and complete stage & sound coordination by Magnevents.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBookModal(null)}
                className="seo-browse-all-link"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#E8B943' }}
              >
                <span>⚡ Check Live Availability</span>
                <span>→</span>
              </button>
            </div>

            {isDJ ? (
              <div className="seo-dj-features-grid">
                {/* Card 1: Pioneer DJ Consoles & Sound */}
                <div
                  className="seo-dj-feat-card"
                  onClick={() => {
                    setSelectedEventType('Wedding DJ & Sangeet');
                    handleOpenBookModal(null);
                  }}
                >
                  <div className="seo-dj-feat-img-wrap">
                    <Image
                      src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80"
                      alt="Pioneer DJ Consoles and Line Array Sound Systems"
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: 'cover' }}
                      loading="eager"
                    />
                    <div className="seo-dj-feat-overlay" />
                    <span className="seo-dj-feat-tag">Included in Setup</span>
                    <span className="seo-dj-feat-icon-bubble">🎛️</span>
                  </div>
                  <div className="seo-dj-feat-body">
                    <h4>Pioneer DJ Consoles &amp; Sound</h4>
                    <div className="seo-dj-feat-tags-list">
                      <span className="seo-dj-feat-mini-tag">🎛️ Pioneer CDJ/XDJ</span>
                      <span className="seo-dj-feat-mini-tag">🔊 JBL/RCF Audio</span>
                      <span className="seo-dj-feat-mini-tag">🎙️ Dual Wireless Mics</span>
                    </div>
                    <div className="seo-dj-feat-action-hint">
                      <span>Check Live Setup</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Live Punjabi Dhol Duo */}
                <div
                  className="seo-dj-feat-card"
                  onClick={() => {
                    setSelectedEventType('Wedding DJ & Sangeet');
                    handleOpenBookModal(null);
                  }}
                >
                  <div className="seo-dj-feat-img-wrap">
                    <Image
                      src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80"
                      alt="Live Punjabi Dhol Duo for Weddings and Sangeet"
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: 'cover' }}
                      loading="eager"
                    />
                    <div className="seo-dj-feat-overlay" />
                    <span className="seo-dj-feat-tag highlight">Most Requested</span>
                    <span className="seo-dj-feat-icon-bubble">🥁</span>
                  </div>
                  <div className="seo-dj-feat-body">
                    <h4>Live Punjabi Dhol Duo</h4>
                    <div className="seo-dj-feat-tags-list">
                      <span className="seo-dj-feat-mini-tag">🥁 High-Voltage Baraat</span>
                      <span className="seo-dj-feat-mini-tag">🔥 Sangeet Energy</span>
                      <span className="seo-dj-feat-mini-tag">⚡ 2 Dhol Masters</span>
                    </div>
                    <div className="seo-dj-feat-action-hint">
                      <span>Add to Booking</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Custom Curated Genres */}
                <div
                  className="seo-dj-feat-card"
                  onClick={() => {
                    setSelectedEventType('Club & After-Party');
                    handleOpenBookModal(null);
                  }}
                >
                  <div className="seo-dj-feat-img-wrap">
                    <Image
                      src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80"
                      alt="Bollywood, EDM and Punjabi DJ Party Crowd"
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: 'cover' }}
                      loading="eager"
                    />
                    <div className="seo-dj-feat-overlay" />
                    <span className="seo-dj-feat-tag">100% Tailored</span>
                    <span className="seo-dj-feat-icon-bubble">🎶</span>
                  </div>
                  <div className="seo-dj-feat-body">
                    <h4>Curated Genre Playlists</h4>
                    <div className="seo-dj-feat-tags-list">
                      <span className="seo-dj-feat-mini-tag">🎵 Bollywood Hits</span>
                      <span className="seo-dj-feat-mini-tag">🎧 Commercial EDM</span>
                      <span className="seo-dj-feat-mini-tag">💃 Punjabi &amp; 90s</span>
                    </div>
                    <div className="seo-dj-feat-action-hint">
                      <span>Choose Playlist</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Stage Lights, SFX & Cold Pyro */}
                <div
                  className="seo-dj-feat-card"
                  onClick={() => {
                    setSelectedEventType('Private House & Pool Party');
                    handleOpenBookModal(null);
                  }}
                >
                  <div className="seo-dj-feat-img-wrap">
                    <Image
                      src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80"
                      alt="Stage Lights, Sharpy Beams, SFX and Cold Pyro"
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: 'cover' }}
                      loading="eager"
                    />
                    <div className="seo-dj-feat-overlay" />
                    <span className="seo-dj-feat-tag">Special Effects</span>
                    <span className="seo-dj-feat-icon-bubble">🎆</span>
                  </div>
                  <div className="seo-dj-feat-body">
                    <h4>Stage Lighting &amp; SFX</h4>
                    <div className="seo-dj-feat-tags-list">
                      <span className="seo-dj-feat-mini-tag">💡 Moving Sharpy Beams</span>
                      <span className="seo-dj-feat-mini-tag">✨ Cold Sparklers</span>
                      <span className="seo-dj-feat-mini-tag">💨 Smoke &amp; Haze FX</span>
                    </div>
                    <div className="seo-dj-feat-action-hint">
                      <span>View SFX Options</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="seo-dj-features-grid">
                <div
                  className="seo-dj-feat-card"
                  onClick={() => {
                    handleOpenAvailabilityModal(null);
                  }}
                >
                  <div className="seo-dj-feat-img-wrap">
                    <Image
                      src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80"
                      alt={`Verified Live ${category}s`}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: 'cover' }}
                      loading="eager"
                    />
                    <div className="seo-dj-feat-overlay" />
                    <span className="seo-dj-feat-tag">Verified Talent</span>
                    <span className="seo-dj-feat-icon-bubble">🎙️</span>
                  </div>
                  <div className="seo-dj-feat-body">
                    <h4>Top Live {category}s</h4>
                    <div className="seo-dj-feat-tags-list">
                      <span className="seo-dj-feat-mini-tag">🎙️ Celebrated Vocalists</span>
                      <span className="seo-dj-feat-mini-tag">🛡️ Arrival Guarantee</span>
                      <span className="seo-dj-feat-mini-tag">⭐ 4.9+ Rated Shows</span>
                    </div>
                    <div className="seo-dj-feat-action-hint">
                      <span>Check Availability</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>

                <div
                  className="seo-dj-feat-card"
                  onClick={() => {
                    handleOpenAvailabilityModal(null);
                  }}
                >
                  <div className="seo-dj-feat-img-wrap">
                    <Image
                      src="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80"
                      alt="Acoustic & Full Band Ensembles"
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: 'cover' }}
                      loading="eager"
                    />
                    <div className="seo-dj-feat-overlay" />
                    <span className="seo-dj-feat-tag highlight">Most Popular</span>
                    <span className="seo-dj-feat-icon-bubble">🎸</span>
                  </div>
                  <div className="seo-dj-feat-body">
                    <h4>Acoustic &amp; Full Band Setups</h4>
                    <div className="seo-dj-feat-tags-list">
                      <span className="seo-dj-feat-mini-tag">🎸 Acoustic Duos</span>
                      <span className="seo-dj-feat-mini-tag">🥁 5-Piece Stage Band</span>
                      <span className="seo-dj-feat-mini-tag">🎹 Digital Mixing</span>
                    </div>
                    <div className="seo-dj-feat-action-hint">
                      <span>Explore Setups</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>

                <div
                  className="seo-dj-feat-card"
                  onClick={() => {
                    handleOpenAvailabilityModal(null);
                  }}
                >
                  <div className="seo-dj-feat-img-wrap">
                    <Image
                      src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80"
                      alt="Diverse Music Genres"
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: 'cover' }}
                      loading="eager"
                    />
                    <div className="seo-dj-feat-overlay" />
                    <span className="seo-dj-feat-tag">100% Curated</span>
                    <span className="seo-dj-feat-icon-bubble">🎶</span>
                  </div>
                  <div className="seo-dj-feat-body">
                    <h4>Multi-Genre Repertoire</h4>
                    <div className="seo-dj-feat-tags-list">
                      <span className="seo-dj-feat-mini-tag">🍷 Sufi &amp; Ghazals</span>
                      <span className="seo-dj-feat-mini-tag">🎵 Bollywood Hits</span>
                      <span className="seo-dj-feat-mini-tag">⚡ Pop &amp; Rock</span>
                    </div>
                    <div className="seo-dj-feat-action-hint">
                      <span>Request Setlist</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>

                <div
                  className="seo-dj-feat-card"
                  onClick={() => {
                    handleOpenAvailabilityModal(null);
                  }}
                >
                  <div className="seo-dj-feat-img-wrap">
                    <Image
                      src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80"
                      alt="Sound & Stage Production"
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: 'cover' }}
                      loading="eager"
                    />
                    <div className="seo-dj-feat-overlay" />
                    <span className="seo-dj-feat-tag">End-to-End</span>
                    <span className="seo-dj-feat-icon-bubble">⚡</span>
                  </div>
                  <div className="seo-dj-feat-body">
                    <h4>Complete Sound Coordination</h4>
                    <div className="seo-dj-feat-tags-list">
                      <span className="seo-dj-feat-mini-tag">🔊 Digital PA Speakers</span>
                      <span className="seo-dj-feat-mini-tag">🎙️ Shure Stage Mics</span>
                      <span className="seo-dj-feat-mini-tag">🎧 Sound Technician</span>
                    </div>
                    <div className="seo-dj-feat-action-hint">
                      <span>Get Instant Quote</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================================================
           3. Live Performance Video Showcase ("Experience the Vibe" Carousel)
           ========================================================================== */}
        <VideoGridSection city={city} category={category} />

        {/* ==========================================================================
           4. Interactive 3-Tier Price Guide (Answers "How much does it cost?")
           ========================================================================== */}
        <div id="pricing" className="seo-pricing-guide-section">
          <div className="seo-section-head-v2" style={{ textAlign: 'center', justifyContent: 'center' }}>
            <div>
              <span className="badge">✨ TRANSPARENT PRICING PACKAGES</span>
              <h2><span className="lux-gold-gradient">{category} Pricing Packages</span> in {city}</h2>
              <p>Direct artist fees with zero middleman charges. Select a package to lock your date &amp; check live availability.</p>
            </div>
          </div>

          <div
            ref={pricingGridRef}
            onScroll={handleGridScroll}
            className="seo-pricing-cards-grid"
          >
            {budgetTiers.map((tier, idx) => (
              <div
                key={tier.id}
                className={`seo-tier-card ${tier.isPopular ? 'featured-tier' : ''} ${activeTierIndex === idx ? 'active-tier' : ''}`}
              >
                <div className="seo-tier-header">
                  <div className="seo-tier-tag-row">
                    {tier.isPopular ? (
                      <span className="seo-tier-badge">
                        <span className="seo-star-icon">★</span>
                        <span>MOST POPULAR IN {city.toUpperCase()}</span>
                      </span>
                    ) : (
                      <span className="seo-tier-kicker">
                        {tier.id.includes('band') || tier.id.includes('ensemble') || tier.id.includes('celebrity') || tier.id.includes('headliner') || tier.id.includes('concert') || tier.id.includes('mega')
                          ? '👑 GRAND PRODUCTION & CONCERT'
                          : '✦ INTIMATE GATHERINGS'}
                      </span>
                    )}
                  </div>
                  <h4>{tier.title}</h4>
                  <div className={`seo-tier-price ${tier.isPopular ? 'featured-price' : ''}`}>
                    {tier.price}
                  </div>
                </div>

                <ul className="seo-tier-features">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx}>
                      <span className="feat-check">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSelectTier(tier)}
                  className={`seo-tier-btn ${tier.isPopular ? 'seo-tier-btn-featured' : ''}`}
                >
                  <span>Check Availability</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            ))}
          </div>

          {/* Mobile Pricing Carousel Dots Indicator */}
          <div className="seo-pricing-dots-wrap" aria-label="Pricing Packages Navigation">
            {budgetTiers.map((tier, idx) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => scrollToTierIndex(idx)}
                className={`seo-pricing-dot ${activeTierIndex === idx ? 'active' : ''} ${tier.isPopular ? 'dot-popular' : ''}`}
                aria-label={`View ${tier.title} package`}
              >
                {tier.isPopular && <span className="dot-star">★</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ==========================================================================
           5. Direct 1-Step Lead Engine & VIP Artist Concierge Ribbon
           ========================================================================== */}
        <div ref={formRef} id="seo-lead-form" className="seo-interactive-booking-card">
          {!isSubmitted ? (
            <form onSubmit={handleInlineSubmit} className="seo-concierge-form">
              <div className="seo-booking-header">
                <div className="seo-booking-title-group">
                  <div className="seo-booking-eyebrow">
                    <span className="seo-pulse-dot-green" />
                    <span>VIP CONCIERGE • 5-MIN FAST RESPONSE</span>
                  </div>
                  <h3 className="seo-booking-title">
                    Get Instant <span className="lux-gold-gradient">{category} Price List</span> &amp; Availability in {city}
                  </h3>
                  <p>Direct artist rates sent to your WhatsApp in 5 minutes • Zero spam guarantee</p>
                </div>
                <div className="seo-fast-response-tag">
                  <span className="seo-pulse-dot-green" />
                  <span>Avg 5-Min WhatsApp Reply</span>
                </div>
              </div>

              {/* If user clicked an artist to feature in inquiry */}
              <AnimatePresence>
                {selectedArtist && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="seo-selected-artist-bar"
                  >
                    <span>
                      🎯 Target Performer Selected: <strong>{selectedArtist.name}</strong> (~₹{selectedArtist.price_min?.toLocaleString('en-IN')})
                    </span>
                    <button type="button" onClick={() => setSelectedArtist(null)}>
                      Clear selection
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Modern Compact Input Grid */}
              <div className="seo-booking-grid">
                {/* Mobile / WhatsApp Number (PRIMARY HIGH-CONVERTING INPUT) */}
                <div className="seo-input-group">
                  <label htmlFor="seo-phone">
                    <span>WhatsApp Number</span>
                    <span className="seo-label-req">*</span>
                  </label>
                  <div className="seo-phone-input-wrap">
                    <span className="seo-phone-prefix">
                      <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="seo-flag-svg">
                        <rect width="18" height="4" fill="#FF9933" />
                        <rect y="4" width="18" height="4" fill="#FFFFFF" />
                        <rect y="8" width="18" height="4" fill="#138808" />
                        <circle cx="9" cy="6" r="1.5" stroke="#000088" strokeWidth="0.6" fill="none" />
                      </svg>
                      <span>+91</span>
                    </span>
                    <input
                      ref={phoneInputRef}
                      id="seo-phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(digits);
                        if (phoneError) setPhoneError("");
                      }}
                      className="seo-phone-input"
                      required
                    />
                  </div>
                  {phoneError && <span className="seo-input-error">{phoneError}</span>}
                </div>

                {/* Event Type */}
                <div className="seo-input-group">
                  <label htmlFor="seo-event-type">
                    <span>Event Type</span>
                  </label>
                  <div className="seo-select-wrap">
                    <select
                      id="seo-event-type"
                      value={selectedEventType}
                      onChange={(e) => setSelectedEventType(e.target.value)}
                      className="seo-input-control"
                    >
                      {eventTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Event Date */}
                <div className="seo-input-group">
                  <label htmlFor="seo-event-date">
                    <span>Event Date</span>
                  </label>
                  <div className="seo-date-wrap">
                    <input
                      id="seo-event-date"
                      type="date"
                      min={getMinDate()}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="seo-input-control"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Name (Optional for zero-friction) */}
                <div className="seo-input-group">
                  <label htmlFor="seo-name">
                    <span>Your Name <span className="seo-label-opt">(Optional)</span></span>
                  </label>
                  <input
                    id="seo-name"
                    type="text"
                    placeholder="E.g. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="seo-input-control"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="seo-booking-actions">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="seo-btn-submit"
                >
                  {isSubmitting ? (
                    <span>⏳ Checking Availability...</span>
                  ) : (
                    <>
                      <span>Send Me Available Artists &amp; Price List</span>
                      <span className="seo-btn-arrow">→</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppQuote}
                  className="seo-btn-whatsapp"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.437 0 9.857-4.403 9.86-9.809.001-2.618-1.01-5.08-2.858-6.93C16.528 2.015 14.07 1.006 11.453 1.006c-5.434 0-9.852 4.403-9.855 9.81-.001 2.062.54 4.079 1.566 5.86l-.99 3.613 3.712-.977zm11.304-6.816c-.302-.15-1.788-.882-2.066-.983-.277-.101-.478-.15-.678.15-.2.3-.775.983-.95 1.185-.175.201-.35.227-.652.076-.302-.15-1.274-.469-2.427-1.498-.897-.8-1.502-1.788-1.678-2.09-.175-.302-.019-.465.132-.615.136-.135.302-.35.454-.526.15-.176.2-.302.302-.503.101-.2.05-.376-.026-.526-.075-.15-.678-1.636-.93-2.243-.244-.59-.493-.51-.678-.518-.176-.008-.377-.01-.578-.01-.2 0-.527.075-.803.376-.277.301-1.055 1.031-1.055 2.516 0 1.485 1.079 2.921 1.229 3.122.15.2 2.125 3.245 5.148 4.549.719.311 1.28.497 1.717.637.722.23 1.38.197 1.901.12.58-.087 1.788-.73 2.04-1.435.252-.703.252-1.306.176-1.435-.076-.13-.277-.201-.578-.352z"/>
                  </svg>
                  <span>Chat on WhatsApp</span>
                </button>
              </div>

              <div className="seo-form-guarantee-note">
                <span className="seo-trust-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8B943" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>100% Free Service</span>
                </span>
                <span className="seo-trust-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8B943" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  <span>Direct Artist Pricing</span>
                </span>
                <span className="seo-trust-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8B943" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                  <span>100% Arrival Guarantee</span>
                </span>
                <span className="seo-trust-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8B943" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  <span>Zero Spam Policy</span>
                </span>
              </div>
            </form>
          ) : (
            /* Instant Animated Success Confirmation Screen */
            <div className="seo-success-box">
              <div className="seo-success-icon">✓</div>
              <h3>Inquiry Received for {city}!</h3>
              {refCode && (
                <div style={{
                  display: 'inline-block',
                  margin: '0 auto 12px',
                  padding: '4px 14px',
                  background: 'rgba(232, 185, 67,  0.15)',
                  border: '1px solid rgba(232, 185, 67,  0.4)',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#E8B943',
                  letterSpacing: '0.05em'
                }}>
                  BOOKING REF: {refCode}
                </div>
              )}
              <p>
                Thank you{name ? `, ${name}` : ''}! Our dedicated {city} entertainment manager is preparing available {category} profiles, video clips, and customized price packages for your event on {eventDate}.
              </p>
              <div className="seo-success-actions">
                <button
                  type="button"
                  onClick={handleWhatsAppQuote}
                  className="seo-btn-whatsapp"
                  style={{ minWidth: '240px' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.437 0 9.857-4.403 9.86-9.809.001-2.618-1.01-5.08-2.858-6.93C16.528 2.015 14.07 1.006 11.453 1.006c-5.434 0-9.852 4.403-9.855 9.81-.001 2.062.54 4.079 1.566 5.86l-.99 3.613 3.712-.977zm11.304-6.816c-.302-.15-1.788-.882-2.066-.983-.277-.101-.478-.15-.678.15-.2.3-.775.983-.95 1.185-.175.201-.35.227-.652.076-.302-.15-1.274-.469-2.427-1.498-.897-.8-1.502-1.788-1.678-2.09-.175-.302-.019-.465.132-.615.136-.135.302-.35.454-.526.15-.176.2-.302.302-.503.101-.2.05-.376-.026-.526-.075-.15-.678-1.636-.93-2.243-.244-.59-.493-.51-.678-.518-.176-.008-.377-.01-.578-.01-.2 0-.527.075-.803.376-.277.301-1.055 1.031-1.055 2.516 0 1.485 1.079 2.921 1.229 3.122.15.2 2.125 3.245 5.148 4.549.719.311 1.28.497 1.717.637.722.23 1.38.197 1.901.12.58-.087 1.788-.73 2.04-1.435.252-.703.252-1.306.176-1.435-.076-.13-.277-.201-.578-.352z"/>
                  </svg>
                  <span>Open WhatsApp to Fast-Track</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>



      {/* ==========================================================================
         7. Quick Tier Availability Modal (1-Step Phone Only Form)
         ========================================================================== */}
      {mounted && typeof document !== 'undefined' ? (
        createPortal(
          <AnimatePresence>
            {tierModalOpen && activeTier && (
              <motion.div
                className="seo-tier-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setTierModalOpen(false)}
                onWheel={(e) => {
                  if (e.target === e.currentTarget) e.preventDefault();
                }}
                onTouchMove={(e) => {
                  if (e.target === e.currentTarget) e.preventDefault();
                }}
              >
                <motion.div
                  className="seo-tier-modal-card"
                  initial={{ scale: 0.94, opacity: 0, y: 16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.94, opacity: 0, y: 16 }}
                  transition={{ type: "spring", damping: 26, stiffness: 340 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="seo-tier-modal-close"
                    onClick={() => setTierModalOpen(false)}
                    aria-label="Close dialog"
                  >
                    ✕
                  </button>

                  {!quickSubmitted ? (
                    <form onSubmit={handleQuickTierSubmit}>
                      <div className="seo-tier-modal-tag">
                        <span className="seo-tier-modal-dot" />
                        <span>Live Availability Check</span>
                      </div>

                      <h3 className="seo-tier-modal-title">
                        Check <span className="seo-modal-title-accent">Live Availability</span>
                      </h3>

                      <div className="seo-tier-selected-box">
                        <div className="seo-tier-selected-left">
                          <span className="seo-tier-selected-kicker">
                            {activeTier.isArtist ? '✦ Direct Artist Booking' : '✦ Verified Artist Tier'}
                          </span>
                          <h5>{activeTier.title}</h5>
                          <span className="seo-tier-selected-loc">📍 {city} • {category}</span>
                        </div>
                        <div className="seo-tier-selected-price-col">
                          <span className="seo-tier-price-kicker">Estimated Range</span>
                          <div className="seo-tier-selected-price">
                            {activeTier.price}
                          </div>
                          <span className="seo-tier-price-guarantee">0% Middleman Fees</span>
                        </div>
                      </div>

                      <div className="seo-tier-form-surface">
                        <div className="seo-tier-assurance-strip">
                          <div className="seo-tier-assurance-item">
                            <span className="seo-assurance-pill">Direct Rates</span>
                            <span className="seo-assurance-val">0% Middleman</span>
                          </div>
                          <div className="seo-tier-assurance-item featured">
                            <span className="seo-assurance-pill">WhatsApp ⚡</span>
                            <span className="seo-assurance-val">Reply in 5 Mins</span>
                          </div>
                          <div className="seo-tier-assurance-item">
                            <span className="seo-assurance-pill">Guaranteed</span>
                            <span className="seo-assurance-val">100% Protected</span>
                          </div>
                        </div>

                        <label className="seo-tier-phone-label" htmlFor="seo-quick-phone">
                          WhatsApp / Mobile Number
                        </label>

                        <div className="seo-tier-phone-wrap">
                          <div className="seo-tier-phone-flag">
                            <svg className="seo-flag-svg" viewBox="0 0 30 20" width="20" height="14" aria-hidden="true">
                              <rect width="30" height="6.67" fill="#FF9933" />
                              <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
                              <rect y="13.34" width="30" height="6.67" fill="#138808" />
                              <circle cx="15" cy="10" r="2.2" fill="#000080" />
                            </svg>
                            <span>+91</span>
                          </div>
                          <input
                            ref={quickPhoneRef}
                            id="seo-quick-phone"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={quickPhone}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setQuickPhone(digits);
                              if (quickPhoneError) setQuickPhoneError("");
                            }}
                            placeholder="Enter 10-digit mobile number"
                            className="seo-tier-phone-input"
                            maxLength={10}
                            autoFocus
                          />
                        </div>

                        {quickPhoneError && (
                          <span className="seo-tier-phone-err">{quickPhoneError}</span>
                        )}

                        <button
                          type="submit"
                          disabled={quickSubmitting}
                          className="seo-tier-submit-btn"
                        >
                          {quickSubmitting ? (
                            <span>⏳ Checking Live Availability...</span>
                          ) : (
                            <>
                              <span>Check Availability &amp; Send Quotes</span>
                              <span>→</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="seo-tier-success-box">
                      <div className="seo-tier-success-icon">✓</div>
                      <h3 className="seo-tier-modal-title" style={{ color: '#10b981' }}>
                        Availability Request Sent!
                      </h3>
                      <p className="seo-tier-success-desc">
                        We received your check for <strong>{activeTier.title}</strong> ({activeTier.price}) in <strong>{city}</strong>. Our artist coordinator will WhatsApp verified singer availability and video clips to <strong>{quickPhone}</strong> within 6 minutes.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                        <a
                          href={`https://wa.me/918076515257?text=${encodeURIComponent(`Hi Magnevents, I just requested availability for ${activeTier.title} (${activeTier.price}) in ${city}. Please share available artists.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="seo-btn-whatsapp"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.437 0 9.857-4.403 9.86-9.809.001-2.618-1.01-5.08-2.858-6.93C16.528 2.015 14.07 1.006 11.453 1.006c-5.434 0-9.852 4.403-9.855 9.81-.001 2.062.54 4.079 1.566 5.86l-.99 3.613 3.712-.977zm11.304-6.816c-.302-.15-1.788-.882-2.066-.983-.277-.101-.478-.15-.678.15-.2.3-.775.983-.95 1.185-.175.201-.35.227-.652.076-.302-.15-1.274-.469-2.427-1.498-.897-.8-1.502-1.788-1.678-2.09-.175-.302-.019-.465.132-.615.136-.135.302-.35.454-.526.15-.176.2-.302.302-.503.101-.2.05-.376-.026-.526-.075-.15-.678-1.636-.93-2.243-.244-.59-.493-.51-.678-.518-.176-.008-.377-.01-.578-.01-.2 0-.527.075-.803.376-.277.301-1.055 1.031-1.055 2.516 0 1.485 1.079 2.921 1.229 3.122.15.2 2.125 3.245 5.148 4.549.719.311 1.28.497 1.717.637.722.23 1.38.197 1.901.12.58-.087 1.788-.73 2.04-1.435.252-.703.252-1.306.176-1.435-.076-.13-.277-.201-.578-.352z"/>
                          </svg>
                          <span>Fast-Track on WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setTierModalOpen(false)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#cbd5e1',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600
                          }}
                        >
                          Done / Close
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      ) : null}      {/* ==========================================================================
         8. Booking & Date-Lock Offer Modal (Designed per Diwali Offer System)
         ========================================================================== */}
      <AnimatePresence>
        {bookModalOpen && (
          <div
            className="diw-modal-root"
            onClick={(e) => {
              if (e.target === e.currentTarget) setBookModalOpen(false);
            }}
          >
            <motion.div
              className="diw-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookModalOpen(false)}
            />

            <motion.div
              className="diw-modal-card"
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. WINE RED PROMOTIONAL HERO BANNER */}
              <div className={`diw-promo-header ${bookSubmitted ? 'is-success-header' : ''}`}>
                <div className="diw-header-top">
                  <div className="diw-badge-tag">
                    <span>🎁</span>
                    <span>{bookSubmitted ? 'OFFICIAL PASS' : 'FIRST BOOKING WELCOME OFFER'}</span>
                  </div>

                  <button
                    type="button"
                    className="diw-close-btn"
                    onClick={() => setBookModalOpen(false)}
                    aria-label="Close offer modal"
                  >
                    ✕
                  </button>
                </div>

                {!bookSubmitted && (
                  <>
                    <h2 className="diw-title">Your Dream Event Starts Here!</h2>
                    <div className="diw-date-lock-card">
                      <div className="diw-lock-info-col">
                        <span className="diw-lock-badge">✨ NEW USER WELCOME DEAL</span>
                        <span className="diw-lock-headline">
                          {modalArtist ? modalArtist.name : 'Live Singers Starting at 30%–70% Off'}
                        </span>
                      </div>
                      <div className="diw-lock-price-badge">
                        <span className="diw-lock-original-price">
                          ₹{modalArtist?.price_max ? modalArtist.price_max.toLocaleString('en-IN') : '10,000'}
                        </span>
                        <span className="diw-lock-current-price">
                          ₹{modalArtist?.price_min ? modalArtist.price_min.toLocaleString('en-IN') : '5,999'}
                        </span>
                        <span className="diw-lock-price-lbl">STARTING FROM</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!bookSubmitted ? (
                /* 2. WARM IVORY FORM BODY */
                <div className="diw-form-body">
                  {/* Triple Discount Showcase Grid */}
                  <div className="diw-triple-discount-wrap">
                    <div className="diw-triple-discount-header">
                      <span>GET 30% TO 70% OFF ON YOUR BOOKING</span>
                    </div>
                    <div className="diw-triple-cards-grid">
                      {/* Card 1: Base Offer */}
                      <div className="diw-triple-card">
                        <span className="diw-triple-pill">BASE OFFER</span>
                        <span className="diw-triple-val">30%–50% OFF</span>
                        <span className="diw-triple-lbl">Instant Event Discount</span>
                      </div>

                      {/* Card 2: Welcome Gift (Featured for 1st-time user) */}
                      <div className="diw-triple-card diw-triple-card-featured">
                        <span className="diw-triple-pill diw-pill-gold">1ST TIME USER 🎁</span>
                        <span className="diw-triple-val diw-val-gold">+15% EXTRA OFF</span>
                        <span className="diw-triple-lbl diw-lbl-gold">Code: FIRST15</span>
                      </div>

                      {/* Card 3: Date Lock Bonus */}
                      <div className="diw-triple-card">
                        <span className="diw-triple-pill">DATE LOCK BONUS ⚡</span>
                        <span className="diw-triple-val">+5% EXTRA</span>
                        <span className="diw-triple-lbl">Early Date Lock-In</span>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <form className="diw-form" onSubmit={handleBookModalSubmit}>
                    <div className="diw-form-grid">
                      {/* Full Name */}
                      <div className="diw-form-group">
                        <label htmlFor="seo-modal-name">
                          Full Name <span className="req">*</span>
                        </label>
                        <input
                          id="seo-modal-name"
                          ref={bookNameInputRef}
                          type="text"
                          required
                          placeholder="e.g. Avneesh Tripathi"
                          autoComplete="off"
                          value={bookName}
                          onChange={(e) => {
                            setBookName(e.target.value);
                            if (bookNameError) setBookNameError("");
                          }}
                          className={bookNameError ? 'diw-input-err' : ''}
                        />
                        {bookNameError && <span className="diw-err-msg">{bookNameError}</span>}
                      </div>

                      {/* Mobile Number */}
                      <div className="diw-form-group">
                        <label htmlFor="seo-modal-phone">
                          Mobile Number <span className="req">*</span>
                        </label>
                        <input
                          id="seo-modal-phone"
                          ref={bookPhoneInputRef}
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          required
                          placeholder="+91 98765-43210"
                          autoComplete="off"
                          value={bookPhone}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setBookPhone(digits);
                            if (bookPhoneError) setBookPhoneError("");
                          }}
                          className={bookPhoneError ? 'diw-input-err' : ''}
                        />
                        {bookPhoneError && <span className="diw-err-msg">{bookPhoneError}</span>}
                      </div>

                      {/* Event Type */}
                      <div className="diw-form-group">
                        <label htmlFor="seo-modal-event-type">
                          Event Type <span className="req">*</span>
                        </label>
                        <select
                          id="seo-modal-event-type"
                          value={bookEventType}
                          onChange={(e) => setBookEventType(e.target.value)}
                        >
                          {MODAL_EVENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Estimated Event Budget */}
                      <div className="diw-form-group">
                        <label htmlFor="seo-modal-budget">
                          Estimated Event Budget <span className="req">*</span>
                        </label>
                        <select
                          id="seo-modal-budget"
                          value={bookBudgetAmount}
                          onChange={(e) => setBookBudgetAmount(Number(e.target.value))}
                        >
                          {BUDGET_OPTIONS.map((tier) => (
                            <option key={tier.value} value={tier.value}>
                              {tier.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={bookSubmitting}
                      className="diw-submit-btn"
                    >
                      <span>{bookSubmitting ? 'Checking Availability...' : 'Unlock My Offer & Lock Date →'}</span>
                    </button>
                    <p className="diw-trust-line">
                      Lock your discount for any event date • No hidden charges
                    </p>
                  </form>
                </div>
              ) : (
                /* 3. SUCCESS STATE */
                <div className="diw-success-card">
                  <div className="diw-success-icon-wrap">
                    <div className="diw-success-icon">✓</div>
                  </div>
                  <h3 className="diw-success-title">Your Welcome Offer is Unlocked! 🎁⚡</h3>
                  <p className="diw-success-desc">
                    Your special booking pass for <strong>{modalArtist ? modalArtist.name : category}</strong> in <strong>{city}</strong> has been registered with priority date locking.
                  </p>

                  <div className="diw-success-pass">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#E8D9CF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Official Reference Code</span>
                      <strong className="diw-pass-ref-code" style={{ color: '#E8B943', fontFamily: 'monospace', fontSize: '18px' }}>{bookRefCode}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard && bookRefCode) {
                          navigator.clipboard.writeText(bookRefCode);
                          setBookTokenCopied(true);
                          setTimeout(() => setBookTokenCopied(false), 2000);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 12px',
                        background: 'rgba(232, 185, 67, 0.15)',
                        border: '1px solid rgba(232, 185, 67, 0.4)',
                        color: '#E8B943',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {bookTokenCopied ? '✓ Copied Reference Code' : '📋 Copy Reference Code'}
                    </button>
                  </div>

                  <p style={{ fontSize: '12.5px', color: '#6A625D', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                    Our artist coordinator will WhatsApp performance videos and the locked quote to <strong>+91 {bookPhone}</strong> within 5 minutes.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <a
                      href={`https://wa.me/918076515257?text=${encodeURIComponent(
                        `Hi Magnevents, I unlocked the First Booking Welcome Offer (FIRST15) for ${modalArtist ? modalArtist.name : category} in ${city} (Ref: ${bookRefCode}). Event: ${bookEventType}, Host: ${bookName || 'Host'}. Please confirm artist availability!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="diw-whatsapp-btn"
                      style={{
                        background: '#25D366',
                        color: '#FFFFFF',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.437 0 9.857-4.403 9.86-9.809.001-2.618-1.01-5.08-2.858-6.93C16.528 2.015 14.07 1.006 11.453 1.006c-5.434 0-9.852 4.403-9.855 9.81-.001 2.062.54 4.079 1.566 5.86l-.99 3.613 3.712-.977zm11.304-6.816c-.302-.15-1.788-.882-2.066-.983-.277-.101-.478-.15-.678.15-.2.3-.775.983-.95 1.185-.175.201-.35.227-.652.076-.302-.15-1.274-.469-2.427-1.498-.897-.8-1.502-1.788-1.678-2.09-.175-.302-.019-.465.132-.615.136-.135.302-.35.454-.526.15-.176.2-.302.302-.503.101-.2.05-.376-.026-.526-.075-.15-.678-1.636-.93-2.243-.244-.59-.493-.51-.678-.518-.176-.008-.377-.01-.578-.01-.2 0-.527.075-.803.376-.277.301-1.055 1.031-1.055 2.516 0 1.485 1.079 2.921 1.229 3.122.15.2 2.125 3.245 5.148 4.549.719.311 1.28.497 1.717.637.722.23 1.38.197 1.901.12.58-.087 1.788-.73 2.04-1.435.252-.703.252-1.306.176-1.435-.076-.13-.277-.201-.578-.352z"/>
                      </svg>
                      <span>Connect Fast on WhatsApp ➔</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setBookModalOpen(false)}
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(0, 0, 0, 0.06)',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        color: '#4A423D',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
