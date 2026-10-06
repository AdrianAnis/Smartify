import { NextRequest, NextResponse } from "next/server";
import { getActiveSesiByToken, PARTICIPANT_COOKIE } from "@/lib/classroom/session";
import { getParticipantByToken } from "@/lib/classroom/participant";
import { getStudentQuestions, getStudentSavedAnswers } from "@/lib/classroom/quiz-play";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await ctx.params;
    const sesi = await getActiveSesiByToken(token);

    if (!sesi || !sesi.is_active) {
      return NextResponse.json(
        { error: "Sesi kuis tidak valid atau sudah tidak aktif." },
        { status: 404 },
      );
    }

    const participantToken = request.cookies.get(PARTICIPANT_COOKIE)?.value;
    if (!participantToken) {
      return NextResponse.json(
        { error: "Sesi peserta tidak ditemukan. Silakan masuk kembali." },
        { status: 401 },
      );
    }

    const peserta = await getParticipantByToken(participantToken);
    if (!peserta || peserta.kuis_id !== sesi.kuis_id) {
      return NextResponse.json(
        { error: "Peserta tidak valid untuk kuis ini." },
        { status: 403 },
      );
    }

    if (sesi.kuis?.status !== "ongoing") {
      return NextResponse.json({ error: "Kuis belum dimulai." }, { status: 403 });
    }

    const { data: kuis } = await supabaseServer
      .from("kuis")
      .select("kuis_id, judul, durasi_menit, kkm, status, waktu_mulai_sesi, total_soal")
      .eq("kuis_id", sesi.kuis_id)
      .maybeSingle();

    if (!kuis) {
      return NextResponse.json({ error: "Kuis tidak ditemukan." }, { status: 404 });
    }

    const questions = await getStudentQuestions(sesi.kuis_id);
    const savedAnswers = await getStudentSavedAnswers(peserta.peserta_id);

    return NextResponse.json({
      kuis: {
        kuisId: kuis.kuis_id,
        judul: kuis.judul,
        durasiMenit: kuis.durasi_menit,
        kkm: kuis.kkm,
        status: kuis.status,
        waktuMulaiSesi: kuis.waktu_mulai_sesi,
        totalSoal: kuis.total_soal,
      },
      peserta: {
        pesertaId: peserta.peserta_id,
        nama: peserta.nama,
        status: peserta.status,
        tabViolations: peserta.tab_violations,
      },
      questions,
      savedAnswers,
    });
  } catch (error) {
    console.error("Fetch questions error:", error);
    return NextResponse.json({ error: "Gagal memuat soal kuis." }, { status: 500 });
  }
}
