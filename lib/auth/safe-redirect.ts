const DEFAULT_REDIRECT = "/dashboard";
const INTERNAL_ORIGIN = "http://smartify.internal";

export function getSafeRedirect(value: string | string[] | null | undefined) {
  if (typeof value !== "string" || !value.startsWith("/")) return DEFAULT_REDIRECT;

  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return DEFAULT_REDIRECT;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_REDIRECT;
  }
}
