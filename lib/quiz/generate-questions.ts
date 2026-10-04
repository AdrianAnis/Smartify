import { GoogleGenAI } from "@google/genai";
import { DIFFICULTY_LABELS } from "./labels";

export const QUIZ_TYPES = ["pilihan_ganda", "isian_singkat", "campuran"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type QuizType = (typeof QUIZ_TYPES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type QuestionType = "pilihan_ganda" | "isian_singkat";

export interface GeneratedQuestion {
  teks_soal: string;
  tipe_soal: QuestionType;
  pilihan: { teks: string; is_benar: boolean }[];
  kunci_jawaban: string;
  jawaban_alternatif: string[];
  penjelasan: string;
  topik: string;
  concept_tags: string[];
}

export interface GenerateQuestionsInput {
  pdfBase64: string;
  title: string;
  difficulty: Difficulty;
  pilganCount: number;
  isianCount: number;
}

export class GenerateQuestionsError extends Error {}

const MAX_ATTEMPTS = 2;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    topik_materi: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 6,
    },
    soal: {
      type: "array",
      items: {
        type: "object",
        properties: {
          teks_soal: { type: "string" },
          tipe_soal: { type: "string", enum: ["pilihan_ganda", "isian_singkat"] },
          pilihan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                teks: { type: "string" },
                is_benar: { type: "boolean" },
              },
              required: ["teks", "is_benar"],
            },
          },
          kunci_jawaban: { type: "string" },
          jawaban_alternatif: { type: "array", items: { type: "string" } },
          penjelasan: { type: "string" },
          topik: { type: "string" },
          concept_tags: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 5,
          },
        },
        required: [
          "teks_soal",
          "tipe_soal",
          "pilihan",
          "kunci_jawaban",
          "jawaban_alternatif",
          "penjelasan",
          "topik",
          "concept_tags",
        ],
      },
    },
  },
  required: ["topik_materi", "soal"],
};

function buildPrompt(input: GenerateQuestionsInput, previousErrors: string[]) {
  const total = input.pilganCount + input.isianCount;
  const lines = [
    "Anda adalah guru ahli yang menyusun soal ujian dari dokumen materi terlampir.",
    "",
    `Judul kuis: ${input.title}`,
    `Tingkat kesulitan: ${DIFFICULTY_LABELS[input.difficulty]}`,
    `Buat TEPAT ${input.pilganCount} soal pilihan ganda dan ${input.isianCount} soal isian singkat (total ${total} soal).`,
    "",
    "Aturan topik:",
    '1. Tentukan 2 sampai 6 topik utama materi di "topik_materi". Nama topik singkat, maksimal 4 kata.',
    '2. Setiap soal wajib punya "topik" yang SAMA PERSIS dengan salah satu nama di "topik_materi".',
    '3. "concept_tags" berisi 1 sampai 5 konsep spesifik yang diuji soal tersebut, huruf kecil.',
    "4. Sebarkan soal ke beberapa topik sesuai porsi materi.",
    "",
    'Aturan soal pilihan ganda (tipe_soal "pilihan_ganda"):',
    "- Tepat 4 pilihan dan tepat 1 pilihan dengan is_benar true.",
    "- Teks pilihan tanpa awalan huruf seperti A. atau B.",
    '- "kunci_jawaban" berisi teks pilihan yang benar, "jawaban_alternatif" berisi [].',
    "",
    'Aturan soal isian singkat (tipe_soal "isian_singkat"):',
    '- "pilihan" berisi [].',
    '- "kunci_jawaban" berisi jawaban singkat 1 sampai 3 kata.',
    '- "jawaban_alternatif" berisi variasi penulisan lain yang juga benar, boleh kosong.',
    "",
    "Aturan umum:",
    '- "penjelasan" berisi 1 sampai 3 kalimat mengapa jawaban tersebut benar.',
    '- Kalimat soal langsung menguji konsep. DILARANG memakai pengantar seperti "Berdasarkan materi" atau "Menurut dokumen".',
    "- Semua soal harus berasal dari isi dokumen dan memakai Bahasa Indonesia baku.",
  ];

  if (previousErrors.length > 0) {
    lines.push(
      "",
      "Hasil sebelumnya tidak valid karena:",
      ...previousErrors.slice(0, 10).map((e) => `- ${e}`),
      "Perbaiki semua masalah tersebut.",
    );
  }

  return lines.join("\n");
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stripOptionPrefix(text: string) {
  return text.replace(/^[A-Da-d][.)]\s*/, "").trim();
}

function validate(raw: unknown, input: GenerateQuestionsInput) {
  const errors: string[] = [];
  const data = raw as { topik_materi?: unknown; soal?: unknown };

  const topics = Array.isArray(data?.topik_materi)
    ? data.topik_materi.map(asString).filter(Boolean)
    : [];
  if (topics.length === 0) errors.push("topik_materi kosong");

  const topicByLower = new Map(topics.map((t) => [t.toLowerCase(), t]));
  const pilgan: GeneratedQuestion[] = [];
  const isian: GeneratedQuestion[] = [];
  const items = Array.isArray(data?.soal) ? data.soal : [];

  items.forEach((item: Record<string, unknown>, index: number) => {
    const no = index + 1;
    const teks = asString(item?.teks_soal);
    const tipe = item?.tipe_soal;
    const penjelasan = asString(item?.penjelasan);
    const topik = topicByLower.get(asString(item?.topik).toLowerCase());

    if (!teks) return errors.push(`soal ${no}: teks_soal kosong`);
    if (!penjelasan) return errors.push(`soal ${no}: penjelasan kosong`);
    if (!topik) return errors.push(`soal ${no}: topik tidak ada di topik_materi`);

    const tags = Array.isArray(item?.concept_tags)
      ? [...new Set(item.concept_tags.map((t) => asString(t).toLowerCase()).filter(Boolean))].slice(0, 5)
      : [];
    const conceptTags = tags.length > 0 ? tags : [topik.toLowerCase()];

    if (tipe === "pilihan_ganda") {
      const options = Array.isArray(item?.pilihan)
        ? item.pilihan.map((p: Record<string, unknown>) => ({
            teks: stripOptionPrefix(asString(p?.teks)),
            is_benar: p?.is_benar === true,
          }))
        : [];
      const unique = new Set(options.map((o) => o.teks.toLowerCase()));
      const correct = options.filter((o) => o.is_benar);

      if (options.length !== 4) return errors.push(`soal ${no}: pilihan harus 4`);
      if (options.some((o) => !o.teks)) return errors.push(`soal ${no}: ada pilihan kosong`);
      if (unique.size !== 4) return errors.push(`soal ${no}: pilihan tidak boleh sama`);
      if (correct.length !== 1) return errors.push(`soal ${no}: harus tepat 1 jawaban benar`);

      pilgan.push({
        teks_soal: teks,
        tipe_soal: "pilihan_ganda",
        pilihan: options,
        kunci_jawaban: correct[0].teks,
        jawaban_alternatif: [],
        penjelasan,
        topik,
        concept_tags: conceptTags,
      });
    } else if (tipe === "isian_singkat") {
      const kunci = asString(item?.kunci_jawaban);
      if (!kunci) return errors.push(`soal ${no}: kunci_jawaban kosong`);
      if (kunci.split(/\s+/).length > 6) {
        return errors.push(`soal ${no}: kunci isian singkat terlalu panjang`);
      }

      const alternatif = Array.isArray(item?.jawaban_alternatif)
        ? [...new Set(item.jawaban_alternatif.map(asString).filter((a) => a && a.toLowerCase() !== kunci.toLowerCase()))]
        : [];

      isian.push({
        teks_soal: teks,
        tipe_soal: "isian_singkat",
        pilihan: [],
        kunci_jawaban: kunci,
        jawaban_alternatif: alternatif,
        penjelasan,
        topik,
        concept_tags: conceptTags,
      });
    } else {
      errors.push(`soal ${no}: tipe_soal tidak dikenal`);
    }
  });

  if (pilgan.length < input.pilganCount) {
    errors.push(`soal pilihan ganda valid hanya ${pilgan.length} dari ${input.pilganCount}`);
  }
  if (isian.length < input.isianCount) {
    errors.push(`soal isian singkat valid hanya ${isian.length} dari ${input.isianCount}`);
  }

  const ok = pilgan.length >= input.pilganCount && isian.length >= input.isianCount;
  return {
    ok,
    errors,
    questions: [...pilgan.slice(0, input.pilganCount), ...isian.slice(0, input.isianCount)],
  };
}

export async function generateQuestions(
  input: GenerateQuestionsInput,
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GenerateQuestionsError("Layanan AI belum dikonfigurasi");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  let previousErrors: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let text: string | undefined;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: buildPrompt(input, previousErrors) },
              { inlineData: { mimeType: "application/pdf", data: input.pdfBase64 } },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: RESPONSE_SCHEMA,
        },
      });
      text = response.text;
    } catch (error) {
      console.error(`Gemini request failed (attempt ${attempt}):`, error);
      throw new GenerateQuestionsError(
        "Layanan AI sedang bermasalah. Silakan coba beberapa saat lagi.",
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text ?? "");
    } catch {
      previousErrors = ["respons bukan JSON yang valid"];
      continue;
    }

    const result = validate(parsed, input);
    if (result.ok) return result.questions;

    console.warn(`Gemini output invalid (attempt ${attempt}):`, result.errors);
    previousErrors = result.errors;
  }

  throw new GenerateQuestionsError(
    "AI belum berhasil membuat soal yang valid dari materi ini. Silakan coba lagi atau gunakan materi lain.",
  );
}
