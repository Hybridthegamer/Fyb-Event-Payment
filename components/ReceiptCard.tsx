'use client';

import { useRef, useState } from 'react';
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

export default function ReceiptCard({
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
  const lastPaymentDate = lastPayment.paidAt?.toDate?.()?.toLocaleDateString('en-NG', {
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

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      <div
        ref={receiptRef}
        className="w-full rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2C0A0A 0%, #4A1515 100%)',
          border: '2px solid rgba(201,162,39,0.4)',
          boxShadow: '0 0 30px rgba(201,162,39,0.15)',
          fontFamily: 'Inter, sans-serif',
          padding: '28px',
        }}
      >
        {/* Header */}
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

        <div className="text-center mb-5">
          <p style={{ color: '#C9A227', fontSize: '13px', fontWeight: 700, letterSpacing: '0.2em' }}>PAYMENT RECEIPT</p>
          <p style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", serif', fontSize: '18px', fontWeight: 600, marginTop: '2px' }}>
            NACOS FYB Dinner Night
          </p>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #C9A227, transparent)', margin: '12px 0' }} />

        <div className="space-y-2 mb-4">
          <ReceiptRow label="Name" value={fullName} />
          <ReceiptRow label="Matric" value={matricNumber} />
          <ReceiptRow label="Date" value={lastPaymentDate} />
        </div>

        <div style={{ height: '1px', background: 'rgba(201,162,39,0.3)', margin: '12px 0' }} />

        <div className="space-y-2">
          <ReceiptRow label="Paid This Session" value={formatNaira(lastPayment.amount)} highlight />
          <ReceiptRow label="Total Paid So Far" value={formatNaira(amountPaid)} />
          <ReceiptRow label="Outstanding Balance" value={formatNaira(remaining)} warning />
        </div>

        <div style={{ height: '1px', background: 'rgba(201,162,39,0.3)', margin: '16px 0' }} />

        <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)' }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <p style={{ color: '#C4A882', fontSize: '12px' }}>Complete payment to receive your ticket.</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          onClick={onPayBalance}
          className="flex-1 py-3 px-5 rounded-lg font-inter font-semibold text-sm transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #C9A227, #E8C84A)', color: '#1A0505' }}
        >
          Pay Remaining Balance ({formatNaira(remaining)})
        </button>
        <button
          onClick={downloadReceipt}
          disabled={downloading}
          className="flex items-center justify-center gap-2 py-3 px-5 rounded-lg font-inter font-medium text-sm border transition-colors disabled:opacity-60"
          style={{ borderColor: 'rgba(201,162,39,0.4)', color: '#C9A227' }}
        >
          {downloading ? (
            <div className="w-4 h-4 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
          Download Receipt
        </button>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  highlight,
  warning,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ color: '#C4A882', fontSize: '13px' }}>{label}:</span>
      <span
        style={{
          color: highlight ? '#2ECC71' : warning ? '#E8C84A' : '#FFFFFF',
          fontSize: '13px',
          fontWeight: highlight || warning ? 600 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}
