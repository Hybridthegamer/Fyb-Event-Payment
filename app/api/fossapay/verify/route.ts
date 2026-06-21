import { NextRequest, NextResponse } from 'next/server';
import {
  getSharedAccount,
  getWalletTransactions,
  isFossaConfigured,
} from '@/lib/fossapay';

export const dynamic = 'force-dynamic';

/**
 * Confirm that a student's bank transfer has landed in the shared account.
 *
 * Body: { reference, amount }
 *   - reference: the narration the student was asked to use (NACOS-FYB-XXXX)
 *   - amount:    the exact amount transferred (ticket portion + FossaPay fee)
 *
 * Live mode: queries the shared wallet's recent deposits and matches one whose
 * narration/reference contains the student reference (and amount is sufficient).
 *
 * Simulation mode (no credentials): confirms immediately so the full receipt /
 * ticket flow can be tested without moving real money.
 */
export async function POST(request: NextRequest) {
  try {
    const { reference, amount } = (await request.json()) as {
      reference?: string;
      amount?: number;
    };

    if (!reference) {
      return NextResponse.json({ verified: false, error: 'Missing reference' }, { status: 400 });
    }

    if (!isFossaConfigured()) {
      // Simulated confirmation for testing.
      return NextResponse.json({ verified: true, simulated: true, amount });
    }

    const account = await getSharedAccount();
    if (!account.walletId) {
      return NextResponse.json(
        { verified: false, error: 'Shared wallet is not provisioned' },
        { status: 500 }
      );
    }

    const txns = await getWalletTransactions(account.walletId, {
      transactionType: 'deposit',
      limit: 100,
    });

    const ref = reference.toLowerCase();
    const match = txns.find((t) => {
      const isCompleted = ['completed', 'successful', 'success'].includes(
        String(t.status).toLowerCase()
      );
      const narrationHit =
        (t.narration || '').toLowerCase().includes(ref) ||
        (t.reference || '').toLowerCase().includes(ref);
      const amountOk = amount ? Number(t.amount) >= Number(amount) - 1 : true;
      return isCompleted && narrationHit && amountOk;
    });

    if (match) {
      return NextResponse.json({
        verified: true,
        amount: match.amount,
        reference: match.reference,
        transactionId: match.transactionId,
      });
    }

    return NextResponse.json({ verified: false });
  } catch (err) {
    console.error('verify route error:', err);
    return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 500 });
  }
}
