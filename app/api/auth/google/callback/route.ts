import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  createSession,
  findOrCreateGoogleUser,
} from "@/lib/auth/auth-service";
import {
  GOOGLE_OAUTH_COOKIE,
  GOOGLE_OAUTH_COOKIE_PATH,
  GoogleAuthError,
  exchangeCodeForProfile,
  getAppUrl,
  parseOAuthState,
} from "@/lib/auth/google";
import { getSafeRedirect } from "@/lib/auth/safe-redirect";

function clearOAuthCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_OAUTH_COOKIE, "", {
    path: GOOGLE_OAUTH_COOKIE_PATH,
    maxAge: 0,
  });
  return response;
}

function loginError(reason: string) {
  return clearOAuthCookie(
    NextResponse.redirect(new URL(`/auth/login?error=google_${reason}`, getAppUrl())),
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.get("error")) return loginError("cancelled");

  const code = params.get("code");
  const state = params.get("state");
  const oauthState = parseOAuthState(request.cookies.get(GOOGLE_OAUTH_COOKIE)?.value);

  if (!code || !state || !oauthState || state !== oauthState.state) {
    return loginError("failed");
  }

  try {
    const profile = await exchangeCodeForProfile(code, oauthState);
    const user = await findOrCreateGoogleUser(profile);
    const { token, maxAge } = await createSession(user);

    const response = NextResponse.redirect(
      new URL(getSafeRedirect(oauthState.redirect), getAppUrl()),
    );
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    return clearOAuthCookie(response);
  } catch (error) {
    if (error instanceof GoogleAuthError) return loginError(error.reason);
    console.error("Google login callback error:", error);
    return loginError("failed");
  }
}
