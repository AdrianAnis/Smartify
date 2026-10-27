import { NextRequest, NextResponse } from "next/server";
import { getClaimedUserId, getUserFromRequest } from "@/lib/auth/auth-service";
import { supabaseServer } from "@/lib/supabase/server";
import { countQuestionsLast24Hours } from "@/lib/subscription/quota.server";
import { FREE_DAILY_MAX_QUESTIONS, PREMIUM_DAILY_MAX_QUESTIONS, isPremiumEffective } from "@/lib/subscription/plan";

export async function GET(request: NextRequest) {
  try {
    const userId = await getClaimedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, used] = await Promise.all([
      getUserFromRequest(request),
      countQuestionsLast24Hours(userId),
    ]);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const premium = isPremiumEffective(user.subscription_status, user.expired_at);
    const limit = premium ? PREMIUM_DAILY_MAX_QUESTIONS : FREE_DAILY_MAX_QUESTIONS;

    const { data: transactions, error } = await supabaseServer
      .from("payment_transactions")
      .select("transaction_id, amount, description, method, status, created_at")
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) console.error("Fetch transactions error:", error);

    return NextResponse.json({
      isPremium: premium,
      expiredAt: user.expired_at ?? null,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      transactions: transactions ?? [],
    });
  } catch (error) {
    console.error("Fetch billing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
