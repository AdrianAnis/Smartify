import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, logoutUser } from "@/lib/auth/auth-service";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value;

    if (token) {
      await logoutUser(token);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });

    response.cookies.delete(AUTH_COOKIE);

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
