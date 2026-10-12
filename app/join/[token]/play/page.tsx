"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Grid,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabase/client";

interface QuestionOption {
  pilihan_id: number;
  teks_pilihan: string;
  urutan: number;
}

interface Question {
  soal_id: number;
  teks_soal: string;
  tipe_soal: "pilihan_ganda" | "isian_singkat" | "uraian";
  poin: number;
  urutan: number;
  topik: string;
  pilihan: QuestionOption[];
}

interface QuizMeta {
  kuisId: number;
  judul: string;
  durasiMenit: number;
  kkm: number;
  status: string;
  waktuMulaiSesi: string | null;
  totalSoal: number;
}

function QuestionListPanel({
  questions,
  answers,
  currentIndex,
  answeredCount,
  onSelect,
  onSubmit,
  onClose,
}: {
  questions: Question[];
  answers: Record<number, string>;
  currentIndex: number;
  answeredCount: number;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onClose?: () => void;
}) {
  return (
    <section aria-label="Daftar Soal" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-card-foreground">Daftar Soal</h3>
          <p className="mt-0.5 text-xs text-muted">
            <span className="font-semibold text-primary">{answeredCount}</span> dari {questions.length} sudah dijawab
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup daftar soal"
            className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-input"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-4 grid max-h-72 grid-cols-5 gap-2 overflow-y-auto p-1">
        {questions.map((question, index) => {
          const isCurrent = index === currentIndex;
          const isAnswered = Boolean(answers[question.soal_id]?.trim());

          return (
            <button
              key={question.soal_id}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Soal ${index + 1}${isCurrent ? ", aktif" : isAnswered ? ", sudah dijawab" : ", belum dijawab"}`}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex h-10 w-full items-center justify-center rounded-lg text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isCurrent
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : isAnswered
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "border border-border bg-card text-gray-500 hover:border-primary/40! hover:text-primary"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          Aktif
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/20" />
          Dijawab
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-border bg-card" />
          Belum
        </span>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30! bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
      >
        <Send className="h-4 w-4" />
        Kumpulkan Jawaban
      </button>
    </section>
  );
}

export default function StudentQuizPlayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { token } = use(params);
  const [kuis, setKuis] = useState<QuizMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [violationAlertOpen, setViolationAlertOpen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const isAutoSubmittingRef = useRef(false);
  const lastViolationAtRef = useRef(0);

  useEffect(() => {
    async function loadQuiz(t: string) {
      try {
        const res = await fetch(`/api/join/${t}/questions`);
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.replace(`/join/${t}`);
            return;
          }
          setError(data.error ?? "Gagal memuat soal kuis.");
          return;
        }

        if (data.peserta?.status === "selesai") {
          router.replace(`/join/${t}/result`);
          return;
        }

        setKuis(data.kuis);
        setQuestions(data.questions ?? []);
        setViolationCount(data.peserta?.tabViolations ?? 0);

        const saved: Record<number, string> = {};
        (data.savedAnswers ?? []).forEach((a: { soal_id: number; jawaban_text: string }) => {
          saved[a.soal_id] = a.jawaban_text;
        });
        setAnswers(saved);
      } catch {
        setError("Terjadi kesalahan koneksi saat memuat kuis.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadQuiz(token);
  }, [token, router]);

  const performSubmit = useCallback(async () => {
    if (isSubmitting || isAutoSubmittingRef.current) return;
    isAutoSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/join/${token}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        router.replace(`/join/${token}/result`);
      } else {
        alert(data.error ?? "Gagal mengumpulkan kuis.");
        isAutoSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch {
      alert("Terjadi kesalahan jaringan saat mengumpulkan kuis.");
      isAutoSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [token, isSubmitting, router]);

  useEffect(() => {
    if (!kuis || !kuis.waktuMulaiSesi) return;

    const startTime = new Date(kuis.waktuMulaiSesi).getTime();
    const durationMs = kuis.durasiMenit * 60 * 1000;
    const endTime = startTime + durationMs;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemainingSeconds(diffSec);

      if (diffSec <= 0) {
        clearInterval(interval);
        void performSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [kuis, performSubmit]);

  useEffect(() => {
    if (!kuis?.kuisId) return;

    async function syncQuizStatus() {
      try {
        const res = await fetch(`/api/join/${token}`, { cache: "no-store" });
        const data = await res.json();
        if (data.status === "selesai" || data.status === "finished") {
          const resultRes = await fetch(`/api/join/${token}/result?ready=1`, {
            cache: "no-store",
          });
          const resultData = await resultRes.json();
          if (resultRes.ok && resultData.ready) {
            router.replace(`/join/${token}/result`);
          } else if (!resultRes.ok) {
            console.error(
              `Failed to verify quiz result before navigation: HTTP ${resultRes.status}`,
            );
          }
        }
      } catch (error) {
        console.error("Failed to sync active quiz status:", error);
      }
    }

    const channel = supabase
      .channel(`quiz-${token}`, { config: { private: false } })
      .on(
        "broadcast",
        { event: "quiz-updated" },
        () => {
          void syncQuizStatus();
        },
      )
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          void syncQuizStatus();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Student quiz realtime subscription failed:", error ?? status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [kuis?.kuisId, token, router]);

  const reportViolation = useCallback(async () => {
    if (isSubmitting || isAutoSubmittingRef.current) return;
    const now = Date.now();
    if (now - lastViolationAtRef.current < 1000) return;
    lastViolationAtRef.current = now;

    try {
      const res = await fetch(`/api/join/${token}/violations`, { method: "POST" });
      const data = await res.json();
      if (data.autoSubmitted) {
        isAutoSubmittingRef.current = true;
        router.replace(`/join/${token}/result`);
        return;
      }
      if (data.violations) {
        setViolationCount(data.violations);
        setViolationAlertOpen(true);
      }
    } catch (error) {
      console.error("Failed to report tab violation:", error);
    }
  }, [token, isSubmitting, router]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        void reportViolation();
      }
    }

    function handleBlur() {
      void reportViolation();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [reportViolation]);

  async function handleSelectAnswer(soalId: number, text: string) {
    setAnswers((prev) => ({ ...prev, [soalId]: text }));

    try {
      await fetch(`/api/join/${token}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soalId, jawabanText: text }),
      });
    } catch {
    }
  }

  function getTimerTone(sec: number | null) {
    if (sec !== null && sec <= 60) return "border-danger-border! bg-danger-subtle text-danger-text animate-pulse motion-reduce:animate-none";
    if (sec !== null && sec <= 300) return "border-warning/30! bg-warning-subtle text-warning-text";
    return "border-primary/20! bg-primary/10 text-primary";
  }

  function formatTimer(sec: number | null) {
    if (sec === null) return "--:--";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" aria-busy="true">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-6 p-4 sm:p-6">
          <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32 rounded-full" />
              </div>
              <Skeleton className="h-4 w-14" />
            </div>
            <Skeleton className="mt-6 h-7 w-full" />
            <Skeleton className="mt-2 h-7 w-2/3" />
            <div className="mt-8 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
          <div className="hidden w-72 shrink-0 rounded-2xl border border-border bg-card p-5 shadow-sm lg:block">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-3 w-36" />
            <div className="mt-4 grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <Skeleton className="mt-6 h-10 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !kuis || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-danger" />
          <h1 className="mt-3 text-lg font-bold text-card-foreground">Gagal Memuat Kuis</h1>
          <p className="mt-2 text-sm text-muted">{error || "Soal tidak tersedia"}</p>
        </div>
      </div>
    );
  }

  const currentSoal = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter((k) => answers[Number(k)]?.trim()).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Image src="/images/logo3.png" alt="Smartify" width={100} height={24} priority className="shrink-0" />
            <div className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden truncate text-sm font-semibold text-card-foreground sm:block">{kuis.judul}</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div
              role="timer"
              aria-label="Sisa waktu"
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-bold tabular-nums transition-colors ${getTimerTone(
                remainingSeconds,
              )}`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={`Buka daftar soal, ${answeredCount} dari ${questions.length} sudah dijawab`}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-card-foreground transition-colors hover:bg-input lg:hidden"
            >
              <Grid className="h-4 w-4 text-primary" />
              <span className="tabular-nums">
                {answeredCount}/{questions.length}
              </span>
            </button>
          </div>
        </div>
        <div
          className="h-1 w-full bg-input"
          role="progressbar"
          aria-label="Soal terjawab"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={answeredCount}
        >
          <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-6 p-4 pb-24 sm:p-6 sm:pb-24 lg:pb-6">
        <div className="min-w-0 flex-1">
          <article className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-primary">
                  Soal {currentIndex + 1}
                  <span className="font-medium text-muted"> dari {questions.length}</span>
                </span>
                {currentSoal.topik && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {currentSoal.topik}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-muted">{currentSoal.poin} poin</span>
            </div>

            <h2 className="mt-5 whitespace-pre-line text-lg font-semibold leading-relaxed text-card-foreground sm:text-xl">
              {currentSoal.teks_soal}
            </h2>

            {currentSoal.tipe_soal === "pilihan_ganda" ? (
              <div className="mt-8 space-y-3">
                {currentSoal.pilihan.map((p, idx) => {
                  const isSelected = answers[currentSoal.soal_id] === p.teks_pilihan;
                  const letter = String.fromCharCode(65 + idx);

                  return (
                    <button
                      key={p.pilihan_id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectAnswer(currentSoal.soal_id, p.teks_pilihan)}
                      className={`group flex w-full min-w-0 items-center gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        isSelected ? "border-primary! bg-primary/5" : "border-border hover:border-primary/40! hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                          isSelected ? "bg-primary text-white" : "bg-input text-gray-600 group-hover:text-primary"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-sm font-medium text-card-foreground sm:text-base">
                        {p.teks_pilihan}
                      </span>
                      <CheckCircle2
                        className={`h-5 w-5 shrink-0 text-primary transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                <label
                  htmlFor="text-answer"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Tuliskan Jawaban Anda
                </label>
                <textarea
                  id="text-answer"
                  rows={4}
                  value={answers[currentSoal.soal_id] ?? ""}
                  onChange={(e) => handleSelectAnswer(currentSoal.soal_id, e.target.value)}
                  placeholder="Ketik jawaban singkat Anda di sini..."
                  className="w-full rounded-xl border border-border bg-input p-4 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </article>

          <nav
            aria-label="Navigasi soal"
            className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6 lg:static lg:mt-4 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
          >
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-input disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubmitDialogOpen(true)}
                className="rounded-xl border border-primary/30! bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 lg:hidden"
              >
                Kumpulkan
              </button>

              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={() => setSubmitDialogOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
                >
                  <span>Selesai</span>
                  <Send className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </nav>
        </div>

        <aside className="sticky top-20 hidden w-72 shrink-0 lg:block">
          <QuestionListPanel
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            answeredCount={answeredCount}
            onSelect={setCurrentIndex}
            onSubmit={() => setSubmitDialogOpen(true)}
          />
        </aside>
      </main>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Daftar Soal"
            className="max-h-[calc(100dvh-1rem)] w-full overflow-y-auto rounded-t-xl bg-background p-3 shadow-xl sm:max-w-md sm:rounded-xl sm:p-4"
          >
            <QuestionListPanel
              questions={questions}
              answers={answers}
              currentIndex={currentIndex}
              answeredCount={answeredCount}
              onSelect={(index) => {
                setCurrentIndex(index);
                setDrawerOpen(false);
              }}
              onSubmit={() => {
                setDrawerOpen(false);
                setSubmitDialogOpen(true);
              }}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={submitDialogOpen}
        title="Kumpulkan jawaban kuis?"
        description={`Anda telah menjawab ${answeredCount} dari total ${questions.length} soal. Setelah dikumpulkan, jawaban tidak dapat diubah lagi.`}
        confirmLabel="Ya, Kumpulkan Sekarang"
        loadingLabel="Mengumpulkan..."
        loading={isSubmitting}
        onConfirm={performSubmit}
        onCancel={() => setSubmitDialogOpen(false)}
      />

      {violationAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-danger-border bg-card p-6 shadow-xl text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger-subtle text-danger">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-card-foreground">Peringatan Anti-Curang</h3>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              Anda terdeteksi berpindah tab atau meninggalkan jendela ujian ({violationCount}x pelanggaran).
              Aktivitas ini tercatat secara realtime ke pengawas/guru.
            </p>
            <button
              type="button"
              onClick={() => setViolationAlertOpen(false)}
              className="mt-5 w-full rounded-xl bg-danger-strong py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-danger-strong/90"
            >
              Saya Mengerti & Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
