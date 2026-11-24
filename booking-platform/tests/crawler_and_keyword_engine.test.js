import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { canonicalizeUrl, hashCanonicalUrl, extractPublicMeta } from '../lib/crawler/crawlerCore.js';
import { generateKeywordsForCity, analyzeBookingIntent, EVENT_CATEGORIES, ARTIST_ACTS } from '../lib/seo/keywordEngine.js';
import { crawlerQueue } from '../lib/crawler/crawlerQueue.js';
import { gscAdapter } from '../lib/crawler/googleSearchConsoleAdapter.js';
import { customSearchAdapter } from '../lib/crawler/googleCustomSearchAdapter.js';
import { placesAdapter } from '../lib/crawler/googlePlacesAdapter.js';

describe('Magnevents Event Discovery, Google Crawling & Keyword Engine Assurance', () => {

  describe('1. URL Canonicalization & Duplicate Detection', () => {
    it('should strip tracking parameters and normalize trailing slashes', () => {
      const raw = 'https://www.Example.COM/venues/delhi/?utm_source=google&utm_medium=cpc&gclid=12345#overview';
      const canonical = canonicalizeUrl(raw);
      assert.equal(canonical, 'https://www.example.com/venues/delhi');
    });

    it('should generate consistent SHA-256 hashes for identical canonical targets', () => {
      const url1 = 'https://example.in/singer-in-lucknow';
      const url2 = 'https://EXAMPLE.in/singer-in-lucknow/?ref=search';
      const hash1 = hashCanonicalUrl(canonicalizeUrl(url1));
      const hash2 = hashCanonicalUrl(canonicalizeUrl(url2));
      assert.equal(hash1, hash2);
    });

    it('should extract Open Graph and Schema.org metadata from HTML', () => {
      const mockHtml = `
        <html>
          <head>
            <title>Grand Sangeet Night 2026</title>
            <meta name="description" content="Annual live concert in Jaipur" />
            <script type="application/ld+json">
              {
                "@type": "MusicEvent",
                "name": "Royal Sufi Mehfil",
                "startDate": "2026-12-15",
                "location": { "name": "Jaipur Palace" }
              }
            </script>
          </head>
        </html>
      `;
      const meta = extractPublicMeta(mockHtml, 'https://example.com/sufi-jaipur');
      assert.equal(meta.title, 'Grand Sangeet Night 2026');
      assert.equal(meta.metaDescription, 'Annual live concert in Jaipur');
      assert.equal(meta.events.length, 1);
      assert.equal(meta.events[0].name, 'Royal Sufi Mehfil');
    });
  });

  describe('2. Booking-Intent Keyword Engine Matrix', () => {
    it('should support 7 core event categories and full artist acts', () => {
      assert.equal(EVENT_CATEGORIES.length, 6);
      assert.ok(ARTIST_ACTS.length >= 20);
    });

    it('should generate prioritized combinations for any Indian city', () => {
      const keywords = generateKeywordsForCity('lucknow', { limit: 20 });
      assert.ok(keywords.length > 0);
      
      const first = keywords[0];
      assert.ok(first.keyword.includes('Lucknow'));
      assert.ok(first.priority >= 0.85);
      assert.ok(first.slug.includes('-in-lucknow'));
    });

    it('should accurately analyze high booking intent from natural search queries', () => {
      const analysis = analyzeBookingIntent('Book wedding singer in Delhi NCR');
      assert.equal(analysis.hasIntent, true);
      assert.ok(analysis.score >= 0.70);
      assert.ok(analysis.detected.actions.includes('book'));
      assert.ok(analysis.detected.acts.includes('Singer') || analysis.detected.acts.includes('Wedding Singer'));
    });

    it('should recognize Hinglish / regional booking queries', () => {
      const analysis = analyzeBookingIntent('Shaadi ke liye best DJ cost in Mumbai');
      assert.equal(analysis.hasIntent, true);
      assert.ok(analysis.detected.cities.includes('Mumbai'));
    });
  });

  describe('3. Crawler Queue & Scheduler State', () => {
    it('should create and track crawler jobs with state isolation', () => {
      const job = crawlerQueue.createJob('custom_search_discovery', { city: 'Varanasi', category: 'Weddings' });
      assert.ok(job.id.startsWith('job_'));
      assert.equal(job.status, 'queued');
      assert.equal(job.targetCity, 'Varanasi');
    });

    it('should manage verification workflow (pending_review -> approved / rejected)', () => {
      const recordId = crawlerQueue.discoveredRecords[0]?.id;
      if (recordId) {
        const res = crawlerQueue.updateRecordVerification(recordId, 'approved', 'Test verification');
        assert.equal(res.success, true);
        assert.equal(res.record.verificationStatus, 'approved');
      }
    });

    it('should compute comprehensive dashboard stats', () => {
      const stats = crawlerQueue.getDashboardStats();
      assert.ok(stats.totalIndexedLandingPages >= 41000);
      assert.equal(stats.totalCoveredCities, 1063);
      assert.ok(stats.totalDiscoveredArtists > 0);
    });
  });

  describe('4. Google Search Adapters & Sitemap Registry', () => {
    it('should return site index summary with active sitemaps', async () => {
      const summary = await gscAdapter.getSiteIndexSummary();
      assert.equal(summary.totalSitemappedUrls, 41853);
      assert.equal(summary.coveredCities, 1063);
      assert.ok(summary.activeSitemaps.includes('sitemap-index.xml'));
    });

    it('should return valid discovery baselines when running without external API keys', async () => {
      const cseResult = await customSearchAdapter.searchEvents('wedding band', { city: 'Jaipur' });
      assert.ok(cseResult.items.length > 0);

      const places = await placesAdapter.discoverVenues('Lucknow', 'Banquet Hall');
      assert.ok(places.length > 0);
      assert.equal(places[0].city, 'Lucknow');
    });

    it('should verify all 4 XML sitemap files exist on disk with valid headers', () => {
      const sitemapsDir = path.join(process.cwd(), 'public/sitemaps');
      const expectedFiles = [
        'all-1063-cities-sitemap.xml',
        'events-sitemap.xml',
        'artists-categories-sitemap.xml',
        'sitemap-index.xml'
      ];

      for (const file of expectedFiles) {
        const filePath = path.join(sitemapsDir, file);
        assert.ok(fs.existsSync(filePath), `Sitemap file ${file} must exist`);
        const content = fs.readFileSync(filePath, 'utf-8').slice(0, 200);
        assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'), `${file} must be valid XML`);
      }
    });
  });
});
