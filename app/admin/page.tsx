'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { formatNaira } from '@/lib/utils';
import {
  getBankLedger,
  recordBankWithdrawal,
  BankLedger,
  BankDepositEntry,
  BankWithdrawalEntry,
} from '@/lib/firestoreHelpers';

const ADMIN_PIN = '2880';

interface Bank {
  bankName: string;
  bankCode: string;
}

type LedgerRow =
  | ({ kind: 'deposit' } & BankDepositEntry)
  | ({ kind: 'withdrawal' } & BankWithdrawalEntry);

export default function AdminPage() {
  return <AuthGuard>{() => <AdminGate />}</AuthGuard>;
}

function AdminGate() {
  const [pin, setPin] = useState(['', '', '', '']);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinInput = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const next = [...pin];
      next[index] = value;
      setPin(next);
      setError(false);

      if (value && index < 3) inputRefs.current[index + 1]?.focus();

      if (value && index === 3) {
        const entered = [...next].join('');
        if (entered === ADMIN_PIN) {
          setUnlocked(true);
        } else {
          setError(true);
          setTimeout(() => {
            setPin(['', '', '', '']);
            setError(false);
            inputRefs.current[0]?.focus();
          }, 700);
        }
      }
    },
    [pin]
  );

  const handlePinKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !pin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [pin]
  );

  if (!unlocked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bam-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '360px', width: '100%', padding: 'var(--bam-pad)' }}>
          <h1
            style={{
              fontFamily: 'var(--bam-font-serif)',
              fontSize: 'var(--bam-t-title)',
              color: 'var(--bam-cream)',
              fontWeight: 400,
              margin: '0 0 var(--bam-space-xl)',
            }}
          >
            Admin Access.
          </h1>
          <p
            style={{
              fontFamily: 'var(--bam-font-mono)',
              fontSize: 'var(--bam-t-micro)',
              color: 'var(--bam-cream-40)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 'var(--bam-space-xl)',
            }}
          >
            ENTER PIN TO CONTINUE
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: 'var(--bam-space-lg)' }}>
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={pin[i]}
                onChange={(e) => handlePinInput(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
                style={{
                  width: '52px',
                  height: '60px',
                  background: 'var(--bam-surface)',
                  border: `1px solid ${error ? 'var(--bam-red)' : 'var(--bam-border)'}`,
                  borderRadius: 0,
                  color: 'var(--bam-cream)',
                  fontFamily: 'var(--bam-font-mono)',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                  animation: error ? 'bam-glitch-shake 0.4s' : 'none',
                }}
                onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; }}
                onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = 'var(--bam-border)'; }}
              />
            ))}
          </div>

          {error && (
            <p
              style={{
                fontFamily: 'var(--bam-font-mono)',
                fontSize: 'var(--bam-t-micro)',
                color: 'var(--bam-red)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                animation: 'bam-fadeIn 0.2s ease',
              }}
            >
              INCORRECT PIN
            </p>
          )}
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

// ─── Dashboard + Bank system ─────────────────────────────────────────────────

function AdminDashboard() {
  const [ledger, setLedger] = useState<BankLedger | null>(null);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [l, balRes] = await Promise.all([
        getBankLedger(),
        fetch('/api/fossapay/balance').then((r) => r.json()).catch(() => ({ available: null })),
      ]);
      setLedger(l);
      setLiveBalance(typeof balRes?.available === 'number' ? balRes.available : null);
    } catch {
      toast.error('Failed to load bank data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalDeposits = ledger?.totalDeposits ?? 0;
  const totalWithdrawals = ledger?.totalWithdrawals ?? 0;
  const ledgerBalance = totalDeposits - totalWithdrawals;
  const balance = liveBalance ?? ledgerBalance;

  const rows: LedgerRow[] = useMemo(() => {
    if (!ledger) return [];
    const deposits: LedgerRow[] = ledger.deposits.map((d) => ({ kind: 'deposit', ...d }));
    const withdrawals: LedgerRow[] = ledger.withdrawals.map((w) => ({ kind: 'withdrawal', ...w }));
    return [...deposits, ...withdrawals].sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
  }, [ledger]);

  const fmtDate = (row: LedgerRow) => {
    try {
      return row.createdAt?.toDate?.().toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) ?? '—';
    } catch {
      return '—';
    }
  };

  const downloadCSV = () => {
    const header = 'Type,Party,Amount,Fee,Reference,Status,Date';
    const lines = rows.map((r) => {
      if (r.kind === 'deposit') {
        return `Deposit,${r.name} (${r.matric}),${r.amount},${r.fee},${r.reference},completed,${fmtDate(r)}`;
      }
      return `Withdrawal,${r.accountName} (${r.bankName} ${r.accountNumber}),${r.amount},0,${r.reference},${r.status},${fmtDate(r)}`;
    });
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NACOS-FYB-Bank-Statement.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: 'BALANCE', value: formatNaira(Math.max(0, Math.round(balance))), accent: true },
    { label: 'DEPOSITS', value: formatNaira(totalDeposits) },
    { label: 'WITHDRAWALS', value: formatNaira(totalWithdrawals) },
    { label: 'TRANSACTIONS', value: String(rows.length) },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bam-bg)' }}>
      <Navbar pageLabel="ADMIN · BANK" />

      <main style={{ padding: 'calc(56px + var(--bam-space-2xl)) var(--bam-pad) var(--bam-space-2xl)' }}>
        {/* Heading + actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: 'var(--bam-space-xl)',
          }}
        >
          <div>
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
              FYB DINNER NIGHT · FOSSAPAY
            </p>
            <h1
              style={{
                fontFamily: 'var(--bam-font-serif)',
                fontSize: 'var(--bam-t-title)',
                color: 'var(--bam-cream)',
                fontWeight: 400,
                margin: 0,
              }}
            >
              Bank.
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={refresh} style={ghostBtn}>REFRESH</button>
            <button onClick={downloadCSV} style={ghostBtn}>EXPORT CSV</button>
            <button
              onClick={() => setShowWithdraw((v) => !v)}
              style={{ ...ghostBtn, background: 'var(--bam-red)', borderColor: 'var(--bam-red)', color: 'var(--bam-cream)' }}
            >
              {showWithdraw ? 'CLOSE' : 'WITHDRAW'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 'var(--bam-space-2xl)' }}>
          {statCards.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--bam-surface)',
                border: `1px solid ${stat.accent ? 'var(--event-gold)' : 'var(--bam-border)'}`,
                borderRadius: 0,
                padding: 'var(--bam-space-lg)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--bam-font-mono)',
                  fontSize: 'var(--bam-t-micro)',
                  color: 'var(--bam-cream-20)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  margin: '0 0 8px',
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--bam-font-serif)',
                  fontSize: stat.accent ? 'var(--bam-t-title)' : '1.6rem',
                  color: stat.accent ? 'var(--event-gold)' : 'var(--bam-cream)',
                  margin: 0,
                  fontWeight: 400,
                  wordBreak: 'break-word',
                }}
              >
                {loading ? '…' : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Withdrawal panel */}
        {showWithdraw && (
          <WithdrawPanel
            available={balance}
            onDone={async () => {
              setShowWithdraw(false);
              await refresh();
            }}
          />
        )}

        {/* Transactions table */}
        <div style={{ border: '1px solid var(--bam-border)', borderRadius: 0, overflow: 'hidden' }}>
          <div
            className="grid grid-cols-5"
            style={{
              background: 'var(--bam-surface-2)',
              padding: '10px 16px',
              borderBottom: '1px solid var(--bam-border)',
            }}
          >
            {['TYPE', 'PARTY', 'AMOUNT', 'REFERENCE', 'DATE'].map((h) => (
              <span
                key={h}
                style={{
                  fontFamily: 'var(--bam-font-mono)',
                  fontSize: 'var(--bam-t-micro)',
                  color: 'var(--bam-cream-20)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {rows.map((row, i) => {
            const isDeposit = row.kind === 'deposit';
            const party = isDeposit
              ? `${(row as BankDepositEntry).name} · ${(row as BankDepositEntry).matric}`
              : `${(row as BankWithdrawalEntry).accountName} · ${(row as BankWithdrawalEntry).bankName}`;
            const failed = !isDeposit && (row as BankWithdrawalEntry).status === 'failed';
            return (
              <div
                key={`${row.kind}-${row.id}-${i}`}
                className="grid grid-cols-5"
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--bam-border)',
                  borderLeft: `3px solid ${isDeposit ? '#2ECC71' : failed ? 'var(--bam-red)' : 'var(--event-gold)'}`,
                  alignItems: 'baseline',
                }}
              >
                <span style={{ ...cellStyle, color: isDeposit ? '#2ECC71' : failed ? 'var(--bam-red)' : 'var(--event-gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {isDeposit ? 'DEPOSIT' : failed ? 'WTH · FAILED' : 'WITHDRAWAL'}
                </span>
                <span style={cellStyle}>{party}</span>
                <span style={cellStyle}>
                  {isDeposit ? '+' : '−'}
                  {formatNaira(row.amount)}
                </span>
                <span style={cellStyle}>{row.reference}</span>
                <span style={cellStyle}>{fmtDate(row)}</span>
              </div>
            );
          })}

          {!loading && rows.length === 0 && (
            <div style={{ padding: 'var(--bam-space-2xl)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--bam-font-mono)', fontSize: '0.8rem', color: 'var(--bam-cream-40)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                NO TRANSACTIONS YET
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Withdrawal panel ────────────────────────────────────────────────────────

function WithdrawPanel({ available, onDone }: { available: number; onDone: () => void }) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/fossapay/banks')
      .then((r) => r.json())
      .then((d) => setBanks(d.banks ?? []))
      .catch(() => setBanks([]));
  }, []);

  const selectedBank = banks.find((b) => b.bankCode === bankCode);

  // Reset the resolved name whenever the destination changes.
  useEffect(() => {
    setAccountName('');
  }, [bankCode, accountNumber]);

  const resolveName = useCallback(async () => {
    if (!bankCode || accountNumber.length < 10) {
      toast.error('Select a bank and enter a valid 10-digit account number.');
      return;
    }
    setResolving(true);
    try {
      const res = await fetch('/api/fossapay/name-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankCode, accountNumber, bankName: selectedBank?.bankName }),
      });
      const data = await res.json();
      if (data.success && data.accountName) {
        setAccountName(data.accountName);
      } else {
        toast.error(data.error || 'Could not resolve account name.');
      }
    } catch {
      toast.error('Account name enquiry failed.');
    } finally {
      setResolving(false);
    }
  }, [bankCode, accountNumber, selectedBank]);

  const submit = useCallback(async () => {
    if (!selectedBank || !accountName || accountNumber.length < 10) {
      toast.error('Verify the destination account first.');
      return;
    }
    if (amount <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    if (amount > available) {
      toast.error('Amount exceeds available balance.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/fossapay/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankCode: selectedBank.bankCode,
          bankName: selectedBank.bankName,
          accountNumber,
          accountName,
          amount,
          remarks: 'FYB Dinner Night withdrawal',
        }),
      });
      const data = await res.json();

      await recordBankWithdrawal({
        id: `wth-${Date.now()}`,
        accountName,
        accountNumber,
        bankName: selectedBank.bankName,
        amount,
        reference: data.reference || `WTH-${Date.now()}`,
        status: data.success ? 'completed' : 'failed',
      });

      if (data.success) {
        toast.success(`Withdrawal of ${formatNaira(amount)} sent.`);
        onDone();
      } else {
        toast.error(data.error || 'Withdrawal failed.');
      }
    } catch {
      toast.error('Withdrawal request failed.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedBank, accountName, accountNumber, amount, available, onDone]);

  return (
    <div
      style={{
        background: 'var(--bam-surface)',
        border: '1px solid var(--event-gold)',
        padding: 'var(--bam-space-xl)',
        marginBottom: 'var(--bam-space-2xl)',
        maxWidth: '540px',
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
        NEW WITHDRAWAL · AVAILABLE {formatNaira(Math.max(0, Math.round(available)))}
      </p>

      <label style={fieldLabel}>Destination Bank</label>
      <select
        value={bankCode}
        onChange={(e) => setBankCode(e.target.value)}
        style={{ ...field, appearance: 'none' }}
      >
        <option value="">Select bank…</option>
        {banks.map((b) => (
          <option key={b.bankCode} value={b.bankCode}>
            {b.bankName}
          </option>
        ))}
      </select>

      <label style={fieldLabel}>Account Number</label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
        placeholder="10-digit account number"
        style={field}
      />

      <button onClick={resolveName} disabled={resolving} style={{ ...ghostBtn, width: '100%', marginBottom: 'var(--bam-space-md)' }}>
        {resolving ? 'VERIFYING…' : 'VERIFY ACCOUNT NAME'}
      </button>

      {accountName && (
        <div
          style={{
            background: 'var(--bam-surface-2)',
            border: '1px solid var(--bam-border)',
            padding: 'var(--bam-space-md)',
            marginBottom: 'var(--bam-space-md)',
          }}
        >
          <span style={fieldLabel}>Account Name</span>
          <p style={{ fontFamily: 'var(--bam-font-mono)', fontSize: '0.9rem', color: 'var(--bam-cream)', margin: 0 }}>
            {accountName}
          </p>
        </div>
      )}

      <label style={fieldLabel}>Amount (₦)</label>
      <input
        type="number"
        min={1}
        max={available}
        value={amount || ''}
        onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
        placeholder="Amount to withdraw"
        style={{ ...field, marginBottom: 'var(--bam-space-lg)' }}
      />

      <button
        onClick={submit}
        disabled={submitting || !accountName}
        style={{
          width: '100%',
          padding: '16px',
          background: 'var(--bam-red)',
          border: 'none',
          borderRadius: 0,
          color: 'var(--bam-cream)',
          fontFamily: 'var(--bam-font-mono)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.20em',
          cursor: submitting || !accountName ? 'not-allowed' : 'pointer',
          opacity: submitting || !accountName ? 0.6 : 1,
        }}
      >
        {submitting ? 'SENDING…' : 'SEND WITHDRAWAL →'}
      </button>
    </div>
  );
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const ghostBtn: React.CSSProperties = {
  background: 'var(--bam-surface)',
  border: '1px solid var(--bam-border)',
  borderRadius: 0,
  color: 'var(--bam-cream-60)',
  fontFamily: 'var(--bam-font-mono)',
  fontSize: 'var(--bam-t-micro)',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  padding: '8px 16px',
  cursor: 'pointer',
  transition: 'border-color 0.15s ease',
};

const cellStyle: React.CSSProperties = {
  fontFamily: 'var(--bam-font-mono)',
  fontSize: '0.8rem',
  color: 'var(--bam-cream-80)',
  wordBreak: 'break-word',
  paddingRight: '8px',
};

const fieldLabel: React.CSSProperties = {
  fontFamily: 'var(--bam-font-mono)',
  fontSize: 'var(--bam-t-micro)',
  color: 'var(--bam-cream-40)',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  display: 'block',
  marginBottom: '8px',
};

const field: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--bam-surface-2)',
  border: '1px solid var(--bam-border)',
  borderRadius: 0,
  color: 'var(--bam-cream-80)',
  fontFamily: 'var(--bam-font-mono)',
  fontSize: '0.875rem',
  padding: '12px 16px',
  outline: 'none',
  marginBottom: 'var(--bam-space-md)',
};
