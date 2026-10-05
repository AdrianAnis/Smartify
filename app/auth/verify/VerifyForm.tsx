"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailIcon, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";

interface VerifyFormProps {
  emailParam: string;
}

export default function VerifyForm({ emailParam }: VerifyFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, "");
    
    // Handle paste
    if (val.length > 1) {
      const chars = val.split("").slice(0, 6);
      const pasteOtp = [...otp];
      chars.forEach((char, i) => {
        if (index + i < 6) pasteOtp[index + i] = char;
      });
      setOtp(pasteOtp);
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Move to next input if filled
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = otp.join("");
    if (finalCode.length < 6) {
      setError("Masukkan 6 digit kode verifikasi");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: finalCode }),
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
      formDescription={
        <>
          Kode verifikasi 6 digit telah dikirim ke <span className="font-bold text-gray-900">{email}</span>. Silakan periksa kotak masuk (inbox) atau folder spam Anda.
        </>
      }
      imageSrc="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2000&auto=format&fit=crop"
    >
      <div className="bg-white">

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

          <div className="space-y-4">
            <label
              className="block text-sm font-medium text-gray-700 text-center"
            >
              Kode Verifikasi
            </label>
            <div className="flex justify-between gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 bg-white border border-gray-300 rounded-xl text-center text-2xl font-semibold focus:outline-none focus:border-primary transition-colors focus:ring-2 focus:ring-primary/20"
                  required
                />
              ))}
            </div>
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
