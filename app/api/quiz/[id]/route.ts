import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { parseId, requireQuizOwner } from "@/lib/quiz/quiz-owner";
import { loadQuestions } from "@/lib/quiz/questions";

const UNDELETABLE_STATUSES = ["waiting", "ongoing"];

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/quiz/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const quizId = parseId(id);
    const [owner, soal] = await Promise.all([
      requireQuizOwner(request, id),
      quizId ? loadQuestions(quizId) : Promise.resolve([]),
    ]);
    if (!owner.ok) return owner.response;

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

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/quiz/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const owner = await requireQuizOwner(request, id);
    if (!owner.ok) return owner.response;

    if (UNDELETABLE_STATUSES.includes(owner.kuis.status)) {
      return NextResponse.json(
        { error: "Kuis yang sedang dibuka untuk siswa tidak bisa dihapus." },
        { status: 409 },
      );
    }

    const { error } = await supabaseServer
      .from("kuis")
      .delete()
      .eq("kuis_id", owner.kuis.kuis_id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json({ error: "Gagal menghapus kuis" }, { status: 500 });
  }
}
