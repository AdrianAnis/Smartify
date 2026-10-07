export const FREE_DAILY_MAX_QUESTIONS = 20;
export const PREMIUM_DAILY_MAX_QUESTIONS = 200;

export const FREE_TRIAL_MAX_QUESTIONS = 20;
export const PREMIUM_MAX_QUESTIONS = 50;

export type Plan = "free" | "premium";

export function isPremiumEffective(
  subscriptionStatus: string | null | undefined,
  expiredAt: string | null | undefined,
): boolean {
  if (subscriptionStatus !== "premium" || !expiredAt) return false;
  return new Date(expiredAt).getTime() > Date.now();
}
