export interface QuizPilihan {
  pilihan_id: number;
  teks_pilihan: string;
  is_benar: boolean;
  urutan: number;
}

export interface QuizKunci {
  jawaban_text: string;
  kata_kunci: string[];
}

export interface QuizSoal {
  soal_id: number;
  teks_soal: string;
  tipe_soal: "pilihan_ganda" | "isian_singkat" | "uraian";
  poin: number;
  urutan: number;
  topik: string;
  concept_tags: string[];
  penjelasan: string | null;
  pilihan: QuizPilihan[];
  kunci_jawaban: QuizKunci | null;
}

export interface QuizDetail {
  kuis_id: number;
  judul: string;
  jenis_soal: string;
  tingkat_kesulitan: string;
  durasi_menit: number;
  kkm: number;
  total_soal: number;
  status: "draft" | "published" | "waiting" | "ongoing" | "selesai";
  kode_kuis: string;
  created_at: string;
}
