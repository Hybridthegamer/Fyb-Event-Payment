'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (
        error.code !== 'auth/popup-closed-by-user' &&
        error.code !== 'auth/cancelled-popup-request'
      ) {
        toast.error('Sign-in failed. Please try again.');
      }
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bam-bg)',
        }}
      >
        <div className="bam-spinner" />
        <style>{`.bam-spinner{width:28px;height:28px;border:1px solid var(--bam-cream-40);border-top-color:transparent;border-radius:50%;animation:bam-spin 1s linear infinite}@keyframes bam-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col md:flex-row"
      style={{ minHeight: '100vh', background: 'var(--bam-bg)' }}
    >
      {/* Left column */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{
          padding: 'var(--bam-pad)',
          background:
            'radial-gradient(ellipse at 30% 60%, rgba(200,0,60,0.06) 0%, transparent 70%)',
        }}
      >
        <div style={{ maxWidth: '520px', width: '100%' }}>
          <p
            data-reveal
            data-reveal-delay="0"
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: 'var(--bam-t-micro)',
              color: 'var(--bam-cream-40)',
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              marginBottom: 'var(--bam-space-md)',
            }}
          >
            NACOS · RSU · CLASS OF 2026
          </p>
          <h1
            data-reveal
            data-reveal-delay="100"
            style={{
              fontFamily: 'var(--bam-font-serif)',
              fontSize: 'clamp(4rem, 12vw, 9rem)',
              color: 'var(--bam-cream)',
              letterSpacing: '-0.02em',
              lineHeight: 0.9,
              margin: 0,
              fontWeight: 400,
            }}
          >
            FYB
          </h1>
          <h2
            data-reveal
            data-reveal-delay="200"
            style={{
              fontFamily: 'var(--bam-font-serif)',
              fontSize: 'clamp(4rem, 12vw, 9rem)',
              color: 'var(--event-gold)',
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              lineHeight: 0.9,
              margin: '0 0 var(--bam-space-lg)',
              fontWeight: 400,
            }}
          >
            DINNER NIGHT
          </h2>
          <p
            data-reveal
            data-reveal-delay="300"
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: 'var(--bam-t-micro)',
              color: 'var(--bam-cream-40)',
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
            }}
          >
            FINAL YEAR BASH · CLASS OF 2026
          </p>
        </div>
      </div>

      {/* Right column */}
      <div
        className="flex-1 flex items-center justify-center border-t md:border-t-0 md:border-l"
        style={{
          padding: 'var(--bam-pad)',
          borderColor: 'var(--bam-border)',
        }}
      >
        <div style={{ maxWidth: '320px', width: '100%' }}>
          <p
            data-reveal
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: 'var(--bam-t-micro)',
              color: 'var(--bam-cream-20)',
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              marginBottom: 'var(--bam-space-sm)',
            }}
          >
            ACCESS PORTAL
          </p>
          <div
            style={{
              width: '40px',
              height: '1px',
              background: 'var(--bam-border)',
              marginBottom: 'var(--bam-space-lg)',
            }}
          />
          <p
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: '0.85rem',
              color: 'var(--bam-cream-60)',
              marginBottom: 'var(--bam-space-xl)',
              lineHeight: 1.6,
            }}
          >
            Sign in with your Google account to continue
          </p>

          <button
            data-reveal
            data-reveal-delay="200"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3"
            style={{
              maxWidth: '320px',
              padding: '14px 32px',
              background: 'var(--bam-surface-2)',
              border: '1px solid var(--bam-border)',
              borderRadius: 0,
              color: 'var(--bam-cream)',
              fontFamily: 'var(--bam-font-mono)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              cursor: signingIn ? 'not-allowed' : 'pointer',
              opacity: signingIn ? 0.6 : 1,
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!signingIn) {
                e.currentTarget.style.background = 'var(--bam-surface)';
                e.currentTarget.style.borderColor = 'var(--bam-cream-40)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bam-surface-2)';
              e.currentTarget.style.borderColor = 'var(--bam-border)';
            }}
          >
            {signingIn ? (
              <div className="bam-spinner-sm" />
            ) : (
              <GoogleIcon />
            )}
            {signingIn ? 'SIGNING IN...' : 'CONTINUE WITH GOOGLE'}
          </button>

          <p
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: 'var(--bam-t-micro)',
              color: 'var(--bam-cream-20)',
              marginTop: 'var(--bam-space-lg)',
              letterSpacing: '0.05em',
            }}
          >
            Use your RSU email address for verification
          </p>
        </div>
      </div>

      <style>{`.bam-spinner-sm{width:16px;height:16px;border:1px solid var(--bam-cream-40);border-top-color:transparent;border-radius:50%;animation:bam-spin 1s linear infinite;flex-shrink:0}@keyframes bam-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2a10.34 10.34 0 0 0-.164-1.84H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
