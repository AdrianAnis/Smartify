"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Footer } from "@/components/footer/footer";
import { broadcastPasswordResetComplete } from "@/lib/auth/password-reset-broadcast";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      broadcastPasswordResetComplete();

      setSuccess("Password berhasil diubah. Mengarahkan ke halaman masuk...");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-card rounded-2xl shadow-sm p-8 md:p-10">
            <div className="flex flex-col items-center mb-6">
              <Image
                src="/images/logo_smartify.png"
                alt="Logo"
                width={120}
                height={40}
                priority
              />
            </div>

            <div className="border-t border-border mb-6" />

            <h1 className="text-2xl font-bold text-card-foreground text-center mb-2">
              Atur password baru
            </h1>
            <p className="text-center text-muted text-sm mb-8 px-1">
              Buat password baru untuk akun Smartify Anda. Setelah diubah, Anda
              akan keluar dari semua perangkat.
            </p>

            {!token ? (
              <div className="space-y-4">
                <div className="p-3 border border-danger-border bg-danger-subtle text-danger-text rounded-xl text-sm">
                  Tautan reset tidak valid. Silakan minta tautan baru.
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="inline-block w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors text-center"
                >
                  Minta tautan baru
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 border border-danger-border bg-danger-subtle text-danger-text rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-success-subtle text-success-text rounded-xl text-sm">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-label"
                    >
                      Password baru
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockIcon className="h-5 w-5 text-muted" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full pl-12 pr-12 py-3 bg-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Sembunyikan password" : "Tampilkan password"
                        }
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-5 w-5 text-muted" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-muted" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-label"
                    >
                      Konfirmasi password baru
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <LockIcon className="h-5 w-5 text-muted" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="w-full pl-12 pr-4 py-3 bg-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !!success}
                    className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Menyimpan..." : "Simpan password baru"}
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-card-foreground mt-6 text-sm">
              Ingat password Anda?{" "}
              <Link
                href="/auth/login"
                className="text-primary font-medium hover:underline"
              >
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
