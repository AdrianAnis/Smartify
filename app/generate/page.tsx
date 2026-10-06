"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Lightbulb,
  Sparkles,
  ChevronDown,
  Loader2,
  CheckCircle2,
  FileText,
  X,
} from "lucide-react";
import {
  FREE_TRIAL_MAX_QUESTIONS,
  PREMIUM_MAX_QUESTIONS,
  isPremiumEffective,
} from "@/lib/subscription/plan";

type QuizType = "pilihan_ganda" | "isian_singkat" | "campuran";
type Difficulty = "easy" | "medium" | "hard";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Mudah" },
  { value: "medium", label: "Sedang" },
  { value: "hard", label: "Sulit" },
];

const LOADING_STEPS = [
  "Mengunggah materi",
  "Membaca isi PDF",
  "Menyusun soal per topik",
  "Membuat kunci jawaban dan penjelasan",
  "Menyimpan kuis",
];

const inputClass =
  "w-full rounded-xl bg-input px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  suffix: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-label">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clamp(parseInt(e.target.value, 10), min, max))}
          className={`${inputClass} pr-20`}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted">
          {suffix}
        </span>
      </div>
    </div>
  );
}

export default function GenerateQuizPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [quizType, setQuizType] = useState<QuizType>("pilihan_ganda");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [pilganCount, setPilganCount] = useState(10);
  const [isianCount, setIsianCount] = useState(5);
  const [duration, setDuration] = useState(45);
  const [kkm, setKkm] = useState(75);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [limitError, setLimitError] = useState("");

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const { user } = await res.json();
        setIsPremium(isPremiumEffective(user?.subscription_status, user?.expired_at));
      } catch (err) {
        console.error("Load plan error:", err);
      }
    };
    void loadPlan();
  }, []);

  const maxQuestions = isPremium ? PREMIUM_MAX_QUESTIONS : FREE_TRIAL_MAX_QUESTIONS;
  const effectiveType: QuizType = isPremium ? quizType : "pilihan_ganda";
  const pilgan = effectiveType === "isian_singkat" ? 0 : pilganCount;
  const isian = effectiveType === "pilihan_ganda" ? 0 : isianCount;
  const totalQuestions = pilgan + isian;

  const selectFile = (selected: File | undefined) => {
    setError("");
    if (!selected) return;
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Hanya file PDF yang diperbolehkan");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 10 MB");
      return;
    }
    setFile(selected);
  };

  const validationError = (() => {
    if (!file) return "Unggah materi PDF terlebih dahulu";
    if (!title.trim()) return "Judul kuis wajib diisi";
    if (totalQuestions < 1) return "Jumlah soal minimal 1";
    if (effectiveType === "campuran" && (pilgan < 1 || isian < 1)) {
      return "Soal campuran butuh minimal 1 pilihan ganda dan 1 isian singkat";
    }
    if (totalQuestions > maxQuestions) {
      return `Jumlah soal maksimal ${maxQuestions} untuk paket ${isPremium ? "Premium" : "Free Trial"}`;
    }
    return "";
  })();

  const handleGenerate = async () => {
    if (validationError || !file) {
      setError(validationError);
      return;
    }

    setError("");
    setLimitError("");
    setDone(false);
    setLoading(true);
    setLoadingStep(0);

    const timer = setInterval(() => {
      setLoadingStep((step) => Math.min(step + 1, LOADING_STEPS.length - 1));
    }, 6000);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("type", effectiveType);
      formData.append("difficulty", difficulty);
      formData.append("pilganCount", String(pilgan));
      formData.append("isianCount", String(isian));
      formData.append("duration", String(duration));
      formData.append("kkm", String(kkm));

      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "SUBSCRIPTION_LIMIT") {
          setLimitError(data.error);
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Gagal membuat kuis");
      }

      setLoadingStep(LOADING_STEPS.length);
      setDone(true);
      setTimeout(() => router.push(`/quiz/${data.quizId}/preview`), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat kuis");
      setLoading(false);
    } finally {
      clearInterval(timer);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Generate Quiz
        </p>
        <h1 className="text-2xl font-bold text-card-foreground">Buat Kuis Baru</h1>
      </div>

      {limitError && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {limitError}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-danger-border bg-danger-subtle px-4 py-3 text-sm text-danger-text">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              1
            </span>
            <h2 className="text-lg font-semibold text-card-foreground">Sumber Materi</h2>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              selectFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {file ? (
            <div className="flex items-center gap-4 rounded-xl border-2 border-primary bg-primary/5 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-card-foreground">{file.name}</p>
                <p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={loading}
                aria-label="Hapus file"
                className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-input disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                selectFile(e.dataTransfer.files[0]);
              }}
              className={`flex w-full flex-col items-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-gray-200"
              }`}
            >
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50">
                <Upload className="h-7 w-7 text-primary" />
              </span>
              <span className="mb-1 font-medium text-card-foreground">Tarik file PDF ke sini</span>
              <span className="mb-4 text-sm text-muted">atau klik untuk memilih dari perangkat</span>
              <span className="flex items-center gap-2">
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted">
                  Maks. 10 MB
                </span>
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted">
                  Hanya PDF
                </span>
              </span>
            </button>
          )}

          <div className="mt-4 flex gap-3 rounded-xl bg-amber-50 p-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-900">
              Gunakan materi berbasis teks yang jelas agar soal yang dihasilkan lebih akurat.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              2
            </span>
            <h2 className="text-lg font-semibold text-card-foreground">Konfigurasi Kuis</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-label">
                Judul Kuis
              </label>
              <input
                id="title"
                type="text"
                value={title}
                maxLength={150}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Ulangan Harian Biologi - Fotosintesis"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="quizType" className="mb-2 block text-sm font-medium text-label">
                Jenis Soal
              </label>
              <div className="relative">
                <select
                  id="quizType"
                  value={effectiveType}
                  onChange={(e) => setQuizType(e.target.value as QuizType)}
                  className={`${inputClass} cursor-pointer appearance-none pr-12`}
                >
                  <option value="pilihan_ganda">Pilihan Ganda</option>
                  <option value="isian_singkat" disabled={!isPremium}>
                    Isian Singkat{!isPremium ? " (Premium)" : ""}
                  </option>
                  <option value="campuran" disabled={!isPremium}>
                    Campuran{!isPremium ? " (Premium)" : ""}
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className={effectiveType === "campuran" ? "grid grid-cols-2 gap-4" : ""}>
              {effectiveType !== "isian_singkat" && (
                <NumberField
                  label={effectiveType === "campuran" ? "Pilihan Ganda" : "Jumlah Soal"}
                  value={pilganCount}
                  onChange={setPilganCount}
                  min={1}
                  max={maxQuestions}
                  suffix="SOAL"
                />
              )}
              {effectiveType !== "pilihan_ganda" && (
                <NumberField
                  label={effectiveType === "campuran" ? "Isian Singkat" : "Jumlah Soal"}
                  value={isianCount}
                  onChange={setIsianCount}
                  min={1}
                  max={maxQuestions}
                  suffix="SOAL"
                />
              )}
            </div>
            <p className="-mt-3 text-xs text-muted">
              Total {totalQuestions} soal, maksimal {maxQuestions} soal (
              {isPremium ? "Premium" : "Free Trial"})
            </p>

            <div>
              <span className="mb-2 block text-sm font-medium text-label">Tingkat Kesulitan</span>
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-1">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={difficulty === option.value}
                    onClick={() => setDifficulty(option.value)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      difficulty === option.value
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted hover:text-card-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Durasi"
                value={duration}
                onChange={setDuration}
                min={1}
                max={180}
                suffix="MENIT"
              />
              <NumberField
                label="KKM"
                value={kkm}
                onChange={setKkm}
                min={0}
                max={100}
                suffix="NILAI"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !!validationError}
                title={validationError || undefined}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? "Membuat soal..." : "Buat Soal Sekarang"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="status"
            aria-live="polite"
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-card p-8 shadow-xl"
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gray-100">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(Math.min(loadingStep + (done ? 0 : 0.5), LOADING_STEPS.length) / LOADING_STEPS.length) * 100}%` }}
              />
            </div>

            <div className="mb-8 mt-4 text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {done ? (
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                ) : (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                )}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                {done ? "Kuis berhasil dibuat" : "Membuat kuis"}
              </h3>
              <p className="text-sm text-muted">
                {done
                  ? "Membuka hasil kuis..."
                  : "Proses ini biasanya memakan waktu kurang dari 1 menit."}
              </p>
            </div>

            <ol className="space-y-4">
              {LOADING_STEPS.map((label, index) => {
                const finished = done || index < loadingStep;
                const active = !done && index === loadingStep;
                return (
                  <li key={label} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                        finished
                          ? "border-primary bg-primary text-white"
                          : active
                            ? "border-primary text-primary"
                            : "border-gray-200 text-gray-300"
                      }`}
                    >
                      {finished ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </span>
                    <span
                      className={`text-sm font-medium ${finished || active ? "text-card-foreground" : "text-muted-foreground"}`}
                    >
                      {label}
                    </span>
                    {active && <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
