import { NextRequest, NextResponse } from "next/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import { loadQuestions } from "@/lib/quiz/questions";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/quiz/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const owner = await requireQuizOwner(request, id);
    if (!owner.ok) return owner.response;

    const soal = await loadQuestions(owner.kuis.kuis_id);

    return NextResponse.json({
      kuis: { ...owner.kuis, guru_id: undefined },
      soal,
      pembuat: owner.user.nama,
    });
  } catch (error) {
    console.error("Get quiz error:", error);
    return NextResponse.json({ error: "Gagal memuat kuis" }, { status: 500 });
  }
}
