"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Users, BookOpen, Clock, AlertCircle, Loader2 } from "lucide-react";

interface KuisInfo {
  sesiId: number;
  kuisId: number;
  judul: string;
  totalSoal: number;
  durasiMenit: number;
  kodeKuis: string;
  status: string;
  isRegistered?: boolean;
}

export default function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [kuisInfo, setKuisInfo] = useState<KuisInfo | null>(null);
  const [nama, setNama] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetchKuisInfo(t);
    });
  }, [params]);

  async function fetchKuisInfo(t: string) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/join/${t}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Tautan tidak valid.");
        return;
      }

      if (data.isRegistered) {
        if (data.status === "ongoing") {
          router.replace(`/join/${t}/play`);
          return;
        }
        if (data.status === "waiting") {
          router.replace(`/join/${t}/waiting`);
          return;
        }
        if (data.status === "selesai") {
          router.replace(`/join/${t}/result`);
          return;
        }
      }

      setKuisInfo(data);
    } catch {
      setError("Tidak dapat memuat informasi kuis.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsJoining(true);

    try {
      const res = await fetch(`/api/join/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal bergabung.");
        return;
      }
      router.push(`/join/${token}/waiting`);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsJoining(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !kuisInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger-subtle">
            <AlertCircle className="h-8 w-8 text-danger" />
          </div>
          <h1 className="text-lg font-semibold text-card-foreground">Tidak Dapat Bergabung</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/images/logo3.png"
            alt="Smartify"
            width={120}
            height={29}
            priority
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-card-foreground line-clamp-2">
              {kuisInfo?.judul}
            </h1>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <BookOpen className="h-4 w-4" />
                {kuisInfo?.totalSoal} soal
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Clock className="h-4 w-4" />
                {kuisInfo?.durasiMenit} menit
              </span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label
                htmlFor="nama"
                className="block text-sm font-medium text-label"
              >
                Nama Kamu
              </label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="nama"
                  type="text"
                  autoComplete="off"
                  autoFocus
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan namamu"
                  maxLength={50}
                  className="w-full pl-12 pr-4 py-3 bg-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-danger-border bg-danger-subtle px-4 py-3 text-sm text-danger-text">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining || !nama.trim()}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none"
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Bergabung...
                </span>
              ) : (
                "Bergabung"
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          Kode kuis:{" "}
          <span className="font-semibold tracking-widest text-foreground">
            {kuisInfo?.kodeKuis}
          </span>
        </p>
      </div>
    </div>
  );
}
