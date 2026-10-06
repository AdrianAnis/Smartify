"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import {
  Check,
  Download,
  Link2,
  Loader2,
  Maximize2,
  Play,
  ScanLine,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DIFFICULTY_LABELS } from "@/lib/quiz/labels";

interface Peserta {
  peserta_id: number;
  nama: string;
  status: string;
  joined_at: string;
}

interface Props {
  kuisId: string;
  judul: string;
  totalSoal: number;
  durasiMenit: number;
  tingkatKesulitan: string;
  initialQrToken: string;
  initialJoinUrl: string;
  initialPeserta: Peserta[];
}

const QR_LOGO = { src: "/images/logo2.png", excavate: true };

function readCssColor(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function WaitingRoomClient({
  kuisId,
  judul,
  totalSoal,
  durasiMenit,
  tingkatKesulitan,
  initialQrToken,
  initialJoinUrl,
  initialPeserta,
}: Props) {
  const router = useRouter();
  const qrToken = initialQrToken;
  const joinUrl = initialJoinUrl;
  const numericKuisId = Number(kuisId);

  const [peserta, setPeserta] = useState<Peserta[]>(initialPeserta);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [kickTarget, setKickTarget] = useState<Peserta | null>(null);
  const [isKicking, setIsKicking] = useState(false);
  const [kickError, setKickError] = useState("");
  const [qrEnlarged, setQrEnlarged] = useState(false);
  const [qrColor] = useState(() => readCssColor("--foreground", "#1a1a1a"));
  const latestFetchIdRef = useRef(0);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const fetchPeserta = useCallback(async () => {
    const fetchId = ++latestFetchIdRef.current;
    try {
      const res = await fetch(`/api/quiz/${kuisId}/participants`);
      const data = await res.json();
      if (!res.ok) {
        console.error(`Failed to refresh waiting-room participants: HTTP ${res.status}`);
        return;
      }
      if (fetchId === latestFetchIdRef.current) {
        setPeserta(data.peserta ?? []);
      }
    } catch (error) {
      console.error("Failed to refresh waiting-room participants:", error);
    }
  }, [kuisId]);

  useEffect(() => {
    const channel = supabase
      .channel(`quiz-${qrToken}`, { config: { private: false } })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "peserta_kuis",
          filter: `kuis_id=eq.${numericKuisId}`,
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
          filter: `kuis_id=eq.${numericKuisId}`,
        },
        (payload) => {
          const deleted = payload.old as { peserta_id: number };
          setPeserta((prev) => prev.filter((x) => x.peserta_id !== deleted.peserta_id));
        },
      )
      .on("broadcast", { event: "quiz-updated" }, (payload) => {
        if (payload.payload.type === "participant_changed") {
          void fetchPeserta();
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void fetchPeserta();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Waiting-room realtime subscription failed:", status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [numericKuisId, qrToken, fetchPeserta]);

  useEffect(() => {
    if (!qrEnlarged) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQrEnlarged(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [qrEnlarged]);

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

  async function handleKick() {
    if (!kickTarget) return;
    setIsKicking(true);
    setKickError("");
    try {
      const res = await fetch(`/api/quiz/${kuisId}/participants/${kickTarget.peserta_id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setKickError(data.error ?? "Gagal mengeluarkan peserta.");
        return;
      }
      setPeserta((prev) => prev.filter((p) => p.peserta_id !== kickTarget.peserta_id));
      setKickTarget(null);
    } catch {
      setKickError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsKicking(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleDownloadQr() {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `QR-${judul.replace(/[^a-zA-Z0-9_-]+/g, "_")}.png`;
    link.click();
  }

  const difficultyLabel = DIFFICULTY_LABELS[tingkatKesulitan] ?? tingkatKesulitan;
  const hasPeserta = peserta.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Ruang tunggu
          </p>
          <h1 className="mt-1 line-clamp-1 text-2xl font-bold tracking-tight text-gray-900">
            {judul}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalSoal} soal · {durasiMenit} menit · {difficultyLabel}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section className="rounded-xl bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-primary">
            <ScanLine className="h-5 w-5" />
            <h2 className="text-lg font-bold text-gray-900">Gabung dari HP</h2>
          </div>

          <button
            type="button"
            onClick={() => setQrEnlarged(true)}
            aria-label="Perbesar kode QR"
            className="group mt-6 flex w-full flex-col items-center rounded-xl bg-gray-50 p-5 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="rounded-xl bg-white p-3 shadow-sm">
              <QRCodeCanvas
                ref={qrCanvasRef}
                value={joinUrl}
                size={232}
                level="H"
                fgColor={qrColor}
                marginSize={1}
                imageSettings={{ ...QR_LOGO, height: 44, width: 44 }}
              />
            </span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors group-hover:text-gray-900">
              <Maximize2 className="h-3.5 w-3.5" />
              Klik untuk memperbesar
            </span>
          </button>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              id="btn-salin-link"
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gray-100 px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Disalin
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Salin link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadQr}
              id="btn-download-qr"
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gray-100 px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Download className="h-4 w-4" />
              Download QR
            </button>
          </div>
        </section>

        <section className="flex flex-col rounded-xl bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums tracking-tight text-gray-900">
                  {peserta.length}
                </span>
                <span className="text-base font-medium text-gray-500">Siswa bergabung</span>
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <button
                type="button"
                onClick={handleStart}
                disabled={isStarting || !hasPeserta}
                id="btn-mulai-kuis"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memulai...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    Mulai Kuis
                  </>
                )}
              </button>
              {!hasPeserta && (
                <p className="text-center text-xs text-gray-400 sm:text-right">
                  Aktif setelah ada siswa bergabung
                </p>
              )}
            </div>
          </div>

          {startError && (
            <div className="mt-5 rounded-xl border border-danger-border bg-danger-subtle px-4 py-3 text-sm text-danger-text">
              {startError}
            </div>
          )}

          <div className="mt-6 flex min-h-[320px] flex-1 rounded-xl bg-gray-50 p-5 sm:p-6">
            {hasPeserta ? (
              <ul className="flex flex-wrap content-start gap-3">
                {peserta.map((p) => (
                  <li
                    key={p.peserta_id}
                    className="group inline-flex animate-[pop-in_220ms_ease-out] items-center gap-2.5 rounded-xl bg-white py-2 pl-2 pr-2 shadow-sm motion-reduce:animate-none"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {p.nama.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[14rem] truncate text-base font-semibold text-gray-900">
                      {p.nama}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setKickError("");
                        setKickTarget(p);
                      }}
                      aria-label={`Keluarkan ${p.nama}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-danger-subtle hover:text-danger-strong focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="m-auto flex max-w-xs flex-col items-center text-center">
                <span className="relative mb-5 flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/15 motion-reduce:animate-none" />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                    <Users className="h-7 w-7 text-primary" />
                  </span>
                </span>
                <p className="text-base font-semibold text-gray-900">Menunggu siswa bergabung</p>
                <p className="mt-1 text-sm text-gray-500">
                  Nama siswa akan muncul di sini secara otomatis setelah mereka memindai QR.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {qrEnlarged && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kode QR untuk bergabung"
          onClick={() => setQrEnlarged(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center rounded-xl bg-white p-6 shadow-xl sm:p-10"
          >
            <button
              type="button"
              onClick={() => setQrEnlarged(false)}
              aria-label="Tutup"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" />
            </button>
            <QRCodeSVG
              value={joinUrl}
              size={560}
              level="H"
              fgColor={qrColor}
              marginSize={1}
              imageSettings={{ ...QR_LOGO, height: 96, width: 96 }}
              style={{ width: "min(70vh, 80vw)", height: "min(70vh, 80vw)" }}
            />
            <p className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
              Scan untuk bergabung
            </p>
            <p className="mt-1 text-base text-gray-500">{judul}</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={kickTarget !== null}
        title="Keluarkan siswa?"
        description={`${kickTarget?.nama ?? "Siswa ini"} akan dikeluarkan dari ruang tunggu. Siswa masih bisa bergabung lagi dengan memindai QR.`}
        confirmLabel="Keluarkan"
        loadingLabel="Mengeluarkan..."
        loading={isKicking}
        error={kickError}
        onConfirm={() => void handleKick()}
        onCancel={() => setKickTarget(null)}
      />
    </div>
  );
}
