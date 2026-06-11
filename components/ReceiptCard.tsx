'use client';

import { memo, useRef, useState } from 'react';
import { formatNaira, getMatricLast4 } from '@/lib/utils';
import { PaymentRecord } from '@/lib/firestoreHelpers';

interface ReceiptCardProps {
  fullName: string;
  matricNumber: string;
  totalAmount: number;
  amountPaid: number;
  lastPayment: PaymentRecord;
  onPayBalance: () => void;
}

const ReceiptCard = memo(function ReceiptCard({
  fullName,
  matricNumber,
  totalAmount,
  amountPaid,
  lastPayment,
  onPayBalance,
}: ReceiptCardProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const last4 = getMatricLast4(matricNumber);
  const remaining = totalAmount - amountPaid;
  const lastPaymentDate =
    lastPayment.paidAt?.toDate?.()?.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) ?? 'N/A';

  const downloadReceipt = async () => {
    if (!receiptRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `NACOS-FYB-Receipt-${last4}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // silently fail
    } finally {
      setDownloading(false);
    }
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '8px',
    alignItems: 'baseline',
  } as React.CSSProperties;

  const labelStyle = {
    fontFamily: 'var(--bam-font-mono)',
    fontSize: 'var(--bam-t-micro)',
    color: 'var(--bam-cream-40)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
  };

  const valueStyle = {
    fontFamily: 'var(--bam-font-mono)',
    fontSize: '0.875rem',
    color: 'var(--bam-cream-80)',
    textAlign: 'right' as const,
  };

  return (
    <div className="flex flex-col gap-4 w-full" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div
        ref={receiptRef}
        style={{
          background: 'var(--bam-surface)',
          border: '1px solid var(--bam-border)',
          borderRadius: 0,
          padding: 'var(--bam-space-xl)',
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
          PAYMENT RECEIPT
        </p>
        <div style={{ height: '1px', background: 'var(--bam-border)', marginBottom: 'var(--bam-space-md)' }} />

        <div style={rowStyle}>
          <span style={labelStyle}>Name</span>
          <span style={valueStyle}>{fullName}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Matric</span>
          <span style={valueStyle}>{matricNumber}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Date</span>
          <span style={valueStyle}>{lastPaymentDate}</span>
        </div>

        <div style={{ height: '1px', background: 'var(--bam-border)', margin: 'var(--bam-space-md) 0' }} />

        <div style={rowStyle}>
          <span style={labelStyle}>Paid This Session</span>
          <span style={{ ...valueStyle, color: 'var(--bam-cream)' }}>{formatNaira(lastPayment.amount)}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Total Paid</span>
          <span style={valueStyle}>{formatNaira(amountPaid)}</span>
        </div>
        <div style={{ ...rowStyle, borderTop: '1px solid var(--bam-border)', paddingTop: '12px', marginTop: '4px' }}>
          <span style={labelStyle}>Outstanding Balance</span>
          <span
            style={{
              fontFamily: 'var(--bam-font-serif)',
              fontSize: '1.4rem',
              color: 'var(--event-gold)',
              textAlign: 'right',
              fontWeight: 400,
            }}
          >
            {formatNaira(remaining)}
          </span>
        </div>

        <div
          style={{
            marginTop: 'var(--bam-space-md)',
            padding: 'var(--bam-space-md)',
            background: 'var(--bam-red-subtle)',
            border: '1px solid rgba(200,0,60,0.2)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: 'var(--bam-t-micro)',
              color: 'var(--bam-cream-20)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              margin: 0,
            }}
          >
            ⚠ COMPLETE PAYMENT TO RECEIVE YOUR TICKET
          </p>
        </div>
      </div>

      <button
        onClick={onPayBalance}
        className="w-full"
        style={{
          background: 'var(--bam-red)',
          border: 'none',
          borderRadius: 0,
          color: 'var(--bam-cream)',
          fontFamily: 'var(--bam-font-mono)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.20em',
          padding: '16px',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bam-red-dark)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bam-red)'; }}
      >
        PAY REMAINING BALANCE →
      </button>

      <button
        onClick={downloadReceipt}
        disabled={downloading}
        className="w-full"
        style={{
          background: 'var(--bam-surface)',
          border: '1px solid var(--bam-border)',
          borderRadius: 0,
          color: 'var(--bam-cream-60)',
          fontFamily: 'var(--bam-font-mono)',
          fontSize: 'var(--bam-t-micro)',
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          padding: '12px',
          cursor: downloading ? 'not-allowed' : 'pointer',
          opacity: downloading ? 0.6 : 1,
          transition: 'border-color 0.15s ease',
        }}
        onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; }}
      >
        {downloading ? 'DOWNLOADING...' : 'DOWNLOAD RECEIPT'}
      </button>
    </div>
  );
});

export default ReceiptCard;
