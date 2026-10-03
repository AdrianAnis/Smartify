import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE, getJwtSecret } from "@/lib/auth/auth-service";

// Pengecekan cepat: hanya tanda tangan + masa berlaku JWT, tanpa database.
// Pengecekan sesi yang sebenarnya tetap dilakukan di setiap route API
// lewat getUserFromRequest.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (token) {
    try {
      await jwtVerify(token, getJwtSecret());
      return NextResponse.next();
    } catch {
      // Token tidak valid atau kadaluarsa: perlakukan sebagai belum login
    }
  }

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set(
    "redirect",
    request.nextUrl.pathname + request.nextUrl.search,
  );

  const response = NextResponse.redirect(loginUrl);
  if (token) {
    response.cookies.delete(AUTH_COOKIE);
  }
  return response;
}

// Hanya halaman guru yang dilindungi. Halaman siswa (waiting-room, take,
// result, review) tetap publik karena siswa tidak punya akun.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/generate/:path*",
    "/quiz/:id/detail",
    "/quiz/:id/preview",
    "/quiz/:id/lihat-soal",
    "/quiz/:id/progress",
  ],
};
