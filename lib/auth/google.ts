import "server-only";
import { createHash, randomBytes } from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { GoogleProfile } from "./auth-service";

export const GOOGLE_OAUTH_COOKIE = "google_oauth";
export const GOOGLE_OAUTH_COOKIE_PATH = "/api/auth/google";
export const GOOGLE_OAUTH_TTL_SECONDS = 10 * 60;

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export interface GoogleOAuthState {
  state: string;
  codeVerifier: string;
  nonce: string;
  redirect: string;
}

export class GoogleAuthError extends Error {
  constructor(public readonly reason: "config" | "failed" | "unverified") {
    super(reason);
  }
}

function base64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

export function getAppUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new GoogleAuthError("config");
  return {
    clientId,
    clientSecret,
    redirectUri: `${getAppUrl()}/api/auth/google/callback`,
  };
}

export function createGoogleAuthRequest(redirect: string) {
  const { clientId, redirectUri } = getGoogleConfig();

  const oauthState: GoogleOAuthState = {
    state: base64Url(randomBytes(32)),
    codeVerifier: base64Url(randomBytes(32)),
    nonce: base64Url(randomBytes(16)),
    redirect,
  };

  const codeChallenge = base64Url(
    createHash("sha256").update(oauthState.codeVerifier).digest(),
  );

  const url = new URL(AUTH_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: oauthState.state,
    nonce: oauthState.nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  return { url: url.toString(), oauthState };
}

export function parseOAuthState(raw: string | undefined): GoogleOAuthState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (
      typeof value?.state === "string" &&
      typeof value?.codeVerifier === "string" &&
      typeof value?.nonce === "string" &&
      typeof value?.redirect === "string"
    ) {
      return value;
    }
  } catch {
    return null;
  }
  return null;
}

export async function exchangeCodeForProfile(
  code: string,
  oauthState: GoogleOAuthState,
): Promise<GoogleProfile> {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: oauthState.codeVerifier,
    }),
  });

  const tokenData = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok || typeof tokenData?.id_token !== "string") {
    console.error("Google token exchange failed:", tokenRes.status, tokenData?.error);
    throw new GoogleAuthError("failed");
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(tokenData.id_token, GOOGLE_JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience: clientId,
    }));
  } catch (error) {
    console.error("Google id_token verification failed:", error);
    throw new GoogleAuthError("failed");
  }

  if (payload.nonce !== oauthState.nonce || typeof payload.sub !== "string") {
    throw new GoogleAuthError("failed");
  }
  if (payload.email_verified !== true || typeof payload.email !== "string") {
    throw new GoogleAuthError("unverified");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    nama: typeof payload.name === "string" ? payload.name.trim() : "",
    avatarUrl: typeof payload.picture === "string" ? payload.picture : null,
  };
}
