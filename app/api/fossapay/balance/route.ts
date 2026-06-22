import { NextResponse } from 'next/server';
import { getSharedAccount, getWallet, isFossaConfigured } from '@/lib/fossapay';

export const dynamic = 'force-dynamic';

/**
 * Live available balance of the shared wallet (admin bank view).
 * Returns `available: null` in simulation mode — the admin dashboard then
 * relies on the Firestore ledger (deposits − withdrawals) instead.
 */
export async function GET() {
  try {
    if (!isFossaConfigured()) {
      return NextResponse.json({ available: null, simulated: true });
    }
    const account = await getSharedAccount();
    if (!account.walletId) {
      return NextResponse.json({ available: null });
    }
    const wallet = await getWallet(account.walletId);
    return NextResponse.json({
      available: wallet.availableBalance,
      ledger: wallet.ledgerBalance,
    });
  } catch (err) {
    console.error('balance route error:', err);
    return NextResponse.json({ available: null, error: 'Failed to load balance' });
  }
}
