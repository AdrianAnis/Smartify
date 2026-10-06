import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rulesFor } from "@/lib/auth/rate-limit";
import { getSafeRedirect } from "@/lib/auth/safe-redirect";
import {
  GOOGLE_OAUTH_COOKIE,
  GOOGLE_OAUTH_COOKIE_PATH,
  GOOGLE_OAUTH_TTL_SECONDS,
  GoogleAuthError,
  createGoogleAuthRequest,
  getAppUrl,
} from "@/lib/auth/google";

function loginError(reason: string) {
  return NextResponse.redirect(new URL(`/auth/login?error=google_${reason}`, getAppUrl()));
}

export async function GET(request: NextRequest) {
  try {
    const limit = await checkRateLimit(rulesFor("googleLogin", request));
    if (!limit.allowed) return loginError("rate");

    const redirect = getSafeRedirect(request.nextUrl.searchParams.get("redirect"));
    const { url, oauthState } = createGoogleAuthRequest(redirect);

    const response = NextResponse.redirect(url);
    response.cookies.set(GOOGLE_OAUTH_COOKIE, JSON.stringify(oauthState), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: GOOGLE_OAUTH_COOKIE_PATH,
      maxAge: GOOGLE_OAUTH_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof GoogleAuthError) return loginError(error.reason);
    console.error("Google login start error:", error);
    return loginError("failed");
  }
}
