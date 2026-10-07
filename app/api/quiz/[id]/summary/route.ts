import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { parseId, requireQuizOwner } from "@/lib/quiz/quiz-owner";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/quiz/[id]/summary">,
) {
  try {
    const { id } = await ctx.params;
    const kuisId = parseId(id) ?? 0;

    const [owner, { data: pesertaList }, { data: hasilList }] = await Promise.all([
      requireQuizOwner(request, id),
      supabaseServer.from("peserta_kuis").select("peserta_id, status").eq("kuis_id", kuisId),
      supabaseServer.from("hasil_kuis").select("peserta_id, score, status_kelulusan").eq("kuis_id", kuisId),
    ]);
    if (!owner.ok) return owner.response;

    const hasilMap = new Map((hasilList ?? []).map((h) => [h.peserta_id, h]));
    const finished = (pesertaList ?? [])
      .filter((p) => p.status === "selesai")
      .map((p) => hasilMap.get(p.peserta_id));

    const scores = finished.map((h) => (h ? Number(h.score) : 0));
    const lulusCount = finished.filter((h) => h?.status_kelulusan === "lulus").length;
    const avgScore = scores.length > 0
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
      : 0;

    return NextResponse.json({
      stats: {
        totalStudents: pesertaList?.length ?? 0,
        finishedStudents: finished.length,
        avgScore,
        maxScore: scores.length > 0 ? Math.max(...scores) : 0,
        minScore: scores.length > 0 ? Math.min(...scores) : 0,
        lulusCount,
        remedialCount: finished.length - lulusCount,
      },
    });
  } catch (error) {
    console.error("Get quiz summary error:", error);
    return NextResponse.json({ error: "Gagal memuat ringkasan kuis" }, { status: 500 });
  }
}
