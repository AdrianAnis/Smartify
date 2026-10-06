import { NextRequest, NextResponse } from "next/server";
import { getSesiByToken, PARTICIPANT_COOKIE } from "@/lib/classroom/session";
import { getParticipantByToken } from "@/lib/classroom/participant";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await ctx.params;
    const sesi = await getSesiByToken(token);

    if (!sesi) {
      return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
    }

    const participantToken = request.cookies.get(PARTICIPANT_COOKIE)?.value;
    if (!participantToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const peserta = await getParticipantByToken(participantToken);
    if (!peserta || peserta.kuis_id !== sesi.kuis_id) {
      return NextResponse.json({ error: "Peserta tidak valid." }, { status: 403 });
    }

    if (request.nextUrl.searchParams.get("ready") === "1") {
      const { data: resultStatus, error: resultStatusError } = await supabaseServer
        .from("hasil_kuis")
        .select("hasil_id")
        .eq("peserta_id", peserta.peserta_id)
        .maybeSingle();

      if (resultStatusError) {
        console.error("Check student result readiness error:", resultStatusError);
        return NextResponse.json({ error: "Gagal memeriksa hasil kuis." }, { status: 500 });
      }

      return NextResponse.json({ ready: Boolean(resultStatus) });
    }

    const { data: hasil } = await supabaseServer
      .from("hasil_kuis")
      .select("hasil_id, score, status_kelulusan, score_per_question, grading_detail, graded_at")
      .eq("peserta_id", peserta.peserta_id)
      .maybeSingle();

    if (!hasil) {
      return NextResponse.json({ error: "Hasil kuis belum tersedia." }, { status: 404 });
    }

    const { data: kuis } = await supabaseServer
      .from("kuis")
      .select("judul, kkm, total_soal, status")
      .eq("kuis_id", sesi.kuis_id)
      .single();

    const { data: allHasil } = await supabaseServer
      .from("hasil_kuis")
      .select("peserta_id, score, status_kelulusan, peserta_kuis(nama)")
      .eq("kuis_id", sesi.kuis_id)
      .order("score", { ascending: false });

    const leaderboard = (allHasil ?? []).map((h, idx) => {
      const pName = Array.isArray(h.peserta_kuis)
        ? (h.peserta_kuis[0] as { nama: string })?.nama
        : (h.peserta_kuis as { nama: string } | null)?.nama;

      return {
        rank: idx + 1,
        pesertaId: h.peserta_id,
        nama: pName ?? "Peserta",
        score: Number(h.score),
        statusKelulusan: h.status_kelulusan,
        isCurrentStudent: h.peserta_id === peserta.peserta_id,
      };
    });

    const reviewAvailable = kuis?.status === "selesai";
    const correctCount = Array.isArray(hasil.score_per_question)
      ? hasil.score_per_question.filter((q: { is_benar: boolean }) => q.is_benar).length
      : 0;

    const myRank = leaderboard.find((l) => l.isCurrentStudent)?.rank ?? 1;

    const { data: soalList } = await supabaseServer
      .from("soal")
      .select(`
        soal_id,
        urutan,
        teks_soal,
        tipe_soal,
        topik,
        penjelasan,
        pilihan_jawaban (
          pilihan_id,
          teks_pilihan,
          is_benar
        ),
        kunci_jawaban (
          jawaban_text
        )
      `)
      .eq("kuis_id", sesi.kuis_id)
      .order("urutan", { ascending: true });

    const gradingMap = new Map<number, { jawaban: string; is_benar: boolean }>();
    if (Array.isArray(hasil.grading_detail)) {
      hasil.grading_detail.forEach((g: { soal_id: number; jawaban: string; is_benar: boolean }) => {
        gradingMap.set(g.soal_id, g);
      });
    }

    const reviewQuestions = (soalList ?? []).map((s) => {
      const g = gradingMap.get(s.soal_id);
      let correctAnswer = "";

      if (s.tipe_soal === "pilihan_ganda") {
        const correct = Array.isArray(s.pilihan_jawaban)
          ? s.pilihan_jawaban.find((p) => p.is_benar)
          : null;
        correctAnswer = correct ? correct.teks_pilihan : "";
      } else {
        const kunci = Array.isArray(s.kunci_jawaban) ? s.kunci_jawaban[0] : s.kunci_jawaban;
        correctAnswer = kunci ? kunci.jawaban_text : "";
      }

      return {
        soalId: s.soal_id,
        urutan: s.urutan,
        teksSoal: s.teks_soal,
        tipeSoal: s.tipe_soal,
        topik: s.topik,
        penjelasan: s.penjelasan ?? "",
        studentAnswer: g?.jawaban ?? "",
        isBenar: g?.is_benar ?? false,
        correctAnswer,
      };
    });

    return NextResponse.json({
      nama: peserta.nama,
      judul: kuis?.judul ?? "",
      kkm: kuis?.kkm ?? 70,
      totalSoal: kuis?.total_soal ?? 0,
      score: Number(hasil.score),
      statusKelulusan: hasil.status_kelulusan,
      tabViolations: peserta.tab_violations ?? 0,
      gradedAt: hasil.graded_at,
      rank: myRank,
      totalParticipants: leaderboard.length,
      leaderboard,
      correctCount,
      reviewAvailable,
      reviewQuestions: reviewAvailable ? reviewQuestions : [],
    });
  } catch (error) {
    console.error("Fetch student result error:", error);
    return NextResponse.json({ error: "Gagal memuat hasil kuis." }, { status: 500 });
  }
}
