import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getClaimedUserId, getUserFromRequest } from "@/lib/auth/auth-service";

export async function GET(request: NextRequest) {
  try {
    const userId = await getClaimedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, { data: quizzes, error }] = await Promise.all([
      getUserFromRequest(request),
      supabaseServer
        .from("kuis")
        .select("kuis_id, judul, total_soal, status, created_at")
        .eq("guru_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error("Fetch quizzes error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar kuis" },
      { status: 500 },
    );
  }
}
