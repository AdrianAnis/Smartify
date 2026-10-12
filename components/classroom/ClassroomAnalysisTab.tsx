import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ClassroomInsight } from "@/lib/quiz/types";

export function ClassroomAnalysisTab({ kuisId }: { kuisId: string }) {
  const [analysis, setAnalysis] = useState<ClassroomInsight | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    async function loadAnalysis() {
      try {
        const res = await fetch("/api/ai/classroom-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kuisId: Number(kuisId) }),
        });
        const data = await res.json();
        
        if (data.pending) {
          setPendingMessage(data.message);
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
  }, [kuisId]);

  return (
    <div>
      <div className="rounded-xl bg-white p-6 shadow-sm overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-danger-subtle p-4 text-sm font-medium text-danger-text mb-4">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
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

        {!analysis && !pendingMessage && !error && !loading && (
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
