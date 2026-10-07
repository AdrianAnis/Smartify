import { createHash, randomBytes, randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { supabaseServer } from "../supabase/server";

export const AUTH_COOKIE = "auth_token";

const VERIFICATION_TTL_MINUTES = 15;
const SESSION_DAYS = 1;
const SESSION_DAYS_REMEMBER = 30;
const RESET_TOKEN_TTL_HOURS = 1;

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET belum diatur");
  }
  return new TextEncoder().encode(secret);
}

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

  await supabaseServer
    .from("temporary_registrations")
    .update({ expires_at: expiresAt.toISOString() })
    .eq("email", email);

  return { verificationCode: code, nama: tempData.nama as string };
}

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

    if (!user.password_hash) {
      throw new Error(
        "Akun ini terdaftar dengan Google. Silakan masuk dengan tombol Google.",
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error("Email atau password salah");
    }

    const session = await createSession(user, rememberMe);

    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        nama: user.nama,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      ...session,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function createSession(
  user: { user_id: number; email: string; role: string },
  rememberMe: boolean = false,
) {
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

  await supabaseServer
    .from("user_sessions")
    .delete()
    .eq("user_id", user.user_id)
    .lt("expires_at", new Date().toISOString());

  const { error } = await supabaseServer.from("user_sessions").insert({
    user_id: user.user_id,
    token,
    expires_at: expiresAt.toISOString(),
  });
  if (error) {
    console.error("Create session error:", error);
    throw new Error("Gagal membuat sesi login");
  }

  return { token, maxAge: days * 24 * 60 * 60 };
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  nama: string;
  avatarUrl: string | null;
}

const GOOGLE_USER_COLUMNS = "user_id, email, nama, role, avatar_url, google_id";

export async function findOrCreateGoogleUser(profile: GoogleProfile) {
  const email = profile.email.trim().toLowerCase();

  const { data: byGoogleId } = await supabaseServer
    .from("users")
    .select(GOOGLE_USER_COLUMNS)
    .eq("google_id", profile.googleId)
    .maybeSingle();
  if (byGoogleId) return byGoogleId;

  const { data: byEmail } = await supabaseServer
    .from("users")
    .select(GOOGLE_USER_COLUMNS)
    .eq("email", email)
    .maybeSingle();

  if (byEmail) {
    const { data: linked, error } = await supabaseServer
      .from("users")
      .update({
        google_id: profile.googleId,
        avatar_url: byEmail.avatar_url ?? profile.avatarUrl,
      })
      .eq("user_id", byEmail.user_id)
      .select(GOOGLE_USER_COLUMNS)
      .single();
    if (error) {
      console.error("Link Google account error:", error);
      throw new Error("Gagal menghubungkan akun Google");
    }
    return linked;
  }

  const { data: created, error } = await supabaseServer
    .from("users")
    .insert({
      email,
      nama: profile.nama || email.split("@")[0],
      role: "guru",
      password_hash: null,
      google_id: profile.googleId,
      avatar_url: profile.avatarUrl,
    })
    .select(GOOGLE_USER_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      for (const [column, value] of [
        ["google_id", profile.googleId],
        ["email", email],
      ]) {
        const { data: existing } = await supabaseServer
          .from("users")
          .select(GOOGLE_USER_COLUMNS)
          .eq(column, value)
          .maybeSingle();
        if (existing) return existing;
      }
    }
    console.error("Create Google user error:", error);
    throw new Error("Gagal membuat akun dari Google");
  }

  await supabaseServer.from("temporary_registrations").delete().eq("email", email);
  await supabaseServer.from("email_verifications").delete().eq("email", email);

  return created;
}

export interface SessionUser {
  user_id: number;
  email: string;
  nama: string;
  role: string;
  avatar_url: string | null;
  subscription_status: string;
  expired_at: string | null;
}

export async function getUserFromToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = Number(payload.userId);
    if (!userId) return null;

    const { data: session } = await supabaseServer
      .from("user_sessions")
      .select("users(user_id, email, nama, role, avatar_url, subscription_status, expired_at)")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    const user = session?.users as unknown as SessionUser | null | undefined;
    return user && user.user_id === userId ? user : null;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return getUserFromToken(token);
}

export async function getClaimedUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return Number(payload.userId) || null;
  } catch {
    return null;
  }
}

export async function logoutUser(token: string) {
  await supabaseServer.from("user_sessions").delete().eq("token", token);
}

function hashPasswordResetToken(plainToken: string): string {
  return createHash("sha256").update(plainToken, "utf8").digest("hex");
}

export async function createPasswordResetToken(
  email: string,
): Promise<{ plainToken: string; nama: string } | null> {
  const { data: user, error } = await supabaseServer
    .from("users")
    .select("user_id, nama")
    .eq("email", email)
    .maybeSingle();

  if (error || !user) {
    return null;
  }

  const plainToken = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_TTL_HOURS);

  await supabaseServer
    .from("password_reset_tokens")
    .delete()
    .eq("user_id", user.user_id);

  const { error: insertError } = await supabaseServer
    .from("password_reset_tokens")
    .insert({
      user_id: user.user_id,
      token_hash: hashPasswordResetToken(plainToken),
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    console.error("password_reset_tokens insert:", insertError);
    throw new Error("Gagal membuat tautan reset password");
  }

  return { plainToken, nama: user.nama };
}

export async function resetPasswordWithToken(
  plainToken: string,
  password: string,
): Promise<void> {
  if (!plainToken || plainToken.length < 32) {
    throw new Error("Tautan tidak valid atau sudah kadaluarsa");
  }

  const { data: row, error } = await supabaseServer
    .from("password_reset_tokens")
    .select("id, user_id, expires_at")
    .eq("token_hash", hashPasswordResetToken(plainToken.trim()))
    .maybeSingle();

  if (error || !row) {
    throw new Error("Tautan tidak valid atau sudah kadaluarsa");
  }

  if (new Date() > new Date(row.expires_at)) {
    await supabaseServer.from("password_reset_tokens").delete().eq("id", row.id);
    throw new Error("Tautan tidak valid atau sudah kadaluarsa");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { error: updateUserError } = await supabaseServer
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("user_id", row.user_id);

  if (updateUserError) {
    console.error("reset password user update:", updateUserError);
    throw new Error("Gagal memperbarui password");
  }

  await supabaseServer
    .from("password_reset_tokens")
    .delete()
    .eq("user_id", row.user_id);

  await supabaseServer
    .from("user_sessions")
    .delete()
    .eq("user_id", row.user_id);
}
