import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/fossapay';

export const dynamic = 'force-dynamic';

/**
 * FossaPay webhook receiver.
 *
 * Verifies the HMAC-SHA256 signature (x-fossapay-signature), acknowledges
 * quickly, and logs the event. Deposit confirmation that advances a student's
 * registration is driven client-side through /api/fossapay/verify (the client
 * holds the Firestore write permission for its own document), so this endpoint
 * is primarily for real-time logging and audit. If a Firebase Admin credential
 * is added later, ledger writes can be moved here.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-fossapay-signature');

  // Only enforce the signature when a webhook secret is configured.
  if (process.env.FOSSAPAY_WEBHOOK_SECRET) {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(rawBody);
    const event = payload?.event;
    const data = payload?.data;

    switch (event) {
      case 'deposit.completed':
        console.log('[fossapay] deposit.completed', {
          reference: data?.reference,
          amount: data?.amount,
          sender: data?.sender?.accountName,
        });
        break;
      case 'withdrawal.completed':
      case 'withdrawal.failed':
        console.log(`[fossapay] ${event}`, {
          reference: data?.reference,
          amount: data?.amount,
          status: data?.status,
        });
        break;
      default:
        console.log('[fossapay] unhandled event', event);
    }
  } catch {
    // Malformed body — still acknowledge to avoid ret‑storms.
  }

  return NextResponse.json({ received: true });
}
