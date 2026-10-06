"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Users,
  Play,
  Copy,
  Check,
  X,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Peserta {
  peserta_id: number;
  nama: string;
  status: string;
  joined_at: string;
}

interface WaitingRoomState {
  qrToken: string;
  joinUrl: string;
  kodeKuis: string;
  judul: string;
  kuisId: number;
}

interface Props {
  kuisId: string;
  judul: string;
  kodeKuis: string;
  initialQrToken: string;
  initialJoinUrl: string;
}

export function WaitingRoomClient({
  kuisId,
  judul,
  kodeKuis,
  initialQrToken,
  initialJoinUrl,
}: Props) {
  const router = useRouter();
  const [room] = useState<WaitingRoomState>({
    qrToken: initialQrToken,
    joinUrl: initialJoinUrl,
    kodeKuis,
    judul,
    kuisId: Number(kuisId),
  });
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [kickingId, setKickingId] = useState<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchPeserta = useCallback(async () => {
    try {
      const res = await fetch(`/api/quiz/${kuisId}/participants`);
      const data = await res.json();
      if (res.ok) setPeserta(data.peserta ?? []);
    } catch {
      setPeserta([]);
    }
  }, [kuisId]);

  useEffect(() => {
    void fetchPeserta();
  }, [fetchPeserta]);

  useEffect(() => {
    const channel = supabase
      .channel(`waiting-room-${room.kuisId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "peserta_kuis",
          filter: `kuis_id=eq.${room.kuisId}`,
        },
        (payload) => {
          const p = payload.new as Peserta;
          setPeserta((prev) => {
            if (prev.some((x) => x.peserta_id === p.peserta_id)) return prev;
            return [...prev, p];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "peserta_kuis",
          filter: `kuis_id=eq.${room.kuisId}`,
        },
        (payload) => {
          const deleted = payload.old as { peserta_id: number };
          setPeserta((prev) =>
            prev.filter((x) => x.peserta_id !== deleted.peserta_id),
          );
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }
    };
  }, [room.kuisId]);

  async function handleStart() {
    setIsStarting(true);
    setStartError("");
    try {
      const res = await fetch(`/api/quiz/${kuisId}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setStartError(data.error ?? "Gagal memulai sesi.");
        return;
      }
      router.push(`/quiz/${kuisId}/monitor`);
    } catch {
      setStartError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleKick(pesertaId: number) {
    setKickingId(pesertaId);
    try {
      await fetch(`/api/quiz/${kuisId}/participants/${pesertaId}`, {
        method: "DELETE",
      });
    } catch {
    } finally {
      setKickingId(null);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(room.joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ruang Tunggu
          </p>
          <h1 className="mt-1 text-2xl font-bold text-card-foreground line-clamp-1">
            {judul}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center gap-1.5 rounded-full bg-success-subtle px-3 py-1 text-xs font-medium text-success-text">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Realtime aktif
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-warning-subtle px-3 py-1 text-xs font-medium text-warning-text">
              <WifiOff className="h-3 w-3" />
              Menghubungkan...
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="rounded-xl border-none bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-card-foreground">
                Peserta Bergabung
              </h2>
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Users className="h-3 w-3" />
                {peserta.length} peserta
              </span>
            </div>

            {peserta.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-input">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-card-foreground">
                  Belum ada peserta
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bagikan QR code atau tautan kepada siswa
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {peserta.map((p) => (
                  <li
                    key={p.peserta_id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {p.nama.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-card-foreground">
                        {p.nama}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleKick(p.peserta_id)}
                      disabled={kickingId === p.peserta_id}
                      aria-label={`Keluarkan ${p.nama}`}
                      className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-danger-subtle hover:text-danger-strong disabled:opacity-50"
                    >
                      {kickingId === p.peserta_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {startError && (
            <div className="rounded-xl border border-danger-border bg-danger-subtle px-4 py-3 text-sm text-danger-text">
              {startError}
            </div>
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting || peserta.length === 0}
            id="btn-mulai-kuis"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 font-semibold text-white-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Memulai...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current" />
                Mulai Kuis ({peserta.length} peserta)
              </>
            )}
          </button>
          {peserta.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Tombol aktif setelah ada peserta yang bergabung
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border-none bg-card p-6 shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="rounded-xl border-4 border-primary/20 p-2 bg-white">
                <QRCodeSVG
                  value={room.joinUrl}
                  size={200}
                  fgColor="#0ea5e9"
                  level="M"
                />
              </div>
            </div>

            <div className="mb-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kode Kuis
              </p>
              <p className="mt-1 text-3xl font-bold tracking-[0.2em] text-card-foreground">
                {kodeKuis}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              id="btn-salin-link"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-none px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-input"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Tautan disalin!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Salin Tautan
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl border-none bg-card p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tautan Join
            </p>
            <p className="break-all text-xs text-muted-foreground">
              {room.joinUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
