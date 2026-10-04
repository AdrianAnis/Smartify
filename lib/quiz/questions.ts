import { supabaseServer } from "@/lib/supabase/server";
import type { QuizSoal } from "./types";

export { EDITABLE_STATUSES } from "./editable";

export async function loadQuestions(kuisId: number, soalId?: number): Promise<QuizSoal[]> {
  let query = supabaseServer
    .from("soal")
    .select("soal_id, teks_soal, tipe_soal, poin, urutan, topik, concept_tags, penjelasan")
    .eq("kuis_id", kuisId)
    .order("urutan", { ascending: true });
  if (soalId) query = query.eq("soal_id", soalId);

  const { data: soalRows, error } = await query;
  if (error) throw error;
  if (soalRows.length === 0) return [];

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

  return soalRows.map((s) => {
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
    } as QuizSoal;
  });
}

export async function syncQuizAfterDelete(kuisId: number) {
  const { data: rows, error } = await supabaseServer
    .from("soal")
    .select("soal_id, tipe_soal, urutan")
    .eq("kuis_id", kuisId)
    .order("urutan", { ascending: true });
  if (error) throw error;

  await Promise.all(
    rows
      .map((row, index) => ({ ...row, next: index + 1 }))
      .filter((row) => row.urutan !== row.next)
      .map((row) =>
        supabaseServer.from("soal").update({ urutan: row.next }).eq("soal_id", row.soal_id),
      ),
  );

  const pilgan = rows.filter((r) => r.tipe_soal === "pilihan_ganda").length;
  await supabaseServer
    .from("kuis")
    .update({
      total_soal: rows.length,
      jumlah_pilgan: pilgan,
      jumlah_uraian: rows.length - pilgan,
    })
    .eq("kuis_id", kuisId);

  return rows.length;
}
