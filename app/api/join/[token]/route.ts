import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getActiveSesiByToken } from "@/lib/classroom/session";
import { joinAsParticipant, getParticipantByToken } from "@/lib/classroom/participant";
import { PARTICIPANT_COOKIE } from "@/lib/classroom/session";
import { publishQuizRealtimeEvent } from "@/lib/classroom/realtime";
import { checkRateLimit, rulesFor, tooManyRequests } from "@/lib/auth/rate-limit";
import { endQuizIfExpired } from "@/lib/classroom/end-quiz";

const MAX_PARTICIPANTS = 200;

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await ctx.params;
    const sesi = await getActiveSesiByToken(token);

    if (!sesi || !sesi.is_active) {
      return NextResponse.json(
        { error: "Tautan tidak valid atau sesi sudah berakhir." },
        { status: 404 },
      );
    }

    const kuis = sesi.kuis;

    if (!kuis) {
      return NextResponse.json({ error: "Data kuis tidak ditemukan." }, { status: 404 });
    }

    if (await endQuizIfExpired({ ...kuis, kuis_id: sesi.kuis_id })) {
      kuis.status = "selesai";
    }

    const participantCookie = request.cookies.get(PARTICIPANT_COOKIE)?.value;
    let currentParticipant = null;

    if (participantCookie) {
      const p = await getParticipantByToken(participantCookie);
      if (p && p.kuis_id === sesi.kuis_id) {
        currentParticipant = p;
      }
    }

    if (kuis.status === "selesai") {
      return NextResponse.json(
        {
          error: "Sesi kuis sudah berakhir.",
          status: "selesai",
          isRegistered: Boolean(currentParticipant),
        },
        { status: 410 },
      );
    }

    if (kuis.status === "ongoing" && !currentParticipant) {
      return NextResponse.json(
        {
          error: "Kuis sudah dimulai. Pendaftaran peserta baru telah ditutup.",
          status: "ongoing",
          isRegistered: false,
        },
        { status: 409 },
      );
    }

    const { count } = await supabaseServer
      .from("peserta_kuis")
      .select("*", { count: "exact", head: true })
      .eq("kuis_id", sesi.kuis_id);

    return NextResponse.json({
      sesiId: sesi.sesi_id,
      kuisId: sesi.kuis_id,
      judul: kuis.judul,
      totalSoal: kuis.total_soal,
      durasiMenit: kuis.durasi_menit,
      status: kuis.status,
      jumlahPeserta: count ?? 0,
      isRegistered: Boolean(currentParticipant),
      participant: currentParticipant
        ? {
            pesertaId: currentParticipant.peserta_id,
            nama: currentParticipant.nama,
            status: currentParticipant.status,
          }
        : null,
    });
  } catch (error) {
    console.error("Get join info error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await ctx.params;
    const sesi = await getActiveSesiByToken(token);

    if (!sesi || !sesi.is_active) {
      return NextResponse.json(
        { error: "Tautan tidak valid atau sesi sudah berakhir." },
        { status: 404 },
      );
    }

    const kuis = sesi.kuis;
    if (!kuis || kuis.status !== "waiting") {
      return NextResponse.json(
        { error: "Tidak bisa bergabung. Kuis sudah dimulai atau berakhir." },
        { status: 409 },
      );
    }

    const [limit, { count: participantCount }] = await Promise.all([
      checkRateLimit(rulesFor("joinQuiz", request)),
      supabaseServer
        .from("peserta_kuis")
        .select("peserta_id", { count: "exact", head: true })
        .eq("kuis_id", sesi.kuis_id),
    ]);
    if (!limit.allowed) return tooManyRequests(limit.retryAfter);
    if ((participantCount ?? 0) >= MAX_PARTICIPANTS) {
      return NextResponse.json(
        { error: "Ruang tunggu sudah penuh. Hubungi guru kamu." },
        { status: 409 },
      );
    }

    const body = await request.json();
    const nama = String(body.nama ?? "").trim();

    if (!nama || nama.length < 2) {
      return NextResponse.json(
        { error: "Nama harus diisi minimal 2 karakter." },
        { status: 400 },
      );
    }

    if (nama.length > 50) {
      return NextResponse.json(
        { error: "Nama maksimal 50 karakter." },
        { status: 400 },
      );
    }

    const { peserta, sessionToken } = await joinAsParticipant(
      sesi.kuis_id,
      sesi.sesi_id,
      nama,
    );
    await publishQuizRealtimeEvent(token, "participant_changed");

    const response = NextResponse.json({
      pesertaId: peserta.peserta_id,
      nama: peserta.nama,
      kuisId: sesi.kuis_id,
    });

    response.cookies.set(PARTICIPANT_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
    if (message.includes("Nama sudah digunakan")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    console.error("Join participant error:", error);
    return NextResponse.json({ error: "Gagal bergabung ke kuis." }, { status: 500 });
  }
}
