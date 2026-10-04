import { NextRequest, NextResponse } from "next/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import { listParticipants } from "@/lib/classroom/participant";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const owner = await requireQuizOwner(request, id);
    if (!owner.ok) return owner.response;

    const peserta = await listParticipants(owner.kuis.kuis_id);

    return NextResponse.json({ peserta });
  } catch (error) {
    console.error("List participants error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar peserta" },
      { status: 500 },
    );
  }
}
