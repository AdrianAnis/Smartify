import { NextRequest, NextResponse } from "next/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import { supabaseServer } from "@/lib/supabase/server";
import { gradeAndSubmitQuiz } from "@/lib/classroom/quiz-play";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const auth = await requireQuizOwner(request, id);
    if (!auth.ok) return auth.response;

    const kuisId = Number(id);

    const { error: updateKuisError } = await supabaseServer
      .from("kuis")
      .update({ status: "selesai" })
      .eq("kuis_id", kuisId);

    if (updateKuisError) {
      console.error("End quiz error:", updateKuisError);
      return NextResponse.json({ error: "Gagal mengakhiri kuis." }, { status: 500 });
    }

    await supabaseServer
      .from("sesi_kuis")
      .update({ is_active: false })
      .eq("kuis_id", kuisId);

    const { data: unsubmitted } = await supabaseServer
      .from("peserta_kuis")
      .select("peserta_id")
      .eq("kuis_id", kuisId)
      .neq("status", "selesai");

    if (unsubmitted && unsubmitted.length > 0) {
      await Promise.allSettled(
        unsubmitted.map((p) => gradeAndSubmitQuiz(p.peserta_id, kuisId)),
      );
    }

    return NextResponse.json({ success: true, message: "Kuis berhasil diakhiri." });
  } catch (error) {
    console.error("End quiz error:", error);
    return NextResponse.json({ error: "Gagal mengakhiri kuis." }, { status: 500 });
  }
}
