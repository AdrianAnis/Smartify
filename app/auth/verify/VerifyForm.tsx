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
      formTitle="Verifikasi Email"
      formDescription="Masukkan kode 6 digit yang telah dikirim ke email Anda."
      imageSrc="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2000&auto=format&fit=crop"
    >
      <div className="bg-white">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 border border-green-200 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MailIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 text-center"
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
              className="w-full px-4 py-4 bg-white border border-gray-300 rounded-xl text-center text-3xl tracking-[0.5em] font-semibold focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
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

          <p className="text-gray-500 text-sm">
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
