'use client';

import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';

export default function PoolPartyPage() {
  return (
    <AuthGuard>
      {() => <PoolPartyContent />}
    </AuthGuard>
  );
}

function PoolPartyContent() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bam-bg)' }}>
      <Navbar pageLabel="POOL PARTY" />

      <div
        className="flex flex-col md:flex-row"
        style={{ minHeight: '100vh', paddingTop: '56px' }}
      >
        {/* Left column */}
        <div
          className="flex-1 flex items-center justify-center"
          style={{ padding: 'var(--bam-pad)' }}
        >
          <div style={{ maxWidth: '520px', width: '100%' }}>
            <p
              style={{
                fontFamily: 'var(--bam-font-mono)',
                fontSize: 'var(--bam-t-micro)',
                color: 'var(--bam-cream-40)',
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                marginBottom: 'var(--bam-space-md)',
              }}
            >
              EVENT 02 · POOL PARTY
            </p>
            <h1
              data-reveal
              style={{
                fontFamily: 'var(--bam-font-serif)',
                fontSize: 'var(--bam-t-display)',
                color: 'var(--bam-cream-20)',
                letterSpacing: '-0.02em',
                lineHeight: 0.9,
                margin: 0,
                fontWeight: 400,
              }}
            >
              POOL
            </h1>
            <h1
              data-reveal
              data-reveal-delay="80"
              style={{
                fontFamily: 'var(--bam-font-serif)',
                fontSize: 'var(--bam-t-display)',
                color: 'var(--bam-cream-20)',
                letterSpacing: '-0.02em',
                lineHeight: 0.9,
                margin: 0,
                fontWeight: 400,
              }}
            >
              PARTY
            </h1>
          </div>
        </div>

        {/* Right column */}
        <div
          className="flex-1 flex items-center justify-center border-t md:border-t-0 md:border-l"
          style={{ padding: 'var(--bam-pad)', borderColor: 'var(--bam-border)' }}
        >
          <div style={{ maxWidth: '360px', width: '100%' }}>
            <span
              data-reveal
              style={{
                display: 'inline-block',
                background: 'var(--bam-surface)',
                border: '1px solid var(--bam-border)',
                borderRadius: '9999px',
                fontFamily: 'var(--bam-font-mono)',
                fontSize: '0.75rem',
                color: 'var(--bam-cream-40)',
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                padding: '12px 32px',
                marginBottom: 'var(--bam-space-xl)',
              }}
            >
              COMING SOON
            </span>

            <p
              style={{
                fontFamily: 'var(--bam-font-mono)',
                fontSize: '0.85rem',
                color: 'var(--bam-cream-40)',
                marginBottom: 'var(--bam-space-xl)',
              }}
            >
              Details will be announced soon.
            </p>

            <div style={{ height: '1px', background: 'var(--bam-border)', marginBottom: 'var(--bam-space-xl)' }} />

            <Link href="/">
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--bam-cream-40)',
                  fontFamily: 'var(--bam-font-mono)',
                  fontSize: 'var(--bam-t-micro)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--bam-cream)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--bam-cream-40)'; }}
              >
                ← BACK TO EVENTS
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
