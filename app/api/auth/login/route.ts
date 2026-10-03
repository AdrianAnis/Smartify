import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, loginUser } from "@/lib/auth/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const rememberMe = body.rememberMe === true;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password harus diisi" },
        { status: 400 },
      );
    }

    const { user, token, maxAge } = await loginUser(
      email,
      password,
      rememberMe,
    );

    const response = NextResponse.json({
      success: true,
      user,
      redirectTo: "/dashboard",
    });

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
