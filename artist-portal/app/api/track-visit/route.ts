import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url =
    process.env.MAIN_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://ecwaqfsjajeidhslybdi.supabase.co';
  const serviceKey =
    process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd2FxZnNqYWplaWRoc2x5YmRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE3ODUyNiwiZXhwIjoyMDkxNzU0NTI2fQ.Pcanl1WQDZgXXXbpKdEqnK5xBQSBqFdWnegdVo9bV9Q';

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function extractIp(req: NextRequest): string {
  const headers = req.headers;
  const cf = headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const trueClient = headers.get('true-client-ip');
  if (trueClient) return trueClient.trim();
  const xReal = headers.get('x-real-ip');
  if (xReal) return xReal.trim();
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim().replace(/^::ffff:/, '');
    if (first) return first;
  }
  return '127.0.0.1';
}

function parseDevice(ua: string) {
  const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua);
  const isTablet = /ipad|tablet/i.test(ua);
  
  let browser = 'Unknown';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';

  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return {
    deviceType: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
    browser,
    os
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path = '/register', type = 'artist_register_visit', source = 'direct_visit' } = body;

    const rawUA = req.headers.get('user-agent') || body.userAgent || 'unknown';
    const clientIp = extractIp(req);
    const referer = req.headers.get('referer') || body.referrer || '';

    // Vercel / Cloudflare edge location headers
    const city = req.headers.get('x-vercel-ip-city') || req.headers.get('cf-ipcity') || null;
    const region = req.headers.get('x-vercel-ip-country-region') || req.headers.get('cf-region') || null;
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || null;
    const timezone = req.headers.get('x-vercel-ip-timezone') || req.headers.get('cf-timezone') || null;

    const dev = parseDevice(rawUA);

    const record = {
      path,
      type,
      user_agent: rawUA,
      ip_address: clientIp,
      city,
      region,
      country,
      device_type: dev.deviceType,
      browser: dev.browser,
      os: dev.os,
      referrer: referer,
      details: {
        ip: clientIp,
        locality: { city, region, country, timezone },
        user: dev,
        source,
        timestamp: new Date().toISOString()
      }
    };

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('analytics').insert([record]).select('id, created_at');

    if (error) {
      console.error('Track visit error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id, ip: clientIp, city });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
