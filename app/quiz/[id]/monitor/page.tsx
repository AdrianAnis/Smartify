import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth/auth-service";
import { AUTH_COOKIE } from "@/lib/auth/auth-service";
import { supabaseServer } from "@/lib/supabase/server";
import { TeacherMonitorClient } from "@/components/classroom/TeacherMonitorClient";

export default async function QuizMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kuisId = Number(id);

  if (!kuisId || !Number.isInteger(kuisId)) redirect("/dashboard");

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) redirect(`/auth/login?redirect=/quiz/${id}/monitor`);

  const [
    user,
    { data: kuis },
    { data: pesertaList },
    { data: jawabanList },
    { data: hasilList },
    { data: realtimeSession, error: realtimeSessionError },
  ] = await Promise.all([
    getUserFromToken(token),
    supabaseServer
      .from("kuis")
      .select("kuis_id, guru_id, judul, status, durasi_menit, kkm, total_soal, waktu_mulai_sesi, kode_kuis")
      .eq("kuis_id", kuisId)
      .maybeSingle(),
    supabaseServer
      .from("peserta_kuis")
      .select("peserta_id, nama, status, tab_violations, joined_at, submitted_at")
      .eq("kuis_id", kuisId)
      .order("joined_at", { ascending: true }),
    supabaseServer
      .from("jawaban_siswa")
      .select("peserta_id, soal_id")
      .eq("kuis_id", kuisId),
    supabaseServer
      .from("hasil_kuis")
      .select("peserta_id, score, status_kelulusan, graded_at")
      .eq("kuis_id", kuisId),
    supabaseServer
      .from("sesi_kuis")
      .select("qr_token")
      .eq("kuis_id", kuisId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!user) redirect(`/auth/login?redirect=/quiz/${id}/monitor`);
  if (!kuis || (kuis.guru_id !== user.user_id && user.role !== "admin")) {
    redirect("/dashboard");
  }

  if (realtimeSessionError) {
    console.error("Failed to load quiz realtime channel:", realtimeSessionError);
  }

  const answerCountMap = new Map<number, number>();
  jawabanList?.forEach((j) => {
    answerCountMap.set(j.peserta_id, (answerCountMap.get(j.peserta_id) ?? 0) + 1);
  });

  const hasilMap = new Map<number, { score: number; status_kelulusan: string }>();
  hasilList?.forEach((h) => {
    hasilMap.set(h.peserta_id, {
      score: Number(h.score),
      status_kelulusan: h.status_kelulusan,
    });
  });

  const initialParticipants = (pesertaList ?? []).map((p) => {
    const hasil = hasilMap.get(p.peserta_id);
    return {
      pesertaId: p.peserta_id,
      nama: p.nama,
      status: p.status,
      tabViolations: p.tab_violations ?? 0,
      joinedAt: p.joined_at,
      submittedAt: p.submitted_at,
      answeredCount: answerCountMap.get(p.peserta_id) ?? 0,
      score: hasil ? hasil.score : null,
      statusKelulusan: hasil ? hasil.status_kelulusan : null,
    };
  });

  return (
    <TeacherMonitorClient
      kuisId={id}
      initialKuis={kuis}
      initialParticipants={initialParticipants}
      realtimeToken={realtimeSession?.qr_token ?? null}
    />
  );
}
