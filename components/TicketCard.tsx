'use client';

import { useRef, useState } from 'react';
import { getMatricLast4 } from '@/lib/utils';

interface TicketCardProps {
  fullName: string;
  matricNumber: string;
  isPlusOne?: boolean;
  plusOneIndex?: number;
  plusOneName?: string;
}

export default function TicketCard({
  fullName,
  matricNumber,
  isPlusOne = false,
  plusOneIndex,
  plusOneName,
}: TicketCardProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const last4 = getMatricLast4(matricNumber);
  const displayName = isPlusOne && plusOneName ? plusOneName : fullName;

  const downloadTicket = async () => {
    if (!ticketRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = isPlusOne
        ? `NACOS-FYB-PlusOne${plusOneIndex}-Ticket-${last4}.png`
        : `NACOS-FYB-Ticket-${last4}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // silently fail — user can screenshot instead
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Ticket card */}
      <div
        ref={ticketRef}
        className="relative w-[340px] sm:w-[560px] rounded-xl overflow-hidden select-none"
        style={{
          background: 'linear-gradient(135deg, #2C0A0A 0%, #4A1515 100%)',
          border: '2px solid #C9A227',
          boxShadow: '0 0 30px rgba(201,162,39,0.25)',
          fontFamily: 'Inter, sans-serif',
          padding: '28px 32px',
        }}
      >
        {/* Plus One badge */}
        {isPlusOne && (
          <div
            className="absolute top-3 right-3 text-[10px] font-bold tracking-widest px-2 py-1 rounded"
            style={{ background: 'rgba(201,162,39,0.2)', color: '#C9A227', border: '1px solid #C9A227' }}
          >
            PLUS ONE
          </div>
        )}

        {/* Logos */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-white rounded-full px-3 py-1 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center text-white text-[7px] font-bold">
              NACOS
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center text-white text-[7px] font-bold">
              RSU
            </div>
          </div>
        </div>

        {/* Event title */}
        <div className="text-center mb-4">
          <p style={{ color: '#C9A227', fontFamily: '"Playfair Display", serif', fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em' }}>
            NACOS FYB
          </p>
          <p style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", serif', fontSize: '28px', fontWeight: 700, lineHeight: 1.1 }}>
            DINNER NIGHT
          </p>
          <div className="inline-flex items-center gap-1 mt-1 px-3 py-1 rounded-full" style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.4)' }}>
            <span style={{ fontSize: '12px' }}>🎭</span>
            <span style={{ color: '#C9A227', fontSize: '11px', fontWeight: 500 }}>Masked Party</span>
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #C9A227, transparent)', margin: '16px 0' }} />

        {/* Ticket info */}
        <div className="text-center">
          <p style={{ color: '#C4A882', fontSize: '11px', letterSpacing: '0.2em', fontWeight: 500 }}>ADMIT ONE</p>
          <p style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 700, marginTop: '4px', fontFamily: '"Playfair Display", serif' }}>
            {displayName}
          </p>
          <p style={{ color: '#C9A227', fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.15em', marginTop: '4px' }}>
            TICKET NO: {last4}
            {isPlusOne && ` • PLUS ONE ${plusOneIndex}`}
          </p>
        </div>

        {/* Decorative barcode strip */}
        <div className="mt-5 flex gap-0.5 overflow-hidden rounded" style={{ height: '28px' }}>
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: `0 0 ${Math.random() > 0.5 ? 4 : 2}px`,
                background: i % 3 === 0 ? '#C9A227' : i % 5 === 0 ? '#E8C84A' : 'rgba(201,162,39,0.3)',
                height: '100%',
              }}
            />
          ))}
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={downloadTicket}
        disabled={downloading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-inter font-semibold transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ background: 'linear-gradient(135deg, #C9A227, #E8C84A)', color: '#1A0505' }}
      >
        {downloading ? (
          <>
            <div className="w-4 h-4 border-2 border-[#1A0505] border-t-transparent rounded-full animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Download Ticket
          </>
        )}
      </button>
    </div>
  );
}
