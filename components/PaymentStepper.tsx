'use client';

import { memo } from 'react';

const STEPS = [
  { number: 1, label: 'DETAILS' },
  { number: 2, label: 'OPTIONS' },
  { number: 3, label: 'PAYMENT' },
  { number: 4, label: 'TICKET' },
];

interface PaymentStepperProps {
  currentStep: number;
  variant?: 'sidebar' | 'bar';
}

const PaymentStepper = memo(function PaymentStepper({
  currentStep,
  variant = 'sidebar',
}: PaymentStepperProps) {
  if (variant === 'bar') {
    return (
      <div>
        <div style={{ display: 'flex', height: '3px', width: '100%' }}>
          {STEPS.map((step, i) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            return (
              <div
                key={step.number}
                style={{
                  flex: 1,
                  background: isCompleted
                    ? 'var(--bam-cream-20)'
                    : isActive
                    ? 'var(--bam-red)'
                    : 'var(--bam-border)',
                  borderRight: i < STEPS.length - 1 ? '1px solid var(--bam-bg)' : 'none',
                }}
              />
            );
          })}
        </div>
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
          {STEPS.find((s) => s.number === currentStep)?.label ?? ''}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--bam-space-lg)' }}>
      {STEPS.map((step) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        return (
          <div key={step.number} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '2px',
                alignSelf: 'stretch',
                minHeight: '40px',
                background: isCompleted
                  ? 'var(--bam-red)'
                  : isActive
                  ? 'var(--bam-cream-40)'
                  : 'var(--bam-border)',
                flexShrink: 0,
              }}
            />
            <div>
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
                {String(step.number).padStart(2, '0')}
              </p>
              <p
                style={{
                  fontFamily: 'var(--bam-font-mono)',
                  fontSize: '0.7rem',
                  color: isActive ? 'var(--bam-cream)' : 'var(--bam-cream-20)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  margin: '2px 0 0',
                }}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default PaymentStepper;
