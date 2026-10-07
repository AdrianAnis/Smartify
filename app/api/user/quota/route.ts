import { NextRequest, NextResponse } from "next/server";
import { getClaimedUserId, getUserFromRequest } from "@/lib/auth/auth-service";
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
    const remaining = Math.max(0, limit - used);

    return NextResponse.json({
      used,
      limit,
      remaining,
      isPremium: premium,
      expiredAt: user.expired_at,
    });
  } catch (error) {
    console.error("Fetch quota error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
