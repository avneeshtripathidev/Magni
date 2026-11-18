import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const ADMIN_COOKIE_NAME = 'magnevents_admin_session';
export const OAUTH_STATE_COOKIE = 'magnevents_google_oauth_state';
export const MAX_ADMIN_EMAILS = 3;

export interface AdminSessionPayload {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'super_admin' | 'artist_manager';
  exp: number;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const WHITELIST_FILE = path.join(DATA_DIR, 'admin-allowed-emails.json');

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    'magnevents-local-admin-secret-fallback'
  );
}

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

export function createAdminSessionToken(payload: Omit<AdminSessionPayload, 'exp'>): string {
  const fullPayload: AdminSessionPayload = {
    ...payload,
    email: normalizeEmail(payload.email),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  return `${encoded}.${sig}`;
}

export function verifyAdminSessionToken(token?: string | null): AdminSessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AdminSessionPayload;
    if (!parsed?.email || !parsed?.exp || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getEnvWhitelistEmails(): string[] {
  const raw =
    process.env.ADMIN_ALLOWED_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS ||
    'magneventsdotin@gmail.com,avanishtripathiavanish79921170@gmail.com';

  return Array.from(
    new Set(
      raw
        .split(',')
        .map((e) => normalizeEmail(e))
        .filter((e) => e.includes('@'))
    )
  ).slice(0, MAX_ADMIN_EMAILS);
}

export async function getServerAllowedAdminEmails(): Promise<string[]> {
  // 1. Try Supabase admin_allowed_emails table first
  try {
    const sb = getSupabaseServer();
    if (sb) {
      const { data, error } = await sb
        .from('admin_allowed_emails')
        .select('email, slot_number')
        .order('slot_number', { ascending: true });

      if (!error && data && data.length > 0) {
        const cleaned = Array.from(
          new Set(data.map((r: any) => normalizeEmail(r.email)).filter((e) => e.includes('@')))
        ).slice(0, MAX_ADMIN_EMAILS);
        if (cleaned.length > 0) return cleaned;
      }
    }
  } catch {
    // fallback below
  }

  // 2. Try local persisted JSON file
  try {
    if (fs.existsSync(WHITELIST_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = Array.from(
          new Set(parsed.map((e: unknown) => normalizeEmail(String(e))).filter((e) => e.includes('@')))
        ).slice(0, MAX_ADMIN_EMAILS);
        if (cleaned.length > 0) return cleaned;
      }
    }
  } catch {
    // fallback below
  }

  // 3. Default to .env.local whitelist
  return getEnvWhitelistEmails();
}

export async function saveServerAllowedAdminEmails(emails: string[]): Promise<string[]> {
  const cleaned = Array.from(
    new Set(emails.map((e) => normalizeEmail(e)).filter((e) => e.includes('@')))
  ).slice(0, MAX_ADMIN_EMAILS);

  if (cleaned.length === 0) {
    throw new Error('At least 1 authorized admin email is required.');
  }

  // Persist locally
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(WHITELIST_FILE, JSON.stringify(cleaned, null, 2), 'utf8');
  } catch {
    // ignore local write errors in read-only envs
  }

  // Sync to Supabase admin_allowed_emails if table exists
  try {
    const sb = getSupabaseServer();
    if (sb) {
      await sb.from('admin_allowed_emails').delete().gte('slot_number', 1);
      await sb.from('admin_allowed_emails').insert(
        cleaned.map((email, idx) => ({
          slot_number: idx + 1,
          email,
          role: 'super_admin',
        }))
      );
    }
  } catch {
    // ignore if table not yet migrated
  }

  return cleaned;
}

export async function isServerAuthorizedAdminEmail(email?: string | null): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const allowed = await getServerAllowedAdminEmails();
  return allowed.includes(normalized);
}
