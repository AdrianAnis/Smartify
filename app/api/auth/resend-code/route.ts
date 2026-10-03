import { NextRequest, NextResponse } from "next/server";
import { resendVerificationCode } from "@/lib/auth/auth-service";
import { sendVerificationEmail } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email harus diisi" },
        { status: 400 },
      );
    }

    const { verificationCode, nama } = await resendVerificationCode(email);

    await sendVerificationEmail(email, verificationCode, nama);

    return NextResponse.json({
      success: true,
      message: "Kode verifikasi baru telah dikirim ke email Anda",
      expiresIn: 15,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
