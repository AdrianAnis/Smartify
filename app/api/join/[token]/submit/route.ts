import { NextRequest, NextResponse } from "next/server";
import { getActiveSesiByToken, PARTICIPANT_COOKIE } from "@/lib/classroom/session";
import { getParticipantByToken } from "@/lib/classroom/participant";
import { gradeAndSubmitQuiz } from "@/lib/classroom/quiz-play";
import { publishQuizRealtimeEvent } from "@/lib/classroom/realtime";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await ctx.params;
    const sesi = await getActiveSesiByToken(token);

    if (!sesi || !sesi.is_active) {
      return NextResponse.json({ error: "Sesi tidak aktif." }, { status: 404 });
    }

    const participantToken = request.cookies.get(PARTICIPANT_COOKIE)?.value;
    if (!participantToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const peserta = await getParticipantByToken(participantToken);
    if (!peserta || peserta.kuis_id !== sesi.kuis_id) {
      return NextResponse.json({ error: "Peserta tidak valid." }, { status: 403 });
    }

    const result = await gradeAndSubmitQuiz(peserta.peserta_id, sesi.kuis_id);
    await publishQuizRealtimeEvent(token, "results_changed");

    return NextResponse.json({
      success: true,
      score: result.score,
      statusKelulusan: result.statusKelulusan,
      kkm: result.kkm,
      totalSoal: result.totalSoal,
      benarCount: result.benarCount,
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return NextResponse.json({ error: "Gagal mengumpulkan kuis." }, { status: 500 });
  }
}
