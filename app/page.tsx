'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
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
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-[#2C0A0A]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-16">
        {/* Heading */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl sm:text-5xl font-bold text-white"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Choose Your Event
          </h1>
          <p className="mt-3 text-[#C4A882] font-inter text-sm sm:text-base">
            Select an event below to register and make payment
          </p>
        </div>

        {/* Event cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card 1: FYB Dinner Night */}
          <div
            className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(145deg, #4A1515 0%, #3D1010 100%)',
              border: '1px solid rgba(201,162,39,0.4)',
              boxShadow: '0 0 30px rgba(201,162,39,0.12)',
            }}
            onClick={() => router.push('/dinner')}
          >
            {/* Background mask icon */}
            <div className="absolute bottom-4 right-4 text-[100px] opacity-[0.06] select-none pointer-events-none group-hover:opacity-[0.1] transition-opacity">
              🎭
            </div>

            {/* Gold glow top edge */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #C9A227, transparent)' }} />

            <div className="relative z-10 p-7 flex flex-col h-full gap-4">
              {/* Title section */}
              <div>
                <p
                  className="text-sm font-semibold tracking-widest mb-1"
                  style={{ fontFamily: '"Playfair Display", serif', color: '#C9A227' }}
                >
                  NACOS FYB
                </p>
                <h2
                  className="text-3xl sm:text-4xl font-bold text-white leading-tight"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  DINNER NIGHT
                </h2>

                {/* Badge */}
                <div className="inline-flex mt-2">
                  <span
                    className="text-xs font-inter font-medium px-3 py-1 rounded-full"
                    style={{ background: 'rgba(201,162,39,0.15)', color: '#C9A227', border: '1px solid rgba(201,162,39,0.3)' }}
                  >
                    🎭 Masked Party
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm font-inter leading-relaxed flex-1" style={{ color: '#C4A882' }}>
                An elegant masquerade dinner night to celebrate the graduating class. A night of glamour, networking, and memories.
              </p>

              {/* Price + CTA */}
              <div className="flex items-center justify-between gap-3 mt-2">
                <div>
                  <p className="text-[10px] font-inter uppercase tracking-widest" style={{ color: '#C4A882' }}>Starting from</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: '"Playfair Display", serif', color: '#E8C84A' }}>
                    {formatNaira(25000)}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push('/dinner'); }}
                  className="btn-gold px-5 py-2.5 rounded-lg font-inter font-semibold text-sm whitespace-nowrap"
                >
                  Register Now
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Pool Party (Coming Soon) */}
          <div
            className="relative rounded-2xl overflow-hidden cursor-not-allowed"
            style={{
              background: 'linear-gradient(145deg, #3A1212 0%, #2E0D0D 100%)',
              border: '1px solid rgba(201,162,39,0.15)',
              opacity: 0.65,
              filter: 'grayscale(30%)',
            }}
            onClick={() => toast('Details coming soon! Stay tuned.', { icon: '📢' })}
          >
            <div className="relative z-10 p-7 flex flex-col h-full gap-4">
              {/* Title */}
              <div>
                <h2
                  className="text-3xl sm:text-4xl font-bold text-white leading-tight"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  FYB POOL PARTY
                </h2>
              </div>

              {/* Coming Soon badge */}
              <div className="flex-1 flex items-center justify-center">
                <div
                  className="px-8 py-3 rounded-full text-lg font-bold font-inter tracking-widest"
                  style={{
                    background: 'linear-gradient(135deg, #C9A227, #E8C84A)',
                    color: '#1A0505',
                  }}
                >
                  COMING SOON
                </div>
              </div>

              <button
                disabled
                className="w-full py-3 rounded-lg font-inter font-semibold text-sm cursor-not-allowed opacity-50"
                style={{ border: '1px solid rgba(201,162,39,0.3)', color: '#C4A882' }}
              >
                Not Available Yet
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
