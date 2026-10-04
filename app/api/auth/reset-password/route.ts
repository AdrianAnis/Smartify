import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth/auth-service";
import {
  checkRateLimit,
  rulesFor,
  tooManyRequests,
} from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (!token) {
      return NextResponse.json(
        { error: "Tautan reset tidak valid" },
        { status: 400 },
      );
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: "Password dan konfirmasi harus diisi" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Password tidak cocok" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 },
      );
    }

    const limit = await checkRateLimit(rulesFor("resetPassword", request));
    if (!limit.allowed) return tooManyRequests(limit.retryAfter);

    await resetPasswordWithToken(token, password);

    return NextResponse.json({
      success: true,
      message:
        "Password berhasil diubah. Silakan masuk dengan password baru Anda.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mengatur ulang password" },
      { status: 400 },
    );
  }
}
