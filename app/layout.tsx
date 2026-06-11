import type { Metadata } from 'next';
import { Instrument_Serif, DM_Mono } from 'next/font/google';
import './globals.css';
import '@/styles/bam-tokens.css';
import ClientProviders from '@/components/ClientProviders';

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'NACOS FYB | Event Payment Portal',
  description: 'NACOS RSU Final Year Bash — Official Event Payment Portal for the Class of 2026.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${dmMono.variable}`}>
      <body className="bam-root">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
