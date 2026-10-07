"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Download, FileText, Search, Users } from "lucide-react";
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

type ResultTab = "siswa" | "soal" | "ai";
type StatusFilter = "all" | "lulus" | "remedial";

const TABS: { id: ResultTab; label: string }[] = [
  { id: "siswa", label: "Nilai siswa" },
  { id: "soal", label: "Analisis soal" },
  { id: "ai", label: "AI Insight" },
];

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "lulus", label: "Lulus" },
  { id: "remedial", label: "Remedial" },
];

function formatScore(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(1));
}

function formatWaktuWIB(raw: string | null | undefined): string {
  if (!raw) return "-";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month")}, ${get("hour")}:${get("minute")} WIB`;
}

function accuracyTone(accuracy: number, kkm: number) {
  if (accuracy >= kkm) return { bar: "bg-success", text: "text-success-text" };
  if (accuracy >= 50) return { bar: "bg-warning", text: "text-warning-text" };
  return { bar: "bg-danger", text: "text-danger-text" };
}

export function TeacherResultClient({
  kuisId,
  initialKuis,
  initialStats,
  initialStudents,
  initialTopicAnalysis,
  initialQuestionAnalysis,
}: Props) {
  const [activeTab, setActiveTab] = useState<ResultTab>("siswa");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");

  const rankById = useMemo(
    () => new Map(initialStudents.map((s, index) => [s.pesertaId, index + 1])),
    [initialStudents],
  );

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return initialStudents.filter((s) => {
      const matchQuery = s.nama.toLowerCase().includes(query);
      const matchStatus = filterStatus === "all" || s.statusKelulusan.toLowerCase() === filterStatus;
      return matchQuery && matchStatus;
    });
  }, [initialStudents, searchQuery, filterStatus]);

  const statItems = [
    { label: "Rata-rata nilai", value: String(formatScore(initialStats.avgScore)), hint: `KKM ${initialKuis.kkm}` },
    {
      label: "Tingkat kelulusan",
      value: `${initialStats.passRate}%`,
      hint: `${initialStats.lulusCount} lulus · ${initialStats.remedialCount} remedial`,
    },
    {
      label: "Nilai tertinggi",
      value: String(formatScore(initialStats.maxScore)),
      hint: `terendah ${formatScore(initialStats.minScore)}`,
    },
    {
      label: "Selesai mengerjakan",
      value: String(initialStats.finishedStudents),
      hint: `dari ${initialStats.totalStudents} siswa`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Laporan hasil</p>
          <h1 className="mt-1 line-clamp-1 text-2xl font-bold tracking-tight text-gray-900">
            {initialKuis.judul}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {initialKuis.total_soal} soal · {initialKuis.durasi_menit} menit · KKM {initialKuis.kkm}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/api/quiz/${kuisId}/export?format=docx`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <FileText className="h-4 w-4" />
            Naskah soal
          </a>
          <a
            href={`/api/quiz/${kuisId}/export?format=xlsx`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Download className="h-4 w-4" />
            Unduh nilai (Excel)
          </a>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-y-6 rounded-xl bg-card p-6 shadow-sm sm:grid-cols-4 sm:gap-y-0">
        {statItems.map((item, index) => (
          <div
            key={item.label}
            className={`sm:px-6 ${index === 0 ? "sm:pl-0" : "sm:border-l sm:border-gray-100"}`}
          >
            <dt className="text-sm text-gray-500">{item.label}</dt>
            <dd className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-gray-900">
              {item.value}
            </dd>
            <dd className="mt-1 text-sm text-gray-400">{item.hint}</dd>
          </div>
        ))}
      </dl>

      <div role="tablist" aria-label="Bagian laporan" className="flex gap-6 border-b border-gray-200">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:text-primary ${
                active ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {tab.id === "siswa" && (
                <span className="ml-1.5 font-normal text-gray-400">{initialStudents.length}</span>
              )}
              {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      {activeTab === "siswa" && (
        <div className="overflow-hidden rounded-xl bg-card shadow-sm">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa"
                aria-label="Cari nama siswa"
                className="h-10 w-full rounded-xl bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="inline-flex rounded-xl bg-gray-100 p-1" role="group" aria-label="Filter status">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={filterStatus === filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    filterStatus === filter.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-t border-gray-100 py-16 text-center">
              <Users className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                {initialStudents.length === 0 ? "Belum ada peserta" : "Tidak ada siswa yang sesuai"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Peringkat</th>
                    <th className="px-6 py-3">Nama siswa</th>
                    <th className="px-6 py-3">Nilai</th>
                    <th className="px-6 py-3">Benar</th>
                    <th className="px-6 py-3">Pindah tab</th>
                    <th className="px-6 py-3 text-right">Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((s) => {
                    const rank = rankById.get(s.pesertaId) ?? 0;
                    return (
                      <tr key={s.pesertaId} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4">
                          {rank === 1 ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                              1
                            </span>
                          ) : (
                            <span className="pl-1.5 tabular-nums text-gray-500">{rank}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{s.nama}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-10 text-base font-bold tabular-nums text-gray-900">
                              {formatScore(s.score)}
                            </span>
                            {s.statusKelulusan === "lulus" ? (
                              <span className="rounded-xl bg-success-subtle px-2 py-0.5 text-xs font-semibold text-success-text">
                                Lulus
                              </span>
                            ) : (
                              <span className="rounded-xl bg-danger-subtle px-2 py-0.5 text-xs font-semibold text-danger-text">
                                Remedial
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 tabular-nums text-gray-500">
                          {s.benarCount}/{initialKuis.total_soal}
                        </td>
                        <td className="px-6 py-4">
                          {s.tabViolations > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-danger-subtle px-2.5 py-0.5 text-xs font-medium text-danger-text">
                              <AlertTriangle className="h-3 w-3" />
                              {s.tabViolations}x
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-500">
                          {formatWaktuWIB(s.submittedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "soal" && (
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <section className="self-start rounded-xl bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Penguasaan per topik</h2>
            <p className="mt-1 text-sm text-gray-500">Persentase jawaban benar di setiap topik.</p>
            <ul className="mt-6 space-y-5">
              {initialTopicAnalysis.map((t) => {
                const tone = accuracyTone(t.accuracy, initialKuis.kkm);
                return (
                  <li key={t.topik}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-gray-900">{t.topik}</span>
                      <span className={`font-semibold tabular-nums ${tone.text}`}>{t.accuracy}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
                        style={{ width: `${t.accuracy}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">{t.totalQuestions} soal</p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="overflow-hidden rounded-xl bg-card shadow-sm">
            <div className="px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900">Per butir soal</h2>
              <p className="mt-1 text-sm text-gray-500">Persentase siswa yang menjawab benar.</p>
            </div>
            <ul className="divide-y divide-gray-100 border-t border-gray-100">
              {initialQuestionAnalysis.map((q) => {
                const tone = accuracyTone(q.accuracy, initialKuis.kkm);
                return (
                  <li key={q.soalId} className="flex items-start gap-4 px-6 py-4">
                    <span className="mt-0.5 w-8 shrink-0 text-sm font-semibold tabular-nums text-gray-400">
                      {q.urutan}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm leading-relaxed text-gray-900">{q.teksSoal}</p>
                      <p className="mt-1 text-xs text-gray-400">{q.topik}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${tone.text}`}>
                      {q.accuracy}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {activeTab === "ai" && <ClassroomAnalysisTab kuisId={kuisId} />}
    </div>
  );
}
