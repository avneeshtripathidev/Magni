import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  MAX_ADMIN_EMAILS,
  getServerAllowedAdminEmails,
  isServerAuthorizedAdminEmail,
  normalizeEmail,
  saveServerAllowedAdminEmails,
  verifyAdminSessionToken,
} from '../../../../../lib/auth/adminSessionServer';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = verifyAdminSessionToken(token);
  const allowedEmails = await getServerAllowedAdminEmails();

  if (!session) {
    return NextResponse.json({ admin: null, allowedEmails }, { status: 200 });
  }

  // Re-verify email is still in the 3-email allowlist on every session check
  const stillAllowed = await isServerAuthorizedAdminEmail(session.email);
  if (!stillAllowed) {
    const res = NextResponse.json(
      {
        admin: null,
        allowedEmails,
        error: `Access revoked: "${session.email}" is no longer in the 3 authorized admin emails.`,
      },
      { status: 403 }
    );
    res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  }

  return NextResponse.json(
    {
      admin: {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
        avatar_url: session.avatar_url,
      },
      allowedEmails,
    },
    { status: 200 }
  );
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = verifyAdminSessionToken(token);

  if (!session || !(await isServerAuthorizedAdminEmail(session.email))) {
    return NextResponse.json({ error: 'Unauthorized admin session.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawEmails = Array.isArray(body?.emails) ? body.emails : [];
    const cleaned = Array.from(
      new Set(
        rawEmails.map((e: unknown) => normalizeEmail(String(e))).filter((e: string) => e.includes('@'))
      )
    ) as string[];

    if (cleaned.length === 0) {
      return NextResponse.json({ error: 'At least 1 authorized admin email is required.' }, { status: 400 });
    }
    if (cleaned.length > MAX_ADMIN_EMAILS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ADMIN_EMAILS} authorized admin emails are allowed.` },
        { status: 400 }
      );
    }
    if (!cleaned.includes(normalizeEmail(session.email))) {
      return NextResponse.json(
        { error: `You cannot remove your own active admin email (${session.email}).` },
        { status: 400 }
      );
    }

    const saved = await saveServerAllowedAdminEmails(cleaned);
    return NextResponse.json({ allowedEmails: saved }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update allowed admin emails.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
