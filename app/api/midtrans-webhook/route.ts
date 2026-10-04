import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
// @ts-ignore
import midtransClient from "midtrans-client";

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "dummy",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // In production, we should verify the signature key
    // For now, we will assume Midtrans POSTed it.
    
    let transactionStatus = body.transaction_status;
    let fraudStatus = body.fraud_status;
    let orderId = body.order_id;
    
    if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
      if (fraudStatus == 'accept' || !fraudStatus) {
        // Upgrade user
        const userIdMatches = orderId.match(/PREMIUM-(\d+)-/);
        if (userIdMatches && userIdMatches[1]) {
          const userId = Number(userIdMatches[1]);
          const expiredAt = new Date();
          expiredAt.setDate(expiredAt.getDate() + 30); // 30 days premium

          await supabaseServer
            .from("users")
            .update({
              subscription_status: "premium",
              expired_at: expiredAt.toISOString()
            })
            .eq("user_id", userId);
        }
      }
    }
    
    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
