import { useState } from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

export function ClassroomAnalysisTab({ kuisId }: { kuisId: string }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/classroom-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kuisId: Number(kuisId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat analisis");
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-card-foreground">AI Classroom Analysis</h2>
          <p className="text-xs text-muted mt-1">
            Dapatkan rekomendasi strategi mengajar spesifik berdasarkan hasil kuis siswa.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span>{loading ? "Menganalisis..." : "Generate AI Analysis"}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-danger-subtle p-4 text-sm font-medium text-danger-text">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-bold text-card-foreground mb-3 text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Insight Kelas (AI Analysis)
            </h3>
            <p className="text-sm text-card-foreground leading-relaxed">
              {analysis.paragraf_penjelasan}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-card-foreground text-lg">Materi yang Belum Dikuasai</h3>
            {analysis.materi_belum_dikuasai?.map((item: any, idx: number) => (
              <div key={idx} className="rounded-2xl border border-border bg-gray-50/50 p-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-danger-text flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {item.materi}
                  </h4>
                  <p className="text-sm text-card-foreground bg-white p-3 rounded-xl border border-border shadow-sm">
                    {item.penjelasan}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-success-text mt-3">Rekomendasi Tindakan:</h4>
                  <p className="text-sm text-card-foreground bg-success-subtle/30 p-3 rounded-xl border border-success-subtle">
                    {item.rekomendasi}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
