"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Users } from "lucide-react";

export default function StudentWaitingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [kuisId, setKuisId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [jumlahPeserta, setJumlahPeserta] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      initWaiting(t);
    });
  }, [params]);

  async function initWaiting(t: string) {
    try {
      const res = await fetch(`/api/join/${t}`);
      const data = await res.json();
      if (!res.ok) {
        router.replace(`/join/${t}`);
        return;
      }

      if (data.status === "ongoing") {
        router.replace(`/join/${t}/play`);
        return;
      }

      if (data.status === "selesai") {
        router.replace(`/join/${t}/result`);
        return;
      }

      setKuisId(data.kuisId);
      setJumlahPeserta(data.jumlahPeserta ?? 0);

      const meRes = await fetch(`/api/join/${t}/me`);
      const meData = await meRes.json();
      if (meData.nama) setNama(meData.nama);

      setIsReady(true);
    } catch {
      router.replace(`/join/${t}`);
    }
  }

  const handleKuisStart = useCallback(
    (t: string) => {
      router.replace(`/join/${t}/play`);
    },
    [router],
  );

  useEffect(() => {
    if (!kuisId || !token) return;

    const channel = supabase
      .channel(`kuis-status-${kuisId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kuis",
          filter: `kuis_id=eq.${kuisId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          if (newStatus === "ongoing") {
            handleKuisStart(token);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peserta_kuis",
          filter: `kuis_id=eq.${kuisId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setJumlahPeserta((prev) => prev + 1);
          }
          if (payload.eventType === "DELETE") {
            setJumlahPeserta((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kuisId, token, handleKuisStart]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/logo3.png"
            alt="Smartify"
            width={120}
            height={29}
            priority
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <div className="h-10 w-10 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
          </div>

          {isReady && nama && (
            <p className="text-base font-semibold text-card-foreground">
              Halo, {nama}!
            </p>
          )}
          <p className="mt-1 text-sm text-muted">
            Menunggu guru memulai kuis...
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-input px-4 py-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-card-foreground">
              {jumlahPeserta} peserta bergabung
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted">
          Jangan tutup halaman ini sebelum kuis dimulai.
        </p>
      </div>
    </div>
  );
}
