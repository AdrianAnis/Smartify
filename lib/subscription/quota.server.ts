import { supabaseServer } from "@/lib/supabase/server";

export async function countQuestionsLast24Hours(userId: number): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseServer
    .from("generation_logs")
    .select("total_soal")
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) {
    console.error("countQuestionsLast24Hours error:", error);
    throw new Error("Gagal memeriksa kuota generate");
  }

  if (!data) return 0;
  return data.reduce((sum, item) => sum + (item.total_soal || 0), 0);
}

interface QuotaReservation {
  allowed: boolean;
  used: number;
  reservationId: number | null;
}

export async function reserveGeneration(
  userId: number,
  totalSoal: number,
  limit: number,
): Promise<QuotaReservation> {
  const { data, error } = await supabaseServer.rpc("reserve_generation", {
    p_user_id: userId,
    p_total_soal: totalSoal,
    p_limit: limit,
  });

  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) {
    console.error("reserveGeneration error:", error);
    throw new Error("Gagal memeriksa kuota generate");
  }

  return { allowed: row.allowed, used: row.used, reservationId: row.reservation_id };
}

export async function releaseGeneration(reservationId: number) {
  const { error } = await supabaseServer.from("generation_logs").delete().eq("log_id", reservationId);
  if (error) console.error("releaseGeneration error:", error);
}
