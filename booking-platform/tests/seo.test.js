import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import robots from '../app/robots.js';
import { parseLocationSlug } from '../app/utils/seoUrlParser.js';
import { footerSeoCategories, footerSeoKeywords } from '../app/constants/seoKeywords.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Magnevents Comprehensive SEO & Indexing Assurance (Phase 15)', () => {

  describe('1. Robots.txt Directives & Security Safeguards', () => {
    const config = robots();

    it('should declare authoritative production canonical sitemap', () => {
      assert.match(config.sitemap, /^https:\/\/www\.magnevents\.in\/sitemap\.xml$/);
    });

    it('should disallow private, administrative, and conversion paths', () => {
      const defaultRule = config.rules.find(r => r.userAgent === '*');
      assert.ok(defaultRule, 'Must contain wildcard user-agent rule');
      
      const requiredDisallows = ['/api/', '/admin/', '/dashboard/', '/private/', '/preview/', '/thank-you'];
      for (const path of requiredDisallows) {
        assert.ok(
          defaultRule.disallow.includes(path),
          `Robots.txt must disallow ${path}`
        );
      }
    });

    it('should allow public root access', () => {
      const defaultRule = config.rules.find(r => r.userAgent === '*');
      assert.equal(defaultRule.allow, '/');
    });
  });

  describe('2. Programmatic SEO Engine & Anti-Thin Content Validation', () => {
    it('should accurately parse high-intent localized query "singer-for-house-party-in-gurgaon"', () => {
      const parsed = parseLocationSlug('singer-for-house-party-in-gurgaon');
      assert.equal(parsed.isValidKeyword, true);
      assert.equal(parsed.parsedCategory, 'Singer');
      assert.equal(parsed.parsedCity, 'Gurgaon');
      assert.equal(parsed.slug, 'singer-for-house-party-in-gurgaon');
    });

    it('should accurately parse "wedding-dj-in-delhi"', () => {
      const parsed = parseLocationSlug('wedding-dj-in-delhi');
      assert.equal(parsed.isValidKeyword, true);
      assert.equal(parsed.parsedCategory, 'Dj');
      assert.equal(parsed.parsedSubCategory, 'Wedding');
      assert.equal(parsed.parsedCity, 'Delhi');
    });

    it('should accurately parse live band queries "live-band-in-mumbai"', () => {
      const parsed = parseLocationSlug('live-band-in-mumbai');
      assert.equal(parsed.isValidKeyword, true);
      assert.equal(parsed.parsedCategory, 'Live band');
      assert.equal(parsed.parsedCity, 'Mumbai');
    });

    it('should flag unsupported / spam queries as invalid keywords to prevent thin indexing', () => {
      const parsed = parseLocationSlug('buy-cheap-crypto-now');
      assert.equal(parsed.isValidKeyword, false);
    });

    it('should normalize slugs with spaces or underscores into kebab-case', () => {
      const parsed = parseLocationSlug('singer_in delhi');
      assert.equal(parsed.slug, 'singer-in-delhi');
    });
  });

  describe('3. Internal Linking Architecture & Semantic Footer Pillars', () => {
    it('should maintain structured semantic categories in footer', () => {
      assert.ok(Array.isArray(footerSeoCategories), 'footerSeoCategories must be an array');
      assert.ok(footerSeoCategories.length >= 5, 'Must contain at least 5 semantic pillar categories');

      const expectedPillars = [
        'Popular Artist Categories',
        'Wedding Entertainment',
        'Private Parties & House Gigs',
        'Corporate Entertainment',
        'Popular Cities'
      ];

      for (const pillar of expectedPillars) {
        const found = footerSeoCategories.some(c => c.title.toLowerCase().includes(pillar.toLowerCase()));
        assert.ok(found, `Must include semantic pillar: ${pillar}`);
      }
    });

    it('should verify that all footer links use valid canonical paths without trailing slashes', () => {
      for (const col of footerSeoCategories) {
        for (const link of col.links) {
          assert.ok(link.href.startsWith('/'), `Link href must start with /: ${link.href}`);
          if (link.href !== '/') {
            assert.ok(!link.href.endsWith('/'), `Link href must not have trailing slash: ${link.href}`);
          }
        }
      }
    });

    it('should maintain legacy flat keywords array for backward compatibility', () => {
      assert.ok(Array.isArray(footerSeoKeywords), 'footerSeoKeywords must be an array');
      assert.ok(footerSeoKeywords.length > 30, 'Should contain extensive keyword phrases');
    });
  });

  describe('4. Centralized SEO Strategy & Machine-Readable Artifact Integrity', () => {
    const docsSeoDir = path.resolve(__dirname, '../../docs/seo');

    it('should maintain valid docs/seo/keyword-map.json', () => {
      const filePath = path.join(docsSeoDir, 'keyword-map.json');
      assert.ok(fs.existsSync(filePath), 'keyword-map.json must exist');
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assert.equal(content.domain, 'https://www.magnevents.in');
      assert.ok(content.pillars.commercial_core.length > 0);
      assert.ok(content.pillars.top_metros.length > 0);
    });

    it('should maintain valid docs/seo/seo-page-registry.json', () => {
      const filePath = path.join(docsSeoDir, 'seo-page-registry.json');
      assert.ok(fs.existsSync(filePath), 'seo-page-registry.json must exist');
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assert.equal(content.site, 'https://www.magnevents.in');
      assert.ok(content.routes.static.length >= 10);
      assert.ok(content.routes.noindex_rules.includes('/api/*'));
    });

    it('should maintain valid docs/seo/seo-quality-rules.json', () => {
      const filePath = path.join(docsSeoDir, 'seo-quality-rules.json');
      assert.ok(fs.existsSync(filePath), 'seo-quality-rules.json must exist');
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assert.equal(content.rules.canonical_enforcement.trailing_slash, false);
      assert.equal(content.rules.canonical_enforcement.host, 'https://www.magnevents.in');
    });
  });

});
