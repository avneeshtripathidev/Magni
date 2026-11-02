import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractClientIp, extractLocality } from '@/app/utils/visitorExtractor';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req) {
  try {
    const data = await req.json().catch(() => ({}));
    const {
      eventName,
      campaignId = null,
      campaignName = null,
      sessionId = null,
      referenceCode = null,
      metadata = {},
      attribution = {}
    } = data;

    if (!eventName) {
      return NextResponse.json({ success: false, error: 'Event name is required' }, { status: 400 });
    }

    const clientIp = extractClientIp(req, data.ip);
    const userAgent = req.headers.get('user-agent') || data.userAgent || '';

    // Device parsing
    let deviceType = 'Desktop';
    if (/Mobi|Android|iPhone/i.test(userAgent)) deviceType = 'Mobile';
    else if (/iPad|Tablet/i.test(userAgent)) deviceType = 'Tablet';

    // Locality resolution
    let city = attribution.city || metadata.city || null;
    let region = attribution.region || metadata.region || null;
    let country = attribution.country || metadata.country || null;

    if (!city && clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      try {
        const locality = await extractLocality(req, clientIp);
        if (locality) {
          city = locality.city || city;
          region = locality.region || region;
          country = locality.country || country;
        }
      } catch (locErr) {}
    }

    // Accurately verify if this visitor actually came via Paid Ads
    const hasAdClickId = !!(attribution.gclid || attribution.gbraid || attribution.wbraid);
    const isPaidMedium = /^(cpc|ppc|paid|google_ad|paidsearch|ad)$/i.test(attribution.utm_medium || '');
    const isGooglePaidAd = hasAdClickId || (attribution.utm_source?.includes('google') && isPaidMedium);

    const referrer = attribution.referrer || req.headers.get('referer') || '';
    const isOrganicGoogle = !isGooglePaidAd && (referrer.toLowerCase().includes('google.') || attribution.utm_medium === 'organic');

    let resolvedTrafficSource = 'Direct Visit';
    let resolvedChannelType = 'Direct';
    if (isGooglePaidAd) {
      resolvedTrafficSource = 'Google Ads';
      resolvedChannelType = 'Paid Search';
    } else if (isOrganicGoogle) {
      resolvedTrafficSource = 'Google Search (Organic)';
      resolvedChannelType = 'Organic Search';
    } else if (attribution.traffic_source) {
      resolvedTrafficSource = attribution.traffic_source;
      resolvedChannelType = 'Referral';
    }

    const funnelRecord = {
      event_name: eventName,
      campaign_id: campaignId ? String(campaignId) : null,
      campaign_name: campaignName || null,
      session_id: sessionId || null,
      reference_code: referenceCode || null,
      ip_address: clientIp || 'unknown',
      city: city || 'Delhi NCR',
      region: region || null,
      country: country || 'India',
      device_type: deviceType,
      gclid: attribution.gclid || null,
      gbraid: attribution.gbraid || null,
      wbraid: attribution.wbraid || null,
      utm_source: attribution.utm_source || (isGooglePaidAd ? 'google' : (isOrganicGoogle ? 'google' : 'direct')),
      utm_medium: attribution.utm_medium || (isGooglePaidAd ? 'cpc' : (isOrganicGoogle ? 'organic' : 'direct')),
      utm_campaign: isGooglePaidAd ? (attribution.utm_campaign || campaignName || null) : null,
      metadata: {
        ...metadata,
        fullUrl: attribution.landing_page || null,
        referrer: referrer || null,
        isAd: isGooglePaidAd,
        trafficSource: resolvedTrafficSource,
        timestamp: new Date().toISOString()
      }
    };

    const supabase = getSupabaseAdmin();
    if (supabase) {
      // 1. Insert into dedicated campaign_funnel_events
      try {
        await supabase.from('campaign_funnel_events').insert([funnelRecord]);
      } catch (fErr) {}

      // 2. Only record actual conversion events (not passive announcement strip views) in general analytics
      if (eventName !== 'offer_strip_view') {
        try {
          await supabase.from('analytics').insert([{
            path: attribution.landing_page ? new URL(attribution.landing_page, 'https://magnevents.in').pathname : '/google-ads-offer',
            type: eventName,
            user_agent: userAgent,
            ip_address: clientIp,
            session_id: sessionId,
            city: city,
            region: region,
            country: country,
            device_type: deviceType,
            referrer: referrer || null,
            details: {
              isAd: isGooglePaidAd,
              trafficSource: resolvedTrafficSource,
              channelType: resolvedChannelType,
              campaign: isGooglePaidAd ? {
                campaignName: campaignName || 'Google Ads Campaign',
                campaignId: campaignId,
                adPlatform: 'Google Ads',
                channelType: 'Paid Search',
                adClickId: attribution.gclid || attribution.gbraid || attribution.wbraid,
                utmSource: attribution.utm_source,
                utmMedium: attribution.utm_medium,
                utmCampaign: attribution.utm_campaign
              } : null,
              conversionEvent: eventName,
              referenceCode: referenceCode,
              metadata
            }
          }]);
        } catch (aErr) {}
      }
    }

    return NextResponse.json({
      success: true,
      event: eventName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[FunnelEventAPI] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

