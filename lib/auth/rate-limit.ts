import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../supabase/server";

export interface RateLimitRule {
  key: string;
  limit: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;

export const RATE_LIMITS = {
  register: { ip: [10, HOUR], email: [3, 15 * MINUTE] },
  resendCode: { ip: [10, HOUR], email: [3, 15 * MINUTE] },
  verify: { ip: [30, 15 * MINUTE], email: [5, 15 * MINUTE] },
  login: { ip: [30, 15 * MINUTE], email: [10, 15 * MINUTE] },
  forgotPassword: { ip: [10, HOUR], email: [3, HOUR] },
  resetPassword: { ip: [10, 15 * MINUTE] },
  generate: { ip: [20, HOUR], email: [10, HOUR] },
  googleLogin: { ip: [30, 15 * MINUTE] },
  joinQuiz: { ip: [120, 10 * MINUTE] },
} as const;

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function hit(rule: RateLimitRule): Promise<RateLimitResult> {
  const { data, error } = await supabaseServer.rpc("rate_limit_hit", {
    p_key: rule.key,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });

  const row = Array.isArray(data) ? data[0] : null;

  if (error || !row) {
    console.error("Rate limit error:", error);
    return { allowed: true, retryAfter: 0 };
  }

  return { allowed: row.allowed, retryAfter: row.retry_after };
}

export async function checkRateLimit(
  rules: RateLimitRule[],
): Promise<RateLimitResult> {
  for (const rule of rules) {
    const result = await hit(rule);
    if (!result.allowed) return result;
  }
  return { allowed: true, retryAfter: 0 };
}

export function rulesFor(
  name: keyof typeof RATE_LIMITS,
  request: NextRequest,
  email?: string,
): RateLimitRule[] {
  const config: { ip: readonly [number, number]; email?: readonly [number, number] } =
    RATE_LIMITS[name];
  const rules: RateLimitRule[] = [
    {
      key: `${name}:ip:${getClientIp(request)}`,
      limit: config.ip[0],
      windowSeconds: config.ip[1],
    },
  ];

  if (email && config.email) {
    rules.push({
      key: `${name}:email:${email}`,
      limit: config.email[0],
      windowSeconds: config.email[1],
    });
  }

  return rules;
}

export function tooManyRequests(retryAfter: number) {
  const minutes = Math.max(1, Math.ceil(retryAfter / 60));
  return NextResponse.json(
    {
      error: `Terlalu banyak percobaan. Silakan coba lagi dalam ${minutes} menit.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
