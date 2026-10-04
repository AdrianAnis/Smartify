import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/auth-service";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: updatedUser } = await supabaseServer
      .from("users")
      .select("subscription_status, expired_at")
      .eq("user_id", user.user_id)
      .single();

    return NextResponse.json({
      status: updatedUser?.subscription_status === "premium" ? "success" : "pending",
      subscription_status: updatedUser?.subscription_status,
      expired_at: updatedUser?.expired_at
    });
  } catch (error: any) {
    console.error("Confirm error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
