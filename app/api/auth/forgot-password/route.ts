import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/auth/auth-service";
import {
  checkRateLimit,
  rulesFor,
  tooManyRequests,
} from "@/lib/auth/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email/resend";

const GENERIC_MESSAGE =
  "Jika email terdaftar di Smartify, kami telah mengirimkan tautan untuk mengatur ulang password. Periksa kotak masuk atau folder spam, lalu ikuti petunjuk di email tersebut.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email harus diisi" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 },
      );
    }

    const limit = await checkRateLimit(
      rulesFor("forgotPassword", request, email),
    );
    if (!limit.allowed) return tooManyRequests(limit.retryAfter);

    const tokenPayload = await createPasswordResetToken(email);

    if (tokenPayload) {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/auth/reset-password?token=${encodeURIComponent(tokenPayload.plainToken)}`;

      try {
        await sendPasswordResetEmail(email, tokenPayload.nama, resetUrl);
      } catch (error) {
        console.error("forgot-password send email:", error);
      }
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("forgot-password:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
