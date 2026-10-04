import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/quiz/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const owner = await requireQuizOwner(request, id);
    if (!owner.ok) return owner.response;

    const { data: soalRows, error: soalError } = await supabaseServer
      .from("soal")
      .select("soal_id, teks_soal, tipe_soal, poin, urutan, topik, concept_tags, penjelasan")
      .eq("kuis_id", owner.kuis.kuis_id)
      .order("urutan", { ascending: true });
    if (soalError) throw soalError;

    const soalIds = soalRows.map((s) => s.soal_id);
    const [pilihanRes, kunciRes] = await Promise.all([
      supabaseServer
        .from("pilihan_jawaban")
        .select("pilihan_id, soal_id, teks_pilihan, is_benar, urutan")
        .in("soal_id", soalIds)
        .order("urutan", { ascending: true }),
      supabaseServer
        .from("kunci_jawaban")
        .select("soal_id, jawaban_text, kata_kunci")
        .in("soal_id", soalIds),
    ]);
    if (pilihanRes.error) throw pilihanRes.error;
    if (kunciRes.error) throw kunciRes.error;

    const soal = soalRows.map((s) => {
      const kunci = kunciRes.data.find((k) => k.soal_id === s.soal_id);
      return {
        ...s,
        pilihan: pilihanRes.data
          .filter((p) => p.soal_id === s.soal_id)
          .map(({ pilihan_id, teks_pilihan, is_benar, urutan }) => ({
            pilihan_id,
            teks_pilihan,
            is_benar,
            urutan,
          })),
        kunci_jawaban: kunci
          ? { jawaban_text: kunci.jawaban_text, kata_kunci: kunci.kata_kunci }
          : null,
      };
    });

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
