import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/auth-service";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 30);

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

    return NextResponse.json({ success: true, message: "Payment successful" });
  } catch (error) {
    console.error("Payment simulation error:", error);
    return NextResponse.json(
      { error: "Failed to simulate payment" },
      { status: 500 }
    );
  }
}
