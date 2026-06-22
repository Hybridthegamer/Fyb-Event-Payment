import { NextResponse } from 'next/server';
import { getSharedAccount } from '@/lib/fossapay';

export const dynamic = 'force-dynamic';

/**
 * Returns the single shared account details displayed to every student.
 * Only public fields are exposed (never the wallet id or secret).
 */
export async function GET() {
  try {
    const account = await getSharedAccount();
    return NextResponse.json({
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      accountName: account.accountName,
      simulated: account.simulated,
    });
  } catch (err) {
    console.error('account route error:', err);
    return NextResponse.json({ error: 'Failed to load account details' }, { status: 500 });
  }
}
