import { supabaseServer } from "@/lib/supabase/server";
import type { QuizSoal } from "./types";

export { EDITABLE_STATUSES } from "./editable";

interface SoalRow {
  soal_id: number;
  teks_soal: string;
  tipe_soal: QuizSoal["tipe_soal"];
  poin: number;
  urutan: number;
  topik: string;
  concept_tags: string[];
  penjelasan: string | null;
  pilihan_jawaban: QuizSoal["pilihan"] | null;
  kunci_jawaban: NonNullable<QuizSoal["kunci_jawaban"]> | NonNullable<QuizSoal["kunci_jawaban"]>[] | null;
}

export async function loadQuestions(kuisId: number, soalId?: number): Promise<QuizSoal[]> {
  let query = supabaseServer
    .from("soal")
    .select(
      "soal_id, teks_soal, tipe_soal, poin, urutan, topik, concept_tags, penjelasan, pilihan_jawaban(pilihan_id, teks_pilihan, is_benar, urutan), kunci_jawaban(jawaban_text, kata_kunci)",
    )
    .eq("kuis_id", kuisId)
    .order("urutan", { ascending: true })
    .order("urutan", { referencedTable: "pilihan_jawaban", ascending: true });
  if (soalId) query = query.eq("soal_id", soalId);

  const { data, error } = await query;
  if (error) throw error;

  return (data as unknown as SoalRow[]).map(({ pilihan_jawaban, kunci_jawaban, ...soal }) => {
    const kunci = Array.isArray(kunci_jawaban) ? kunci_jawaban[0] : kunci_jawaban;
    return {
      ...soal,
      pilihan: pilihan_jawaban ?? [],
      kunci_jawaban: kunci ? { jawaban_text: kunci.jawaban_text, kata_kunci: kunci.kata_kunci } : null,
    };
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
