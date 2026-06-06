'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';
import LogoPill from '@/components/LogoPill';

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
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast.error('Sign-in failed. Please try again.');
      }
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2C0A0A]">
        <div className="w-12 h-12 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#2C0A0A]"
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 30%, #3D1010 0%, #2C0A0A 65%)' }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 text-[120px] opacity-[0.03] select-none">🎭</div>
        <div className="absolute bottom-1/4 right-1/4 text-[120px] opacity-[0.03] select-none">🎭</div>
      </div>

      <div
        className="relative w-full max-w-sm rounded-2xl p-8 flex flex-col items-center gap-6"
        style={{
          background: '#3D1010',
          border: '1px solid rgba(201,162,39,0.35)',
          boxShadow: '0 0 60px rgba(201,162,39,0.12), 0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logos */}
        <LogoPill />

        {/* Title */}
        <div className="text-center space-y-1">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: '"Playfair Display", serif', color: '#C9A227' }}
          >
            NACOS FYB PORTAL
          </h1>
          <p className="text-sm font-inter" style={{ color: '#C4A882' }}>
            Sign in to access event registration
          </p>
        </div>

        {/* Gold divider */}
        <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.5), transparent)' }} />

        {/* Google sign-in button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl font-inter font-medium text-sm transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: '#fff',
            color: '#1A0505',
            border: '2px solid #C9A227',
            boxShadow: signingIn ? 'none' : '0 0 20px rgba(201,162,39,0.2)',
          }}
        >
          {signingIn ? (
            <div className="w-5 h-5 border-2 border-[#1A0505] border-t-transparent rounded-full animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {signingIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        {/* Footer note */}
        <p className="text-center text-[11px] font-inter" style={{ color: '#C4A882' }}>
          Use your RSU email address for verification purposes
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2a10.34 10.34 0 0 0-.164-1.84H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
