import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Confirms a student's payment claim. Admin verifies the actual bank transfer
 * separately. This endpoint records the claim and lets the student proceed.
 *
 * Body: { reference, amount }
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

    return NextResponse.json({ verified: true, amount });
  } catch {
    return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 500 });
  }
}
