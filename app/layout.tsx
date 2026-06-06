import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'NACOS FYB | Event Payment Portal',
  description: 'NACOS RSU Final Year Bash — Official Event Payment Portal for the Class of 2026.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          gutter={12}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#3D1010',
              color: '#fff',
              border: '1px solid rgba(201, 162, 39, 0.4)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#2ECC71', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#E74C3C', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
