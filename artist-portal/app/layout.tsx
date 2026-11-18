import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth/authContext';

export const metadata: Metadata = {
  title: 'Magnevents Artist Portal | Performer Suite',
  description: 'Manage live gigs, portfolio, availability, and earnings on Magnevents.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.webp',
    apple: '/logo.webp',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Magnevents Artist',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F8FAFC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body className="bg-[#F8FAFC] text-[#0F172A] font-sans min-h-screen selection:bg-sky-500 selection:text-white antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
