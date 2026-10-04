import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE, getJwtSecret } from "@/lib/auth/auth-service";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (token) {
    try {
      await jwtVerify(token, getJwtSecret());
      return NextResponse.next();
    } catch {}
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
