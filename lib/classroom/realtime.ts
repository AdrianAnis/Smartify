import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export type QuizRealtimeEventType =
  | "participant_changed"
  | "answers_changed"
  | "quiz_status_changed"
  | "results_changed";

const QUIZ_REALTIME_EVENT = "quiz-updated";

export async function publishQuizRealtimeEvent(
  qrToken: string,
  type: QuizRealtimeEventType,
  status?: string,
) {
  const channel = supabaseServer.channel(`quiz-${qrToken}`, {
    config: { private: false },
  });

  try {
    const result = await channel.httpSend(QUIZ_REALTIME_EVENT, {
      type,
      ...(status ? { status } : {}),
    });

    if (!result.success) {
      console.error("Failed to publish quiz realtime event:", result);
    }
  } catch (error) {
    console.error("Failed to publish quiz realtime event:", error);
  } finally {
    try {
      await supabaseServer.removeChannel(channel);
    } catch (error) {
      console.error("Failed to clean up quiz realtime channel:", error);
    }
  }
}

export async function publishQuizRealtimeEventForQuiz(
  kuisId: number,
  type: QuizRealtimeEventType,
  status?: string,
) {
  const { data: sesi, error } = await supabaseServer
    .from("sesi_kuis")
    .select("qr_token")
    .eq("kuis_id", kuisId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to find quiz realtime channel:", error);
    return;
  }

  if (!sesi?.qr_token) {
    console.error(`No realtime channel found for quiz ${kuisId}.`);
    return;
  }

  await publishQuizRealtimeEvent(sesi.qr_token, type, status);
}
