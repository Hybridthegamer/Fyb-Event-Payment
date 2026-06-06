'use client';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-[#2C0A0A]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-md rounded-2xl overflow-hidden text-center"
          style={{
            background: 'linear-gradient(145deg, #4A1515 0%, #3D1010 100%)',
            border: '1px solid rgba(201,162,39,0.3)',
            boxShadow: '0 0 40px rgba(201,162,39,0.12)',
          }}
        >
          {/* Top gold line */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #C9A227, #E8C84A)' }} />

          <div className="p-10 flex flex-col items-center gap-5">
            <div className="text-6xl">🏊</div>

            <h1
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              FYB POOL PARTY
            </h1>

            {/* Coming Soon badge */}
            <div
              className="px-8 py-3 rounded-full text-base font-bold font-inter tracking-widest"
              style={{ background: 'linear-gradient(135deg, #C9A227, #E8C84A)', color: '#1A0505' }}
            >
              COMING SOON
            </div>

            <p className="text-sm font-inter leading-relaxed" style={{ color: '#C4A882' }}>
              Details will be announced soon. Stay tuned for an epic end-of-year celebration!
            </p>

            <div className="w-full h-px" style={{ background: 'rgba(201,162,39,0.2)' }} />

            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 font-inter text-sm font-medium transition-colors hover:text-[#C9A227]"
              style={{ color: '#C4A882' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Go Back to Events
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
