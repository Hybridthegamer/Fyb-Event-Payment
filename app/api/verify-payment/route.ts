import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body as { reference?: string };

    if (!reference) {
      return NextResponse.json({ verified: false, error: 'No reference provided' }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ verified: false, error: 'Server misconfiguration' }, { status: 500 });
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!paystackRes.ok) {
      return NextResponse.json({ verified: false, error: 'Paystack verification request failed' }, { status: 502 });
    }

    const data = await paystackRes.json();

    if (data.status === true && data.data?.status === 'success') {
      return NextResponse.json({
        verified: true,
        amount: Math.round(data.data.amount / 100),
        reference: data.data.reference,
        currency: data.data.currency,
      });
    }

    return NextResponse.json({ verified: false, status: data.data?.status });
  } catch (err) {
    console.error('Payment verification error:', err);
    return NextResponse.json({ verified: false, error: 'Internal server error' }, { status: 500 });
  }
}
