"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, FileText, BarChart3, ChevronRight, Loader2, Award, ArrowDown, ArrowUp, Download } from "lucide-react";
import { ClassroomAnalysisTab } from "@/components/classroom/ClassroomAnalysisTab";
import { QUIZ_TYPE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "@/lib/quiz/labels";
import type { QuizDetail } from "@/lib/quiz/types";

interface SummaryData {
  stats: {
    totalStudents: number;
    finishedStudents: number;
    avgScore: number;
    maxScore: number;
    minScore: number;
    lulusCount: number;
    remedialCount: number;
  };
  students: {
    pesertaId: number;
    nama: string;
    score: number;
    statusKelulusan: string;
  }[];
  soal: {
    soal_id: number;
    urutan: number;
    teks_soal: string;
    tipe_soal: string;
    tingkat_kesulitan: string;
  }[];
}

export function FinishedQuizView({ id, kkm }: { id: string, kkm: number }) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentTab, setStudentTab] = useState<"semua" | "tuntas" | "belum">("semua");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/quiz/${id}/summary?t=${Date.now()}`, {
          cache: "no-store"
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal memuat ringkasan kuis");
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat ringkasan kuis");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-danger-subtle p-6 text-center text-danger-text">
        <p>{error || "Data tidak ditemukan"}</p>
      </div>
    );
  }

  const { stats, students, soal } = data;
  const tuntas = students.filter((s) => s.statusKelulusan === "lulus");
  const belumTuntas = students.filter((s) => s.statusKelulusan !== "lulus");

  return (
    <div className="space-y-6">
      {/* 1. AI Insight */}
      <ClassroomAnalysisTab kuisId={id} />

      {/* 2. Hasil Peserta */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Hasil Peserta
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Ringkasan hasil pengerjaan kuis oleh seluruh siswa.
            </p>
          </div>
          <Link
            href={`/api/quiz/${id}/export?format=xlsx`}
            target="_blank"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:bg-primary/5 transition-colors px-3 py-1.5 rounded-xl border border-primary/20"
          >
            <Download className="h-4 w-4" /> Unduh Hasil
          </Link>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="rounded-xl bg-white-gray-100 shadow-sm p-4 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-2xl">
                <CheckCircle2 className="h-6 w-6" /> {stats.lulusCount}
              </div>
              <p className="text-sm text-gray-500 mt-1 font-medium">Tuntas</p>
            </div>
            <div className="rounded-xl bg-white-gray-100 shadow-sm p-4 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-2xl">
                <XCircle className="h-6 w-6" /> {stats.remedialCount}
              </div>
              <p className="text-sm text-gray-500 mt-1 font-medium">Belum Tuntas</p>
            </div>
            <div className="rounded-xl bg-white-gray-100 shadow-sm p-4 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
                <BarChart3 className="h-6 w-6" /> {stats.avgScore}
              </div>
              <p className="text-sm text-gray-500 mt-1 font-medium">Rata-rata</p>
            </div>
            <div className="rounded-xl bg-white-gray-100 shadow-sm p-4 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 text-gray-700 font-bold text-2xl">
                <Award className="h-6 w-6" /> {stats.maxScore}
              </div>
              <p className="text-sm text-gray-500 mt-1 font-medium">Nilai Tertinggi</p>
            </div>
            <div className="rounded-xl bg-white-gray-100 shadow-sm p-4 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 text-gray-700 font-bold text-2xl">
                <ArrowDown className="h-6 w-6" /> {stats.minScore}
              </div>
              <p className="text-sm text-gray-500 mt-1 font-medium">Nilai Terendah</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex gap-4 mb-4 overflow-x-auto pb-1">
              <button
                onClick={() => setStudentTab("semua")}
                className={`pb-3 px-4 text-sm font-medium transition-colors ${
                  studentTab === "semua"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Total Seluruh Siswa ({students.length})
              </button>
              <button
                onClick={() => setStudentTab("tuntas")}
                className={`pb-3 px-4 text-sm font-medium transition-colors ${
                  studentTab === "tuntas"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Siswa Tuntas ({tuntas.length})
              </button>
              <button
                onClick={() => setStudentTab("belum")}
                className={`pb-3 px-4 text-sm font-medium transition-colors ${
                  studentTab === "belum"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Siswa Belum Tuntas ({belumTuntas.length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-l-xl">No</th>
                    <th className="px-4 py-3 font-medium">Nama Siswa</th>
                    <th className="px-4 py-3 font-medium text-right rounded-r-xl">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(studentTab === "semua" ? students : studentTab === "tuntas" ? tuntas : belumTuntas).map((s, i) => (
                    <tr key={s.pesertaId} className="hover:bg-gray-50/30">
                      <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.nama}</td>
                      <td className={`px-4 py-3 text-right font-bold ${s.statusKelulusan === "lulus" ? "text-emerald-600" : "text-rose-600"}`}>
                        {s.score}
                      </td>
                    </tr>
                  ))}
                  {(studentTab === "semua" ? students : studentTab === "tuntas" ? tuntas : belumTuntas).length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">Tidak ada data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Daftar Soal */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Daftar Soal
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Daftar soal yang digunakan dalam kuis ini.
            </p>
          </div>
          <Link
            href={`/quiz/${id}/questions`}
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors-gray-200 px-3 py-1.5 rounded-xl"
          >
            Lihat Detail Jawaban <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto p-4 sm:p-6 pt-2">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50/50">
              <tr>
                <th className="px-4 py-3 font-medium rounded-l-xl">No</th>
                <th className="px-4 py-3 font-medium">Soal</th>
                <th className="px-4 py-3 font-medium">Jenis</th>
                <th className="px-4 py-3 font-medium rounded-r-xl">Tingkat Kesulitan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(soal || []).map((q) => {
                const diffColor = DIFFICULTY_COLORS[q.tingkat_kesulitan as keyof typeof DIFFICULTY_COLORS] || "text-gray-600 bg-gray-100";
                const diffLabel = DIFFICULTY_LABELS[q.tingkat_kesulitan as keyof typeof DIFFICULTY_LABELS] || q.tingkat_kesulitan;
                const typeLabel = QUIZ_TYPE_LABELS[q.tipe_soal as keyof typeof QUIZ_TYPE_LABELS] || q.tipe_soal;
                
                return (
                  <tr key={q.soal_id} className="group hover:bg-gray-50/30">
                    <td className="px-4 py-4 text-gray-900 font-medium">{q.urutan}</td>
                    <td className="px-4 py-4 text-gray-600">
                      <div className="line-clamp-2 max-w-[200px] sm:max-w-[400px]">
                        {q.teks_soal}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-gray-100 text-gray-600">
                        {typeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium ${diffColor.replace('border', 'bg-opacity-10')}`}>
                        {diffLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
