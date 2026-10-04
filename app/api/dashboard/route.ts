import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/auth-service";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: quizzes, error } = await supabaseServer
      .from("kuis")
      .select("kuis_id, judul, total_soal, status, created_at")
      .eq("guru_id", user.user_id)
      .order("created_at", { ascending: false });

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
