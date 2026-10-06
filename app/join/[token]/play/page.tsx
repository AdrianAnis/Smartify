"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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

interface PesertaMeta {
  pesertaId: number;
  nama: string;
  status: string;
  tabViolations: number;
}

function QuestionListPanel({
  questions,
  answers,
  currentIndex,
  answeredCount,
  onSelect,
  onClose,
}: {
  questions: Question[];
  answers: Record<number, string>;
  currentIndex: number;
  answeredCount: number;
  onSelect: (index: number) => void;
  onClose?: () => void;
}) {
  return (
    <section
      aria-label="Daftar Soal"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-card-foreground">
          Daftar Soal
          <span className="ml-1.5 font-medium text-muted">
            {answeredCount}/{questions.length}
          </span>
        </h3>
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

      <div className="grid max-h-72 grid-cols-5 gap-2 overflow-y-auto p-1">
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
              className={`flex h-11 w-full items-center justify-center rounded-xl border text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : isAnswered
                    ? "border-success bg-success text-white"
                    : "border-border bg-card text-card-foreground hover:bg-input"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-3 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-primary bg-primary" />
          <span>Aktif</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-success bg-success" />
          <span>Sudah Dijawab</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-border bg-card" />
          <span>Belum Dijawab</span>
        </div>
      </div>
    </section>
  );
}

export default function StudentQuizPlayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [kuis, setKuis] = useState<QuizMeta | null>(null);
  const [peserta, setPeserta] = useState<PesertaMeta | null>(null);
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

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      loadQuiz(t);
    });
  }, [params]);

  async function loadQuiz(t: string) {
    setIsLoading(true);
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
      setPeserta(data.peserta);
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

    const channel = supabase
      .channel(`play-kuis-${kuis.kuisId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kuis",
          filter: `kuis_id=eq.${kuis.kuisId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          if (newStatus === "selesai") {
            void performSubmit();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kuis?.kuisId, performSubmit]);

  const reportViolation = useCallback(async () => {
    if (isSubmitting || isAutoSubmittingRef.current) return;
    try {
      const res = await fetch(`/api/join/${token}/violations`, { method: "POST" });
      const data = await res.json();
      if (data.violations) {
        setViolationCount(data.violations);
        setViolationAlertOpen(true);
      }
    } catch {
    }
  }, [token, isSubmitting]);

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

  function getTimerBg(sec: number | null) {
    if (sec === null) return "bg-primary";
    if (sec <= 60) return "bg-danger";
    if (sec <= 300) return "bg-warning";
    return "bg-cyan-500";
  }

  function formatTimer(sec: number | null) {
    if (sec === null) return "--:--";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted">Memuat lembar soal...</p>
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
  const isCurrentAnswered = Boolean(answers[currentSoal.soal_id]?.trim());
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo3.png"
              alt="Smartify"
              width={90}
              height={22}
              priority
            />
            <div className="hidden sm:block h-4 w-[1px] bg-border" />
            <span className="hidden sm:block text-xs font-semibold text-card-foreground line-clamp-1 max-w-[200px]">
              {kuis.judul}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors ${getTimerBg(
                remainingSeconds,
              )}`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={`Buka daftar soal, ${answeredCount} dari ${questions.length} sudah dijawab`}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-input lg:hidden"
            >
              <Grid className="h-3.5 w-3.5 text-primary" />
              <span>Daftar Soal</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-6 p-4 pb-28 sm:p-6 sm:pb-28">
        <div className="w-full max-w-3xl min-w-0 flex-1">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Soal {currentIndex + 1} dari {questions.length}
                </span>
                <span className="rounded-xl bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {currentSoal.topik}
                </span>
              </div>
              <span className="text-xs text-muted">{currentSoal.poin} Poin</span>
            </div>

            <div className="mb-8">
              <h2 className="text-base font-semibold leading-relaxed text-card-foreground whitespace-pre-line sm:text-lg">
                {currentSoal.teks_soal}
              </h2>
            </div>

            {currentSoal.tipe_soal === "pilihan_ganda" ? (
              <div className="space-y-3">
                {currentSoal.pilihan.map((p, idx) => {
                  const isSelected = answers[currentSoal.soal_id] === p.teks_pilihan;
                  const letter = String.fromCharCode(65 + idx);

                  return (
                    <button
                      key={p.pilihan_id}
                      type="button"
                      onClick={() => handleSelectAnswer(currentSoal.soal_id, p.teks_pilihan)}
                      className={`flex w-full min-w-0 items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-cyan-50/60 shadow-sm"
                          : "border-border hover:bg-gray-50/50"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-input text-gray-700"
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="min-w-0 break-words text-sm font-medium text-card-foreground">
                        {p.teks_pilihan}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
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
          </div>
        </div>

        <aside className="sticky top-24 hidden w-64 shrink-0 lg:block">
          <QuestionListPanel
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            answeredCount={answeredCount}
            onSelect={setCurrentIndex}
          />
        </aside>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur sm:p-4">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-6">
          <div className="flex w-full max-w-3xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-input disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubmitDialogOpen(true)}
                className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                Kumpulkan
              </button>

              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={() => setSubmitDialogOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
                >
                  <span>Selesai</span>
                  <Send className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

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
