import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/auth-service";
import { supabaseServer } from "@/lib/supabase/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
});

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { kuisId } = body;
    if (!kuisId) return NextResponse.json({ error: "kuisId is required" }, { status: 400 });

    const { data: kuis } = await supabaseServer
      .from("kuis")
      .select("guru_id, judul, kkm")
      .eq("kuis_id", kuisId)
      .single();

    if (!kuis || (kuis.guru_id !== user.user_id && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch Soal
    const { data: soalList } = await supabaseServer
      .from("soal")
      .select("soal_id, urutan, teks_soal, topik")
      .eq("kuis_id", kuisId);

    // Fetch Participants and Results
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
    
    let totalScore = 0;
    const topicStats: Record<string, { attempts: number; correct: number }> = {};
    const questionStats: Record<number, { attempts: number; correct: number }> = {};

    hasilList.forEach((hasil) => {
      totalScore += hasil.score;
      if (Array.isArray(hasil.score_per_question)) {
        hasil.score_per_question.forEach((sq: any) => {
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

    const averageScore = totalScore / hasilList.length;

    const topicAnalysis = Object.entries(topicStats).map(([topik, stat]) => ({
      topik,
      accuracy: Math.round((stat.correct / stat.attempts) * 100)
    }));

    const questionAnalysis = Object.entries(questionStats).map(([sId, stat]) => {
      const soal = soalMap.get(Number(sId));
      return {
        urutan: soal?.urutan,
        teks_soal: soal?.teks_soal,
        topik: soal?.topik,
        accuracy: Math.round((stat.correct / stat.attempts) * 100)
      };
    });

    const aiContext = `
Analisis kelas untuk Kuis: ${kuis.judul}
KKM: ${kuis.kkm}
Jumlah Siswa Selesai: ${pesertaList.length}
Rata-rata Skor: ${averageScore.toFixed(1)}

Data Topik:
${topicAnalysis.map(t => `- ${t.topik}: ${t.accuracy}% benar`).join("\n")}

Data Soal:
${questionAnalysis.map(q => `- Soal ${q.urutan} (${q.topik}): ${q.accuracy}% benar - "${q.teks_soal}"`).join("\n")}

Tugas Anda:
Buatkan "Teaching Recommendation" (Rekomendasi Strategi Mengajar) untuk Guru berdasarkan data di atas.
Anda harus mengidentifikasi topik mana yang lemah, memberikan bukti numerik spesifik dari soal/topik, dan memberikan rekomendasi strategi konkret.

Gunakan format list rekomendasi, dimana setiap item memiliki:
- problem: Masalah utama yang ditemukan
- evidence: Bukti numerik dari data soal/topik
- recommendation: Strategi pembelajaran yang disarankan

Output dalam JSON sesuai schema.
`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        recommendations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              problem: { type: Type.STRING },
              evidence: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ["problem", "evidence", "recommendation"]
          }
        },
        summary: {
          type: Type.STRING,
          description: "Ringkasan singkat tentang performa kelas"
        }
      },
      required: ["recommendations", "summary"]
    };

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: aiContext,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const aiText = response.text;
    if (!aiText) throw new Error("Gemini returned empty response");

    const analysis = JSON.parse(aiText);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Classroom Analysis error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
