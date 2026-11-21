import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/auth-service";
import { supabaseServer } from "@/lib/supabase/server";
import { isPremiumEffective } from "@/lib/subscription/plan";

const PREMIUM_DURATION_DAYS = 30;

export async function POST(request: NextRequest) {
  if (process.env.ENABLE_PAYMENT_SIMULATION !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentExpiry = user.expired_at ? new Date(user.expired_at) : null;
    const stillActive =
      isPremiumEffective(user.subscription_status, user.expired_at) && currentExpiry !== null;
    const expiredAt = stillActive ? new Date(currentExpiry) : new Date();
    expiredAt.setDate(expiredAt.getDate() + PREMIUM_DURATION_DAYS);

    const { error } = await supabaseServer
      .from("users")
      .update({
        subscription_status: "premium",
        expired_at: expiredAt.toISOString(),
      })
      .eq("user_id", user.user_id);

    if (error) {
      console.error("Simulation error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const { error: transactionError } = await supabaseServer.from("payment_transactions").insert({
      user_id: user.user_id,
      amount: 79000,
      description: "Smartify Premium 30 hari",
      method: "QRIS",
      status: "paid",
    });
    if (transactionError) console.error("Record transaction error:", transactionError);

    return NextResponse.json({ success: true, message: "Payment successful" });
  } catch (error) {
    console.error("Payment simulation error:", error);
    return NextResponse.json(
      { error: "Failed to simulate payment" },
      { status: 500 }
    );
  }
}
