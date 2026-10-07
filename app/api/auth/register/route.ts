import { NextRequest, NextResponse } from "next/server";
import { initiateRegistration } from "@/lib/auth/auth-service";
import {
  checkRateLimit,
  rulesFor,
  tooManyRequests,
} from "@/lib/auth/rate-limit";
import { sendVerificationEmail } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nama = String(body.nama ?? "").trim();
    const password = String(body.password ?? "");
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !password || !nama) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 },
      );
    }

    const limit = await checkRateLimit(rulesFor("register", request, email));
    if (!limit.allowed) return tooManyRequests(limit.retryAfter);

    const { verificationCode } = await initiateRegistration(
      email,
      password,
      nama,
    );

    await sendVerificationEmail(email, verificationCode, nama);

    return NextResponse.json({
      success: true,
      message:
        "Kode verifikasi telah dikirim ke email Anda. Silakan cek inbox atau folder spam.",
      email: email,
      expiresIn: 15,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mendaftar" },
      { status: 400 },
    );
  }
}
