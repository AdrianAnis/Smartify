"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailIcon, ArrowRight } from "lucide-react";
import { onPasswordResetComplete } from "@/lib/auth/password-reset-broadcast";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    return onPasswordResetComplete(() => {
      router.replace("/auth/login");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Lupa Password?" 
      description="Jangan khawatir! Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang password akun Smartify Anda."
    >
      <div>
        {!sent ? (
          <>
            <h1 className="text-3xl font-bold text-card-foreground mb-2">
              Atur Ulang Password
            </h1>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Masukkan email yang terdaftar. Kami akan mengirimkan tautan
              aman untuk mengatur ulang password Anda.
            </p>

            {error && (
              <div className="mb-6 p-4 border border-danger-border bg-danger-subtle text-danger-text rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-label"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MailIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-input border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? "Mengirim..." : "Kirim Tautan Reset"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MailIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-card-foreground">
              Periksa email Anda
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Jika alamat ini terhubung dengan akun Smartify, email berisi
              tautan atur ulang password telah dikirim. Buka pesan tersebut,
              ketuk{" "}
              <span className="font-semibold text-foreground">
                Atur password baru
              </span>
              , lalu buat password yang kuat. Setelah selesai, kembali ke
              halaman masuk untuk login dengan password yang baru.
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed mt-2 bg-gray-50 p-4 rounded-xl border border-border">
              Tidak melihat email? Periksa folder spam atau promosi. Tautan
              biasanya berlaku satu jam demi keamanan akun Anda.
            </p>
            <div className="pt-4">
              <Link
                href="/auth/login"
                className="inline-block w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-center"
              >
                Kembali ke halaman masuk
              </Link>
            </div>
          </div>
        )}

        {!sent && (
          <p className="text-center text-muted-foreground mt-8 text-sm">
            Ingat password Anda?{" "}
            <Link
              href="/auth/login"
              className="text-primary font-semibold hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
