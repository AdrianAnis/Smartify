import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/auth-service";

type User = NonNullable<Awaited<ReturnType<typeof getUserFromRequest>>>;

export interface Kuis {
  kuis_id: number;
  guru_id: number;
  judul: string;
  jenis_soal: string;
  tingkat_kesulitan: string;
  durasi_menit: number;
  kkm: number;
  total_soal: number;
  status: "draft" | "published" | "waiting" | "ongoing" | "selesai";
  kode_kuis: string;
  created_at: string;
  ai_insight?: unknown;
}

type OwnerResult =
  | { ok: true; user: User; kuis: Kuis }
  | { ok: false; response: NextResponse };

export function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function requireQuizOwner(
  request: NextRequest,
  rawQuizId: string,
): Promise<OwnerResult> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const quizId = parseId(rawQuizId);
  const notFound = {
    ok: false as const,
    response: NextResponse.json({ error: "Kuis tidak ditemukan" }, { status: 404 }),
  };
  if (!quizId) return notFound;

  const { data: kuis } = await supabaseServer
    .from("kuis")
    .select(
      "kuis_id, guru_id, judul, jenis_soal, tingkat_kesulitan, durasi_menit, kkm, total_soal, status, kode_kuis, created_at, ai_insight",
    )
    .eq("kuis_id", quizId)
    .maybeSingle();

  if (!kuis || (kuis.guru_id !== user.user_id && user.role !== "admin")) {
    return notFound;
  }

  return { ok: true, user, kuis: kuis as Kuis };
}
