import LoginForm from "./LoginForm";
import { getSafeRedirect } from "@/lib/auth/safe-redirect";

const GOOGLE_ERRORS: Record<string, string> = {
  google_cancelled: "Login dengan Google dibatalkan.",
  google_failed: "Login dengan Google gagal. Silakan coba lagi.",
  google_unverified: "Email Google Anda belum terverifikasi.",
  google_config: "Login dengan Google belum dikonfigurasi.",
  google_rate: "Terlalu banyak percobaan. Silakan coba lagi beberapa menit lagi.",
};

export default async function LoginPage(props: PageProps<"/auth/login">) {
  const { redirect, error } = await props.searchParams;
  const initialError = typeof error === "string" ? (GOOGLE_ERRORS[error] ?? "") : "";
  return <LoginForm redirectTo={getSafeRedirect(redirect)} initialError={initialError} />;
}
