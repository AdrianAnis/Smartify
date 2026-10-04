import { randomInt } from "crypto";
import { supabaseServer } from "@/lib/supabase/server";
import type { Difficulty, GeneratedQuestion, QuizType } from "./generate-questions";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_CODE_ATTEMPTS = 5;
const POIN_PER_SOAL = 10;

export interface CreateQuizInput {
  guruId: number;
  title: string;
  type: QuizType;
  difficulty: Difficulty;
  durasiMenit: number;
  kkm: number;
  pilganCount: number;
  isianCount: number;
  file: { name: string; size: number };
  questions: GeneratedQuestion[];
}

function generateQuizCode() {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

async function insertKuis(input: CreateQuizInput) {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const { data, error } = await supabaseServer
      .from("kuis")
      .insert({
        guru_id: input.guruId,
        judul: input.title,
        jenis_soal: input.type,
        tingkat_kesulitan: input.difficulty,
        durasi_menit: input.durasiMenit,
        kkm: input.kkm,
        jumlah_pilgan: input.pilganCount,
        jumlah_uraian: input.isianCount,
        total_soal: input.questions.length,
        status: "draft",
        kode_kuis: generateQuizCode(),
      })
      .select("kuis_id")
      .single();

    if (!error) return data.kuis_id as number;
    if (error.code !== "23505") throw error;
  }
  throw new Error("Gagal membuat kode kuis unik");
}

export async function createQuizWithQuestions(input: CreateQuizInput) {
  const kuisId = await insertKuis(input);

  try {
    const { error: dokumenError } = await supabaseServer.from("dokumen").insert({
      kuis_id: kuisId,
      nama_file: input.file.name,
      ukuran_bytes: input.file.size,
      mime_type: "application/pdf",
    });
    if (dokumenError) throw dokumenError;

    const { data: soalRows, error: soalError } = await supabaseServer
      .from("soal")
      .insert(
        input.questions.map((q, index) => ({
          kuis_id: kuisId,
          teks_soal: q.teks_soal,
          tipe_soal: q.tipe_soal,
          poin: POIN_PER_SOAL,
          urutan: index + 1,
          topik: q.topik,
          concept_tags: q.concept_tags,
          penjelasan: q.penjelasan,
        })),
      )
      .select("soal_id, urutan");
    if (soalError) throw soalError;

    const soalIdByUrutan = new Map(soalRows.map((row) => [row.urutan, row.soal_id]));

    const pilihanRows = input.questions.flatMap((q, index) =>
      q.pilihan.map((p, optionIndex) => ({
        soal_id: soalIdByUrutan.get(index + 1),
        teks_pilihan: p.teks,
        is_benar: p.is_benar,
        urutan: optionIndex + 1,
      })),
    );
    if (pilihanRows.length > 0) {
      const { error: pilihanError } = await supabaseServer
        .from("pilihan_jawaban")
        .insert(pilihanRows);
      if (pilihanError) throw pilihanError;
    }

    const { error: kunciError } = await supabaseServer.from("kunci_jawaban").insert(
      input.questions.map((q, index) => ({
        soal_id: soalIdByUrutan.get(index + 1),
        jawaban_text: q.kunci_jawaban,
        kata_kunci: q.jawaban_alternatif,
      })),
    );
    if (kunciError) throw kunciError;

    return kuisId;
  } catch (error) {
    console.error("Save quiz failed, rolling back:", error);
    await supabaseServer.from("kuis").delete().eq("kuis_id", kuisId);
    throw new Error("Gagal menyimpan kuis ke database");
  }
}
