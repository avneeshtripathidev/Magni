/**
 * Strict Admin Google Login Whitelist (Maximum 3 Authorized Emails)
 * Configured via NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS (comma-separated) in .env.local,
 * with optional runtime management (capped strictly at 3 emails) inside Admin Access.
 */

export const MAX_ADMIN_EMAILS = 3;

export const DEFAULT_ALLOWED_ADMIN_EMAILS: string[] = [
  'magneventsdotin@gmail.com',
  'avanishtripathiavanish79921170@gmail.com',
];

const STORAGE_KEY = 'magnevents_allowed_admin_emails_v1';

export function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

export function getEnvAllowedAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS || '';
  const parsed = raw
    .split(',')
    .map((e) => normalizeEmail(e))
    .filter((e) => e.includes('@'));

  const base = parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ADMIN_EMAILS;
  return Array.from(new Set(base)).slice(0, MAX_ADMIN_EMAILS);
}

export function getAllowedAdminEmails(): string[] {
  const envEmails = getEnvAllowedAdminEmails();
  if (typeof window === 'undefined') return envEmails;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return envEmails;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved) && saved.length > 0) {
      const cleaned = Array.from(
        new Set(
          saved
            .map((e: unknown) => normalizeEmail(String(e)))
            .filter((e: string) => e.includes('@'))
        )
      ).slice(0, MAX_ADMIN_EMAILS);
      if (cleaned.length > 0) return cleaned;
    }
  } catch {
    // fall back to env emails
  }
  return envEmails;
}

export function saveAllowedAdminEmails(emails: string[]): string[] {
  const cleaned = Array.from(
    new Set(
      emails
        .map((e) => normalizeEmail(e))
        .filter((e) => e.includes('@'))
    )
  ).slice(0, MAX_ADMIN_EMAILS);

  if (typeof window !== 'undefined' && cleaned.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }
  return cleaned;
}

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  const target = normalizeEmail(email);
  if (!target) return false;
  const allowed = getAllowedAdminEmails();
  return allowed.includes(target);
}
