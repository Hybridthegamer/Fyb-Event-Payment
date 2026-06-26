import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SHARED_ACCOUNT_NAME = 'Fyb Dinner Night.';

/** Returns the static bank account details displayed to every student. */
export async function GET() {
  return NextResponse.json({
    accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || '',
    bankName: process.env.PAYMENT_BANK_NAME || '',
    accountName: process.env.PAYMENT_ACCOUNT_NAME || SHARED_ACCOUNT_NAME,
  });
}
