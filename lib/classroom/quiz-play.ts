import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export interface StudentSoal {
  soal_id: number;
  teks_soal: string;
  tipe_soal: "pilihan_ganda" | "isian_singkat" | "uraian";
  poin: number;
  urutan: number;
  topik: string;
  pilihan: {
    pilihan_id: number;
    teks_pilihan: string;
    urutan: number;
  }[];
}

export async function getStudentQuestions(kuisId: number): Promise<StudentSoal[]> {
  const { data: soalList } = await supabaseServer
    .from("soal")
    .select(`
      soal_id,
      teks_soal,
      tipe_soal,
      poin,
      urutan,
      topik,
      pilihan_jawaban (
        pilihan_id,
        teks_pilihan,
        urutan
      )
    `)
    .eq("kuis_id", kuisId)
    .order("urutan", { ascending: true });

  if (!soalList) return [];

  return soalList.map((s) => ({
    soal_id: s.soal_id,
    teks_soal: s.teks_soal,
    tipe_soal: s.tipe_soal as StudentSoal["tipe_soal"],
    poin: s.poin,
    urutan: s.urutan,
    topik: s.topik,
    pilihan: Array.isArray(s.pilihan_jawaban)
      ? [...s.pilihan_jawaban].sort((a, b) => a.urutan - b.urutan)
      : [],
  }));
}

export async function getStudentSavedAnswers(pesertaId: number) {
  const { data } = await supabaseServer
    .from("jawaban_siswa")
    .select("soal_id, jawaban_text")
    .eq("peserta_id", pesertaId);

  return data ?? [];
}

const MAX_ANSWER_LENGTH = 500;

export async function saveSingleAnswer(
  pesertaId: number,
  soalId: number,
  kuisId: number,
  jawabanText: string,
) {
  const { data: soal } = await supabaseServer
    .from("soal")
    .select("soal_id")
    .eq("soal_id", soalId)
    .eq("kuis_id", kuisId)
    .maybeSingle();
  if (!soal) throw new Error("Soal tidak ditemukan di kuis ini");

  await supabaseServer
    .from("peserta_kuis")
    .update({ status: "mengerjakan" })
    .eq("peserta_id", pesertaId)
    .eq("status", "menunggu");

  const { data, error } = await supabaseServer
    .from("jawaban_siswa")
    .upsert(
      {
        peserta_id: pesertaId,
        soal_id: soalId,
        kuis_id: kuisId,
        jawaban_text: jawabanText.slice(0, MAX_ANSWER_LENGTH),
        saved_at: new Date().toISOString(),
      },
      { onConflict: "peserta_id,soal_id" },
    )
    .select("jawaban_id")
    .single();

  if (error) {
    console.error("Save answer error:", error);
    throw new Error(error.message ?? "Gagal menyimpan jawaban");
  }

  return data;
}

export async function recordTabViolation(pesertaId: number) {
  const { data: peserta } = await supabaseServer
    .from("peserta_kuis")
    .select("tab_violations")
    .eq("peserta_id", pesertaId)
    .maybeSingle();

  if (!peserta) return { violations: 0 };

  const newCount = (peserta.tab_violations ?? 0) + 1;

  await supabaseServer
    .from("peserta_kuis")
    .update({ tab_violations: newCount })
    .eq("peserta_id", pesertaId);

  return { violations: newCount };
}

export async function gradeAndSubmitQuiz(pesertaId: number, kuisId: number) {
  const { data: kuis } = await supabaseServer
    .from("kuis")
    .select("kkm, total_soal")
    .eq("kuis_id", kuisId)
    .maybeSingle();

  if (!kuis) throw new Error("Kuis tidak ditemukan");

  const { data: soalList } = await supabaseServer
    .from("soal")
    .select(`
      soal_id,
      tipe_soal,
      poin,
      pilihan_jawaban (
        pilihan_id,
        teks_pilihan,
        is_benar
      ),
      kunci_jawaban (
        jawaban_text,
        kata_kunci
      )
    `)
    .eq("kuis_id", kuisId);

  const { data: jawabanList } = await supabaseServer
    .from("jawaban_siswa")
    .select("soal_id, jawaban_text")
    .eq("peserta_id", pesertaId);

  const jawabanMap = new Map<number, string>();
  jawabanList?.forEach((j) => jawabanMap.set(j.soal_id, j.jawaban_text));

  let totalMaxScore = 0;
  let totalEarnedScore = 0;
  const scorePerQuestion: { soal_id: number; is_benar: boolean; score: number }[] = [];
  const gradingDetail: { soal_id: number; jawaban: string; is_benar: boolean }[] = [];

  for (const s of soalList ?? []) {
    const maxPoin = s.poin || 10;
    totalMaxScore += maxPoin;

    const studentAnswer = jawabanMap.get(s.soal_id)?.trim() ?? "";
    let isBenar = false;

    if (s.tipe_soal === "pilihan_ganda") {
      const correctOption = Array.isArray(s.pilihan_jawaban)
        ? s.pilihan_jawaban.find((p) => p.is_benar)
        : null;
      if (correctOption && studentAnswer === correctOption.teks_pilihan) {
        isBenar = true;
      }
    } else if (s.tipe_soal === "isian_singkat") {
      const kunci = Array.isArray(s.kunci_jawaban) ? s.kunci_jawaban[0] : s.kunci_jawaban;
      if (kunci) {
        const target = kunci.jawaban_text.trim().toLowerCase();
        const input = studentAnswer.toLowerCase();
        if (target && input === target) {
          isBenar = true;
        } else if (Array.isArray(kunci.kata_kunci) && kunci.kata_kunci.length > 0) {
          isBenar = kunci.kata_kunci.some((k: string) => k.trim().toLowerCase() === input);
        }
      }
    } else {
      isBenar = studentAnswer.length > 0;
    }

    const earned = isBenar ? maxPoin : 0;
    totalEarnedScore += earned;

    scorePerQuestion.push({
      soal_id: s.soal_id,
      is_benar: isBenar,
      score: earned,
    });

    gradingDetail.push({
      soal_id: s.soal_id,
      jawaban: studentAnswer,
      is_benar: isBenar,
    });
  }

  const finalScore = totalMaxScore > 0
    ? Number(((totalEarnedScore / totalMaxScore) * 100).toFixed(2))
    : 0;

  const statusKelulusan: "lulus" | "remedial" = finalScore >= (kuis.kkm ?? 70) ? "lulus" : "remedial";

  const submittedAt = new Date().toISOString();

  await supabaseServer
    .from("peserta_kuis")
    .update({ status: "selesai", submitted_at: submittedAt })
    .eq("peserta_id", pesertaId);

  const { data: hasil, error: hasilError } = await supabaseServer
    .from("hasil_kuis")
    .upsert(
      {
        peserta_id: pesertaId,
        kuis_id: kuisId,
        score: finalScore,
        status_kelulusan: statusKelulusan,
        score_per_question: scorePerQuestion,
        grading_detail: gradingDetail,
        graded_at: submittedAt,
      },
      { onConflict: "peserta_id" },
    )
    .select("hasil_id, score, status_kelulusan")
    .single();

  if (hasilError) {
    console.error("Hasil kuis error:", hasilError);
    throw new Error(hasilError.message ?? "Gagal menyimpan hasil kuis");
  }

  return {
    hasilId: hasil.hasil_id,
    score: finalScore,
    statusKelulusan,
    kkm: kuis.kkm,
    totalSoal: kuis.total_soal,
    benarCount: scorePerQuestion.filter((q) => q.is_benar).length,
  };
}
