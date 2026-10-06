import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, customerName, customerEmail, customerPhone, description } = await request.json();

    const apiKey = process.env.MAYAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MAYAR_API_KEY is not configured' }, { status: 500 });
    }

    // Default ke api.mayar.club jika tidak ada di env
    const apiUrl = process.env.MAYAR_API_URL || 'https://api.mayar.club';

    // Panggil API Mayar langsung menggunakan fetch
    const response = await fetch(`${apiUrl}/hl/v2/qr-codes/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount || 79000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mayar API Error:', data);
      return NextResponse.json({ error: data.messages || data.message || "Gagal membuat invoice", raw: data }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Route Error:', error.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
