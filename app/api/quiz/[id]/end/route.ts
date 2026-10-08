import { NextRequest, NextResponse } from "next/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import { endQuizSession } from "@/lib/classroom/end-quiz";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const auth = await requireQuizOwner(request, id);
    if (!auth.ok) return auth.response;

    if (auth.kuis.status !== "ongoing") {
      return NextResponse.json(
        { error: "Hanya kuis yang sedang berlangsung yang dapat diakhiri." },
        { status: 409 },
      );
    }

    const ended = await endQuizSession(auth.kuis.kuis_id);
    if (!ended) {
      return NextResponse.json({ error: "Kuis sudah berakhir." }, { status: 409 });
    }

    return NextResponse.json({ success: true, message: "Kuis berhasil diakhiri." });
  } catch (error) {
    console.error("End quiz error:", error);
    return NextResponse.json({ error: "Gagal mengakhiri kuis." }, { status: 500 });
  }
}
