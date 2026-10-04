import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { generateSessionToken } from "@/lib/classroom/session";

export async function isNamaAvailable(kuisId: number, nama: string) {
  const { data } = await supabaseServer
    .from("peserta_kuis")
    .select("peserta_id")
    .eq("kuis_id", kuisId)
    .eq("nama", nama)
    .maybeSingle();

  return !data;
}

export async function joinAsParticipant(
  kuisId: number,
  sesiId: number,
  nama: string,
) {
  const available = await isNamaAvailable(kuisId, nama);
  if (!available) {
    throw new Error("Nama sudah digunakan. Pilih nama lain.");
  }

  const sessionToken = generateSessionToken();

  const { data: peserta, error } = await supabaseServer
    .from("peserta_kuis")
    .insert({
      kuis_id: kuisId,
      sesi_id: sesiId,
      nama,
      session_token: sessionToken,
      status: "menunggu",
    })
    .select("peserta_id, nama, status")
    .single();

  if (error || !peserta) {
    if (error?.code === "23505") {
      throw new Error("Nama sudah digunakan. Pilih nama lain.");
    }
    throw new Error("Gagal bergabung ke kuis");
  }

  return { peserta, sessionToken };
}

export async function getParticipantByToken(sessionToken: string) {
  const { data } = await supabaseServer
    .from("peserta_kuis")
    .select("peserta_id, kuis_id, sesi_id, nama, status, tab_violations")
    .eq("session_token", sessionToken)
    .maybeSingle();

  return data;
}

export async function listParticipants(kuisId: number) {
  const { data } = await supabaseServer
    .from("peserta_kuis")
    .select("peserta_id, nama, status, joined_at")
    .eq("kuis_id", kuisId)
    .order("joined_at", { ascending: true });

  return data ?? [];
}

export async function kickParticipant(pesertaId: number, kuisId: number) {
  const { error } = await supabaseServer
    .from("peserta_kuis")
    .delete()
    .eq("peserta_id", pesertaId)
    .eq("kuis_id", kuisId);

  if (error) throw new Error("Gagal mengeluarkan peserta");
}
