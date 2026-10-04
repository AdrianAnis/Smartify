import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth/auth-service";
import { AUTH_COOKIE } from "@/lib/auth/auth-service";
import { supabaseServer } from "@/lib/supabase/server";
import { TeacherResultClient } from "@/components/classroom/TeacherResultClient";

export default async function QuizResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kuisId = Number(id);

  if (!kuisId || !Number.isInteger(kuisId)) redirect("/dashboard");

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) redirect(`/auth/login?redirect=/quiz/${id}/result`);

  const user = await getUserFromToken(token);
  if (!user) redirect(`/auth/login?redirect=/quiz/${id}/result`);

  const { data: kuis } = await supabaseServer
    .from("kuis")
    .select("kuis_id, guru_id, judul, status, durasi_menit, kkm, total_soal, created_at, kode_kuis")
    .eq("kuis_id", kuisId)
    .maybeSingle();

  if (!kuis || (kuis.guru_id !== user.user_id && user.role !== "admin")) {
    redirect("/dashboard");
  }

  const { data: pesertaList } = await supabaseServer
    .from("peserta_kuis")
    .select("peserta_id, nama, status, tab_violations, joined_at, submitted_at")
    .eq("kuis_id", kuisId);

  const { data: hasilList } = await supabaseServer
    .from("hasil_kuis")
    .select("peserta_id, score, status_kelulusan, score_per_question, grading_detail, graded_at")
    .eq("kuis_id", kuisId);

  const { data: soalList } = await supabaseServer
    .from("soal")
    .select("soal_id, urutan, teks_soal, tipe_soal, topik, poin")
    .eq("kuis_id", kuisId)
    .order("urutan", { ascending: true });

  const hasilMap = new Map<number, {
    score: number;
    status_kelulusan: string;
    score_per_question: { soal_id: number; is_benar: boolean; score: number }[];
  }>();

  hasilList?.forEach((h) => {
    hasilMap.set(h.peserta_id, {
      score: Number(h.score),
      status_kelulusan: h.status_kelulusan,
      score_per_question: Array.isArray(h.score_per_question) ? h.score_per_question : [],
    });
  });

  const students = (pesertaList ?? []).map((p) => {
    const h = hasilMap.get(p.peserta_id);
    const benarCount = h?.score_per_question?.filter((q) => q.is_benar).length ?? 0;

    return {
      pesertaId: p.peserta_id,
      nama: p.nama,
      status: p.status,
      tabViolations: p.tab_violations ?? 0,
      joinedAt: p.joined_at,
      submittedAt: p.submitted_at,
      score: h ? h.score : 0,
      statusKelulusan: h ? h.status_kelulusan : "remedial",
      benarCount,
    };
  }).sort((a, b) => b.score - a.score);

  const scoredStudents = students.filter((s) => s.status === "selesai");
  const totalStudents = students.length;
  const lulusCount = scoredStudents.filter((s) => s.statusKelulusan === "lulus").length;
  const remedialCount = scoredStudents.length - lulusCount;

  const scores = scoredStudents.map((s) => s.score);
  const avgScore = scores.length > 0
    ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
    : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const passRate = scoredStudents.length > 0
    ? Math.round((lulusCount / scoredStudents.length) * 100)
    : 0;

  const questionCorrectMap = new Map<number, { total: number; correct: number }>();
  (soalList ?? []).forEach((s) => {
    questionCorrectMap.set(s.soal_id, { total: 0, correct: 0 });
  });

  hasilList?.forEach((h) => {
    if (Array.isArray(h.score_per_question)) {
      h.score_per_question.forEach((sq: { soal_id: number; is_benar: boolean }) => {
        const entry = questionCorrectMap.get(sq.soal_id);
        if (entry) {
          entry.total += 1;
          if (sq.is_benar) entry.correct += 1;
        }
      });
    }
  });

  const topicStatsMap = new Map<string, { totalQuestions: number; totalAttempts: number; totalCorrect: number }>();
  (soalList ?? []).forEach((s) => {
    const entry = questionCorrectMap.get(s.soal_id);
    const prev = topicStatsMap.get(s.topik) ?? { totalQuestions: 0, totalAttempts: 0, totalCorrect: 0 };
    prev.totalQuestions += 1;
    prev.totalAttempts += entry?.total ?? 0;
    prev.totalCorrect += entry?.correct ?? 0;
    topicStatsMap.set(s.topik, prev);
  });

  const topicAnalysis = Array.from(topicStatsMap.entries()).map(([topik, stat]) => {
    const accuracy = stat.totalAttempts > 0
      ? Math.round((stat.totalCorrect / stat.totalAttempts) * 100)
      : 0;
    return {
      topik,
      totalQuestions: stat.totalQuestions,
      accuracy,
    };
  });

  const questionAnalysis = (soalList ?? []).map((s) => {
    const entry = questionCorrectMap.get(s.soal_id);
    const accuracy = entry && entry.total > 0
      ? Math.round((entry.correct / entry.total) * 100)
      : 0;

    return {
      soalId: s.soal_id,
      urutan: s.urutan,
      teksSoal: s.teks_soal,
      tipeSoal: s.tipe_soal,
      topik: s.topik,
      accuracy,
      totalAnswered: entry?.total ?? 0,
    };
  });

  return (
    <TeacherResultClient
      kuisId={id}
      initialKuis={kuis}
      initialStats={{
        totalStudents,
        finishedStudents: scoredStudents.length,
        avgScore,
        maxScore,
        minScore,
        lulusCount,
        remedialCount,
        passRate,
      }}
      initialStudents={students}
      initialTopicAnalysis={topicAnalysis}
      initialQuestionAnalysis={questionAnalysis}
    />
  );
}
