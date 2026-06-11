'use client';

import { memo } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface NavbarProps {
  pageLabel?: string;
  stepLabel?: string;
}

const Navbar = memo(function Navbar({ pageLabel, stepLabel }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--bam-pad)',
        background: 'var(--bam-overlay)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--bam-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: '9999px',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxHeight: '32px',
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '5.5px',
              fontWeight: 700,
              fontFamily: 'var(--bam-font-mono)',
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}
          >
            NACOS
          </div>
          <div style={{ width: '1px', height: '14px', background: '#d1d5db', flexShrink: 0 }} />
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#14532d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '6.5px',
              fontWeight: 700,
              fontFamily: 'var(--bam-font-mono)',
              flexShrink: 0,
            }}
          >
            RSU
          </div>
        </div>
        <span
          style={{
            fontFamily: 'var(--bam-font-mono)',
            fontSize: '0.6rem',
            color: 'var(--bam-cream-40)',
            textTransform: 'uppercase',
            letterSpacing: '0.20em',
          }}
        >
          NACOS · RSU
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {pageLabel && (
          <span
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: '0.6rem',
              color: 'var(--bam-cream-40)',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
            }}
          >
            {pageLabel}
            {stepLabel ? ` · ${stepLabel}` : ''}
          </span>
        )}
        <button
          onClick={handleSignOut}
          style={{
            fontFamily: 'var(--bam-font-mono)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            border: '1px solid var(--bam-border)',
            background: 'transparent',
            color: 'var(--bam-cream-60)',
            padding: '6px 14px',
            borderRadius: 0,
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--bam-cream-40)';
            e.currentTarget.style.color = 'var(--bam-cream)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--bam-border)';
            e.currentTarget.style.color = 'var(--bam-cream-60)';
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
});

export default Navbar;
