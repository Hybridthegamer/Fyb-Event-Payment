'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { formatNaira } from '@/lib/utils';

export default function HomePage() {
  return (
    <AuthGuard>
      {() => <HomeContent />}
    </AuthGuard>
  );
}

function HomeContent() {
  const [poolClicked, setPoolClicked] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bam-bg)' }}>
      <Navbar pageLabel="HOME" />

      {/* Ticker */}
      <div
        style={{
          marginTop: '56px',
          background: 'var(--bam-surface)',
          borderTop: '1px solid var(--bam-border)',
          borderBottom: '1px solid var(--bam-border)',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            animation: 'bam-marquee 40s linear infinite',
            whiteSpace: 'nowrap',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--bam-font-mono)',
                fontSize: 'var(--bam-t-micro)',
                color: 'var(--bam-cream-40)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                paddingRight: '3rem',
              }}
            >
              NACOS FYB · CLASS OF 2026 · RIVERS STATE UNIVERSITY · DINNER NIGHT · MASKED PARTY · POOL PARTY ·{' '}
            </span>
          ))}
        </div>
      </div>

      {/* Intro */}
      <div
        style={{
          padding: 'var(--bam-space-3xl) var(--bam-pad) var(--bam-space-xl)',
        }}
      >
        <p
          data-reveal
          style={{
            fontFamily: 'var(--bam-font-mono)',
            fontSize: 'var(--bam-t-micro)',
            color: 'var(--bam-cream-20)',
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            marginBottom: 'var(--bam-space-md)',
          }}
        >
          SELECT EVENT
        </p>
        <h1
          data-reveal
          data-reveal-delay="100"
          style={{
            fontFamily: 'var(--bam-font-serif)',
            fontSize: 'var(--bam-t-headline)',
            color: 'var(--bam-cream)',
            letterSpacing: '-0.02em',
            margin: 0,
            fontWeight: 400,
          }}
        >
          Choose Your Night.
        </h1>
      </div>

      {/* Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        style={{ padding: '0 var(--bam-pad) var(--bam-space-3xl)' }}
      >
        {/* Card 1: Dinner Night */}
        <div
          data-reveal
          style={{
            background: 'var(--bam-surface)',
            border: '1px solid var(--bam-border)',
            borderRadius: 0,
            padding: 'var(--bam-space-2xl)',
            animation: 'bam-pulse-border 4s ease-in-out infinite',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 'var(--bam-space-md)',
              right: 'var(--bam-space-md)',
              fontSize: '4rem',
              opacity: 0.06,
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            aria-hidden="true"
          >
            🎭
          </div>

          <p
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: 'var(--bam-t-micro)',
              color: 'var(--bam-cream-20)',
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              marginBottom: 'var(--bam-space-md)',
            }}
          >
            EVENT 01 · DINNER
          </p>

          <h2
            style={{
              fontFamily: 'var(--bam-font-serif)',
              fontSize: 'var(--bam-t-headline)',
              color: 'var(--bam-cream)',
              letterSpacing: '-0.02em',
              lineHeight: 0.85,
              margin: 0,
              fontWeight: 400,
            }}
          >
            DINNER
          </h2>
          <h2
            style={{
              fontFamily: 'var(--bam-font-serif)',
              fontSize: 'var(--bam-t-headline)',
              color: 'var(--event-gold)',
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              lineHeight: 0.85,
              margin: '0 0 var(--bam-space-md)',
              fontWeight: 400,
            }}
          >
            NIGHT
          </h2>

          <p
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: 'var(--bam-t-micro)',
              color: 'var(--bam-cream-40)',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              marginBottom: 'var(--bam-space-lg)',
            }}
          >
            MASKED PARTY · FROM {formatNaira(25000)}
          </p>

          <div
            style={{
              height: '1px',
              background: 'var(--bam-border)',
              margin: 'var(--bam-space-lg) 0',
            }}
          />

          <p
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: '0.85rem',
              color: 'var(--bam-cream-60)',
              lineHeight: 1.7,
              marginBottom: 'var(--bam-space-xl)',
            }}
          >
            An elegant masquerade dinner to celebrate the graduating class of Rivers State University.
          </p>

          <Link href="/dinner">
            <button
              className="w-full"
              style={{
                background: 'var(--bam-red)',
                color: 'var(--bam-cream)',
                border: 'none',
                borderRadius: 0,
                fontFamily: 'var(--bam-font-mono)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.20em',
                padding: '14px 32px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bam-red-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bam-red)';
              }}
            >
              REGISTER NOW →
            </button>
          </Link>
        </div>

        {/* Card 2: Pool Party */}
        <div>
          <div
            data-reveal
            data-reveal-delay="150"
            onClick={() => setPoolClicked(true)}
            style={{
              background: 'var(--bam-bg)',
              border: '1px solid var(--bam-border)',
              borderRadius: 0,
              padding: 'var(--bam-space-2xl)',
              opacity: 0.55,
              cursor: 'not-allowed',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--bam-font-mono)',
                fontSize: 'var(--bam-t-micro)',
                color: 'var(--bam-cream-20)',
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                marginBottom: 'var(--bam-space-md)',
              }}
            >
              EVENT 02 · POOL PARTY
            </p>

            <h2
              style={{
                fontFamily: 'var(--bam-font-serif)',
                fontSize: 'var(--bam-t-headline)',
                color: 'var(--bam-cream-40)',
                letterSpacing: '-0.02em',
                lineHeight: 0.85,
                margin: 0,
                fontWeight: 400,
              }}
            >
              POOL
            </h2>
            <h2
              style={{
                fontFamily: 'var(--bam-font-serif)',
                fontSize: 'var(--bam-t-headline)',
                color: 'var(--bam-cream-40)',
                letterSpacing: '-0.02em',
                lineHeight: 0.85,
                margin: '0 0 var(--bam-space-xl)',
                fontWeight: 400,
              }}
            >
              PARTY
            </h2>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--bam-space-xl)' }}>
              <span
                style={{
                  background: 'var(--bam-surface-2)',
                  border: '1px solid var(--bam-border)',
                  borderRadius: '9999px',
                  fontFamily: 'var(--bam-font-mono)',
                  fontSize: '0.6rem',
                  color: 'var(--bam-cream-40)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  padding: '6px 18px',
                }}
              >
                COMING SOON
              </span>
            </div>

            <button
              disabled
              className="w-full"
              style={{
                background: 'var(--bam-surface-2)',
                border: '1px solid var(--bam-border)',
                borderRadius: 0,
                color: 'var(--bam-cream-20)',
                fontFamily: 'var(--bam-font-mono)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.20em',
                padding: '14px 32px',
                cursor: 'not-allowed',
              }}
            >
              NOT AVAILABLE YET
            </button>
          </div>

          {poolClicked && (
            <p
              style={{
                fontFamily: 'var(--bam-font-mono)',
                fontSize: 'var(--bam-t-micro)',
                color: 'var(--bam-cream-40)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginTop: 'var(--bam-space-md)',
                animation: 'bam-fadeIn 0.3s ease',
              }}
            >
              Details coming soon · Stay tuned
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--bam-border)',
          padding: 'var(--bam-space-xl) var(--bam-pad)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--bam-font-mono)',
            fontSize: 'var(--bam-t-micro)',
            color: 'var(--bam-cream-20)',
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
          }}
        >
          NACOS · RSU · CLASS OF 2026
        </p>
      </div>
    </div>
  );
}
