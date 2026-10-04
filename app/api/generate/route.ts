import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/auth-service";
import {
  checkRateLimit,
  rulesFor,
  tooManyRequests,
} from "@/lib/auth/rate-limit";
import {
  DIFFICULTIES,
  QUIZ_TYPES,
  GenerateQuestionsError,
  generateQuestions,
  type Difficulty,
  type QuizType,
} from "@/lib/quiz/generate-questions";
import { createQuizWithQuestions } from "@/lib/quiz/create-quiz";
import {
  FREE_MAX_GENERATES_PER_24H,
  FREE_TRIAL_MAX_QUESTIONS,
  PREMIUM_MAX_QUESTIONS,
  isPremiumEffective,
} from "@/lib/subscription/plan";
import { countGeneratesLast24Hours } from "@/lib/subscription/quota.server";

export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function subscriptionLimit(error: string) {
  return NextResponse.json({ error, code: "SUBSCRIPTION_LIMIT" }, { status: 403 });
}

function toInt(value: FormDataEntryValue | null) {
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const type = String(formData.get("type") ?? "") as QuizType;
    const difficulty = String(formData.get("difficulty") ?? "") as Difficulty;
    const durasiMenit = toInt(formData.get("duration"));
    const kkm = toInt(formData.get("kkm"));
    let pilganCount = toInt(formData.get("pilganCount"));
    let isianCount = toInt(formData.get("isianCount"));

    if (!(file instanceof File) || file.size === 0) {
      return badRequest("Materi PDF wajib diunggah");
    }
    if (!title || title.length > 150) {
      return badRequest("Judul kuis wajib diisi (maksimal 150 karakter)");
    }
    if (!QUIZ_TYPES.includes(type)) return badRequest("Jenis soal tidak valid");
    if (!DIFFICULTIES.includes(difficulty)) {
      return badRequest("Tingkat kesulitan tidak valid");
    }
    if (!(durasiMenit >= 1 && durasiMenit <= 180)) {
      return badRequest("Durasi harus 1 sampai 180 menit");
    }
    if (!(kkm >= 0 && kkm <= 100)) return badRequest("KKM harus 0 sampai 100");

    if (type === "pilihan_ganda") isianCount = 0;
    if (type === "isian_singkat") pilganCount = 0;
    if (!(pilganCount >= 0) || !(isianCount >= 0)) {
      return badRequest("Jumlah soal tidak valid");
    }

    const totalQuestions = pilganCount + isianCount;
    if (totalQuestions < 1) return badRequest("Jumlah soal minimal 1");
    if (type === "campuran" && (pilganCount < 1 || isianCount < 1)) {
      return badRequest("Soal campuran butuh minimal 1 pilihan ganda dan 1 isian singkat");
    }

    if (file.size > MAX_FILE_SIZE) {
      return badRequest("Ukuran file maksimal 10 MB");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return badRequest("File harus berupa PDF");
    }

    const limit = await checkRateLimit(rulesFor("generate", request, user.email));
    if (!limit.allowed) return tooManyRequests(limit.retryAfter);

    const premium = isPremiumEffective(user.subscription_status, user.expired_at);

    if (!premium) {
      if (type !== "pilihan_ganda") {
        return subscriptionLimit(
          "Free Trial hanya mendukung soal pilihan ganda. Upgrade ke Premium untuk isian singkat dan campuran.",
        );
      }
      if (totalQuestions > FREE_TRIAL_MAX_QUESTIONS) {
        return subscriptionLimit(
          `Free Trial dibatasi maksimal ${FREE_TRIAL_MAX_QUESTIONS} soal. Upgrade ke Premium untuk hingga ${PREMIUM_MAX_QUESTIONS} soal.`,
        );
      }
      const used = await countGeneratesLast24Hours(user.user_id);
      if (used >= FREE_MAX_GENERATES_PER_24H) {
        return subscriptionLimit(
          `Free Trial dibatasi ${FREE_MAX_GENERATES_PER_24H} kali generate dalam 24 jam. Upgrade ke Premium untuk generate tanpa batas.`,
        );
      }
    } else if (totalQuestions > PREMIUM_MAX_QUESTIONS) {
      return subscriptionLimit(
        `Paket Premium mendukung maksimal ${PREMIUM_MAX_QUESTIONS} soal per kuis.`,
      );
    }

    const questions = await generateQuestions({
      pdfBase64: buffer.toString("base64"),
      title,
      difficulty,
      pilganCount,
      isianCount,
    });

    const quizId = await createQuizWithQuestions({
      guruId: user.user_id,
      title,
      type,
      difficulty,
      durasiMenit,
      kkm,
      pilganCount,
      isianCount,
      file: { name: file.name, size: file.size },
      questions,
    });

    return NextResponse.json({ success: true, quizId });
  } catch (error) {
    if (error instanceof GenerateQuestionsError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("API generate error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
