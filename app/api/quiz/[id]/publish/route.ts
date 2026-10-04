import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import { loadQuestions } from "@/lib/quiz/questions";
import type { QuizSoal } from "@/lib/quiz/types";

function findProblem(soal: QuizSoal[]) {
  if (soal.length === 0) return "Kuis belum memiliki soal";

  for (const [index, s] of soal.entries()) {
    const no = index + 1;
    if (!s.teks_soal.trim()) return `Soal ${no} belum memiliki teks`;
    if (!s.kunci_jawaban?.jawaban_text.trim()) return `Soal ${no} belum memiliki kunci jawaban`;
    if (s.tipe_soal === "pilihan_ganda") {
      if (s.pilihan.length < 2) return `Soal ${no} belum memiliki pilihan jawaban yang cukup`;
      if (s.pilihan.filter((p) => p.is_benar).length !== 1) {
        return `Soal ${no} harus memiliki tepat 1 jawaban benar`;
      }
    }
  }
  return null;
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/quiz/[id]/publish">,
) {
  try {
    const { id } = await ctx.params;
    const owner = await requireQuizOwner(request, id);
    if (!owner.ok) return owner.response;

    if (owner.kuis.status !== "draft") {
      return NextResponse.json({ error: "Kuis sudah dipublish" }, { status: 409 });
    }

    const problem = findProblem(await loadQuestions(owner.kuis.kuis_id));
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("kuis")
      .update({ status: "published" })
      .eq("kuis_id", owner.kuis.kuis_id)
      .eq("status", "draft")
      .select("status");
    if (error) throw error;
    if (data.length === 0) {
      return NextResponse.json({ error: "Kuis sudah dipublish" }, { status: 409 });
    }

    return NextResponse.json({ success: true, status: "published" });
  } catch (error) {
    console.error("Publish quiz error:", error);
    return NextResponse.json({ error: "Gagal mempublish kuis" }, { status: 500 });
  }
}
