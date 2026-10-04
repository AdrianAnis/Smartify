import { NextRequest, NextResponse } from "next/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const auth = await requireQuizOwner(request, id);
    if (!auth.ok) return auth.response;

    const kuisId = Number(id);

    const { data: kuis } = await supabaseServer
      .from("kuis")
      .select("kuis_id, judul, status, durasi_menit, kkm, total_soal, waktu_mulai_sesi, kode_kuis")
      .eq("kuis_id", kuisId)
      .single();

    const { data: pesertaList } = await supabaseServer
      .from("peserta_kuis")
      .select("peserta_id, nama, status, tab_violations, joined_at, submitted_at")
      .eq("kuis_id", kuisId)
      .order("joined_at", { ascending: true });

    const { data: jawabanList } = await supabaseServer
      .from("jawaban_siswa")
      .select("peserta_id, soal_id")
      .eq("kuis_id", kuisId);

    const { data: hasilList } = await supabaseServer
      .from("hasil_kuis")
      .select("peserta_id, score, status_kelulusan, graded_at")
      .eq("kuis_id", kuisId);

    const answerCountMap = new Map<number, number>();
    jawabanList?.forEach((j) => {
      answerCountMap.set(j.peserta_id, (answerCountMap.get(j.peserta_id) ?? 0) + 1);
    });

    const hasilMap = new Map<number, { score: number; status_kelulusan: string; graded_at: string }>();
    hasilList?.forEach((h) => {
      hasilMap.set(h.peserta_id, {
        score: Number(h.score),
        status_kelulusan: h.status_kelulusan,
        graded_at: h.graded_at,
      });
    });

    const participants = (pesertaList ?? []).map((p) => {
      const hasil = hasilMap.get(p.peserta_id);
      return {
        pesertaId: p.peserta_id,
        nama: p.nama,
        status: p.status,
        tabViolations: p.tab_violations ?? 0,
        joinedAt: p.joined_at,
        submittedAt: p.submitted_at,
        answeredCount: answerCountMap.get(p.peserta_id) ?? 0,
        score: hasil ? hasil.score : null,
        statusKelulusan: hasil ? hasil.status_kelulusan : null,
      };
    });

    return NextResponse.json({
      kuis,
      participants,
    });
  } catch (error) {
    console.error("Monitor API error:", error);
    return NextResponse.json({ error: "Gagal memuat data live monitor." }, { status: 500 });
  }
}
