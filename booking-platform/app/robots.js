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
    // Block crawl loops and duplicate parameter URLs for Google Search Console
    '/ai-search?*',
    '/artists?*',
    '/*?*q=*',
    '/*?*category=*',
    '/*?*city=*',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowList,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowList,
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemaps/all-1063-cities-sitemap.xml`,
    ],
    host: baseUrl,
  };
}
