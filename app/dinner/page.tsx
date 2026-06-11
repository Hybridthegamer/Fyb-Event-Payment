'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getRegistration,
  saveRegistration,
  recordPayment,
  Registration,
  PaymentRecord,
} from '@/lib/firestoreHelpers';
import { formatNaira, getMatricLast4 } from '@/lib/utils';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import PaymentStepper from '@/components/PaymentStepper';
import TicketCard from '@/components/TicketCard';
import ReceiptCard from '@/components/ReceiptCard';

const BASE_AMOUNT = 25000;
const PLUS_ONE_AMOUNT = 10000;
const BANK_NAME = 'First Bank of Nigeria';
const ACCOUNT_NUMBER = '3141592653';
const ACCOUNT_NAME = 'NACOS RSU FYB';

type PaymentMode = 'full' | 'instalment';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bam-surface)',
  border: '1px solid var(--bam-border)',
  borderRadius: 0,
  color: 'var(--bam-cream-80)',
  fontFamily: 'var(--bam-font-mono)',
  fontSize: '0.875rem',
  letterSpacing: '0.05em',
  padding: '12px 16px',
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--bam-font-mono)',
  fontSize: 'var(--bam-t-micro)',
  color: 'var(--bam-cream-40)',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  display: 'block',
  marginBottom: '8px',
};

export default function DinnerPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [existingReg, setExistingReg] = useState<Registration | null>(null);
  const [isReturningPartial, setIsReturningPartial] = useState(false);

  const [fullName, setFullName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [hasPlusOnes, setHasPlusOnes] = useState(false);
  const [numPlusOnes, setNumPlusOnes] = useState(1);
  const [plusOneNames, setPlusOneNames] = useState<string[]>(['']);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full');
  const [instalmentAmount, setInstalmentAmount] = useState(0);
  const [continuePayAmount, setContinuePayAmount] = useState(500);

  const [latestPayment, setLatestPayment] = useState<PaymentRecord | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [savingReg, setSavingReg] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const ticketRefs = useRef<HTMLDivElement[]>([]);

  const plusOneTotal = useMemo(
    () => (hasPlusOnes ? numPlusOnes * PLUS_ONE_AMOUNT : 0),
    [hasPlusOnes, numPlusOnes]
  );
  const totalAmount = useMemo(() => BASE_AMOUNT + plusOneTotal, [plusOneTotal]);
  const minInstalment = useMemo(
    () => Math.round((totalAmount * 0.1) / 100) * 100,
    [totalAmount]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/login');
        setAuthLoading(false);
        return;
      }
      setUser(firebaseUser);
      setAuthLoading(false);
      try {
        const reg = await getRegistration(firebaseUser.uid);
        if (reg) {
          setExistingReg(reg);
          if (reg.paymentStatus === 'completed') {
            setStep(4);
          } else if (reg.paymentStatus === 'partial') {
            setIsReturningPartial(true);
            const remaining = reg.totalAmount - reg.amountPaid;
            setContinuePayAmount(Math.min(remaining, remaining));
            setStep(3);
          } else {
            setFullName(reg.fullName);
            setMatricNumber(reg.matricNumber);
            if (reg.numPlusOnes > 0) {
              setHasPlusOnes(true);
              setNumPlusOnes(reg.numPlusOnes);
              setPlusOneNames(reg.plusOnes.map((p) => p.name));
            }
          }
        }
      } catch {
        toast.error('Failed to load your registration. Please refresh.');
      } finally {
        setPageLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    setPlusOneNames((prev) => {
      const next = Array.from({ length: numPlusOnes }, (_, i) => prev[i] ?? '');
      return next;
    });
  }, [numPlusOnes]);

  useEffect(() => {
    setInstalmentAmount(minInstalment);
  }, [minInstalment]);

  const handleStep1Continue = useCallback(() => {
    if (!fullName.trim()) { toast.error('Please enter your full name.'); return; }
    if (matricNumber.trim().length < 4) { toast.error('Matric number must be at least 4 characters.'); return; }
    if (hasPlusOnes) {
      for (let i = 0; i < numPlusOnes; i++) {
        if (!plusOneNames[i]?.trim()) {
          toast.error(`Please enter the name for Plus One ${i + 1}.`);
          return;
        }
      }
    }
    setStep(2);
  }, [fullName, matricNumber, hasPlusOnes, numPlusOnes, plusOneNames]);

  const handleProceedToPay = useCallback(async () => {
    if (!user) return;
    if (paymentMode === 'instalment' && instalmentAmount < minInstalment) {
      toast.error(`Minimum instalment is ${formatNaira(minInstalment)}.`);
      return;
    }
    setSavingReg(true);
    try {
      const numP = hasPlusOnes ? numPlusOnes : 0;
      const plusOnes = hasPlusOnes ? plusOneNames.map((n) => ({ name: n.trim() })) : [];
      const plusOneAmt = numP * PLUS_ONE_AMOUNT;
      const total = BASE_AMOUNT + plusOneAmt;
      await saveRegistration(user.uid, {
        uid: user.uid,
        email: user.email ?? '',
        fullName: fullName.trim(),
        matricNumber: matricNumber.trim(),
        plusOnes,
        numPlusOnes: numP,
        baseAmount: BASE_AMOUNT,
        plusOneAmount: plusOneAmt,
        totalAmount: total,
      });
      toast.success('Registration saved.');
      setStep(3);
    } catch {
      toast.error('Failed to save registration. Please try again.');
    } finally {
      setSavingReg(false);
    }
  }, [user, paymentMode, instalmentAmount, minInstalment, hasPlusOnes, numPlusOnes, plusOneNames, fullName, matricNumber]);

  // ─── PAYMENT STUB ─────────────────────────────────────────
  const handlePayment = useCallback(async (amountInNaira: number): Promise<void> => {
    console.warn('Payment handler not yet implemented.', { amountInNaira });
  }, []);
  // ──────────────────────────────────────────────────────────

  const handleDownloadAll = useCallback(async () => {
    if (!existingReg) return;
    const html2canvas = (await import('html2canvas')).default;
    const last4 = getMatricLast4(existingReg.matricNumber);
    const allTicketDivs = document.querySelectorAll('[data-ticket]');
    for (let i = 0; i < allTicketDivs.length; i++) {
      const el = allTicketDivs[i] as HTMLElement;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
      const link = document.createElement('a');
      const isPlusOne = el.dataset.plusone === 'true';
      const idx = el.dataset.idx ?? '';
      link.download = isPlusOne
        ? `NACOS-FYB-PlusOne${idx}-Ticket-${last4}.png`
        : `NACOS-FYB-Ticket-${last4}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      await new Promise((r) => setTimeout(r, 400));
    }
  }, [existingReg]);

  const handleCopyAccount = useCallback(() => {
    navigator.clipboard.writeText(ACCOUNT_NUMBER).then(() => {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    });
  }, []);

  const handleCopyRef = useCallback((refCode: string) => {
    navigator.clipboard.writeText(refCode).then(() => {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    });
  }, []);

  if (authLoading || pageLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bam-bg)' }}>
        <div className="bam-spinner" />
        <style>{`.bam-spinner{width:28px;height:28px;border:1px solid var(--bam-cream-40);border-top-color:transparent;border-radius:50%;animation:bam-spin 1s linear infinite}@keyframes bam-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) return null;

  const reg = existingReg;
  const regTotalAmount = reg?.totalAmount ?? totalAmount;
  const regAmountPaid = reg?.amountPaid ?? 0;
  const regRemaining = regTotalAmount - regAmountPaid;
  const amountToPayNow = paymentMode === 'full' ? (reg?.totalAmount ?? totalAmount) : instalmentAmount;
  const refCode = `NACOS-FYB-${getMatricLast4(reg?.matricNumber ?? matricNumber)}`;
  const stepLabel = `0${step} / 04`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bam-bg)' }}>
      <Navbar pageLabel="DINNER NIGHT" stepLabel={step < 4 ? stepLabel : undefined} />

      <div
        className="flex"
        style={{ minHeight: '100vh', paddingTop: '56px' }}
      >
        {/* Sidebar — desktop only */}
        <aside
          className="hidden lg:flex flex-col justify-between"
          style={{
            width: '280px',
            flexShrink: 0,
            position: 'sticky',
            top: '56px',
            height: 'calc(100vh - 56px)',
            borderRight: '1px solid var(--bam-border)',
            padding: 'var(--bam-space-xl) var(--bam-space-lg)',
            overflowY: 'auto',
          }}
        >
          <div>
            {/* Logo */}
            <div
              style={{
                background: '#fff',
                borderRadius: '9999px',
                padding: '4px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: 'var(--bam-space-2xl)',
              }}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '5.5px', fontWeight: 700, fontFamily: 'var(--bam-font-mono)' }}>NACOS</div>
              <div style={{ width: '1px', height: '14px', background: '#d1d5db' }} />
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#14532d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '6.5px', fontWeight: 700, fontFamily: 'var(--bam-font-mono)' }}>RSU</div>
            </div>

            <PaymentStepper currentStep={step} variant="sidebar" />
          </div>

          <div>
            {['NACOS FYB · RSU', 'DINNER NIGHT · MASKED PARTY', 'CLASS OF 2026'].map((line) => (
              <p
                key={line}
                style={{
                  fontFamily: 'var(--bam-font-mono)',
                  fontSize: 'var(--bam-t-micro)',
                  color: 'var(--bam-cream-20)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  margin: '0 0 4px',
                }}
              >
                {line}
              </p>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--bam-space-2xl) var(--bam-pad)',
          }}
        >
          {/* Mobile step bar */}
          {step < 4 && (
            <div className="lg:hidden mb-8">
              <PaymentStepper currentStep={step} variant="bar" />
            </div>
          )}

          {/* ── STEP 1: DETAILS ── */}
          {step === 1 && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div style={{ flex: 1 }}>
                <h2
                  data-reveal
                  style={{
                    fontFamily: 'var(--bam-font-serif)',
                    fontSize: 'var(--bam-t-title)',
                    color: 'var(--bam-cream)',
                    letterSpacing: '-0.01em',
                    fontWeight: 400,
                    margin: '0 0 var(--bam-space-xl)',
                  }}
                >
                  Your Details.
                </h2>

                <div style={{ marginBottom: 'var(--bam-space-xl)' }}>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chukwuemeka Obi"
                    style={{ ...inputStyle, boxSizing: 'border-box' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; }}
                  />
                </div>

                <div style={{ marginBottom: 'var(--bam-space-xl)' }}>
                  <label style={labelStyle}>Matric Number</label>
                  <input
                    type="text"
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    placeholder="e.g. U2019/5700"
                    style={{ ...inputStyle, boxSizing: 'border-box' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; }}
                  />
                </div>

                {/* Plus One toggle */}
                <div style={{ marginBottom: 'var(--bam-space-xl)' }}>
                  <label style={labelStyle}>Plus Ones</label>
                  <div style={{ display: 'flex', gap: 0 }}>
                    {(['NO PLUS ONES', 'ADD PLUS ONES'] as const).map((opt) => {
                      const active = opt === 'NO PLUS ONES' ? !hasPlusOnes : hasPlusOnes;
                      return (
                        <button
                          key={opt}
                          onClick={() => setHasPlusOnes(opt === 'ADD PLUS ONES')}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            background: active ? 'var(--bam-surface-2)' : 'var(--bam-surface)',
                            border: `1px solid ${active ? 'var(--bam-cream-40)' : 'var(--bam-border)'}`,
                            borderRadius: 0,
                            color: active ? 'var(--bam-cream)' : 'var(--bam-cream-40)',
                            fontFamily: 'var(--bam-font-mono)',
                            fontSize: 'var(--bam-t-micro)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            marginRight: opt === 'NO PLUS ONES' ? '-1px' : 0,
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {hasPlusOnes && (
                  <div style={{ marginBottom: 'var(--bam-space-xl)' }}>
                    <label style={labelStyle}>Number of Plus Ones</label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={numPlusOnes}
                      onChange={(e) => setNumPlusOnes(Number(e.target.value))}
                      style={{
                        width: '100%',
                        appearance: 'none',
                        height: '2px',
                        background: 'var(--bam-border)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    />
                    <p
                      style={{
                        fontFamily: 'var(--bam-font-mono)',
                        fontSize: 'var(--bam-t-micro)',
                        color: 'var(--bam-cream-40)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        marginTop: '8px',
                      }}
                    >
                      BRINGING {numPlusOnes} PLUS ONE{numPlusOnes > 1 ? 'S' : ''}
                    </p>

                    <div style={{ marginTop: 'var(--bam-space-md)' }}>
                      {Array.from({ length: numPlusOnes }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            marginBottom: 'var(--bam-space-md)',
                            animation: `bam-fadeUp 0.4s ease both`,
                            animationDelay: `${i * 80}ms`,
                          }}
                        >
                          <label style={labelStyle}>Plus One {i + 1} Full Name</label>
                          <input
                            type="text"
                            value={plusOneNames[i] ?? ''}
                            onChange={(e) => {
                              const next = [...plusOneNames];
                              next[i] = e.target.value;
                              setPlusOneNames(next);
                            }}
                            placeholder={`Plus One ${i + 1} name`}
                            style={{ ...inputStyle, boxSizing: 'border-box' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStep1Continue}
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
                  CONTINUE →
                </button>
              </div>

              {/* Pricing summary */}
              <PricingSummary
                hasPlusOnes={hasPlusOnes}
                numPlusOnes={numPlusOnes}
                totalAmount={totalAmount}
                plusOneTotal={plusOneTotal}
              />
            </div>
          )}

          {/* ── STEP 2: OPTIONS ── */}
          {step === 2 && (
            <div style={{ maxWidth: '540px' }}>
              <h2
                data-reveal
                style={{
                  fontFamily: 'var(--bam-font-serif)',
                  fontSize: 'var(--bam-t-title)',
                  color: 'var(--bam-cream)',
                  fontWeight: 400,
                  margin: '0 0 var(--bam-space-xl)',
                }}
              >
                Payment Options.
              </h2>

              <div style={{ marginBottom: 'var(--bam-space-xl)' }}>
                <p
                  style={{
                    fontFamily: 'var(--bam-font-mono)',
                    fontSize: 'var(--bam-t-micro)',
                    color: 'var(--bam-cream-20)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.22em',
                    margin: '0 0 4px',
                  }}
                >
                  TOTAL DUE
                </p>
                <p
                  data-reveal
                  style={{
                    fontFamily: 'var(--bam-font-serif)',
                    fontSize: 'var(--bam-t-headline)',
                    color: 'var(--bam-cream)',
                    letterSpacing: '-0.02em',
                    margin: 0,
                    fontWeight: 400,
                  }}
                >
                  {formatNaira(totalAmount)}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bam-space-md)', marginBottom: 'var(--bam-space-xl)' }}>
                {/* Full payment */}
                <div
                  onClick={() => setPaymentMode('full')}
                  style={{
                    border: `1px solid ${paymentMode === 'full' ? 'var(--bam-cream-40)' : 'var(--bam-border)'}`,
                    background: paymentMode === 'full' ? 'var(--bam-surface)' : 'transparent',
                    borderRadius: 0,
                    padding: 'var(--bam-space-xl)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--bam-font-mono)',
                        fontSize: 'var(--bam-t-micro)',
                        color: 'var(--bam-cream-40)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.18em',
                      }}
                    >
                      PAY IN FULL
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--bam-font-mono)',
                        fontSize: '0.5rem',
                        color: 'var(--event-gold)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.18em',
                        border: '1px solid var(--event-gold)',
                        borderRadius: '9999px',
                        padding: '3px 10px',
                      }}
                    >
                      RECOMMENDED
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--bam-font-serif)',
                      fontSize: '2rem',
                      color: 'var(--bam-cream)',
                      margin: '0 0 8px',
                      fontWeight: 400,
                    }}
                  >
                    {formatNaira(totalAmount)}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--bam-font-mono)',
                      fontSize: '0.8rem',
                      color: 'var(--bam-cream-60)',
                      margin: 0,
                    }}
                  >
                    Pay everything now. Your ticket will be generated immediately after payment.
                  </p>
                </div>

                {/* Instalment */}
                <div
                  onClick={() => setPaymentMode('instalment')}
                  style={{
                    border: `1px solid ${paymentMode === 'instalment' ? 'var(--bam-cream-40)' : 'var(--bam-border)'}`,
                    background: paymentMode === 'instalment' ? 'var(--bam-surface)' : 'transparent',
                    borderRadius: 0,
                    padding: 'var(--bam-space-xl)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--bam-font-mono)',
                      fontSize: 'var(--bam-t-micro)',
                      color: 'var(--bam-cream-40)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.18em',
                      margin: '0 0 8px',
                    }}
                  >
                    PAY IN INSTALMENTS
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--bam-font-mono)',
                      fontSize: '0.8rem',
                      color: 'var(--bam-cream-60)',
                      margin: 0,
                    }}
                  >
                    Pay at least 10% now ({formatNaira(minInstalment)}) and clear the balance before the event.
                  </p>
                  {paymentMode === 'instalment' && (
                    <div style={{ marginTop: 'var(--bam-space-md)', paddingTop: 'var(--bam-space-md)', borderTop: '1px solid var(--bam-border)' }}>
                      <label style={labelStyle}>Amount to pay now (min {formatNaira(minInstalment)})</label>
                      <input
                        type="number"
                        value={instalmentAmount}
                        min={minInstalment}
                        max={totalAmount}
                        step={100}
                        onChange={(e) => {
                          const val = Math.max(minInstalment, Math.min(totalAmount, Number(e.target.value)));
                          setInstalmentAmount(val);
                        }}
                        style={{ ...inputStyle, boxSizing: 'border-box' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; }}
                      />
                      {instalmentAmount < totalAmount && (
                        <p
                          style={{
                            fontFamily: 'var(--bam-font-mono)',
                            fontSize: 'var(--bam-t-micro)',
                            color: 'var(--bam-cream-40)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            marginTop: '8px',
                          }}
                        >
                          REMAINING: {formatNaira(totalAmount - instalmentAmount)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--bam-space-md)' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    padding: '16px 24px',
                    background: 'transparent',
                    border: '1px solid var(--bam-border)',
                    borderRadius: 0,
                    color: 'var(--bam-cream-60)',
                    fontFamily: 'var(--bam-font-mono)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; e.currentTarget.style.color = 'var(--bam-cream)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; e.currentTarget.style.color = 'var(--bam-cream-60)'; }}
                >
                  ← BACK
                </button>
                <button
                  onClick={handleProceedToPay}
                  disabled={savingReg}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: 'var(--bam-red)',
                    border: 'none',
                    borderRadius: 0,
                    color: 'var(--bam-cream)',
                    fontFamily: 'var(--bam-font-mono)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.20em',
                    cursor: savingReg ? 'not-allowed' : 'pointer',
                    opacity: savingReg ? 0.7 : 1,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!savingReg) e.currentTarget.style.background = 'var(--bam-red-dark)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bam-red)'; }}
                >
                  {savingReg ? 'SAVING...' : 'PROCEED →'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: BANK TRANSFER ── */}
          {step === 3 && !isReturningPartial && reg && (
            <div style={{ maxWidth: '540px' }}>
              <h2
                data-reveal
                style={{
                  fontFamily: 'var(--bam-font-serif)',
                  fontSize: 'var(--bam-t-title)',
                  color: 'var(--bam-cream)',
                  fontWeight: 400,
                  margin: '0 0 var(--bam-space-xl)',
                }}
              >
                Bank Transfer.
              </h2>

              {/* Steps */}
              <div style={{ marginBottom: 'var(--bam-space-xl)' }}>
                {[
                  'Open your bank app or visit your bank.',
                  'Transfer the exact amount shown below.',
                  `Use the reference code as your payment narration.`,
                  'Click "Confirm Payment" after completing the transfer.',
                ].map((instruction, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '12px',
                      borderLeft: '3px solid var(--bam-red)',
                      paddingLeft: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--bam-font-mono)',
                        fontSize: 'var(--bam-t-micro)',
                        color: 'var(--bam-cream-20)',
                        flexShrink: 0,
                        paddingTop: '2px',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p
                      style={{
                        fontFamily: 'var(--bam-font-mono)',
                        fontSize: '0.85rem',
                        color: 'var(--bam-cream-60)',
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bank details card */}
              <div
                style={{
                  background: 'var(--bam-surface)',
                  border: '1px solid var(--bam-border)',
                  borderRadius: 0,
                  padding: 'var(--bam-space-xl)',
                  marginBottom: 'var(--bam-space-md)',
                  animation: 'bam-pulse-border 4s ease-in-out infinite',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--bam-font-mono)',
                    fontSize: 'var(--bam-t-micro)',
                    color: 'var(--bam-cream-20)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.22em',
                    margin: '0 0 var(--bam-space-md)',
                  }}
                >
                  BANK DETAILS
                </p>
                <div style={{ height: '1px', background: 'var(--bam-border)', marginBottom: 'var(--bam-space-md)' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: 'var(--bam-space-md)', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', color: 'var(--bam-cream-40)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Bank</span>
                  <span style={{ fontFamily: 'var(--bam-font-mono)', fontSize: '0.875rem', color: 'var(--bam-cream-80)', textAlign: 'right' }}>{BANK_NAME}</span>
                </div>

                <p
                  style={{
                    fontFamily: 'var(--bam-font-serif)',
                    fontSize: '2.5rem',
                    color: 'var(--bam-cream)',
                    letterSpacing: '0.05em',
                    margin: '0 0 8px',
                    fontWeight: 400,
                    textAlign: 'center',
                  }}
                >
                  {ACCOUNT_NUMBER}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--bam-font-mono)',
                    fontSize: '0.875rem',
                    color: 'var(--bam-cream-80)',
                    textAlign: 'center',
                    marginBottom: 'var(--bam-space-md)',
                  }}
                >
                  {ACCOUNT_NAME}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--bam-font-serif)',
                    fontSize: '1.4rem',
                    color: 'var(--event-gold)',
                    textAlign: 'center',
                    margin: '0 0 var(--bam-space-md)',
                    fontWeight: 400,
                  }}
                >
                  {formatNaira(amountToPayNow)}
                </p>

                <button
                  onClick={handleCopyAccount}
                  className="w-full"
                  style={{
                    background: 'var(--bam-surface-2)',
                    border: `1px solid ${copiedAccount ? 'var(--bam-cream-40)' : 'var(--bam-border)'}`,
                    borderRadius: 0,
                    color: 'var(--bam-cream)',
                    fontFamily: 'var(--bam-font-mono)',
                    fontSize: 'var(--bam-t-micro)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {copiedAccount ? 'COPIED ✓' : 'COPY ACCOUNT NUMBER'}
                </button>
              </div>

              {/* Reference code */}
              <div
                style={{
                  background: 'var(--bam-red-subtle)',
                  border: '1px solid rgba(200, 0, 60, 0.25)',
                  borderRadius: 0,
                  padding: 'var(--bam-space-md) var(--bam-space-lg)',
                  marginBottom: 'var(--bam-space-xl)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--bam-font-mono)',
                    fontSize: 'var(--bam-t-micro)',
                    color: 'var(--bam-cream-40)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.22em',
                    margin: '0 0 6px',
                  }}
                >
                  USE AS NARRATION
                </p>
                <p
                  style={{
                    fontFamily: 'var(--bam-font-mono)',
                    fontSize: '1rem',
                    color: 'var(--bam-cream)',
                    letterSpacing: '0.08em',
                    margin: '0 0 10px',
                  }}
                >
                  {refCode}
                </p>
                <button
                  onClick={() => handleCopyRef(refCode)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${copiedRef ? 'var(--bam-cream-40)' : 'rgba(200,0,60,0.25)'}`,
                    borderRadius: 0,
                    color: 'var(--bam-cream-60)',
                    fontFamily: 'var(--bam-font-mono)',
                    fontSize: 'var(--bam-t-micro)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {copiedRef ? 'COPIED ✓' : 'COPY REFERENCE'}
                </button>
              </div>

              {/* Confirmation form */}
              <div style={{ marginBottom: 'var(--bam-space-xl)' }}>
                <label style={labelStyle}>Payment Reference (optional)</label>
                <input
                  type="text"
                  placeholder="Your bank transfer reference"
                  style={{ ...inputStyle, boxSizing: 'border-box' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--bam-space-md)' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{ padding: '16px 24px', background: 'transparent', border: '1px solid var(--bam-border)', borderRadius: 0, color: 'var(--bam-cream-60)', fontFamily: 'var(--bam-font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; e.currentTarget.style.color = 'var(--bam-cream)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; e.currentTarget.style.color = 'var(--bam-cream-60)'; }}
                >
                  ← BACK
                </button>
                <button
                  onClick={() => handlePayment(amountToPayNow)}
                  disabled={processingPayment}
                  style={{ flex: 1, padding: '16px', background: 'var(--bam-red)', border: 'none', borderRadius: 0, color: 'var(--bam-cream)', fontFamily: 'var(--bam-font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.20em', cursor: processingPayment ? 'not-allowed' : 'pointer', opacity: processingPayment ? 0.7 : 1, transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => { if (!processingPayment) e.currentTarget.style.background = 'var(--bam-red-dark)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bam-red)'; }}
                >
                  {processingPayment ? 'PROCESSING...' : 'CONFIRM PAYMENT →'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 VARIANT: CONTINUE PAYING ── */}
          {step === 3 && isReturningPartial && reg && (
            <div style={{ maxWidth: '540px' }}>
              <h2
                style={{
                  fontFamily: 'var(--bam-font-serif)',
                  fontSize: 'var(--bam-t-title)',
                  color: 'var(--bam-cream)',
                  fontWeight: 400,
                  margin: '0 0 var(--bam-space-sm)',
                }}
              >
                Bank Transfer.
              </h2>
              <p
                style={{
                  fontFamily: 'var(--bam-font-mono)',
                  fontSize: '0.85rem',
                  color: 'var(--bam-cream-60)',
                  marginBottom: 'var(--bam-space-xl)',
                }}
              >
                Welcome back, {reg.fullName.split(' ')[0]}. Complete your payment to receive your ticket.
              </p>

              {/* Bank details */}
              <div
                style={{
                  background: 'var(--bam-surface)',
                  border: '1px solid var(--bam-border)',
                  borderRadius: 0,
                  padding: 'var(--bam-space-xl)',
                  marginBottom: 'var(--bam-space-md)',
                  animation: 'bam-pulse-border 4s ease-in-out infinite',
                }}
              >
                <p style={{ fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', color: 'var(--bam-cream-20)', textTransform: 'uppercase', letterSpacing: '0.22em', margin: '0 0 var(--bam-space-md)' }}>BANK DETAILS</p>
                <div style={{ height: '1px', background: 'var(--bam-border)', marginBottom: 'var(--bam-space-md)' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', color: 'var(--bam-cream-40)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Bank</span>
                  <span style={{ fontFamily: 'var(--bam-font-mono)', fontSize: '0.875rem', color: 'var(--bam-cream-80)', textAlign: 'right' }}>{BANK_NAME}</span>
                </div>
                <p style={{ fontFamily: 'var(--bam-font-serif)', fontSize: '2.5rem', color: 'var(--bam-cream)', letterSpacing: '0.05em', margin: '0 0 8px', fontWeight: 400, textAlign: 'center' }}>{ACCOUNT_NUMBER}</p>
                <p style={{ fontFamily: 'var(--bam-font-mono)', fontSize: '0.875rem', color: 'var(--bam-cream-80)', textAlign: 'center', marginBottom: '12px' }}>{ACCOUNT_NAME}</p>
                <p style={{ fontFamily: 'var(--bam-font-serif)', fontSize: '1.4rem', color: 'var(--event-gold)', textAlign: 'center', margin: '0 0 var(--bam-space-md)', fontWeight: 400 }}>{formatNaira(regRemaining)}</p>
                <button onClick={handleCopyAccount} className="w-full" style={{ background: 'var(--bam-surface-2)', border: `1px solid ${copiedAccount ? 'var(--bam-cream-40)' : 'var(--bam-border)'}`, borderRadius: 0, color: 'var(--bam-cream)', fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '10px', cursor: 'pointer', transition: 'border-color 0.15s ease' }}>
                  {copiedAccount ? 'COPIED ✓' : 'COPY ACCOUNT NUMBER'}
                </button>
              </div>

              <div style={{ background: 'var(--bam-red-subtle)', border: '1px solid rgba(200,0,60,0.25)', padding: 'var(--bam-space-md) var(--bam-space-lg)', marginBottom: 'var(--bam-space-xl)' }}>
                <p style={{ fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', color: 'var(--bam-cream-40)', textTransform: 'uppercase', letterSpacing: '0.22em', margin: '0 0 6px' }}>USE AS NARRATION</p>
                <p style={{ fontFamily: 'var(--bam-font-mono)', fontSize: '1rem', color: 'var(--bam-cream)', letterSpacing: '0.08em', margin: '0 0 10px' }}>{refCode}</p>
                <button onClick={() => handleCopyRef(refCode)} style={{ background: 'transparent', border: `1px solid ${copiedRef ? 'var(--bam-cream-40)' : 'rgba(200,0,60,0.25)'}`, borderRadius: 0, color: 'var(--bam-cream-60)', fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '6px 14px', cursor: 'pointer' }}>
                  {copiedRef ? 'COPIED ✓' : 'COPY REFERENCE'}
                </button>
              </div>

              <div style={{ marginBottom: 'var(--bam-space-xl)' }}>
                <label style={labelStyle}>Amount to pay (min ₦500, max {formatNaira(regRemaining)})</label>
                <input
                  type="number"
                  value={continuePayAmount}
                  min={500}
                  max={regRemaining}
                  step={100}
                  onChange={(e) => {
                    const val = Math.max(500, Math.min(regRemaining, Number(e.target.value)));
                    setContinuePayAmount(val);
                  }}
                  style={{ ...inputStyle, boxSizing: 'border-box' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; }}
                />
                {continuePayAmount < regRemaining && (
                  <p style={{ fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', color: 'var(--bam-cream-40)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '8px' }}>
                    REMAINING AFTER: {formatNaira(regRemaining - continuePayAmount)}
                  </p>
                )}
              </div>

              <button
                onClick={() => handlePayment(continuePayAmount)}
                disabled={processingPayment}
                className="w-full"
                style={{ padding: '16px', background: 'var(--bam-red)', border: 'none', borderRadius: 0, color: 'var(--bam-cream)', fontFamily: 'var(--bam-font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.20em', cursor: processingPayment ? 'not-allowed' : 'pointer', opacity: processingPayment ? 0.7 : 1, transition: 'background 0.15s ease' }}
                onMouseEnter={(e) => { if (!processingPayment) e.currentTarget.style.background = 'var(--bam-red-dark)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bam-red)'; }}
              >
                {processingPayment ? 'PROCESSING...' : 'CONFIRM PAYMENT →'}
              </button>
            </div>
          )}

          {/* ── STEP 4: TICKET or RECEIPT ── */}
          {step === 4 && reg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bam-space-xl)' }}>
              <div>
                <h2
                  data-reveal
                  style={{
                    fontFamily: 'var(--bam-font-serif)',
                    fontSize: 'var(--bam-t-title)',
                    color: 'var(--bam-cream)',
                    letterSpacing: '-0.01em',
                    fontWeight: 400,
                    margin: '0 0 var(--bam-space-sm)',
                  }}
                >
                  Your Ticket.
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--bam-font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--bam-cream-60)',
                  }}
                >
                  {reg.paymentStatus === 'completed'
                    ? 'Download and keep your ticket(s) safe.'
                    : 'Complete your payment to receive your ticket.'}
                </p>
              </div>

              {reg.paymentStatus === 'completed' ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bam-space-2xl)', overflowX: 'auto' }}>
                    <TicketCard fullName={reg.fullName} matricNumber={reg.matricNumber} />
                    {reg.plusOnes.map((plusOne, i) => (
                      <TicketCard
                        key={i}
                        fullName={reg.fullName}
                        matricNumber={reg.matricNumber}
                        isPlusOne
                        plusOneIndex={i + 1}
                        plusOneName={plusOne.name}
                      />
                    ))}
                  </div>

                  {reg.numPlusOnes > 0 && (
                    <button
                      onClick={handleDownloadAll}
                      style={{
                        background: 'var(--bam-surface)',
                        border: '1px solid var(--bam-border)',
                        borderRadius: 0,
                        color: 'var(--bam-cream-60)',
                        fontFamily: 'var(--bam-font-mono)',
                        fontSize: 'var(--bam-t-micro)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.18em',
                        padding: '12px 24px',
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                        transition: 'border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; }}
                    >
                      DOWNLOAD ALL TICKETS
                    </button>
                  )}
                </>
              ) : (reg.paymentStatus === 'partial' && reg.payments.length > 0) ? (
                <ReceiptCard
                  fullName={reg.fullName}
                  matricNumber={reg.matricNumber}
                  totalAmount={reg.totalAmount}
                  amountPaid={reg.amountPaid}
                  lastPayment={latestPayment ?? reg.payments[reg.payments.length - 1]}
                  onPayBalance={() => {
                    setIsReturningPartial(true);
                    setContinuePayAmount(Math.min(regRemaining, regRemaining));
                    setStep(3);
                  }}
                />
              ) : (
                /* Flagged / under review state */
                <div style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      border: '1px solid var(--bam-cream-40)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto var(--bam-space-lg)',
                      fontFamily: 'var(--bam-font-mono)',
                      fontSize: '1rem',
                      color: 'var(--bam-cream-40)',
                    }}
                  >
                    ?
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--bam-font-serif)',
                      fontSize: 'var(--bam-t-title)',
                      color: 'var(--bam-cream)',
                      fontWeight: 400,
                      margin: '0 0 var(--bam-space-md)',
                    }}
                  >
                    Under Review.
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--bam-font-mono)',
                      fontSize: '0.85rem',
                      color: 'var(--bam-cream-60)',
                      lineHeight: 1.7,
                      marginBottom: 'var(--bam-space-xl)',
                    }}
                  >
                    Your payment is being reviewed. You will receive your ticket once verification is complete.
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--bam-font-mono)',
                      fontSize: 'var(--bam-t-micro)',
                      color: 'var(--bam-cream-40)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                    }}
                  >
                    +234 (703) 206-7876 · +234 (815) 625-2884
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--bam-cream);
          cursor: pointer;
          border: none;
        }
        input[type='range']::-webkit-slider-runnable-track {
          background: var(--bam-border);
          height: 2px;
        }
        input::placeholder { color: var(--bam-cream-20); }
      `}</style>
    </div>
  );
}

// ── Sub-components ──

function PricingSummary({
  hasPlusOnes,
  numPlusOnes,
  totalAmount,
  plusOneTotal,
}: {
  hasPlusOnes: boolean;
  numPlusOnes: number;
  totalAmount: number;
  plusOneTotal: number;
}) {
  return (
    <div
      className="lg:w-64 w-full lg:sticky lg:top-24 h-fit"
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
          margin: '0 0 var(--bam-space-md)',
        }}
      >
        SUMMARY
      </p>
      <div style={{ height: '1px', background: 'var(--bam-border)', marginBottom: 'var(--bam-space-md)' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', color: 'var(--bam-cream-40)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Base ticket</span>
        <span style={{ fontFamily: 'var(--bam-font-mono)', fontSize: '0.875rem', color: 'var(--bam-cream-80)', textAlign: 'right' }}>{formatNaira(25000)}</span>
      </div>

      {hasPlusOnes && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', color: 'var(--bam-cream-40)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Plus ×{numPlusOnes}</span>
          <span style={{ fontFamily: 'var(--bam-font-mono)', fontSize: '0.875rem', color: 'var(--bam-cream-80)', textAlign: 'right' }}>{formatNaira(plusOneTotal)}</span>
        </div>
      )}

      <div style={{ height: '1px', background: 'var(--bam-border)', margin: 'var(--bam-space-md) 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', color: 'var(--bam-cream-40)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Total</span>
        <span style={{ fontFamily: 'var(--bam-font-serif)', fontSize: '1.4rem', color: 'var(--bam-cream)', textAlign: 'right', fontWeight: 400 }}>{formatNaira(totalAmount)}</span>
      </div>
    </div>
  );
}
