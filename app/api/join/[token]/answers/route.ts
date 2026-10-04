import { NextRequest, NextResponse } from "next/server";
import { getActiveSesiByToken, PARTICIPANT_COOKIE } from "@/lib/classroom/session";
import { getParticipantByToken } from "@/lib/classroom/participant";
import { saveSingleAnswer } from "@/lib/classroom/quiz-play";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await ctx.params;
    const sesi = await getActiveSesiByToken(token);

    if (!sesi || !sesi.is_active) {
      return NextResponse.json(
        { error: "Sesi tidak aktif." },
        { status: 404 },
      );
    }

    const participantToken = request.cookies.get(PARTICIPANT_COOKIE)?.value;
    if (!participantToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const peserta = await getParticipantByToken(participantToken);
    if (!peserta || peserta.kuis_id !== sesi.kuis_id) {
      return NextResponse.json(
        { error: "Peserta tidak valid." },
        { status: 403 },
      );
    }

    if (peserta.status === "selesai") {
      return NextResponse.json(
        { error: "Kuis sudah Anda kumpulkan." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const soalId = Number(body.soalId);
    const jawabanText = String(body.jawabanText ?? "");

    if (!soalId) {
      return NextResponse.json(
        { error: "ID Soal tidak valid." },
        { status: 400 },
      );
    }

    await saveSingleAnswer(
      peserta.peserta_id,
      soalId,
      sesi.kuis_id,
      jawabanText,
    );

    return NextResponse.json({ success: true, soalId, jawabanText });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json({ error: "Gagal menyimpan jawaban." }, { status: 500 });
  }
}
