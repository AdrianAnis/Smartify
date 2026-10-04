"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Download,
  ArrowLeft,
  Trophy,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  Search,
  Filter,
  Layers,
  HelpCircle,
  Eye,
  Calendar,
  Sparkles,
} from "lucide-react";

import { ClassroomAnalysisTab } from "./ClassroomAnalysisTab";

interface StudentResult {
  pesertaId: number;
  nama: string;
  status: string;
  tabViolations: number;
  joinedAt: string;
  submittedAt: string | null;
  score: number;
  statusKelulusan: string;
  benarCount: number;
}

interface TopicAnalysis {
  topik: string;
  totalQuestions: number;
  accuracy: number;
}

interface QuestionAnalysis {
  soalId: number;
  urutan: number;
  teksSoal: string;
  tipeSoal: string;
  topik: string;
  accuracy: number;
  totalAnswered: number;
}

interface QuizMeta {
  kuis_id: number;
  judul: string;
  status: string;
  durasi_menit: number;
  kkm: number;
  total_soal: number;
  created_at: string;
  kode_kuis: string;
}

interface StatsMeta {
  totalStudents: number;
  finishedStudents: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  lulusCount: number;
  remedialCount: number;
  passRate: number;
}

interface Props {
  kuisId: string;
  initialKuis: QuizMeta;
  initialStats: StatsMeta;
  initialStudents: StudentResult[];
  initialTopicAnalysis: TopicAnalysis[];
  initialQuestionAnalysis: QuestionAnalysis[];
}

function formatWaktuWIB(raw: string | null | undefined): string {
  if (!raw || raw === "-") return "-";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "-";
    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const day = parts.find((p) => p.type === "day")?.value.padStart(2, "0");
    const month = parts.find((p) => p.type === "month")?.value.padStart(2, "0");
    const year = parts.find((p) => p.type === "year")?.value;
    const hour = parts.find((p) => p.type === "hour")?.value.padStart(2, "0");
    const minute = parts.find((p) => p.type === "minute")?.value.padStart(2, "0");
    return `${day}/${month}/${year} ${hour}:${minute} WIB`;
  } catch {
    return "-";
  }
}

export function TeacherResultClient({
  kuisId,
  initialKuis,
  initialStats,
  initialStudents,
  initialTopicAnalysis,
  initialQuestionAnalysis,
}: Props) {
  const [activeTab, setActiveTab] = useState<"siswa" | "topik" | "ai">("siswa");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "lulus" | "remedial">("all");
  const [isExporting, setIsExporting] = useState(false);

  const filteredStudents = useMemo(() => {
    return initialStudents.filter((s) => {
      const matchQuery = s.nama.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchStatus =
        filterStatus === "all" ? true : s.statusKelulusan.toLowerCase() === filterStatus;
      return matchQuery && matchStatus;
    });
  }, [initialStudents, searchQuery, filterStatus]);

  async function handleDownloadExcel() {
    setIsExporting(true);
    try {
      window.location.href = `/api/quiz/${kuisId}/export?format=xlsx`;
    } catch {
    } finally {
      setTimeout(() => setIsExporting(false), 1500);
    }
  }

  async function handleDownloadWord() {
    setIsExporting(true);
    try {
      window.location.href = `/api/quiz/${kuisId}/export?format=docx`;
    } catch {
    } finally {
      setTimeout(() => setIsExporting(false), 1500);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 pb-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-input hover:text-card-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Laporan Hasil & Analisis Kuis
              </p>
              <span className="inline-flex items-center rounded-full bg-success-subtle px-2.5 py-0.5 text-xs font-semibold text-success-text">
                Selesai
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-card-foreground line-clamp-1">
              {initialKuis.judul}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/quiz/${kuisId}/preview`}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-input"
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span>Lihat Soal</span>
          </Link>
          <button
            type="button"
            onClick={handleDownloadWord}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:bg-secondary/90 disabled:opacity-50 border border-border"
          >
            <Download className="h-4 w-4" />
            <span>Naskah Soal</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? "Mengunduh..." : "Nilai (Excel)"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rata-rata Nilai
          </p>
          <p className="mt-2 text-3xl font-bold text-primary-strong">
            {initialStats.avgScore}
          </p>
          <p className="mt-1 text-xs text-muted">
            KKM: {initialKuis.kkm}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nilai Tertinggi
          </p>
          <p className="mt-2 text-3xl font-bold text-success-text">
            {initialStats.maxScore}
          </p>
          <p className="mt-1 text-xs text-muted">
            Terendah: {initialStats.minScore}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tingkat Kelulusan
          </p>
          <p className="mt-2 text-3xl font-bold text-card-foreground">
            {initialStats.passRate}%
          </p>
          <p className="mt-1 text-xs text-muted">
            {initialStats.lulusCount} Lulus • {initialStats.remedialCount} Remedial
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Siswa
          </p>
          <p className="mt-2 text-3xl font-bold text-card-foreground">
            {initialStats.totalStudents}
          </p>
          <p className="mt-1 text-xs text-muted">
            {initialStats.finishedStudents} Selesai mengerjakan
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("siswa")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "siswa"
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:bg-input hover:text-card-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Daftar Nilai Siswa ({initialStudents.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("topik")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "topik"
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:bg-input hover:text-card-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Analisis Topik & Soal</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "ai"
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:bg-input hover:text-card-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>AI Analysis</span>
        </button>
      </div>

      {activeTab === "siswa" && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa..."
                className="w-full rounded-xl bg-input pl-10 pr-4 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "lulus" | "remedial")}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="lulus">Lulus</option>
                <option value="remedial">Remedial</option>
              </select>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted">
              Tidak ada siswa yang sesuai pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-gray-50/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5">Peringkat</th>
                    <th className="px-6 py-3.5">Nama Siswa</th>
                    <th className="px-6 py-3.5">Nilai Akhir</th>
                    <th className="px-6 py-3.5">Status Kelulusan</th>
                    <th className="px-6 py-3.5">Jawaban Benar</th>
                    <th className="px-6 py-3.5">Pelanggaran Tab</th>
                    <th className="px-6 py-3.5 text-right">Waktu Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((s, idx) => (
                    <tr key={s.pesertaId} className="hover:bg-input/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-card-foreground">
                        {idx === 0 ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                            1
                          </span>
                        ) : (
                          <span className="text-muted">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-card-foreground">
                        {s.nama}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base font-bold text-card-foreground">
                          {s.score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {s.statusKelulusan === "lulus" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-2.5 py-1 text-xs font-bold text-success-text uppercase">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Lulus
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-subtle px-2.5 py-1 text-xs font-bold text-danger-text uppercase">
                            <XCircle className="h-3.5 w-3.5" />
                            Remedial
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {s.benarCount} / {initialKuis.total_soal}
                      </td>
                      <td className="px-6 py-4">
                        {s.tabViolations > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-subtle px-2.5 py-0.5 text-xs font-medium text-danger-text">
                            <AlertTriangle className="h-3 w-3" />
                            {s.tabViolations}x
                          </span>
                        ) : (
                          <span className="text-xs text-muted">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted font-mono">
                        {formatWaktuWIB(s.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "topik" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold text-card-foreground mb-1">
              Tingkat Penguasaan per Topik
            </h2>
            <p className="text-xs text-muted mb-6">
              Membantu guru mengidentifikasi materi yang sudah dikuasai maupun materi yang perlu remedial.
            </p>

            <div className="space-y-4">
              {initialTopicAnalysis.map((t) => (
                <div key={t.topik} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-card-foreground font-semibold">
                      {t.topik} ({t.totalQuestions} soal)
                    </span>
                    <span
                      className={
                        t.accuracy >= initialKuis.kkm
                          ? "text-success-text font-bold"
                          : "text-danger-text font-bold"
                      }
                    >
                      {t.accuracy}% Akurasi
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-input overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        t.accuracy >= initialKuis.kkm
                          ? "bg-success"
                          : t.accuracy >= 50
                          ? "bg-warning"
                          : "bg-danger"
                      }`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold text-card-foreground mb-1">
              Analisis Per Butir Soal
            </h2>
            <p className="text-xs text-muted mb-6">
              Persentase siswa yang menjawab benar untuk setiap nomor soal.
            </p>

            <div className="space-y-4">
              {initialQuestionAnalysis.map((q) => (
                <div
                  key={q.soalId}
                  className="rounded-xl border border-border bg-gray-50/50 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        Soal {q.urutan}
                      </span>
                      <span className="text-xs font-medium text-muted">
                        {q.topik}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        q.accuracy >= 70
                          ? "bg-success-subtle text-success-text"
                          : q.accuracy >= 40
                          ? "bg-warning-subtle text-warning-text"
                          : "bg-danger-subtle text-danger-text"
                      }`}
                    >
                      {q.accuracy}% Benar
                    </span>
                  </div>
                  <p className="text-sm text-card-foreground line-clamp-2 leading-relaxed">
                    {q.teksSoal}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <ClassroomAnalysisTab kuisId={kuisId} />
      )}
    </div>
  );
}
