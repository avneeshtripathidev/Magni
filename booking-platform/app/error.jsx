'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log error to monitoring / console without crashing SSR
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div style={{
      backgroundColor: '#090a0f',
      color: '#f8fafc',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '560px', width: '100%' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          padding: '6px 18px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '1px',
          marginBottom: '20px',
          border: '1px solid rgba(239, 68, 68, 0.25)'
        }}>
          TEMPORARY SERVER NOTICE
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1.2,
          marginBottom: '16px'
        }}>
          Something went wrong
        </h1>

        <p style={{
          color: '#94a3b8',
          fontSize: '15px',
          lineHeight: 1.6,
          marginBottom: '32px',
          maxWidth: '440px',
          margin: '0 auto 32px auto'
        }}>
          We encountered an unexpected issue while loading this page. Our engineering team has been notified.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#fbbf24',
              color: '#0f172a',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px -4px rgba(251, 191, 36, 0.4)'
            }}
          >
            <RefreshCw size={16} /> Try Again
          </button>

          <Link
            href="/"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

