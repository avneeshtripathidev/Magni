import { createClient } from '@supabase/supabase-js';
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface StoredLocalArtistAccount {
  id: string;
  email: string;
  password_hash: string;
  artist: Record<string, any>;
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'artist-accounts.json');

export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derived = scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return timingSafeEqual(derived, keyBuf);
}

export function sanitizeArtistForClient(row: Record<string, any>) {
  if (!row) return row;
  const clone = { ...row };
  if (clone.performance_details && typeof clone.performance_details === 'object') {
    const { _auth_hash, ...cleanPerf } = clone.performance_details;
    clone.performance_details = cleanPerf;
  }
  return clone;
}

export function readLocalAccounts(): StoredLocalArtistAccount[] {
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) return [];
    const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalAccounts(accounts: StoredLocalArtistAccount[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist local artist fallback store:', err);
  }
}

export function buildNewArtistRecord(input: {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
}) {
  const cleanName = input.fullName.trim();
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanPhone = input.phone.trim();
  const slugBase = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'artist';
  const slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();

  return {
    name: cleanName,
    stage_name: cleanName,
    slug,
    email: cleanEmail,
    phone_no: cleanPhone,
    category: 'Singer',
    sub_category: '',
    genres: ['Bollywood', 'Sufi'],
    city: 'Delhi NCR',
    state: 'Delhi',
    country: 'India',
    languages: ['Hindi', 'English'],
    bio: '',
    experience_years: 1,
    price_min: 15000,
    price_max: 50000,
    youtube_links: [],
    audio_samples: [],
    submitted_pricing: {
      starting_price: 15000,
      solo_price: 15000,
      duo_price: 25000,
      band_price: 50000,
      hourly_price: 4000,
      travel_charges_policy: 'Outstation travel and stay arranged by event organizer',
    },
    performance_details: {
      min_duration_minutes: 60,
      max_duration_minutes: 180,
      sound_system_provided: false,
      technical_requirements: '',
      travel_readiness: 'pan_india',
      serviceable_cities: [],
      blocked_dates: [],
      _auth_hash: input.passwordHash,
    },
    verification_documents: {
      legal_name: cleanName,
      id_type: '',
      id_number_masked: '',
      id_document_url: '',
      address_proof_url: '',
      pan_or_tax_id: '',
    },
    verification_status: 'pending',
    profile_completion: 20,
    is_live: false,
    is_featured: false,
    created_at: now,
    updated_at: now,
  };
}

export function generateFallbackId(): string {
  return randomUUID();
}
