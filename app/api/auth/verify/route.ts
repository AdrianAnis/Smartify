import { NextRequest, NextResponse } from "next/server";
import { verifyAndCreateUser } from "@/lib/auth/auth-service";
import {
  checkRateLimit,
  rulesFor,
  tooManyRequests,
} from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const code = String(body.code ?? "").trim();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email dan kode verifikasi harus diisi" },
        { status: 400 },
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Kode verifikasi harus 6 digit angka" },
        { status: 400 },
      );
    }

    const limit = await checkRateLimit(rulesFor("verify", request, email));
    if (!limit.allowed) return tooManyRequests(limit.retryAfter);

    const { user } = await verifyAndCreateUser(email, code);

    return NextResponse.json({
      success: true,
      message:
        "Email berhasil diverifikasi! Akun Anda telah aktif. Silakan login.",
      user: {
        email: user.email,
        nama: user.nama,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memverifikasi email" },
      { status: 400 },
    );
  }
}
