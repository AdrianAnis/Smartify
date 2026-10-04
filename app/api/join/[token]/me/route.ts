import { NextRequest, NextResponse } from "next/server";
import { getParticipantByToken } from "@/lib/classroom/participant";
import { PARTICIPANT_COOKIE } from "@/lib/classroom/session";

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(PARTICIPANT_COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: "Tidak ada sesi peserta." }, { status: 401 });
  }

  const peserta = await getParticipantByToken(sessionToken);
  if (!peserta) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  return NextResponse.json({
    pesertaId: peserta.peserta_id,
    nama: peserta.nama,
    kuisId: peserta.kuis_id,
    status: peserta.status,
  });
}
