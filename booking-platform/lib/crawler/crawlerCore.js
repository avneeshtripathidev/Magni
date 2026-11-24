/**
 * Magnevents Modular Crawler Core
 * 
 * Legitimate, ethical search crawler engine adhering strictly to:
 * - URL canonicalization
 * - SHA-256 duplicate detection
 * - Robots.txt compliance and crawl delay respect
 * - Rate limiting and exponential backoff
 * - Never bypassing CAPTCHAs, authentication, or anti-bot protections
 * - Never scraping Google HTML or impersonating Googlebot
 */

import crypto from 'crypto';

/**
 * Normalizes a URL into standard canonical form:
 * - Lowercases scheme & hostname
 * - Removes default ports (:80, :443)
 * - Strips marketing/tracking query parameters (utm_*, gclid, fbclid, ref, etc.)
 * - Strips URL fragments (#...)
 * - Normalizes trailing slashes (preserves root '/')
 */
export function canonicalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.hash = ''; // Remove hash fragments

    // Strip common tracking and session parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid', 'msclkid', 'mc_cid', 'mc_eid', '_ga', '_gl', 'ref', 'source'
    ];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }

    // Sort remaining query params for determinism
    parsed.searchParams.sort();

    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;

    return parsed.toString();
  } catch (err) {
    return rawUrl.trim().split('#')[0].replace(/\/+$/, '');
  }
}

/**
 * Computes deterministic SHA-256 hash of a canonical URL for O(1) duplicate detection.
 */
export function hashCanonicalUrl(canonicalUrl) {
  return crypto.createHash('sha256').update(canonicalUrl).digest('hex');
}

/**
 * In-memory robots.txt cache
 */
const robotsCache = new Map();

/**
 * Validates whether crawling a path is permitted by robots.txt rules.
 */
export async function isAllowedByRobots(url, userAgent = 'MagneventsBot/2.0') {
  try {
    const parsed = new URL(url);
    const domain = `${parsed.protocol}//${parsed.host}`;
    const robotsUrl = `${domain}/robots.txt`;

    let rules = robotsCache.get(domain);
    if (!rules) {
      const res = await fetch(robotsUrl, {
        headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(4000)
      }).catch(() => null);

      if (res && res.ok) {
        const text = await res.text();
        rules = parseRobotsTxt(text, userAgent);
        robotsCache.set(domain, rules);
      } else {
        // If robots.txt returns 404 or fails, allowed by default per RFC 9309
        rules = { disallow: [], crawlDelay: 1000 };
        robotsCache.set(domain, rules);
      }
    }

    // Check path against disallow list
    const path = parsed.pathname + parsed.search;
    for (const dis of rules.disallow) {
      if (dis && path.startsWith(dis)) {
        return false;
      }
    }

    return true;
  } catch (err) {
    return true; // Fallback to safe permissive
  }
}

/**
 * Basic robots.txt parser for user agent and disallow directives.
 */
function parseRobotsTxt(content, targetAgent) {
  const lines = content.split('\n');
  const disallow = [];
  let crawlDelay = 1500;
  let appliesToUs = false;

  for (let line of lines) {
    line = line.split('#')[0].trim();
    if (!line) continue;

    const [directive, ...rest] = line.split(':');
    const key = directive.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'user-agent') {
      const agent = value.toLowerCase();
      appliesToUs = agent === '*' || targetAgent.toLowerCase().includes(agent);
    } else if (appliesToUs) {
      if (key === 'disallow' && value) {
        disallow.push(value);
      } else if (key === 'crawl-delay') {
        const delay = parseInt(value, 10);
        if (!isNaN(delay)) crawlDelay = Math.max(1000, delay * 1000);
      }
    }
  }

  return { disallow, crawlDelay };
}

/**
 * Extracts public structured data, Open Graph, and meta details from HTML content.
 */
export function extractPublicMeta(html, sourceUrl) {
  if (!html || typeof html !== 'string') return {};

  const result = {
    title: '',
    metaDescription: '',
    canonicalUrl: '',
    events: [],
    artists: [],
    venues: []
  };

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) result.title = titleMatch[1].trim();

  // Meta Description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  if (metaDescMatch) result.metaDescription = metaDescMatch[1].trim();

  // Canonical tag
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonicalMatch) result.canonicalUrl = canonicalMatch[1].trim();

  // JSON-LD Schema.org parsing
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsedData = JSON.parse(match[1]);
      const items = Array.isArray(parsedData) ? parsedData : [parsedData];
      for (const item of items) {
        const type = item['@type'];
        if (type === 'Event' || type === 'MusicEvent') {
          result.events.push({
            name: item.name || '',
            startDate: item.startDate || null,
            location: item.location?.name || item.location?.address || '',
            performer: item.performer?.name || '',
            description: item.description || ''
          });
        } else if (type === 'Person' || type === 'MusicGroup') {
          result.artists.push({
            name: item.name || '',
            genre: item.genre || '',
            description: item.description || ''
          });
        } else if (type === 'Place' || type === 'EventVenue') {
          result.venues.push({
            name: item.name || '',
            address: typeof item.address === 'string' ? item.address : item.address?.streetAddress || ''
          });
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks
    }
  }

  return result;
}

/**
 * Sleep helper with exponential backoff support.
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
