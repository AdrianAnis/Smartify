import { supabaseServer } from "@/lib/supabase/server";
import { gradeAndSubmitQuiz } from "./quiz-play";
import { publishQuizRealtimeEventForQuiz } from "./realtime";
import { ANSWER_GRACE_MS } from "./session";

interface TimedQuiz {
  kuis_id: number;
  status: string;
  waktu_mulai_sesi: string | null;
  durasi_menit: number;
}

export async function endQuizSession(kuisId: number) {
  const { data: updated, error } = await supabaseServer
    .from("kuis")
    .update({ status: "selesai" })
    .eq("kuis_id", kuisId)
    .eq("status", "ongoing")
    .select("kuis_id");

  if (error) throw error;
  if (!updated || updated.length === 0) return false;

  await supabaseServer.from("sesi_kuis").update({ is_active: false }).eq("kuis_id", kuisId);

  const { data: unsubmitted } = await supabaseServer
    .from("peserta_kuis")
    .select("peserta_id")
    .eq("kuis_id", kuisId)
    .neq("status", "selesai");

  if (unsubmitted && unsubmitted.length > 0) {
    await Promise.allSettled(unsubmitted.map((p) => gradeAndSubmitQuiz(p.peserta_id, kuisId)));
  }

  await publishQuizRealtimeEventForQuiz(kuisId, "quiz_status_changed", "selesai");
  return true;
}

export function isQuizExpired(kuis: TimedQuiz) {
  if (kuis.status !== "ongoing" || !kuis.waktu_mulai_sesi) return false;
  const deadline =
    new Date(kuis.waktu_mulai_sesi).getTime() + kuis.durasi_menit * 60_000 + ANSWER_GRACE_MS;
  return Date.now() > deadline;
}

export async function endQuizIfExpired(kuis: TimedQuiz) {
  if (!isQuizExpired(kuis)) return false;
  try {
    await endQuizSession(kuis.kuis_id);
  } catch (error) {
    console.error("Auto end quiz error:", error);
    return false;
  }
  return true;
}
