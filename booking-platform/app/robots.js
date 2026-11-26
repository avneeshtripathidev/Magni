export default function robots() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.magnevents.in').replace(/\/+$/, '');
  
  const disallowList = [
    '/api',
    '/api/',
    '/api/*',
    '/admin',
    '/admin/',
    '/admin/*',
    '/dashboard',
    '/dashboard/',
    '/dashboard/*',
    '/private',
    '/private/',
    '/private/*',
    '/preview',
    '/preview/',
    '/preview/*',
    '/thank-you',
    '/thank-you/',
    '/thank-you/*',
    '/f/*',
    '/_next/static/chunks/*',
    // Block crawl loops and duplicate parameter URLs for search crawlers
    '/ai-search?*',
    '/artists?*',
    '/*?*q=*',
    '/*?*category=*',
    '/*?*city=*',
  ];

  return {
    rules: [
      {
        userAgent: [
          'AhrefsBot',
          'SemrushBot',
          'SemrushBot-SA',
          'MJ12bot',
          'DotBot',
          'PetalBot',
          'Bytespider',
          'Amazonbot',
          'DataForSeoBot'
        ],
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowList,
      },
      {
        userAgent: [
          'Googlebot',
          'Googlebot-Image',
          'Googlebot-Mobile',
          'Bingbot',
          'Slurp',
          'DuckDuckBot',
          'Baiduspider',
          'YandexBot',
          'Applebot',
          'facebookexternalhit',
          'Twitterbot',
          'LinkedInBot',
          'WhatsApp',
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'OAI-SearchBot',
          'CCBot'
        ],
        allow: '/',
        disallow: disallowList,
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemaps/sitemap-index.xml`,
      `${baseUrl}/sitemaps/all-1063-cities-sitemap.xml`,
      `${baseUrl}/sitemaps/events-sitemap.xml`,
      `${baseUrl}/sitemaps/artists-categories-sitemap.xml`,
      `${baseUrl}/llms.txt`,
      `${baseUrl}/llms-full.txt`,
    ],
    host: baseUrl,
  };
}
