'use client';

import { memo, useRef, useState } from 'react';
import { getMatricLast4 } from '@/lib/utils';

interface TicketCardProps {
  fullName: string;
  matricNumber: string;
  isPlusOne?: boolean;
  plusOneIndex?: number;
  plusOneName?: string;
}

const TicketCard = memo(function TicketCard({
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
    <div
      className="flex flex-col items-center gap-3"
      data-ticket
      data-plusone={isPlusOne ? 'true' : 'false'}
      data-idx={isPlusOne ? String(plusOneIndex) : ''}
    >
      {/* Ticket */}
      <div
        ref={ticketRef}
        style={{
          width: '640px',
          maxWidth: '100%',
          height: '280px',
          background: 'linear-gradient(135deg, #0D0D0D 0%, #1A0505 100%)',
          border: '1px solid var(--event-gold)',
          borderRadius: 0,
          overflow: 'hidden',
          display: 'flex',
          position: 'relative',
          fontFamily: 'var(--bam-font-mono)',
        }}
      >
        {/* Plus One badge */}
        {isPlusOne && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'var(--bam-red)',
              color: 'var(--bam-cream)',
              fontFamily: 'var(--bam-font-mono)',
              fontSize: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              padding: '4px 10px',
              zIndex: 2,
            }}
          >
            PLUS ONE
          </div>
        )}

        {/* Left section — 60% */}
        <div
          style={{
            width: '60%',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {/* Logo */}
            <div
              style={{
                background: '#fff',
                borderRadius: '9999px',
                padding: '3px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '4.5px',
                  fontWeight: 700,
                }}
              >
                NACOS
              </div>
              <div style={{ width: '1px', height: '12px', background: '#d1d5db' }} />
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#14532d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '5px',
                  fontWeight: 700,
                }}
              >
                RSU
              </div>
            </div>

            <p
              style={{
                fontFamily: 'var(--bam-font-mono)',
                fontSize: '0.5rem',
                color: 'var(--bam-cream-40)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                margin: '0 0 6px',
              }}
            >
              NACOS · RSU · CLASS OF 2026
            </p>

            <p
              style={{
                fontFamily: 'var(--bam-font-serif)',
                fontSize: '2.2rem',
                color: 'var(--bam-cream)',
                letterSpacing: '-0.02em',
                lineHeight: 0.85,
                margin: 0,
                fontWeight: 400,
              }}
            >
              DINNER
            </p>
            <p
              style={{
                fontFamily: 'var(--bam-font-serif)',
                fontSize: '2.2rem',
                color: 'var(--event-gold)',
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
                lineHeight: 0.85,
                margin: '0 0 8px',
                fontWeight: 400,
              }}
            >
              NIGHT
            </p>

            <span
              style={{
                fontFamily: 'var(--bam-font-mono)',
                fontSize: '0.5rem',
                color: 'var(--bam-cream-20)',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                background: 'var(--bam-cream-08)',
                borderRadius: '9999px',
                padding: '3px 8px',
              }}
            >
              MASKED PARTY
            </span>
          </div>

          <div>
            <div
              style={{
                height: '1px',
                background: 'rgba(201, 162, 39, 0.3)',
                margin: '12px 0',
              }}
            />
            <p
              style={{
                fontFamily: 'var(--bam-font-mono)',
                fontSize: '0.5rem',
                color: 'var(--bam-cream-20)',
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                margin: '0 0 4px',
              }}
            >
              {isPlusOne ? `PLUS ONE · ${plusOneIndex}` : 'ADMIT ONE'}
            </p>
            <p
              style={{
                fontFamily: 'var(--bam-font-serif)',
                fontSize: '1.4rem',
                color: 'var(--bam-cream)',
                margin: 0,
                fontWeight: 400,
                lineHeight: 1.1,
              }}
            >
              {displayName}
            </p>
          </div>
        </div>

        {/* Dashed vertical divider */}
        <div
          style={{
            width: '1px',
            background:
              'repeating-linear-gradient(to bottom, rgba(201,162,39,0.2) 0px, rgba(201,162,39,0.2) 6px, transparent 6px, transparent 12px)',
            alignSelf: 'stretch',
            flexShrink: 0,
          }}
        />

        {/* Right section — 40% */}
        <div
          style={{
            flex: 1,
            padding: '28px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--bam-font-mono)',
                fontSize: '0.5rem',
                color: 'var(--bam-cream-40)',
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                margin: '0 0 4px',
              }}
            >
              TICKET NO.
            </p>
            <p
              style={{
                fontFamily: 'var(--bam-font-serif)',
                fontSize: '3rem',
                color: 'var(--event-gold)',
                letterSpacing: '0.05em',
                margin: 0,
                lineHeight: 1,
                fontWeight: 400,
              }}
            >
              {last4}
            </p>
          </div>

          {/* Decorative barcode */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '36px' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: i % 3 === 0 ? '36px' : i % 2 === 0 ? '24px' : '18px',
                  background: 'var(--bam-cream-20)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* Decorative mask */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              fontSize: '3rem',
              opacity: 0.06,
              lineHeight: 1,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            🎭
          </div>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={downloadTicket}
        disabled={downloading}
        style={{
          background: 'transparent',
          border: '1px solid var(--bam-border)',
          borderRadius: 0,
          color: 'var(--bam-cream-60)',
          fontFamily: 'var(--bam-font-mono)',
          fontSize: 'var(--bam-t-micro)',
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          padding: '8px 20px',
          cursor: downloading ? 'not-allowed' : 'pointer',
          opacity: downloading ? 0.6 : 1,
          transition: 'border-color 0.15s ease, color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!downloading) {
            e.currentTarget.style.borderColor = 'var(--bam-cream-40)';
            e.currentTarget.style.color = 'var(--bam-cream)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--bam-border)';
          e.currentTarget.style.color = 'var(--bam-cream-60)';
        }}
      >
        {downloading ? 'DOWNLOADING...' : 'DOWNLOAD TICKET →'}
      </button>
    </div>
  );
});

export default TicketCard;
