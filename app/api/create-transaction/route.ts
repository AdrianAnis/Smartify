import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/auth-service";
// @ts-ignore
import midtransClient from "midtrans-client";

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "dummy",
});

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orderId = `PREMIUM-${user.user_id}-${Date.now()}`;
    const amount = 79000;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: user.nama,
        email: user.email,
      },
      item_details: [
        {
          id: "PREMIUM-30D",
          price: amount,
          quantity: 1,
          name: "Smartify Premium (30 Hari)",
        }
      ]
    };

    if (process.env.MIDTRANS_SERVER_KEY) {
      const transaction = await snap.createTransaction(parameter);
      return NextResponse.json({ token: transaction.token, redirect_url: transaction.redirect_url });
    } else {
      // Mock for development if no key
      return NextResponse.json({ token: "mock-token-123", redirect_url: "https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-token-123" });
    }

  } catch (error: any) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
