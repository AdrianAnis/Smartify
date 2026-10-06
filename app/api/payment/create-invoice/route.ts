import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth-service';

const PREMIUM_PRICE = 79000;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.MAYAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MAYAR_API_KEY is not configured' }, { status: 500 });
    }

    const apiUrl = process.env.MAYAR_API_URL || 'https://api.mayar.club';

    const response = await fetch(`${apiUrl}/hl/v2/qr-codes/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: PREMIUM_PRICE
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mayar API Error:', data);
      return NextResponse.json({ error: data.messages || data.message || "Gagal membuat invoice" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Gagal membuat invoice' }, { status: 500 });
  }
}
