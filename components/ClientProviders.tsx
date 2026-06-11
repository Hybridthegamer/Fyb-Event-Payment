'use client';

import { Toaster } from 'react-hot-toast';
import GrainOverlay from './GrainOverlay';
import CustomCursor from './CustomCursor';
import useScrollReveal from '@/hooks/useScrollReveal';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  useScrollReveal();

  return (
    <>
      <GrainOverlay />
      <CustomCursor />
      {children}
      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bam-surface)',
            color: 'var(--bam-cream)',
            border: '1px solid var(--bam-border)',
            fontFamily: 'var(--bam-font-mono)',
            fontSize: '12px',
            letterSpacing: '0.05em',
            borderRadius: '0',
          },
          success: {
            iconTheme: { primary: '#2ECC71', secondary: '#0D0D0D' },
          },
          error: {
            iconTheme: { primary: '#C8003C', secondary: '#0D0D0D' },
          },
        }}
      />
    </>
  );
}
