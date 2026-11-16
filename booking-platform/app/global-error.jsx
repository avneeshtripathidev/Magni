'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Fatal Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <title>Server Error | Magnevents</title>
      </head>
      <body style={{
        margin: 0,
        backgroundColor: '#090a0f',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '500px' }}>
          <h1 style={{ fontSize: '36px', color: '#ffffff', marginBottom: '16px' }}>Service Unavailable</h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
            A temporary system error occurred. Please refresh the page or return to the main site.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#fbbf24',
                color: '#0f172a',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
            <a
              href="/"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Go to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

