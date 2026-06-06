declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackOptions) => { openIframe: () => void };
    };
  }
}

export interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata?: Record<string, unknown>;
  onSuccess: (transaction: { reference: string }) => void;
  onClose: () => void;
}

let scriptLoadPromise: Promise<void> | null = null;

export function loadPaystackScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.PaystackPop) {
    return Promise.resolve();
  }
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Failed to load Paystack script'));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export async function initiatePaystackPayment(options: PaystackOptions): Promise<void> {
  await loadPaystackScript();
  const handler = window.PaystackPop.setup(options);
  handler.openIframe();
}
