import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { supabaseServer } from "../supabase/server";

export async function initiateRegistration(
  email: string,
  password: string,
  nama: string,
) {
  try {
    const { data: existingUser } = await supabaseServer
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      throw new Error("Email sudah terdaftar");
    }

    // Bersihkan registrasi kadaluarsa + data lama untuk email ini
    await supabaseServer
      .from("temporary_registrations")
      .delete()
      .lt("expires_at", new Date().toISOString());

    await supabaseServer
      .from("temporary_registrations")
      .delete()
      .eq("email", email);

    await supabaseServer
      .from("email_verifications")
      .delete()
      .eq("email", email);

    const verificationCode = randomInt(100000, 1000000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const passwordHash = await bcrypt.hash(password, 10);

    const { error: tempError } = await supabaseServer
      .from("temporary_registrations")
      .insert({
        email,
        password_hash: passwordHash,
        nama,
        expires_at: expiresAt.toISOString(),
      });

    if (tempError) {
      console.error("Temporary registration error:", tempError);
      throw new Error("Gagal menyimpan data sementara");
    }

    const { error: verifError } = await supabaseServer
      .from("email_verifications")
      .insert({
        email,
        code: verificationCode,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

    if (verifError) {
      console.error("Email verification error:", verifError);
      throw new Error("Gagal menyimpan data verifikasi");
    }

    return { verificationCode, expiresAt };
  } catch (error) {
    console.error("Initiate registration error:", error);
    throw error;
  }
}
