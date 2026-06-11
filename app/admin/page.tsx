'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';

const ADMIN_PIN = '0000';

type TabKey = 'ALL' | 'FLAGGED' | 'PARTIAL' | 'COMPLETED';

const MOCK_STATS = {
  total: 147,
  flagged: 3,
  partial: 24,
  completed: 120,
};

const MOCK_REGISTRATIONS = [
  { id: '1', name: 'Chukwuemeka Obi', matric: 'U2019/5700', status: 'completed', amount: '₦25,000', date: '2026-05-14' },
  { id: '2', name: 'Amaka Nwosu', matric: 'U2019/4321', status: 'partial', amount: '₦12,500', date: '2026-05-15' },
  { id: '3', name: 'Emeka Eze', matric: 'U2019/8800', status: 'flagged', amount: '₦25,000', date: '2026-05-16' },
  { id: '4', name: 'Ngozi Adeyemi', matric: 'U2019/1122', status: 'completed', amount: '₦35,000', date: '2026-05-17' },
  { id: '5', name: 'Tobi Adeleke', matric: 'U2019/6655', status: 'completed', amount: '₦25,000', date: '2026-05-17' },
  { id: '6', name: 'Chioma Okafor', matric: 'U2019/3344', status: 'partial', amount: '₦5,000', date: '2026-05-18' },
  { id: '7', name: 'Emeka Johnson', matric: 'U2019/9900', status: 'flagged', amount: '₦45,000', date: '2026-05-18' },
];

export default function AdminPage() {
  const [pin, setPin] = useState(['', '', '', '']);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinInput = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

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
  }, [pin]);

  const handlePinKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [pin]);

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return MOCK_REGISTRATIONS;
    return MOCK_REGISTRATIONS.filter((r) => r.status === activeTab.toLowerCase());
  }, [activeTab]);

  const downloadCSV = () => {
    const header = 'Name,Matric,Status,Amount,Date';
    const rows = MOCK_REGISTRATIONS.map(
      (r) => `${r.name},${r.matric},${r.status},${r.amount},${r.date}`
    ).join('\n');
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NACOS-FYB-Registrations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const tabs: TabKey[] = ['ALL', 'FLAGGED', 'PARTIAL', 'COMPLETED'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bam-bg)' }}>
      <Navbar pageLabel="ADMIN" />

      <main style={{ paddingTop: '56px', padding: 'calc(56px + var(--bam-space-2xl)) var(--bam-pad) var(--bam-space-2xl)' }}>
        {/* Stats */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ marginBottom: 'var(--bam-space-2xl)' }}
        >
          {[
            { label: 'TOTAL', value: MOCK_STATS.total, flagged: false, delay: '0' },
            { label: 'COMPLETED', value: MOCK_STATS.completed, flagged: false, delay: '80' },
            { label: 'PARTIAL', value: MOCK_STATS.partial, flagged: false, delay: '160' },
            { label: 'FLAGGED', value: MOCK_STATS.flagged, flagged: true, delay: '240' },
          ].map((stat) => (
            <div
              key={stat.label}
              data-reveal
              data-reveal-delay={stat.delay}
              style={{
                background: 'var(--bam-surface)',
                border: `1px solid ${stat.flagged ? 'rgba(200,0,60,0.3)' : 'var(--bam-border)'}`,
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
                  fontSize: 'var(--bam-t-title)',
                  color: stat.flagged ? 'var(--bam-red)' : 'var(--bam-cream)',
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs + Export */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--bam-space-md)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--bam-border)' }}>
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  fontFamily: 'var(--bam-font-mono)',
                  fontSize: 'var(--bam-t-micro)',
                  color: activeTab === tab ? 'var(--bam-cream)' : 'var(--bam-cream-40)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--bam-cream)' : '2px solid transparent',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  marginBottom: '-1px',
                }}
              >
                {tab}{i < tabs.length - 1 && <span style={{ color: 'var(--bam-cream-20)', marginLeft: '16px' }}>·</span>}
              </button>
            ))}
          </div>

          <button
            onClick={downloadCSV}
            style={{
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
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--bam-cream-40)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--bam-border)'; }}
          >
            EXPORT CSV
          </button>
        </div>

        {/* Table */}
        <div style={{ border: '1px solid var(--bam-border)', borderRadius: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div
            className="grid grid-cols-5"
            style={{
              background: 'var(--bam-surface-2)',
              padding: '10px 16px',
              borderBottom: '1px solid var(--bam-border)',
            }}
          >
            {['NAME', 'MATRIC', 'STATUS', 'AMOUNT', 'DATE'].map((h) => (
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

          {filtered.map((row) => (
            <div key={row.id}>
              <div
                className="grid grid-cols-5"
                onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--bam-border)',
                  borderLeft: row.status === 'flagged' ? '3px solid var(--bam-red)' : '3px solid transparent',
                  background: row.status === 'flagged' ? 'var(--bam-red-subtle)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (row.status !== 'flagged') (e.currentTarget as HTMLElement).style.background = 'var(--bam-surface)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = row.status === 'flagged' ? 'var(--bam-red-subtle)' : 'transparent';
                }}
              >
                {[row.name, row.matric, row.status.toUpperCase(), row.amount, row.date].map((cell, ci) => (
                  <span
                    key={ci}
                    style={{
                      fontFamily: 'var(--bam-font-mono)',
                      fontSize: '0.8rem',
                      color: ci === 2 && row.status === 'flagged' ? 'var(--bam-red)' : 'var(--bam-cream-80)',
                      textTransform: ci === 2 ? 'uppercase' : 'none',
                      letterSpacing: ci === 2 ? '0.12em' : '0',
                    }}
                  >
                    {cell}
                  </span>
                ))}
              </div>

              {expandedRow === row.id && (
                <div
                  style={{
                    borderTop: '1px dashed var(--bam-border)',
                    borderBottom: '1px solid var(--bam-border)',
                    background: 'var(--bam-surface-2)',
                    padding: 'var(--bam-space-lg)',
                    animation: 'bam-fadeIn 0.2s ease',
                  }}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4" style={{ marginBottom: 'var(--bam-space-md)' }}>
                    {[
                      ['Name', row.name],
                      ['Matric Number', row.matric],
                      ['Status', row.status.toUpperCase()],
                      ['Amount Paid', row.amount],
                      ['Registration Date', row.date],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p style={{ fontFamily: 'var(--bam-font-mono)', fontSize: 'var(--bam-t-micro)', color: 'var(--bam-cream-40)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px' }}>{label}</p>
                        <p style={{ fontFamily: 'var(--bam-font-mono)', fontSize: '0.8rem', color: 'var(--bam-cream-80)', margin: 0 }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {row.status === 'flagged' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          background: 'var(--bam-red)',
                          border: 'none',
                          borderRadius: 0,
                          color: 'var(--bam-cream)',
                          fontFamily: 'var(--bam-font-mono)',
                          fontSize: 'var(--bam-t-micro)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          padding: '8px 20px',
                          cursor: 'pointer',
                        }}
                      >
                        VERIFY
                      </button>
                      <button
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--bam-border)',
                          borderRadius: 0,
                          color: 'var(--bam-cream-60)',
                          fontFamily: 'var(--bam-font-mono)',
                          fontSize: 'var(--bam-t-micro)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          padding: '8px 20px',
                          cursor: 'pointer',
                        }}
                      >
                        REJECT
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: 'var(--bam-space-2xl)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--bam-font-mono)', fontSize: '0.8rem', color: 'var(--bam-cream-40)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                NO RECORDS
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
