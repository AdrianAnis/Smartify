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

export async function recordGeneration(userId: number, totalSoal: number) {
  const { error } = await supabaseServer
    .from("generation_logs")
    .insert({ user_id: userId, total_soal: totalSoal });

  if (error) console.error("recordGeneration error:", error);
}
