"use client";

import React, { useState, useEffect } from 'react';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { artistService } from '../../../services/artistService';
import { WhatsAppShareActions } from '../../../components/shared/WhatsAppShareActions';
import {
  User,
  Mic2,
  Music,
  MapPin,
  Clock,
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';

const CATEGORIES = [
  'Solo Singer',
  'Live Band',
  'Acoustic Duo',
  'DJ',
  'Instrumentalist',
  'Sufi Singer',
  'Classical Musician',
  'Wedding Performer',
  'Anchor / Host',
  'Comedian',
];

const GENRES = [
  'Bollywood',
  'Bollywood Retro',
  'Sufi',
  'Punjabi Pop',
  'Western Pop',
  'Classic Rock',
  'Ghazals',
  'Classical Fusion',
  'EDM / Commercial',
  'English Jazz',
  'Indie Acoustic',
  'Folk & Regional',
];

const LANGUAGES = [
  'Hindi',
  'English',
  'Punjabi',
  'Urdu',
  'Bengali',
  'Gujarati',
  'Marathi',
  'Tamil',
  'Telugu',
  'Spanish',
];

const COVERAGE_LOCATIONS = [
  'All India (Pan-India)',
  'Delhi NCR',
  'Mumbai',
  'Bengaluru',
  'Jaipur',
  'Udaipur',
  'Goa',
  'Chandigarh',
  'Lucknow',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Chennai',
  'Ahmedabad',
  'Gandhinagar',
  'Indore',
  'Dehradun',
  'Agra',
  'Varanasi',
  'Jodhpur',
  'Surat',
];

export default function ProfilePage() {
  const { artist, refreshArtist } = useArtistAuth();

  const [formData, setFormData] = useState({
    name: '',
    stage_name: '',
    phone_no: '',
    email: '',
    city: 'Delhi NCR',
    state: 'Delhi',
    country: 'India',
    experience_years: 3,
    category: 'Solo Singer',
    sub_category: 'Bollywood / Sufi',
    genres: ['Bollywood', 'Sufi'] as string[],
    languages: ['Hindi', 'English'] as string[],
    serviceable_cities: ['Delhi NCR'] as string[],
    bio: '',
    starting_price: 15000,
    solo_price: 15000,
    duo_price: 25000,
    band_price: 45000,
    hourly_price: 5000,
    travel_policy: 'Travel & hospitality to be provided by host for outstation events',
    min_duration: 60,
    max_duration: 180,
    sound_system: false,
    tech_requirements: '2 Cordless Mics, Stage Monitor, 2 Line Inputs',
    travel_readiness: 'pan_india',
  });

  const [customLocation, setCustomLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (artist) {
      setFormData({
        name: artist.name || '',
        stage_name: artist.stage_name || artist.name || '',
        phone_no: artist.phone_no || '',
        email: artist.email || '',
        city: artist.city || 'Delhi NCR',
        state: artist.state || 'Delhi',
        country: artist.country || 'India',
        experience_years: artist.experience_years || 3,
        category: artist.category || 'Solo Singer',
        sub_category: artist.sub_category || 'Bollywood / Sufi',
        genres: artist.genres?.length ? artist.genres : ['Bollywood', 'Sufi'],
        languages: artist.languages?.length ? artist.languages : ['Hindi', 'English'],
        serviceable_cities: artist.performance_details?.serviceable_cities?.length
          ? artist.performance_details.serviceable_cities
          : [artist.city || 'Delhi NCR'],
        bio: artist.bio || '',
        starting_price: artist.submitted_pricing?.starting_price || artist.price_min || 15000,
        solo_price: artist.submitted_pricing?.solo_price || artist.price_min || 15000,
        duo_price: artist.submitted_pricing?.duo_price || 25000,
        band_price: artist.submitted_pricing?.band_price || artist.price_max || 45000,
        hourly_price: artist.submitted_pricing?.hourly_price || 5000,
        travel_policy: artist.submitted_pricing?.travel_charges_policy || 'Travel & hospitality to be provided by host for outstation events',
        min_duration: artist.performance_details?.min_duration_minutes || 60,
        max_duration: artist.performance_details?.max_duration_minutes || 180,
        sound_system: !!artist.performance_details?.sound_system_provided,
        tech_requirements: artist.performance_details?.technical_requirements || '2 Cordless Mics, Stage Monitor, 2 Line Inputs',
        travel_readiness: artist.performance_details?.travel_readiness || 'pan_india',
      });
    }
  }, [artist]);

  const toggleGenre = (genre: string) => {
    setFormData((prev) => {
      const exists = prev.genres.includes(genre);
      return {
        ...prev,
        genres: exists ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre],
      };
    });
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => {
      const exists = prev.languages.includes(lang);
      return {
        ...prev,
        languages: exists ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang],
      };
    });
  };

  const toggleCoverageLocation = (loc: string) => {
    setFormData((prev) => {
      const exists = prev.serviceable_cities.includes(loc);
      return {
        ...prev,
        serviceable_cities: exists
          ? prev.serviceable_cities.filter((c) => c !== loc)
          : [...prev.serviceable_cities, loc],
      };
    });
  };

  const addCustomCoverageLocation = () => {
    const trimmed = customLocation.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      if (prev.serviceable_cities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        serviceable_cities: [...prev.serviceable_cities, trimmed],
      };
    });
    setCustomLocation('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist?.id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updates = {
        name: formData.name,
        stage_name: formData.stage_name,
        phone_no: formData.phone_no,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        experience_years: Number(formData.experience_years),
        category: formData.category,
        sub_category: formData.sub_category,
        genres: formData.genres,
        languages: formData.languages,
        bio: formData.bio,
        price_min: Number(formData.starting_price),
        price_max: Number(formData.band_price),
        submitted_pricing: {
          starting_price: Number(formData.starting_price),
          solo_price: Number(formData.solo_price),
          duo_price: Number(formData.duo_price),
          band_price: Number(formData.band_price),
          hourly_price: Number(formData.hourly_price),
          travel_charges_policy: formData.travel_policy,
        },
        performance_details: {
          min_duration_minutes: Number(formData.min_duration),
          max_duration_minutes: Number(formData.max_duration),
          sound_system_provided: formData.sound_system,
          technical_requirements: formData.tech_requirements,
          travel_readiness: formData.travel_readiness as any,
          serviceable_cities:
            formData.serviceable_cities.length > 0
              ? formData.serviceable_cities
              : [formData.city].filter(Boolean),
        },
      };

      await artistService.updateProfile(artist.id, updates);
      await refreshArtist();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Profile & Logistics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stage identity, musical repertoire, and technical requirements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {artist && (
            <WhatsAppShareActions
              artist={artist}
              completedEvents={artist.successful_bookings || 0}
              variant="full"
            />
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary min-h-[38px] flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Profile changes saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Basic Information */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Identity & Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Legal Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
                placeholder="Full name on ID"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stage / Act Name *</label>
              <input
                type="text"
                required
                value={formData.stage_name}
                onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
                placeholder="e.g. Aarav & The Acoustic Project"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone_no}
                onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Base City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Delhi NCR, Mumbai, Bengaluru"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State / Region</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Delhi, Maharashtra"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Live Experience (Years)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Act & Genres */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Mic2 className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Act & Musical Repertoire</h2>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="text-slate-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Genres</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {GENRES.map((g) => {
                  const selected = formData.genres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Languages</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {LANGUAGES.map((l) => {
                  const selected = formData.languages.includes(l);
                  return (
                    <button
                      type="button"
                      key={l}
                      onClick={() => toggleLanguage(l)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Performance Coverage Area (Where You Can Easily Perform)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select cities or regions you easily travel to for gigs.
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase">
                  {formData.serviceable_cities.length} Selected
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set([...COVERAGE_LOCATIONS, ...formData.serviceable_cities])).map((loc) => {
                  const selected = formData.serviceable_cities.includes(loc);
                  return (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => toggleCoverageLocation(loc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {loc}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Add another city or area (e.g. Noida, Manali, Shimla)..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm flex-1 min-w-0"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCoverageLocation())}
                />
                <button
                  type="button"
                  onClick={addCustomCoverageLocation}
                  className="btn-secondary whitespace-nowrap w-full sm:w-auto text-xs py-2 px-3.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Location</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Biography */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Music className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Artist Biography</h2>
          </div>

          <div>
            <textarea
              rows={4}
              required
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Introduce your artistic background, signature tracks, notable events, and stage style..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Section 4: Performance Logistics & Technical Rider */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Logistics & Stage Rider</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Min Set Duration (Minutes)</label>
              <input
                type="number"
                step="15"
                value={formData.min_duration}
                onChange={(e) => setFormData({ ...formData, min_duration: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Set Duration (Minutes)</label>
              <input
                type="number"
                step="15"
                value={formData.max_duration}
                onChange={(e) => setFormData({ ...formData, max_duration: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Travel Availability</label>
              <select
                value={formData.travel_readiness}
                onChange={(e) => setFormData({ ...formData, travel_readiness: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              >
                <option value="pan_india">Pan-India (Available for Travel)</option>
                <option value="state_wide">State-Wide Only</option>
                <option value="local_only">Base City Only</option>
                <option value="international">International</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sound Equipment Provided?</label>
              <select
                value={formData.sound_system ? 'yes' : 'no'}
                onChange={(e) => setFormData({ ...formData, sound_system: e.target.value === 'yes' })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              >
                <option value="no">No (Client / Venue arranges Sound)</option>
                <option value="yes">Yes (I bring sound setup)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Technical Stage Rider</label>
            <input
              type="text"
              value={formData.tech_requirements}
              onChange={(e) => setFormData({ ...formData, tech_requirements: e.target.value })}
              placeholder="e.g. 2 Cordless Mics, Stage Monitor, 2 Line Inputs"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
            />
          </div>
        </div>

        {/* Section 5: Standard Pricing */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Event Pricing (₹)</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Solo Performance (₹) *</label>
              <input
                type="number"
                step="500"
                required
                value={formData.starting_price}
                onChange={(e) => setFormData({ ...formData, starting_price: Number(e.target.value), solo_price: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duo Act (₹)</label>
              <input
                type="number"
                step="500"
                value={formData.duo_price}
                onChange={(e) => setFormData({ ...formData, duo_price: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Band Show (₹)</label>
              <input
                type="number"
                step="500"
                value={formData.band_price}
                onChange={(e) => setFormData({ ...formData, band_price: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hourly Overtime Fee (₹)</label>
              <input
                type="number"
                step="500"
                value={formData.hourly_price}
                onChange={(e) => setFormData({ ...formData, hourly_price: Number(e.target.value) })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Travel Policy</label>
              <input
                type="text"
                value={formData.travel_policy}
                onChange={(e) => setFormData({ ...formData, travel_policy: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full sm:w-auto min-h-[40px] px-6 text-xs font-bold"
          >
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
