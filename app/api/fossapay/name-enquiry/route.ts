import { NextRequest, NextResponse } from 'next/server';
import { bankNameEnquiry, isFossaConfigured } from '@/lib/fossapay';

export const dynamic = 'force-dynamic';

/**
 * Resolve the account holder name for a bank code + account number, so the
 * admin can confirm a withdrawal destination before sending funds.
 */
export async function POST(request: NextRequest) {
  try {
    const { bankCode, accountNumber, bankName } = (await request.json()) as {
      bankCode?: string;
      accountNumber?: string;
      bankName?: string;
    };

    if (!bankCode || !accountNumber || accountNumber.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Provide a valid bank and 10-digit account number' },
        { status: 400 }
      );
    }

    if (!isFossaConfigured()) {
      // Simulated lookup for testing the withdrawal UI.
      return NextResponse.json({
        success: true,
        simulated: true,
        accountName: `TEST ACCOUNT (${bankName || bankCode})`,
      });
    }

    const result = await bankNameEnquiry({ bankCode, accountNumber });
    return NextResponse.json({ success: true, accountName: result.accountName });
  } catch (err) {
    console.error('name-enquiry route error:', err);
    const message = err instanceof Error ? err.message : 'Account name enquiry failed';
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
