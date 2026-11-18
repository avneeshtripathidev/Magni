"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/artists');
  }, [router]);

  return (
    <>
      <meta httpEquiv="refresh" content="0;url=/artists" />
      <div
        style={{
          backgroundColor: '#090a0f',
          color: '#f8fafc',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '15px',
              marginBottom: '20px',
            }}
          >
            Redirecting you to our verified artists...
          </p>
          <Link
            href="/artists"
            style={{
              backgroundColor: '#fbbf24',
              color: '#0f172a',
              padding: '12px 28px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Browse Artists
          </Link>
        </div>
      </div>
    </>
  );
}
