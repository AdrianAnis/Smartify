import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth/auth-service";
import { AUTH_COOKIE } from "@/lib/auth/auth-service";
import { supabaseServer } from "@/lib/supabase/server";
import { openWaitingRoom } from "@/lib/classroom/session";
import { listParticipants } from "@/lib/classroom/participant";
import { WaitingRoomClient } from "@/components/classroom/WaitingRoomClient";

export default async function WaitingRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kuisId = Number(id);

  if (!kuisId || !Number.isInteger(kuisId)) redirect("/dashboard");

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) redirect(`/auth/login?redirect=/quiz/${id}/waiting-room`);

  const user = await getUserFromToken(token);
  if (!user) redirect(`/auth/login?redirect=/quiz/${id}/waiting-room`);

  const { data: kuis } = await supabaseServer
    .from("kuis")
    .select("kuis_id, guru_id, judul, status, total_soal, durasi_menit, tingkat_kesulitan")
    .eq("kuis_id", kuisId)
    .maybeSingle();

  if (!kuis || kuis.guru_id !== user.user_id) redirect("/dashboard");

  if (!["published", "waiting"].includes(kuis.status)) {
    redirect(`/quiz/${id}/preview`);
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  let qrToken: string;
  let joinUrl: string;

  if (kuis.status === "published") {
    const result = await openWaitingRoom(kuisId);
    qrToken = result.qrToken;
    joinUrl = `${appUrl}/join/${qrToken}`;
  } else {
    const { data: sesi } = await supabaseServer
      .from("sesi_kuis")
      .select("qr_token")
      .eq("kuis_id", kuisId)
      .eq("is_active", true)
      .maybeSingle();

    if (!sesi) {
      const result = await openWaitingRoom(kuisId);
      qrToken = result.qrToken;
    } else {
      qrToken = sesi.qr_token;
    }
    joinUrl = `${appUrl}/join/${qrToken}`;
  }

  const initialPeserta = await listParticipants(kuisId);

  return (
    <WaitingRoomClient
      kuisId={id}
      judul={kuis.judul}
      totalSoal={kuis.total_soal}
      durasiMenit={kuis.durasi_menit}
      tingkatKesulitan={kuis.tingkat_kesulitan}
      initialQrToken={qrToken}
      initialJoinUrl={joinUrl}
      initialPeserta={initialPeserta}
    />
  );
}
