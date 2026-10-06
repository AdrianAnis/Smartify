import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/quiz/[id]/summary">,
) {
  try {
    const { id } = await ctx.params;
    const owner = await requireQuizOwner(request, id);
    if (!owner.ok) return owner.response;

    const kuisId = owner.kuis.kuis_id;

    const { data: pesertaList } = await supabaseServer
      .from("peserta_kuis")
      .select("peserta_id, nama, status, tab_violations, joined_at, submitted_at")
      .eq("kuis_id", kuisId);

    const { data: hasilList } = await supabaseServer
      .from("hasil_kuis")
      .select("peserta_id, score, status_kelulusan, score_per_question, grading_detail, graded_at")
      .eq("kuis_id", kuisId);

    const { data: soalList } = await supabaseServer
      .from("soal")
      .select("soal_id, urutan, teks_soal, tipe_soal, topik, poin")
      .eq("kuis_id", kuisId)
      .order("urutan", { ascending: true });

    const hasilMap = new Map<number, {
      score: number;
      status_kelulusan: string;
    }>();

    hasilList?.forEach((h) => {
      hasilMap.set(h.peserta_id, {
        score: Number(h.score),
        status_kelulusan: h.status_kelulusan,
      });
    });

    const students = (pesertaList ?? []).map((p) => {
      const h = hasilMap.get(p.peserta_id);
      return {
        pesertaId: p.peserta_id,
        nama: p.nama,
        status: p.status,
        score: h ? h.score : 0,
        statusKelulusan: h ? h.status_kelulusan : "remedial",
      };
    }).sort((a, b) => b.score - a.score);

    const scoredStudents = students.filter((s) => s.status === "selesai");
    const lulusCount = scoredStudents.filter((s) => s.statusKelulusan === "lulus").length;
    const remedialCount = scoredStudents.length - lulusCount;

    const scores = scoredStudents.map((s) => s.score);
    const avgScore = scores.length > 0
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
      : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;

    const questionStats = new Map<number, { attempts: number; correct: number }>();
    hasilList?.forEach((h) => {
      if (Array.isArray(h.score_per_question)) {
        h.score_per_question.forEach((sq: any) => {
          const sId = sq.soal_id;
          if (!questionStats.has(sId)) {
            questionStats.set(sId, { attempts: 0, correct: 0 });
          }
          const stat = questionStats.get(sId)!;
          stat.attempts++;
          if (sq.is_benar) stat.correct++;
        });
      }
    });

    const soalListWithDynamicDifficulty = (soalList || []).map((s) => {
      const stat = questionStats.get(s.soal_id);
      let accuracy = 1; // default if no one answered
      if (stat && stat.attempts > 0) {
        accuracy = stat.correct / stat.attempts;
      }
      
      let dynamicDiff = "medium";
      if (accuracy >= 0.7) dynamicDiff = "easy";
      else if (accuracy <= 0.4) dynamicDiff = "hard";

      return {
        ...s,
        tingkat_kesulitan: dynamicDiff,
      };
    });

    return NextResponse.json({
      stats: {
        totalStudents: students.length,
        finishedStudents: scoredStudents.length,
        avgScore,
        maxScore,
        minScore,
        lulusCount,
        remedialCount,
      },
      students: scoredStudents,
      soal: soalListWithDynamicDifficulty,
    });
  } catch (error) {
    console.error("Get quiz summary error:", error);
    return NextResponse.json({ error: "Gagal memuat ringkasan kuis" }, { status: 500 });
  }
}
