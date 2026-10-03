import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { supabaseServer } from "../supabase/server";

export const AUTH_COOKIE = "auth_token";

const VERIFICATION_TTL_MINUTES = 15;
const SESSION_DAYS = 1;
const SESSION_DAYS_REMEMBER = 30;

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET belum diatur");
  }
  return new TextEncoder().encode(secret);
}

// Buat kode OTP 6 digit baru untuk email ini (kode lama dihapus)
async function createVerificationCode(email: string) {
  await supabaseServer
    .from("email_verifications")
    .delete()
    .eq("email", email);

  const code = randomInt(100000, 1000000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_TTL_MINUTES);

  const { error } = await supabaseServer.from("email_verifications").insert({
    email,
    code,
    expires_at: expiresAt.toISOString(),
    is_used: false,
  });

  if (error) {
    console.error("Email verification error:", error);
    throw new Error("Gagal menyimpan data verifikasi");
  }

  return { code, expiresAt };
}

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

    const passwordHash = await bcrypt.hash(password, 10);
    const tempExpiresAt = new Date();
    tempExpiresAt.setMinutes(
      tempExpiresAt.getMinutes() + VERIFICATION_TTL_MINUTES,
    );

    const { error: tempError } = await supabaseServer
      .from("temporary_registrations")
      .insert({
        email,
        password_hash: passwordHash,
        nama,
        expires_at: tempExpiresAt.toISOString(),
      });

    if (tempError) {
      console.error("Temporary registration error:", tempError);
      throw new Error("Gagal menyimpan data sementara");
    }

    const { code, expiresAt } = await createVerificationCode(email);

    return { verificationCode: code, expiresAt };
  } catch (error) {
    console.error("Initiate registration error:", error);
    throw error;
  }
}

// Kirim ulang kode untuk registrasi yang belum diverifikasi
export async function resendVerificationCode(email: string) {
  const { data: tempData } = await supabaseServer
    .from("temporary_registrations")
    .select("nama")
    .eq("email", email)
    .maybeSingle();

  if (!tempData) {
    throw new Error(
      "Data registrasi tidak ditemukan. Silakan registrasi ulang.",
    );
  }

  const { code, expiresAt } = await createVerificationCode(email);

  // Perpanjang data registrasi sementara agar sama dengan masa berlaku kode baru
  await supabaseServer
    .from("temporary_registrations")
    .update({ expires_at: expiresAt.toISOString() })
    .eq("email", email);

  return { verificationCode: code, nama: tempData.nama as string };
}

// Verifikasi kode OTP lalu buat akun guru
export async function verifyAndCreateUser(email: string, code: string) {
  try {
    const { data: verification, error: verifError } = await supabaseServer
      .from("email_verifications")
      .select("id, expires_at")
      .eq("email", email)
      .eq("code", code)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verifError || !verification) {
      throw new Error("Kode verifikasi tidak valid");
    }

    const now = new Date();
    if (now > new Date(verification.expires_at)) {
      throw new Error("Kode verifikasi sudah kadaluarsa");
    }

    const { data: tempData, error: tempError } = await supabaseServer
      .from("temporary_registrations")
      .select("password_hash, nama, expires_at")
      .eq("email", email)
      .maybeSingle();

    if (tempError || !tempData) {
      throw new Error(
        "Data registrasi tidak ditemukan. Silakan registrasi ulang.",
      );
    }

    if (now > new Date(tempData.expires_at)) {
      throw new Error(
        "Data registrasi sudah kadaluarsa. Silakan registrasi ulang.",
      );
    }

    const { data: newUser, error: userError } = await supabaseServer
      .from("users")
      .insert({
        email,
        password_hash: tempData.password_hash,
        nama: tempData.nama,
        role: "guru",
      })
      .select("user_id, email, nama, role")
      .single();

    if (userError) {
      console.error("User creation error:", userError);
      throw new Error("Gagal membuat akun");
    }

    await supabaseServer
      .from("email_verifications")
      .update({ is_used: true })
      .eq("id", verification.id);

    await supabaseServer
      .from("temporary_registrations")
      .delete()
      .eq("email", email);

    return { user: newUser };
  } catch (error) {
    console.error("Verify and create user error:", error);
    throw error;
  }
}

// Login: cek password, buat JWT, simpan sesi
export async function loginUser(
  email: string,
  password: string,
  rememberMe: boolean = false,
) {
  try {
    const { data: user } = await supabaseServer
      .from("users")
      .select("user_id, email, nama, role, avatar_url, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      throw new Error("Email atau password salah");
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error("Email atau password salah");
    }

    // Masa berlaku JWT dan cookie harus sama: 1 hari, atau 30 hari jika "ingat saya"
    const days = rememberMe ? SESSION_DAYS_REMEMBER : SESSION_DAYS;

    const token = await new SignJWT({
      userId: user.user_id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${days}d`)
      .sign(getJwtSecret());

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Bersihkan sesi kadaluarsa; sesi aktif di perangkat lain tetap dibiarkan
    await supabaseServer
      .from("user_sessions")
      .delete()
      .eq("user_id", user.user_id)
      .lt("expires_at", new Date().toISOString());

    await supabaseServer.from("user_sessions").insert({
      user_id: user.user_id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        nama: user.nama,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      token,
      maxAge: days * 24 * 60 * 60,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Ambil user dari JWT. Token harus valid DAN masih tercatat di user_sessions,
// sehingga logout / reset password langsung membatalkan token.
export async function getUserFromToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = Number(payload.userId);
    if (!userId) return null;

    const { data: session } = await supabaseServer
      .from("user_sessions")
      .select("id")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!session) return null;

    const { data: user } = await supabaseServer
      .from("users")
      .select(
        "user_id, email, nama, role, avatar_url, subscription_status, expired_at",
      )
      .eq("user_id", userId)
      .maybeSingle();

    return user;
  } catch {
    return null;
  }
}

// Helper untuk route API: ambil user yang sedang login dari cookie auth_token
export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return getUserFromToken(token);
}

// Logout: hapus sesi agar token tidak bisa dipakai lagi
export async function logoutUser(token: string) {
  await supabaseServer.from("user_sessions").delete().eq("token", token);
}
