'use client';

import { useState, useEffect, useRef } from 'react';
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
// Note: recordPayment will be called by the bank transfer handler in Step 2.
import { formatNaira, getMatricLast4 } from '@/lib/utils';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import PaymentStepper from '@/components/PaymentStepper';
import TicketCard from '@/components/TicketCard';
import ReceiptCard from '@/components/ReceiptCard';

const BASE_AMOUNT = 25000;
const PLUS_ONE_AMOUNT = 10000;

type PaymentMode = 'full' | 'instalment';

export default function DinnerPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [existingReg, setExistingReg] = useState<Registration | null>(null);
  const [isReturningPartial, setIsReturningPartial] = useState(false);

  // Step 1 state
  const [fullName, setFullName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [hasPlusOnes, setHasPlusOnes] = useState(false);
  const [numPlusOnes, setNumPlusOnes] = useState(1);
  const [plusOneNames, setPlusOneNames] = useState<string[]>(['']);

  // Step 2 state
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full');
  const [instalmentAmount, setInstalmentAmount] = useState(0);

  // Step 3 / Continue Paying
  const [continuePayAmount, setContinuePayAmount] = useState(500);

  // Payment result state
  const [latestPayment, setLatestPayment] = useState<PaymentRecord | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [savingReg, setSavingReg] = useState(false);

  // Download all ref
  const ticketRefs = useRef<HTMLDivElement[]>([]);

  // Computed values
  const plusOneTotal = hasPlusOnes ? numPlusOnes * PLUS_ONE_AMOUNT : 0;
  const totalAmount = BASE_AMOUNT + plusOneTotal;
  const minInstalment = Math.round((totalAmount * 0.1) / 100) * 100;

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
            // unpaid — pre-fill
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

  // Keep plusOneNames in sync with numPlusOnes
  useEffect(() => {
    setPlusOneNames((prev) => {
      const next = Array.from({ length: numPlusOnes }, (_, i) => prev[i] ?? '');
      return next;
    });
  }, [numPlusOnes]);

  // Sync instalment amount when total changes
  useEffect(() => {
    setInstalmentAmount(minInstalment);
  }, [minInstalment]);

  // --- Step 1: validate and advance ---
  const handleStep1Continue = () => {
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
  };

  // --- Step 2: save registration and advance ---
  const handleProceedToPay = async () => {
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
  };

  // ─── PAYMENT STUB ─────────────────────────────────────────
  // Paystack removed. Bank transfer handler goes here in Step 2.
  // Expected signature:
  //   handlePayment(amountInNaira: number): Promise<void>
  const handlePayment = async (amountInNaira: number): Promise<void> => {
    console.warn(
      "Payment handler not yet implemented.",
      { amountInNaira }
    );
  };
  // ──────────────────────────────────────────────────────────

  // Download all tickets
  const handleDownloadAll = async () => {
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
  };

  // --- Render loading states ---
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2C0A0A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#C4A882] font-inter text-sm">Loading your registration...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Re-derive registration data for rendering
  const reg = existingReg;
  const regTotalAmount = reg?.totalAmount ?? totalAmount;
  const regAmountPaid = reg?.amountPaid ?? 0;
  const regRemaining = regTotalAmount - regAmountPaid;

  const amountToPayNow =
    paymentMode === 'full' ? (reg?.totalAmount ?? totalAmount) : instalmentAmount;

  return (
    <div className="min-h-screen flex flex-col bg-[#2C0A0A]">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {/* Step indicator — hide on step 4 for cleaner ticket view */}
        {step < 4 && (
          <div className="mb-8">
            <PaymentStepper currentStep={step} />
          </div>
        )}

        {/* ── STEP 1: DETAILS ── */}
        {step === 1 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Form */}
            <div className="flex-1 gold-card p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: '"Playfair Display", serif' }}>
                Your Details
              </h2>

              <div className="space-y-5">
                <Field label="Full Name">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chukwuemeka Obi"
                    className="input-styled"
                  />
                </Field>

                <Field label="Matric Number">
                  <input
                    type="text"
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    placeholder="e.g. U2019/5700"
                    className="input-styled"
                  />
                </Field>

                <Field label="">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => { setHasPlusOnes(!hasPlusOnes); }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${hasPlusOnes ? 'bg-[#C9A227]' : 'bg-[#2C0A0A]'} border border-[rgba(201,162,39,0.4)]`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${hasPlusOnes ? 'left-7' : 'left-1'}`} />
                    </div>
                    <span className="text-sm font-inter font-medium text-white">Bringing a Plus One?</span>
                  </label>
                </Field>

                {hasPlusOnes && (
                  <div className="space-y-4 p-4 rounded-xl" style={{ background: 'rgba(201,162,39,0.05)', border: '1px solid rgba(201,162,39,0.2)' }}>
                    <div>
                      <label className="text-sm font-inter font-medium text-[#C4A882] block mb-2">
                        Number of Plus Ones: <span className="text-[#C9A227] font-bold text-lg">{numPlusOnes}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={numPlusOnes}
                        onChange={(e) => setNumPlusOnes(Number(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: '#C9A227' }}
                      />
                      <div className="flex justify-between text-[10px] text-[#C4A882] mt-1">
                        <span>1</span><span>5</span><span>10</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Array.from({ length: numPlusOnes }).map((_, i) => (
                        <Field key={i} label={`Plus One ${i + 1} Full Name`}>
                          <input
                            type="text"
                            value={plusOneNames[i] ?? ''}
                            onChange={(e) => {
                              const next = [...plusOneNames];
                              next[i] = e.target.value;
                              setPlusOneNames(next);
                            }}
                            placeholder={`Plus One ${i + 1} name`}
                            className="input-styled"
                          />
                        </Field>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStep1Continue}
                  className="btn-gold w-full py-3 rounded-lg font-inter font-semibold text-sm mt-2"
                >
                  Continue to Payment Options →
                </button>
              </div>
            </div>

            {/* Pricing sidebar */}
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
          <div className="max-w-xl mx-auto">
            <div className="gold-card p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                Payment Options
              </h2>
              <p className="text-[#C4A882] font-inter text-sm mb-6">Choose how you'd like to pay</p>

              {/* Total */}
              <div
                className="text-center mb-6 py-4 rounded-xl"
                style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)' }}
              >
                <p className="text-[#C4A882] text-xs font-inter uppercase tracking-widest">Total Amount</p>
                <p className="text-4xl font-bold mt-1" style={{ fontFamily: '"Playfair Display", serif', color: '#E8C84A' }}>
                  {formatNaira(totalAmount)}
                </p>
              </div>

              <div className="space-y-4">
                {/* Option A: Full Payment */}
                <PaymentOptionCard
                  selected={paymentMode === 'full'}
                  onSelect={() => setPaymentMode('full')}
                  title="Pay in Full"
                  badge="Recommended"
                  amount={formatNaira(totalAmount)}
                  description="Pay everything now. Your ticket will be generated immediately after payment."
                />

                {/* Option B: Instalments */}
                <PaymentOptionCard
                  selected={paymentMode === 'instalment'}
                  onSelect={() => setPaymentMode('instalment')}
                  title="Pay in Instalments"
                  description={`Pay at least 10% now (${formatNaira(minInstalment)}) and clear the balance before the event.`}
                >
                  {paymentMode === 'instalment' && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-[rgba(201,162,39,0.2)]">
                      <label className="text-sm font-inter text-[#C4A882]">
                        Amount to pay now (min {formatNaira(minInstalment)})
                      </label>
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
                        className="input-styled"
                      />
                      {instalmentAmount < totalAmount && (
                        <p className="text-xs font-inter" style={{ color: '#C4A882' }}>
                          Remaining after this payment:{' '}
                          <span style={{ color: '#E8C84A', fontWeight: 600 }}>
                            {formatNaira(totalAmount - instalmentAmount)}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </PaymentOptionCard>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-shrink-0 px-5 py-3 rounded-lg font-inter font-medium text-sm border transition-colors hover:text-[#C9A227]"
                  style={{ borderColor: 'rgba(201,162,39,0.3)', color: '#C4A882' }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleProceedToPay}
                  disabled={savingReg}
                  className="btn-gold flex-1 py-3 rounded-lg font-inter font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {savingReg ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#1A0505] border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Proceed to Pay →'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: PAYMENT ── */}
        {step === 3 && !isReturningPartial && reg && (
          <div className="max-w-md mx-auto">
            <div className="gold-card p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: '"Playfair Display", serif' }}>
                Confirm & Pay
              </h2>

              {/* Summary */}
              <div className="space-y-3 mb-6">
                <SummaryRow label="Name" value={reg.fullName} />
                <SummaryRow label="Matric No." value={reg.matricNumber} />
                {reg.numPlusOnes > 0 && (
                  <SummaryRow label="Plus Ones" value={`${reg.numPlusOnes} guest${reg.numPlusOnes > 1 ? 's' : ''}`} />
                )}
                <div className="h-px" style={{ background: 'rgba(201,162,39,0.2)' }} />
                <SummaryRow label="Total Cost" value={formatNaira(reg.totalAmount)} />
                <SummaryRow
                  label="Paying Now"
                  value={formatNaira(amountToPayNow)}
                  highlight
                />
                {paymentMode === 'instalment' && (
                  <SummaryRow
                    label="Balance After"
                    value={formatNaira(reg.totalAmount - amountToPayNow)}
                    muted
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-shrink-0 px-4 py-3 rounded-lg font-inter font-medium text-sm border transition-colors hover:text-[#C9A227]"
                  style={{ borderColor: 'rgba(201,162,39,0.3)', color: '#C4A882' }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => handlePayment(amountToPayNow)}
                  disabled={processingPayment}
                  className="btn-gold flex-1 py-3 rounded-lg font-inter font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#1A0505] border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay Now`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 VARIANT: CONTINUE PAYING (returning partial) ── */}
        {step === 3 && isReturningPartial && reg && (
          <div className="max-w-md mx-auto">
            <div className="gold-card p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                Continue Paying
              </h2>
              <p className="text-[#C4A882] text-sm font-inter mb-6">
                Welcome back, {reg.fullName.split(' ')[0]}. Complete your payment to get your ticket.
              </p>

              <div className="space-y-3 mb-6">
                <SummaryRow label="Name" value={reg.fullName} />
                <SummaryRow label="Matric No." value={reg.matricNumber} />
                <div className="h-px" style={{ background: 'rgba(201,162,39,0.2)' }} />
                <SummaryRow label="Total Cost" value={formatNaira(reg.totalAmount)} />
                <SummaryRow label="Paid So Far" value={formatNaira(reg.amountPaid)} />
                <SummaryRow label="Balance Remaining" value={formatNaira(regRemaining)} highlight />
              </div>

              <div className="mb-5">
                <label className="text-sm font-inter font-medium text-[#C4A882] block mb-2">
                  Amount to pay now (min ₦500, max {formatNaira(regRemaining)})
                </label>
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
                  className="input-styled"
                />
                {continuePayAmount < regRemaining && (
                  <p className="text-xs font-inter mt-1" style={{ color: '#C4A882' }}>
                    Remaining after:{' '}
                    <span style={{ color: '#E8C84A', fontWeight: 600 }}>
                      {formatNaira(regRemaining - continuePayAmount)}
                    </span>
                  </p>
                )}
              </div>

              <button
                onClick={() => handlePayment(continuePayAmount)}
                disabled={processingPayment}
                className="btn-gold w-full py-3 rounded-lg font-inter font-semibold text-sm flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#1A0505] border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay Now`
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: TICKET or RECEIPT ── */}
        {step === 4 && reg && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
                {reg.paymentStatus === 'completed' ? 'Your Ticket(s)' : 'Payment Receipt'}
              </h2>
              <p className="text-[#C4A882] font-inter text-sm mt-2">
                {reg.paymentStatus === 'completed'
                  ? 'Download and keep your ticket(s) safe!'
                  : 'Complete your payment to get your ticket.'}
              </p>
            </div>

            {reg.paymentStatus === 'completed' ? (
              <>
                {/* Overflow-x scroll on mobile for tickets */}
                <div className="w-full overflow-x-auto pb-2">
                  <div className="flex flex-col items-center gap-8 min-w-min mx-auto">
                    {/* Student ticket */}
                    <TicketCard
                      fullName={reg.fullName}
                      matricNumber={reg.matricNumber}
                    />

                    {/* Plus One tickets */}
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
                </div>

                {/* Download All button (only if there are 2+ tickets) */}
                {reg.numPlusOnes > 0 && (
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-inter font-semibold text-sm border transition-colors hover:text-white"
                    style={{ borderColor: 'rgba(201,162,39,0.4)', color: '#C9A227' }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download All Tickets
                  </button>
                )}
              </>
            ) : (
              /* Receipt for partial payment */
              <ReceiptCard
                fullName={reg.fullName}
                matricNumber={reg.matricNumber}
                totalAmount={reg.totalAmount}
                amountPaid={reg.amountPaid}
                lastPayment={
                  latestPayment ??
                  reg.payments[reg.payments.length - 1]
                }
                onPayBalance={() => {
                  setIsReturningPartial(true);
                  setContinuePayAmount(Math.min(regRemaining, regRemaining));
                  setStep(3);
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Inline styles for form inputs */}
      <style jsx global>{`
        .input-styled {
          width: 100%;
          background: #2C0A0A;
          border: 1px solid rgba(201,162,39,0.3);
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .input-styled::placeholder {
          color: rgba(196,168,130,0.5);
        }
        .input-styled:focus {
          border-color: #C9A227;
          box-shadow: 0 0 0 3px rgba(201,162,39,0.12);
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ──

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-inter font-medium" style={{ color: '#C4A882' }}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

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
      className="lg:w-64 w-full rounded-xl p-5 h-fit lg:sticky lg:top-6"
      style={{
        background: 'rgba(201,162,39,0.05)',
        border: '1px solid rgba(201,162,39,0.25)',
      }}
    >
      <h3 className="text-sm font-inter font-semibold mb-4" style={{ color: '#C9A227' }}>
        Pricing Summary
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-inter">
          <span style={{ color: '#C4A882' }}>Base ticket</span>
          <span className="text-white">{formatNaira(25000)}</span>
        </div>
        {hasPlusOnes && (
          <div className="flex justify-between text-sm font-inter">
            <span style={{ color: '#C4A882' }}>Plus One(s) ×{numPlusOnes}</span>
            <span className="text-white">{formatNaira(plusOneTotal)}</span>
          </div>
        )}
        <div className="h-px my-2" style={{ background: 'rgba(201,162,39,0.2)' }} />
        <div className="flex justify-between font-inter font-semibold">
          <span style={{ color: '#C4A882' }}>Total</span>
          <span style={{ color: '#E8C84A', fontSize: '1.125rem' }}>{formatNaira(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}

function PaymentOptionCard({
  selected,
  onSelect,
  title,
  badge,
  amount,
  description,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  badge?: string;
  amount?: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      onClick={onSelect}
      className="rounded-xl p-4 cursor-pointer transition-all"
      style={{
        background: selected ? 'rgba(201,162,39,0.1)' : '#2C0A0A',
        border: `2px solid ${selected ? '#C9A227' : 'rgba(201,162,39,0.2)'}`,
        boxShadow: selected ? '0 0 20px rgba(201,162,39,0.15)' : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
            style={{ borderColor: selected ? '#C9A227' : 'rgba(201,162,39,0.4)' }}
          >
            {selected && <div className="w-2 h-2 rounded-full bg-[#C9A227]" />}
          </div>
          <span className="font-inter font-semibold text-sm text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className="text-[10px] font-inter font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(46,204,113,0.15)', color: '#2ECC71', border: '1px solid rgba(46,204,113,0.3)' }}
            >
              {badge}
            </span>
          )}
          {amount && (
            <span className="text-sm font-inter font-bold" style={{ color: '#E8C84A' }}>
              {amount}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs font-inter pl-6" style={{ color: '#C4A882' }}>{description}</p>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm font-inter">
      <span style={{ color: '#C4A882' }}>{label}</span>
      <span style={{ color: highlight ? '#2ECC71' : muted ? '#C4A882' : '#FFFFFF', fontWeight: highlight ? 600 : 400 }}>
        {value}
      </span>
    </div>
  );
}
