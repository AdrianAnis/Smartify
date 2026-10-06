"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  StopCircle,
  Trophy,
  ArrowLeft,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ParticipantMonitor {
  pesertaId: number;
  nama: string;
  status: string;
  tabViolations: number;
  joinedAt: string;
  submittedAt: string | null;
  answeredCount: number;
  score: number | null;
  statusKelulusan: string | null;
}

interface QuizMonitorData {
  kuis_id: number;
  judul: string;
  status: string;
  durasi_menit: number;
  kkm: number;
  total_soal: number;
  waktu_mulai_sesi: string | null;
  kode_kuis: string;
}

interface Props {
  kuisId: string;
  initialKuis: QuizMonitorData;
  initialParticipants: ParticipantMonitor[];
  realtimeToken: string | null;
}

export function TeacherMonitorClient({
  kuisId,
  initialKuis,
  initialParticipants,
  realtimeToken,
}: Props) {
  const router = useRouter();
  const [kuis, setKuis] = useState<QuizMonitorData>(initialKuis);
  const [participants, setParticipants] = useState<ParticipantMonitor[]>(initialParticipants);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [endError, setEndError] = useState("");
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`/api/quiz/${kuisId}/monitor`);
      if (!res.ok) {
        console.error(`Failed to refresh quiz monitor: HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      if (data.kuis) setKuis(data.kuis);
      if (data.participants) setParticipants(data.participants);
    } catch (error) {
      console.error("Failed to refresh quiz monitor:", error);
    }
  }, [kuisId]);

  const scheduleLatestRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => {
      refreshTimeoutRef.current = null;
      void fetchLatest();
    }, 150);
  }, [fetchLatest]);

  useEffect(() => {
    if (!kuis.waktu_mulai_sesi || kuis.status === "selesai") {
      setRemainingSeconds(0);
      return;
    }

    const startTime = new Date(kuis.waktu_mulai_sesi).getTime();
    const durationMs = kuis.durasi_menit * 60 * 1000;
    const endTime = startTime + durationMs;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemainingSeconds(diffSec);

      if (diffSec === 0 && kuis.status === "ongoing") {
        void fetchLatest();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [kuis.waktu_mulai_sesi, kuis.durasi_menit, kuis.status, fetchLatest]);

  useEffect(() => {
    const kId = Number(kuisId);
    const channel = supabase
      .channel(
        realtimeToken ? `quiz-${realtimeToken}` : `live-monitor-${kId}`,
        { config: { private: false } },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peserta_kuis",
          filter: `kuis_id=eq.${kId}`,
        },
        scheduleLatestRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jawaban_siswa",
          filter: `kuis_id=eq.${kId}`,
        },
        scheduleLatestRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hasil_kuis",
          filter: `kuis_id=eq.${kId}`,
        },
        scheduleLatestRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kuis",
          filter: `kuis_id=eq.${kId}`,
        },
        scheduleLatestRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sesi_kuis",
          filter: `kuis_id=eq.${kId}`,
        },
        scheduleLatestRefresh,
      )
      .on(
        "broadcast",
        { event: "quiz-updated" },
        scheduleLatestRefresh,
      )
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          scheduleLatestRefresh();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Teacher monitor realtime subscription failed:", error ?? status);
        }
      });

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      void supabase.removeChannel(channel);
    };
  }, [kuisId, realtimeToken, scheduleLatestRefresh]);

  async function handleEndQuiz() {
    setIsEnding(true);
    setEndError("");
    try {
      const res = await fetch(`/api/quiz/${kuisId}/end`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setEndError(data.error ?? "Gagal mengakhiri kuis.");
        return;
      }
      setEndDialogOpen(false);
      router.push(`/quiz/${kuisId}/result`);
    } catch {
      setEndError("Terjadi kesalahan koneksi.");
    } finally {
      setIsEnding(false);
    }
  }

  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      if (a.score !== null && b.score !== null) {
        return b.score - a.score;
      }
      if (a.score !== null) return -1;
      if (b.score !== null) return 1;
      return b.answeredCount - a.answeredCount;
    });
  }, [participants]);

  const stats = useMemo(() => {
    const total = participants.length;
    const selesai = participants.filter((p) => p.status === "selesai").length;
    const mengerjakan = participants.filter((p) => p.status === "mengerjakan").length;
    const lulus = participants.filter((p) => p.statusKelulusan === "lulus").length;

    const scored = participants.filter((p) => p.score !== null);
    const avgScore = scored.length > 0
      ? (scored.reduce((acc, p) => acc + (p.score ?? 0), 0) / scored.length).toFixed(1)
      : "-";

    const passRate = selesai > 0 ? Math.round((lulus / selesai) * 100) : 0;

    return { total, selesai, mengerjakan, avgScore, passRate };
  }, [participants]);

  function formatTime(seconds: number | null) {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const isQuizEnded = kuis.status === "selesai";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/quiz/${kuisId}/preview`}
            className="flex items-center justify-center rounded-xl p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Live Classroom Monitor
              </p>
              {isQuizEnded ? (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  Sesi Berakhir
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-0.5 text-xs font-medium text-success-text">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Live Realtime
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-card-foreground line-clamp-1">
              {kuis.judul}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border-none bg-card px-4 py-2 shadow-sm">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sisa Waktu
              </p>
              <p className="text-base font-bold font-mono text-card-foreground">
                {isQuizEnded ? "00:00" : formatTime(remainingSeconds)}
              </p>
            </div>
          </div>

          {isQuizEnded ? (
            <Link
              href={`/quiz/${kuisId}/result`}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90"
            >
              <Trophy className="h-4 w-4" />
              Buka Laporan Hasil
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEndError("");
                setEndDialogOpen(true);
              }}
              id="btn-akhiri-kuis"
              className="flex items-center gap-2 rounded-xl bg-danger-strong px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-danger-strong/90"
            >
              <StopCircle className="h-4 w-4" />
              Akhiri Kuis
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border-none bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted">Total Peserta</p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border-none bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted">Selesai Mengerjakan</p>
          <p className="mt-1 text-2xl font-bold text-success-text">
            {stats.selesai} <span className="text-xs font-normal text-muted">/ {stats.total}</span>
          </p>
        </div>
        <div className="rounded-xl border-none bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted">Rata-rata Nilai</p>
          <p className="mt-1 text-2xl font-bold text-primary-strong">{stats.avgScore}</p>
        </div>
        <div className="rounded-xl border-none bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted">Tingkat Kelulusan</p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">
            {stats.passRate}% <span className="text-xs font-normal text-muted">(KKM {kuis.kkm})</span>
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border-none bg-card shadow-sm">
        <div className="border-b border-border p-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-card-foreground">
                Leaderboard & Progres Siswa
              </h2>
            </div>
            <span className="text-xs text-muted">
              Auto update secara realtime
            </span>
          </div>
        </div>

        {sortedParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-card-foreground">Belum ada peserta di sesi ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Peringkat</th>
                  <th className="px-6 py-3.5">Nama Siswa</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Progres Soal</th>
                  <th className="px-6 py-3.5">Pelanggaran Tab</th>
                  <th className="px-6 py-3.5 text-right">Nilai Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedParticipants.map((p, idx) => {
                  const progressPct = kuis.total_soal > 0
                    ? Math.round((p.answeredCount / kuis.total_soal) * 100)
                    : 0;

                  return (
                    <tr key={p.pesertaId} className="transition-colors hover:bg-input/50">
                      <td className="px-6 py-4 font-semibold text-card-foreground">
                        {idx === 0 && p.score !== null ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                            1
                          </span>
                        ) : (
                          <span className="text-muted">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-card-foreground">
                        {p.nama}
                      </td>
                      <td className="px-6 py-4">
                        {p.status === "selesai" ? (
                          <span className="inline-flex items-center rounded-full bg-success-subtle px-2.5 py-1 text-xs font-medium text-success-text">
                            Selesai
                          </span>
                        ) : p.status === "mengerjakan" ? (
                          <span className="inline-flex items-center rounded-full bg-warning-subtle px-2.5 py-1 text-xs font-medium text-warning-text">
                            Mengerjakan
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            Menunggu
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-36">
                          <div className="flex justify-between text-xs text-muted mb-1">
                            <span>{p.answeredCount} / {kuis.total_soal}</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-input">
                            <div
                              className="h-1.5 rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.tabViolations > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-subtle px-2.5 py-0.5 text-xs font-medium text-danger-text">
                            <AlertTriangle className="h-3 w-3" />
                            {p.tabViolations}x pindah tab
                          </span>
                        ) : (
                          <span className="text-xs text-muted">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.score !== null ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-base font-bold text-card-foreground">
                              {p.score}
                            </span>
                            {p.statusKelulusan === "lulus" ? (
                              <span className="rounded-xl bg-success-subtle px-1.5 py-0.5 text-[10px] font-bold uppercase text-success-text">
                                Lulus
                              </span>
                            ) : (
                              <span className="rounded-xl bg-danger-subtle px-1.5 py-0.5 text-[10px] font-bold uppercase text-danger-text">
                                Remedial
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={endDialogOpen}
        title="Akhiri sesi kuis sekarang?"
        description="Semua siswa yang sedang mengerjakan kuis akan otomatis disubmit nilainya dan sesi kuis akan ditutup."
        confirmLabel="Ya, Akhiri Kuis"
        loadingLabel="Mengakhiri..."
        loading={isEnding}
        error={endError}
        onConfirm={handleEndQuiz}
        onCancel={() => setEndDialogOpen(false)}
      />
    </div>
  );
}
