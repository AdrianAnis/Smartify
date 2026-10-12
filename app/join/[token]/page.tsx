"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Users,
  AlertCircle,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface KuisInfo {
  sesiId: number;
  kuisId: number;
  judul: string;
  totalSoal: number;
  durasiMenit: number;
  status: string;
  isRegistered?: boolean;
}

export default function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { token } = use(params);
  const [kuisInfo, setKuisInfo] = useState<KuisInfo | null>(null);
  const [nama, setNama] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    async function fetchKuisInfo(t: string) {
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
        if (new URLSearchParams(window.location.search).get("kicked") === "1") {
          setNotice("Kamu dikeluarkan dari ruang tunggu oleh guru. Isi nama lagi jika ingin bergabung kembali.");
        }
      } catch {
        setError("Tidak dapat memuat informasi kuis.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchKuisInfo(token);
  }, [token, router]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
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
      <AuthLayout
        imageSrc="/images/join-class.jpg"
        title="Siap mengerjakan kuis?"
        description="Masukkan namamu, tunggu guru memulai, lalu kerjakan kuis bersama teman sekelasmu."
      >
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="mx-auto h-8 w-52" />
          <Skeleton className="mx-auto h-4 w-64" />
          <div className="pt-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-12 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </AuthLayout>
    );
  }

  if (error && !kuisInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="w-full max-w-sm rounded-2xl border border-danger-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-danger-subtle text-danger">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold text-card-foreground">Tidak Dapat Bergabung</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      imageSrc="/images/join-class.jpg"
      title="Siap mengerjakan kuis?"
      description="Masukkan namamu, tunggu guru memulai, lalu kerjakan kuis bersama teman sekelasmu."
      formTitle={kuisInfo?.judul}
      formDescription="Masukkan namamu untuk masuk ke ruang tunggu"
    >
      <div className="bg-white">
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label
              htmlFor="nama"
              className="block text-sm font-medium text-label"
            >
              Nama Kamu
            </label>

            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
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
                className="w-full rounded-xl bg-input py-3 pr-4 pl-10 text-sm font-medium text-card-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          {notice && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-danger-border bg-danger-subtle p-3 text-xs text-danger-text">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining || !nama.trim()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Bergabung...</span>
              </>
            ) : (
              <>
                <span>Bergabung</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Tanpa akun • Cukup isi nama dan ikuti kuis</span>
        </div>
      </div>
    </AuthLayout>
  );
}
