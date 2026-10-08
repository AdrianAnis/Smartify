"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, AlertTriangle, StopCircle, Trophy } from "lucide-react";
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
    if (!kuis.waktu_mulai_sesi || kuis.status === "selesai") return;

    const startTime = new Date(kuis.waktu_mulai_sesi).getTime();
    const durationMs = kuis.durasi_menit * 60 * 1000;
    const endTime = startTime + durationMs;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemainingSeconds(diffSec);

      if (diffSec === 0 && kuis.status === "ongoing" && Math.floor((now - endTime) / 1000) % 5 === 0) {
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
  const isTimeLow = !isQuizEnded && remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds <= 60;

  const statItems = [
    { label: "Total peserta", value: String(stats.total), hint: null },
    { label: "Selesai mengerjakan", value: String(stats.selesai), hint: `dari ${stats.total}` },
    { label: "Rata-rata nilai", value: stats.avgScore, hint: null },
    { label: "Tingkat kelulusan", value: `${stats.passRate}%`, hint: `KKM ${kuis.kkm}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Monitor kuis
            </p>
            {isQuizEnded && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                Sesi berakhir
              </span>
            )}
          </div>
          <h1 className="mt-1 line-clamp-1 text-2xl font-bold tracking-tight text-gray-900">
            {kuis.judul}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Sisa waktu
            </p>
            <p
              className={`font-mono text-3xl font-bold leading-tight tabular-nums ${
                isTimeLow ? "text-danger" : "text-gray-900"
              }`}
            >
              {isQuizEnded ? "00:00" : formatTime(remainingSeconds)}
            </p>
          </div>

          {isQuizEnded ? (
            <Link
              href={`/quiz/${kuisId}/result`}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Trophy className="h-4 w-4" />
              Buka laporan hasil
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEndError("");
                setEndDialogOpen(true);
              }}
              id="btn-akhiri-kuis"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-danger-strong px-6 text-base font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2"
            >
              <StopCircle className="h-4 w-4" />
              Akhiri kuis
            </button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-y-6 rounded-xl bg-card p-6 shadow-sm sm:grid-cols-4 sm:gap-y-0">
        {statItems.map((item, index) => (
          <div
            key={item.label}
            className={`sm:px-6 ${index === 0 ? "sm:pl-0" : "sm:border-l sm:border-gray-100"}`}
          >
            <dt className="text-sm text-gray-500">{item.label}</dt>
            <dd className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums tracking-tight text-gray-900">
                {item.value}
              </span>
              {item.hint && <span className="text-sm text-gray-400">{item.hint}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="overflow-hidden rounded-xl bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900">Progres siswa</h2>
          <span className="text-xs text-gray-400">Diperbarui otomatis</span>
        </div>

        {sortedParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-t border-gray-100 py-16 text-center">
            <Users className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">Belum ada peserta di sesi ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3">No</th>
                  <th className="px-6 py-3">Nama siswa</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Progres soal</th>
                  <th className="px-6 py-3">Pindah tab</th>
                  <th className="px-6 py-3 text-right">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedParticipants.map((p, idx) => {
                  const progressPct = kuis.total_soal > 0
                    ? Math.round((p.answeredCount / kuis.total_soal) * 100)
                    : 0;

                  return (
                    <tr key={p.pesertaId} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {idx === 0 && p.score !== null ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                            1
                          </span>
                        ) : (
                          <span className="pl-1.5 text-gray-500">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{p.nama}</td>
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
                        <div className="flex w-44 items-center gap-3">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                            <div
                              className="h-1.5 rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-xs tabular-nums text-gray-500">
                            {p.answeredCount}/{kuis.total_soal}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.tabViolations > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-subtle px-2.5 py-0.5 text-xs font-medium text-danger-text">
                            <AlertTriangle className="h-3 w-3" />
                            {p.tabViolations}x
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.score !== null ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-base font-bold tabular-nums text-gray-900">
                              {Number.isInteger(p.score) ? p.score : Number(p.score.toFixed(1))}
                            </span>
                            {p.statusKelulusan === "lulus" ? (
                              <span className="rounded-xl bg-success-subtle px-2 py-0.5 text-xs font-semibold text-success-text">
                                Lulus
                              </span>
                            ) : (
                              <span className="rounded-xl bg-danger-subtle px-2 py-0.5 text-xs font-semibold text-danger-text">
                                Remedial
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
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
        confirmLabel="Ya, akhiri kuis"
        loadingLabel="Mengakhiri..."
        loading={isEnding}
        error={endError}
        onConfirm={handleEndQuiz}
        onCancel={() => setEndDialogOpen(false)}
      />
    </div>
  );
}
