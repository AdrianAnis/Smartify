import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/auth-service";
import { supabaseServer } from "@/lib/supabase/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import type { QuestionScore } from "@/lib/classroom/quiz-play";
import type { ClassroomInsight } from "@/lib/quiz/types";

const MIN_ERROR_RATE = 30;
const NO_ISSUE_SUMMARY =
  "Seluruh materi dalam kuis ini sudah dikuasai dengan baik oleh siswa, sehingga tidak ada topik yang perlu mendapat perhatian khusus.";

interface GeminiError {
  status?: number;
  message?: string;
}

function asGeminiError(error: unknown): GeminiError {
  return typeof error === "object" && error !== null ? (error as GeminiError) : {};
}

function sanitizeAnalysis(raw: unknown): ClassroomInsight {
  const insight = (raw ?? {}) as Partial<ClassroomInsight>;
  const allTopics = Array.isArray(insight.topics) ? insight.topics : [];
  const topics = allTopics.filter((t) => Number(t?.error_percentage) > MIN_ERROR_RATE);
  if (topics.length === 0) return { summary: NO_ISSUE_SUMMARY, topics: [] };
  if (topics.length !== allTopics.length) {
    return {
      summary: `Berdasarkan hasil pengerjaan siswa, terdapat ${topics.length} materi yang menunjukkan tingkat kesalahan paling tinggi.`,
      topics,
    };
  }
  return { summary: insight.summary ?? "", topics };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.API_GEMINI_QUIZ;
    if (!apiKey) {
      return NextResponse.json({ error: "API_GEMINI_QUIZ environment variable is missing" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const body = await req.json();
    const { kuisId } = body;
    if (!kuisId) return NextResponse.json({ error: "kuisId is required" }, { status: 400 });

    const owner = await requireQuizOwner(req, kuisId.toString());
    if (!owner.ok) return owner.response;
    const { kuis } = owner;

    if (kuis.status !== "selesai") {
      return NextResponse.json({ 
        success: true, 
        pending: true,
        message: "Kuis masih dalam pengerjaan, analisis belum dapat dilakukan." 
      });
    }

    if (kuis.ai_insight) {
      return NextResponse.json({
        success: true,
        analysis: sanitizeAnalysis(kuis.ai_insight),
        cached: true
      });
    }

    const { data: soalList } = await supabaseServer
      .from("soal")
      .select("soal_id, urutan, teks_soal, topik")
      .eq("kuis_id", kuisId);

    const { data: pesertaList } = await supabaseServer
      .from("peserta_kuis")
      .select("peserta_id, nama, status")
      .eq("kuis_id", kuisId)
      .eq("status", "selesai");

    const { data: hasilList } = await supabaseServer
      .from("hasil_kuis")
      .select("peserta_id, score, status_kelulusan, score_per_question")
      .eq("kuis_id", kuisId);

    if (!soalList || !pesertaList || !hasilList || pesertaList.length === 0) {
      return NextResponse.json({ error: "Tidak cukup data siswa yang selesai mengerjakan untuk dianalisis" }, { status: 400 });
    }

    const soalMap = new Map(soalList.map((s) => [s.soal_id, s]));
    
    const topicStats: Record<string, { attempts: number; correct: number }> = {};
    const questionStats: Record<number, { attempts: number; correct: number }> = {};

    hasilList.forEach((hasil) => {
      if (Array.isArray(hasil.score_per_question)) {
        hasil.score_per_question.forEach((sq: QuestionScore) => {
          const sId = sq.soal_id;
          const soal = soalMap.get(sId);
          if (!soal) return;

          if (!topicStats[soal.topik]) topicStats[soal.topik] = { attempts: 0, correct: 0 };
          if (!questionStats[sId]) questionStats[sId] = { attempts: 0, correct: 0 };

          topicStats[soal.topik].attempts++;
          questionStats[sId].attempts++;

          if (sq.is_benar) {
            topicStats[soal.topik].correct++;
            questionStats[sId].correct++;
          }
        });
      }
    });

    const topicAnalysis = Object.entries(topicStats)
      .map(([topik, stat]) => ({
        topik,
        accuracy: Math.round((stat.correct / stat.attempts) * 100),
        errorRate: 100 - Math.round((stat.correct / stat.attempts) * 100),
      }))
      .filter((t) => t.errorRate > MIN_ERROR_RATE)
      .sort((a, b) => b.errorRate - a.errorRate);

    const hardTopics = new Set(topicAnalysis.map((t) => t.topik));

    const questionAnalysis = Object.entries(questionStats)
      .map(([sId, stat]) => {
        const soal = soalMap.get(Number(sId));
        return {
          urutan: soal?.urutan,
          teks_soal: soal?.teks_soal,
          topik: soal?.topik,
          accuracy: Math.round((stat.correct / stat.attempts) * 100),
        };
      })
      .filter((q) => q.topik && hardTopics.has(q.topik) && 100 - q.accuracy > MIN_ERROR_RATE);

    if (topicAnalysis.length === 0) {
      const emptyAnalysis = { summary: NO_ISSUE_SUMMARY, topics: [] };
      await supabaseServer.from("kuis").update({ ai_insight: emptyAnalysis }).eq("kuis_id", kuisId);
      return NextResponse.json({ success: true, analysis: emptyAnalysis, cached: false });
    }

    const aiContext = `
Analisis kelas untuk Kuis: ${kuis.judul}
Jumlah Siswa Selesai: ${pesertaList.length}

Data Topik:
${topicAnalysis.map(t => `- ${t.topik}: ${t.errorRate}% siswa menjawab salah`).join("\n")}

Data Kesalahan pada Soal:
${questionAnalysis.map(q => `- Soal ${q.urutan} (${q.topik}): ${100 - q.accuracy}% siswa menjawab salah - "${q.teks_soal}"`).join("\n")}

Tugas Anda:
Buatkan "Insight AI" yang mendetail, sangat praktis, dan langsung dapat dieksekusi oleh Guru. 
Untuk bagian "why_difficult" dan "strategy", tulislah penjelasan yang lumayan panjang dan terstruktur (sekitar 2-3 kalimat per poin), bukan hanya beberapa kata singkat. Jelaskan secara spesifik letak kebingungan siswa dari konteks soalnya.
Namun tetap pertahankan gaya bahasa yang ringkas, profesional, dan tidak berbunga-bunga (jangan AI Slop).
Hanya bahas topik yang tercantum pada "Data Topik" di atas. Jangan menambahkan topik lain, dan jangan membahas materi yang sudah dikuasai siswa.
`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: "Satu kalimat ringkasan (contoh: 'Berdasarkan hasil pengerjaan 32 siswa, terdapat 2 materi yang menunjukkan tingkat kesalahan paling tinggi.')"
        },
        topics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              materi: { type: Type.STRING, description: "Nama topik/materi" },
              error_percentage: { type: Type.INTEGER, description: "Persentase siswa yang menjawab salah (angka saja)" },
              problematic_questions: { type: Type.STRING, description: "Soal nomor berapa saja yang paling banyak salah (contoh: 'Kesalahan paling banyak terjadi pada soal nomor 3 dan 7.')" },
              why_difficult: { type: Type.STRING, description: "Analisis konkret dan detail (2-3 kalimat) mengapa siswa kesulitan materi ini" },
              strategy: { type: Type.STRING, description: "Strategi praktis dan detail (2-3 kalimat) cara memperbaikinya di kelas" },
            },
            required: ["materi", "error_percentage", "problematic_questions", "why_difficult", "strategy"]
          }
        }
      },
      required: ["summary", "topics"]
    };

    const modelCandidates = Array.from(
      new Set(
        [
          process.env.GEMINI_MODEL,
          "gemini-3.8-flash",
          "gemini-3.7-flash",
          "gemini-3.6-flash",
          "gemini-3.5-flash",
          "gemini-flash-latest",
          "gemini-2.5-flash",
        ].filter(Boolean) as string[],
      ),
    );

    const isRetryable = (e: unknown) => {
      const { status, message } = asGeminiError(e);
      const msg = String(message || "");
      return (
        [429, 500, 502, 503, 504].includes(Number(status)) ||
        /\b(429|500|502|503|504)\b|high demand|UNAVAILABLE|overloaded|RESOURCE_EXHAUSTED/i.test(msg)
      );
    };
    const isModelMissing = (e: unknown) => {
      const { status, message } = asGeminiError(e);
      return Number(status) === 404 || /NOT_FOUND|no longer available|is not found/i.test(String(message || ""));
    };

    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | undefined;
    let lastError: unknown;

    outer: for (const model of modelCandidates) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: aiContext,
            config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema,
            },
          });
          break outer;
        } catch (e) {
          lastError = e;
          if (isModelMissing(e)) break;
          if (!isRetryable(e)) throw e;
          console.warn(`Gemini ${model} gagal (percobaan ${attempt}/3): ${asGeminiError(e).message}`);
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }
    }

    if (!response) {
      throw lastError || new Error("Semua model Gemini sedang tidak tersedia");
    }

    const aiText = response.text;
    if (!aiText) throw new Error("Gemini returned empty response");

    const analysis = sanitizeAnalysis(JSON.parse(aiText));

    await supabaseServer
      .from("kuis")
      .update({ ai_insight: analysis })
      .eq("kuis_id", kuisId);

    return NextResponse.json({
      success: true,
      analysis,
      cached: false
    });
  } catch (error) {
    console.error("Classroom Analysis error:", error);
    const { status, message } = asGeminiError(error);
    return NextResponse.json(
      { error: message || "Gagal membuat AI insight" },
      { status: status || 500 },
    );
  }
}
