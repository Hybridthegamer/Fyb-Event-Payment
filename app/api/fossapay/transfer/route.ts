import { NextRequest, NextResponse } from 'next/server';
import { getSharedAccount, interBankTransfer, isFossaConfigured } from '@/lib/fossapay';

export const dynamic = 'force-dynamic';

/**
 * Execute an admin withdrawal (inter-bank transfer) out of the shared account.
 *
 * Body: { bankCode, bankName, accountNumber, accountName, amount, remarks? }
 *
 * Simulation mode (no credentials) returns a synthetic success so the admin
 * bank flow is fully testable.
 */
export async function POST(request: NextRequest) {
  try {
    const { bankCode, bankName, accountNumber, accountName, amount, remarks } =
      (await request.json()) as {
        bankCode?: string;
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
        amount?: number;
        remarks?: string;
      };

    if (!bankCode || !bankName || !accountNumber || !accountName || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid withdrawal details' },
        { status: 400 }
      );
    }

    const reference = `WTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (!isFossaConfigured()) {
      return NextResponse.json({ success: true, simulated: true, reference });
    }

    const account = await getSharedAccount();
    if (!account.customerId) {
      return NextResponse.json(
        { success: false, error: 'Shared account customer is not provisioned' },
        { status: 500 }
      );
    }

    const result = await interBankTransfer({
      customerId: account.customerId,
      destinationBankCode: bankCode,
      destinationBankName: bankName,
      destinationAccountNumber: accountNumber,
      destinationAccountName: accountName,
      amount,
      reference,
      remarks: remarks || 'FYB Dinner Night withdrawal',
    });

    return NextResponse.json({ success: true, reference: result.reference });
  } catch (err) {
    console.error('transfer route error:', err);
    const message = err instanceof Error ? err.message : 'Transfer failed';
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
