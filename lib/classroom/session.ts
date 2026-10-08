import "server-only";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabase/server";

export const PARTICIPANT_COOKIE = "participant_token";

export const ANSWER_GRACE_MS = 15_000;

export async function openWaitingRoom(kuisId: number) {
  await supabaseServer
    .from("sesi_kuis")
    .update({ is_active: false })
    .eq("kuis_id", kuisId)
    .eq("is_active", true);

  const qrToken = randomUUID();

  const { data: sesi, error: sesiError } = await supabaseServer
    .from("sesi_kuis")
    .insert({ kuis_id: kuisId, qr_token: qrToken, is_active: true })
    .select("sesi_id, qr_token")
    .single();

  if (sesiError || !sesi) {
    console.error("Supabase Error Detail:", JSON.stringify(sesiError, null, 2));
    throw new Error(sesiError?.message ?? "Gagal membuat sesi kuis");
  }

  const { error: kuisError } = await supabaseServer
    .from("kuis")
    .update({ status: "waiting" })
    .eq("kuis_id", kuisId)
    .eq("status", "published");

  if (kuisError) {
    console.error(kuisError);
    throw new Error(kuisError?.message ?? "Gagal mengubah status kuis");
  }

  return { sesiId: sesi.sesi_id, qrToken: sesi.qr_token };
}

export interface SesiWithKuis {
  sesi_id: number;
  kuis_id: number;
  is_active: boolean;
  kuis: {
    judul: string;
    total_soal: number;
    durasi_menit: number;
    status: string;
    waktu_mulai_sesi: string | null;
  } | null;
}

export function isQuizOpenForAnswers(kuis: SesiWithKuis["kuis"]) {
  if (!kuis || kuis.status !== "ongoing" || !kuis.waktu_mulai_sesi) return false;
  const deadline =
    new Date(kuis.waktu_mulai_sesi).getTime() + kuis.durasi_menit * 60_000 + ANSWER_GRACE_MS;
  return Date.now() <= deadline;
}

export async function getActiveSesiByToken(qrToken: string): Promise<SesiWithKuis | null> {
  const { data } = await supabaseServer
    .from("sesi_kuis")
    .select("sesi_id, kuis_id, is_active, kuis(judul, total_soal, durasi_menit, status, waktu_mulai_sesi)")
    .eq("qr_token", qrToken)
    .eq("is_active", true)
    .maybeSingle();

  return data as SesiWithKuis | null;
}

export async function getSesiByToken(qrToken: string): Promise<SesiWithKuis | null> {
  const { data } = await supabaseServer
    .from("sesi_kuis")
    .select("sesi_id, kuis_id, is_active, kuis(judul, total_soal, durasi_menit, status, waktu_mulai_sesi)")
    .eq("qr_token", qrToken)
    .maybeSingle();

  return data as SesiWithKuis | null;
}

export async function startSession(kuisId: number) {
  const waktuMulai = new Date().toISOString();

  const { error } = await supabaseServer
    .from("kuis")
    .update({ status: "ongoing", waktu_mulai_sesi: waktuMulai })
    .eq("kuis_id", kuisId)
    .eq("status", "waiting");

  if (error) {
    console.error(error);
    throw new Error(error.message ?? "Gagal memulai sesi");
  }

  return { waktu_mulai_sesi: waktuMulai };
}

export function generateSessionToken() {
  return randomUUID();
}
