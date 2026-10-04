"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailIcon, ArrowRight, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";

interface VerifyFormProps {
  emailParam: string;
}

export default function VerifyForm({ emailParam }: VerifyFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setSuccess("Email berhasil diverifikasi! Mengarahkan ke halaman login...");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("Masukkan email terlebih dahulu");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess("Kode verifikasi baru telah dikirim ke email Anda");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Amankan Akun Anda" 
      description="Verifikasi email Anda untuk memastikan keamanan dan akses penuh ke seluruh fitur cerdas Smartify."
    >
      <div>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-card-foreground mb-2 text-center">
          Verifikasi Email
        </h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed text-center">
          Masukkan kode 6 digit yang telah dikirim ke email Anda.
        </p>

        {error && (
          <div className="mb-6 p-4 border border-danger-border bg-danger-subtle text-danger-text rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 border border-success-subtle bg-success-subtle text-success-text rounded-xl text-sm font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-label text-center"
            >
              Kode Verifikasi
            </label>
            <input
              type="text"
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-4 bg-input border border-transparent rounded-xl text-center text-3xl tracking-[0.5em] font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Verifikasi Sekarang"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="text-center mt-8 space-y-4">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading}
            className="text-primary font-medium hover:underline text-sm disabled:opacity-50"
          >
            Kirim ulang kode verifikasi
          </button>

          <p className="text-muted-foreground text-sm">
            Kembali ke{" "}
            <Link
              href="/auth/login"
              className="text-primary font-semibold hover:underline"
            >
              Halaman Masuk
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
