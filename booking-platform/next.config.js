const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  swcMinify: true,
  poweredByHeader: false,
  trailingSlash: false, // Enforce no trailing slashes for SEO consistency
  experimental: {
    externalDir: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    const path = require('path');
    const fs = require('fs');

    const localDb = path.resolve(__dirname, 'database');
    const rootDb = path.resolve(__dirname, '../database');
    config.resolve.alias['@database'] = fs.existsSync(localDb) ? localDb : rootDb;

    const localHelpers = path.resolve(__dirname, 'helpers');
    const rootHelpers = path.resolve(__dirname, '../helpers');
    config.resolve.alias['@helpers'] = fs.existsSync(localHelpers) ? localHelpers : rootHelpers;

    config.resolve.alias['framer-motion'] = path.resolve(__dirname, 'lib/framer-motion-mock.js');
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ];
    return config;
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-1802bb19214743ffa99aa227f25e7ede.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
  },
  async headers() {
    const headers = [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(favicon.ico|icon.png|icon-512.png|apple-icon.png|site.webmanifest)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/sitemaps/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Global Vercel Edge CDN Caching for public landing pages - eliminates 99% of Serverless Function CPU
      {
        source: '/:slug((?!api|_next|admin|dashboard|private|f|thank-you).*)',
        headers: [
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];

    // Enforce noindex on all vercel.app preview/branch deployment hosts
    headers.push({
      source: '/:path*',
      has: [
        {
          type: 'host',
          value: '(.*)\\.vercel\\.app',
        },
      ],
      headers: [
        {
          key: 'X-Robots-Tag',
          value: 'noindex, nofollow',
        },
      ],
    });

    if (process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development') {
      headers.push({
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
        source: '/:path*',
      });
    }
    
    return headers;
  },
  async rewrites() {
    return [
      {
        source: '/sitemap_index.xml',
        destination: '/sitemap.xml',
      },
      {
        source: '/page-sitemap.xml',
        destination: '/sitemap.xml',
      },
    ];
  },
  async redirects() {
    return [
      // 1. Canonicalize apex magnevents.in to www.magnevents.in
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'magnevents.in',
          },
        ],
        destination: 'https://www.magnevents.in/:path*',
        permanent: true,
      },
      // 3. Consolidate legacy/duplicate category paths to canonical programmatic routes
      {
        source: '/artists/singers/:city',
        destination: '/singer-in-:city',
        permanent: true,
      },
      {
        source: '/artists/djs/:city',
        destination: '/dj-in-:city',
        permanent: true,
      },
      {
        source: '/artists/live-bands/:city',
        destination: '/live-band-in-:city',
        permanent: true,
      },
      // 4. Consolidate prefix variants to master canonical routes
      {
        source: '/book-singer-in-:city',
        destination: '/singer-in-:city',
        permanent: true,
      },
      {
        source: '/live-singer-in-:city',
        destination: '/singer-in-:city',
        permanent: true,
      },
      // 5. Clean up old removed wedding invitation routes (permanently redirect to home)
      {
        source: '/wedding-invitations/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wedding-invitation/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/invitation-maker/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/about',
        destination: '/blog-post',
        permanent: true,
      },
      {
        source: '/register',
        destination: 'https://artists.magnevents.in/register',
        permanent: true,
      },
      {
        source: '/artist-registration',
        destination: 'https://artists.magnevents.in/register',
        permanent: true,
      },
      {
        source: '/register/artist',
        destination: 'https://artists.magnevents.in/register',
        permanent: true,
      },
      {
        source: '/null',
        destination: '/',
        permanent: true,
      },
      {
        source: '/book',
        destination: '/',
        permanent: true,
      },
      {
        source: '/contact',
        destination: '/',
        permanent: true,
      },
      {
        source: '/search',
        destination: '/ai-search',
        permanent: true,
      },
      {
        source: '/how-to-book-a-singrs-in-delhi',
        destination: '/artists',
        permanent: true,
      },
      {
        source: '/how-to-book-a-singer-in-delhi',
        destination: '/artists',
        permanent: true,
      },
      {
        source: '/mobile-home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/city',
        destination: '/',
        permanent: true,
      },
      {
        source: '/city/:city_slug/blog',
        destination: '/city/:city_slug',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
      {
        source: '/dashboard/:path*',
        destination: '/',
        permanent: true,
      },
    ]
  }
}

module.exports = withPWA(nextConfig)
