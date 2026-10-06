import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth/auth-service";
import { AUTH_COOKIE } from "@/lib/auth/auth-service";
import { supabaseServer } from "@/lib/supabase/server";
import { QuestionsClient } from "./QuestionsClient";

export default async function QuizQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kuisId = Number(id);

  if (!kuisId || !Number.isInteger(kuisId)) redirect("/dashboard");

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) redirect(`/auth/login?redirect=/quiz/${id}/questions`);

  const user = await getUserFromToken(token);
  if (!user) redirect(`/auth/login?redirect=/quiz/${id}/questions`);

  const { data: kuis } = await supabaseServer
    .from("kuis")
    .select("kuis_id, guru_id, judul")
    .eq("kuis_id", kuisId)
    .maybeSingle();

  if (!kuis || (kuis.guru_id !== user.user_id && user.role !== "admin")) {
    redirect("/dashboard");
  }

  const { data: soalList } = await supabaseServer
    .from("soal")
    .select(`
      soal_id,
      urutan,
      teks_soal,
      tipe_soal,
      penjelasan,
      pilihan_jawaban (
        pilihan_id,
        teks_pilihan,
        is_benar,
        urutan
      ),
      kunci_jawaban (
        jawaban_text
      )
    `)
    .eq("kuis_id", kuisId)
    .order("urutan", { ascending: true });

  return (
    <QuestionsClient kuisId={id} judul={kuis.judul} soalList={soalList ?? []} />
  );
}
