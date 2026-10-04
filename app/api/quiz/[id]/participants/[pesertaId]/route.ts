import { NextRequest, NextResponse } from "next/server";
import { requireQuizOwner, parseId } from "@/lib/quiz/quiz-owner";
import { kickParticipant } from "@/lib/classroom/participant";

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; pesertaId: string }> },
) {
  try {
    const { id, pesertaId } = await ctx.params;
    const owner = await requireQuizOwner(request, id);
    if (!owner.ok) return owner.response;

    const parsedPesertaId = parseId(pesertaId);
    if (!parsedPesertaId) {
      return NextResponse.json({ error: "ID peserta tidak valid" }, { status: 400 });
    }

    await kickParticipant(parsedPesertaId, owner.kuis.kuis_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kick participant error:", error);
    return NextResponse.json(
      { error: "Gagal mengeluarkan peserta" },
      { status: 500 },
    );
  }
}
