import { NextResponse } from 'next/server';
import { getSupportedBanks, isFossaConfigured } from '@/lib/fossapay';

export const dynamic = 'force-dynamic';

// A small, common subset used for the simulated withdrawal flow when no
// FossaPay credentials are present.
const SIMULATED_BANKS = [
  { bankName: 'ACCESS BANK', bankCode: '044' },
  { bankName: 'GTBANK', bankCode: '058' },
  { bankName: 'UNITED BANK FOR AFRICA', bankCode: '033' },
  { bankName: 'ZENITH BANK', bankCode: '057' },
  { bankName: 'FIRST BANK OF NIGERIA', bankCode: '011' },
  { bankName: 'OPAY', bankCode: '999992' },
  { bankName: 'KUDA MICROFINANCE BANK', bankCode: '50211' },
  { bankName: 'WEMA BANK', bankCode: '035' },
  { bankName: 'PALMPAY', bankCode: '999991' },
  { bankName: 'MONIEPOINT MICROFINANCE BANK', bankCode: '50515' },
];

export async function GET() {
  try {
    if (!isFossaConfigured()) {
      return NextResponse.json({ banks: SIMULATED_BANKS, simulated: true });
    }
    const banks = await getSupportedBanks();
    return NextResponse.json({ banks });
  } catch (err) {
    console.error('banks route error:', err);
    return NextResponse.json({ banks: SIMULATED_BANKS, simulated: true });
  }
}
