import { NextRequest, NextResponse } from "next/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import { startSession } from "@/lib/classroom/session";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const owner = await requireQuizOwner(request, id);
    if (!owner.ok) return owner.response;

    if (owner.kuis.status !== "waiting") {
      return NextResponse.json(
        { error: "Ruang tunggu belum dibuka atau kuis sudah berjalan." },
        { status: 409 },
      );
    }

    const result = await startSession(owner.kuis.kuis_id);

    return NextResponse.json({ success: true, waktu_mulai_sesi: result.waktu_mulai_sesi });
  } catch (error) {
    console.error("Start session error:", error);
    return NextResponse.json(
      { error: "Gagal memulai sesi kuis" },
      { status: 500 },
    );
  }
}
