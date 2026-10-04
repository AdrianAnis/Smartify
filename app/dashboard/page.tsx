"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, FileText, LayoutGrid, List } from "lucide-react";
import { QuizCard, type QuizStatus } from "@/components/dashboard/QuizCard";

interface Quiz {
  kuis_id: number;
  judul: string;
  total_soal: number;
  status: QuizStatus;
  created_at: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setQuizzes(data.quizzes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat daftar kuis");
      } finally {
        setLoading(false);
      }
    };
    void fetchQuizzes();
  }, [router]);

  const q = searchQuery.trim().toLowerCase();
  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.judul?.toLowerCase().includes(q),
  );
  const hasAnyQuiz = quizzes.length > 0;
  const searchHasNoMatch = q.length > 0 && hasAnyQuiz && filteredQuizzes.length === 0;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Dashboard
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-xl font-bold text-card-foreground sm:text-2xl">
            Koleksi Kuis Saya
          </h1>

          {hasAnyQuiz && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs lg:w-80">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Cari kuis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-input py-3 pl-12 pr-4 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex items-center rounded-xl border border-border bg-card p-1">
                {(["grid", "list"] as const).map((mode) => {
                  const Icon = mode === "grid" ? LayoutGrid : List;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      aria-pressed={viewMode === mode}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-initial sm:px-4 ${
                        viewMode === mode
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted hover:text-card-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {mode === "grid" ? "Grid" : "List"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-danger-border bg-danger-subtle px-4 py-3 text-sm text-danger-text">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {filteredQuizzes.length > 0 && (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4"
              }
            >
              {filteredQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.kuis_id}
                  id={quiz.kuis_id}
                  title={quiz.judul}
                  totalSoal={quiz.total_soal}
                  tanggal={formatDate(quiz.created_at)}
                  status={quiz.status}
                />
              ))}
            </div>
          )}

          {searchHasNoMatch && (
            <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">
                Kuis tidak ditemukan
              </h3>
              <p className="mt-2 text-sm text-muted">
                Tidak ada judul kuis yang cocok dengan &ldquo;{searchQuery.trim()}&rdquo;.
                Coba kata kunci lain.
              </p>
            </div>
          )}

          {!hasAnyQuiz && !error && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Belum ada kuis</h3>
              <p className="mb-6 mt-1 text-sm text-muted">
                Mulai buat kuis pertama Anda dari materi PDF.
              </p>
              <Link
                href="/generate"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Buat kuis baru
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
