"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronUp,
  Clock,
  Loader2,
  Users,
  X,
  XCircle,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  pesertaId: number;
  nama: string;
  score: number;
  statusKelulusan: string;
  isCurrentStudent: boolean;
}

interface ReviewQuestion {
  soalId: number;
  urutan: number;
  teksSoal: string;
  tipeSoal: string;
  topik: string;
  penjelasan: string;
  studentAnswer: string;
  isBenar: boolean;
  correctAnswer: string;
}

interface ResultData {
  nama: string;
  judul: string;
  kkm: number;
  totalSoal: number;
  score: number;
  statusKelulusan: "lulus" | "remedial";
  tabViolations: number;
  gradedAt: string;
  rank: number;
  totalParticipants: number;
  leaderboard: LeaderboardEntry[];
  correctCount: number;
  reviewAvailable: boolean;
  reviewQuestions: ReviewQuestion[];
}

function formatScore(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(1));
}

export default function StudentQuizResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { token: t } = await params;
      if (cancelled) return;
      setToken(t);

      try {
        const res = await fetch(`/api/join/${t}/result`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Gagal memuat hasil kuis.");
          return;
        }
        setResult(data);
      } catch {
        if (!cancelled) setError("Terjadi kesalahan koneksi.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  function toggleReview() {
    const next = !showReview;
    setShowReview(next);
    if (next) {
      setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted">Memuat hasil kuis...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-xl bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted">{error || "Hasil kuis belum ada"}</p>
          <button
            type="button"
            onClick={() => router.replace(`/join/${token}`)}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const isLulus = result.statusKelulusan === "lulus";
  const correctCount = result.correctCount;
  const incorrectCount = Math.max(0, result.totalSoal - correctCount);
  const displayScore = formatScore(result.score);
  const accuracy = Math.round((correctCount / (result.totalSoal || 1)) * 100);
  const infoItems = [
    { icon: Users, label: "Peringkat", value: `#${result.rank} dari ${result.totalParticipants}` },
    { icon: Award, label: "Total soal", value: `${result.totalSoal} soal` },
    { icon: Clock, label: "Pindah tab", value: `${result.tabViolations} kali` },
    { icon: CheckCircle2, label: "Akurasi", value: `${accuracy}%` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-success-text">
              Kuis selesai
            </p>
            <h1 className="line-clamp-1 text-lg font-bold text-gray-900 sm:text-xl">
              {result.judul}
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-6 max-w-4xl space-y-6 px-4 pb-28 sm:mt-8 sm:px-6 sm:pb-12">
        <section className="rounded-xl bg-card p-5 shadow-sm sm:p-8">
          <div className="flex flex-col items-center py-4 text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Nilai akhir
            </h2>
            <p className="mt-1 text-sm text-gray-500">{result.nama}</p>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-7xl font-bold leading-none tabular-nums tracking-tight text-gray-900 sm:text-8xl">
                {displayScore}
              </span>
              <span className="text-lg font-medium text-gray-400">/ 100</span>
            </div>

            <div
              className={`mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2 ${
                isLulus ? "bg-success-subtle text-success-text" : "bg-danger-subtle text-danger-text"
              }`}
            >
              <span className="text-sm font-semibold">{isLulus ? "Lulus" : "Remedial"}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {isLulus
                ? `Nilai mencapai KKM ${result.kkm}`
                : `Nilai di bawah KKM ${result.kkm}`}
            </p>
          </div>

          <div className="my-6 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                Benar
              </div>
              <span className="text-2xl font-bold tabular-nums text-gray-900">{correctCount}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <XCircle className="h-5 w-5 shrink-0 text-danger" />
                Salah
              </div>
              <span className="text-2xl font-bold tabular-nums text-gray-900">{incorrectCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-2 sm:gap-x-10">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 items-center justify-between gap-3 text-sm"
              >
                <div className="flex shrink-0 items-center gap-2 text-gray-600">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-card shadow-sm">
          <div className="px-5 py-4 sm:px-8">
            <h2 className="text-sm font-semibold text-gray-900">
              Peringkat kelas ({result.leaderboard.length} peserta)
            </h2>
          </div>
          <ul className="divide-y divide-gray-100 border-t border-gray-100 text-sm">
            {result.leaderboard.map((item) => (
              <li
                key={item.pesertaId}
                className={`flex items-center justify-between gap-3 px-5 py-3 sm:px-8 ${
                  item.isCurrentStudent ? "bg-primary/10 font-semibold" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.rank === 1
                        ? "bg-amber-100 text-amber-700"
                        : item.rank === 2
                          ? "bg-gray-200 text-gray-700"
                          : item.rank === 3
                            ? "bg-amber-50 text-amber-800"
                            : "text-muted"
                    }`}
                  >
                    {item.rank}
                  </span>
                  <span className="truncate text-gray-900">
                    {item.nama} {item.isCurrentStudent && "(Kamu)"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-bold tabular-nums text-gray-900">{formatScore(item.score)}</span>
                  <span
                    className={`rounded-xl px-2 py-0.5 text-xs font-semibold ${
                      item.statusKelulusan === "lulus"
                        ? "bg-success-subtle text-success-text"
                        : "bg-danger-subtle text-danger-text"
                    }`}
                  >
                    {item.statusKelulusan === "lulus" ? "Lulus" : "Remedial"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {!result.reviewAvailable && (
          <p className="text-center text-sm text-gray-500 sm:text-right">
            Pembahasan soal tersedia setelah guru mengakhiri kuis.
          </p>
        )}

        {result.reviewAvailable && (
          <div className="hidden sm:flex sm:justify-end">
            <button
              type="button"
              onClick={toggleReview}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {showReview ? "Sembunyikan pembahasan" : "Lihat jawaban dan pembahasan"}
              {showReview ? <ChevronUp className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
            </button>
          </div>
        )}

        {showReview && (
          <div ref={reviewRef} className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Jawaban dan pembahasan</h2>
            {result.reviewQuestions.map((q, idx) => (
              <article key={q.soalId} className="space-y-3 rounded-xl bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">Soal {idx + 1}.</span>
                    <span className="rounded-xl bg-gray-100 px-2 py-0.5 text-xs font-medium text-muted">
                      {q.topik}
                    </span>
                  </div>
                  {q.isBenar ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-subtle px-2.5 py-0.5 text-xs font-semibold text-success-text">
                      <Check className="h-3.5 w-3.5" />
                      Benar
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger-subtle px-2.5 py-0.5 text-xs font-semibold text-danger-text">
                      <X className="h-3.5 w-3.5" />
                      Salah
                    </span>
                  )}
                </div>

                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-900">{q.teksSoal}</p>

                <div className="space-y-1.5 rounded-xl bg-gray-50 p-3.5 text-sm">
                  <div className="flex gap-2">
                    <span className="w-28 shrink-0 font-medium text-muted">Jawaban Anda:</span>
                    <span
                      className={`font-semibold ${q.isBenar ? "text-success-text" : "text-danger-text"}`}
                    >
                      {q.studentAnswer || "(Tidak dijawab)"}
                    </span>
                  </div>
                  {!q.isBenar && q.correctAnswer && (
                    <div className="flex gap-2">
                      <span className="w-28 shrink-0 font-medium text-muted">Kunci jawaban:</span>
                      <span className="font-semibold text-success-text">{q.correctAnswer}</span>
                    </div>
                  )}
                </div>

                {q.penjelasan && (
                  <div className="rounded-xl bg-success-subtle p-3.5 text-sm leading-relaxed text-success-text">
                    <span className="mb-0.5 block font-semibold">Penjelasan</span>
                    {q.penjelasan}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {result.reviewAvailable && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-card/95 p-4 shadow-[0_-1px_0_rgba(0,0,0,0.06)] backdrop-blur sm:hidden">
          <button
            type="button"
            onClick={toggleReview}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {showReview ? "Sembunyikan pembahasan" : "Lihat jawaban dan pembahasan"}
            {showReview ? (
              <ChevronUp className="h-5 w-5 shrink-0" />
            ) : (
              <ArrowRight className="h-5 w-5 shrink-0" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
