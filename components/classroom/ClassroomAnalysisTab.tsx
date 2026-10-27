import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCw } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ClassroomInsight } from "@/lib/quiz/types";

export function ClassroomAnalysisTab({ kuisId }: { kuisId: string }) {
  const [analysis, setAnalysis] = useState<ClassroomInsight | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [locked, setLocked] = useState(false);

  const retry = () => {
    setError(null);
    setLoading(true);
    setAttempt((value) => value + 1);
  };

  useEffect(() => {
    async function loadAnalysis() {
      try {
        const res = await fetch("/api/ai/classroom-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kuisId: Number(kuisId) }),
        });
        const data = await res.json().catch(() => ({}));

        if (data.pending) {
          setPendingMessage(data.message);
          return;
        }

        if (res.status === 403 && data.code === "SUBSCRIPTION_LIMIT") {
          setLocked(true);
          return;
        }

        if (!res.ok) throw new Error(data.error || "Gagal membuat analisis");
        setAnalysis(data.analysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal membuat analisis");
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, [kuisId, attempt]);

  return (
    <div>
      <div className="rounded-xl bg-white p-6 shadow-sm overflow-hidden">
        {locked && !loading && (
          <div className="text-center py-8">
            <h3 className="text-gray-900 font-bold mb-2">AI Insight khusus Premium</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              Upgrade ke Premium untuk melihat materi yang paling banyak belum dipahami siswa beserta strategi perbaikannya.
            </p>
            <Link
              href="/payment/checkout"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Upgrade ke Premium
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-4 flex flex-col gap-3 rounded-xl bg-danger-subtle p-4 text-sm font-medium text-danger-text sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={retry}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RotateCw className="h-4 w-4" />
              Coba lagi
            </button>
          </div>
        )}

        {pendingMessage && !loading && (
          <div className="text-center py-8">
            <h3 className="text-gray-900 font-bold mb-2">Belum Ada Analisis</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {pendingMessage}
            </p>
          </div>
        )}

        {!analysis && !pendingMessage && !error && !loading && !locked && (
          <div className="text-center py-8">
            <h3 className="text-gray-900 font-bold mb-2">Belum Ada Analisis</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Analisis akan digenerate otomatis ketika seluruh siswa telah menyelesaikan kuis ini.
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-8" aria-busy="true">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Smartify menganalisis pola jawaban siswa...</p>
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-full max-w-lg" />
            </div>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {analysis && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1">
                {analysis.topics.length > 0 ? "Materi yang Perlu Mendapat Perhatian" : "Pemahaman Siswa Sudah Baik"}
              </h3>
              <p className="text-sm text-gray-500">{analysis.summary}</p>
            </div>

            <div className="space-y-8">
              {analysis.topics.map((item, idx) => (
                <div key={idx} className="space-y-4 pt-6 first:border-0 first:pt-0">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {String(idx + 1).padStart(2, '0')} — {item.materi}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-xl">{item.error_percentage}% siswa menjawab salah</span>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h5 className="font-bold text-gray-800 text-sm">Mengapa siswa kesulitan?</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {item.why_difficult}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-bold text-gray-800 text-sm">Strategi menjelaskan</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {item.strategy}
                      </p>
                    </div>
                  </div>

                  {item.students && item.students.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-bold text-gray-800 text-sm">
                        Siswa yang perlu penguatan ({item.students.length})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {item.students.map((student) => (
                          <span
                            key={student.nama}
                            className="rounded-xl bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            {student.nama} · {student.salah}/{student.total} salah
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
