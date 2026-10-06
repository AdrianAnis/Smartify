"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  Loader2,
  Award,
  BarChart3,
  BookOpen,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  pesertaId: number;
  nama: string;
  score: number;
  statusKelulusan: string;
  isCurrentStudent: boolean;
}

interface ReviewQuestion {
  soalId: number;
  urutan: number;
  teksSoal: string;
  tipeSoal: string;
  topik: string;
  penjelasan: string;
  studentAnswer: string;
  isBenar: boolean;
  correctAnswer: string;
}

interface ResultData {
  nama: string;
  judul: string;
  kkm: number;
  totalSoal: number;
  score: number;
  statusKelulusan: "lulus" | "remedial";
  tabViolations: number;
  gradedAt: string;
  rank: number;
  totalParticipants: number;
  leaderboard: LeaderboardEntry[];
  reviewQuestions: ReviewQuestion[];
}

export default function StudentQuizResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"ringkasan" | "pembahasan" | "leaderboard">("ringkasan");

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      loadResult(t);
    });
  }, [params]);

  async function loadResult(t: string) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/join/${t}/result`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat hasil kuis.");
        return;
      }
      setResult(data);
    } catch {
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted">Memuat hasil kuis...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted">{error || "Hasil kuis belum ada"}</p>
          <button
            type="button"
            onClick={() => router.replace(`/join/${token}`)}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const isLulus = result.statusKelulusan === "lulus";
  const benarCount = result.reviewQuestions?.filter((q) => q.isBenar).length ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6 pb-16">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Image
            src="/images/logo3.png"
            alt="Smartify"
            width={100}
            height={24}
            priority
          />
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground hover:bg-input transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            {isLulus ? (
              <Trophy className="h-7 w-7 text-primary" />
            ) : (
              <Award className="h-7 w-7 text-amber-500" />
            )}
          </div>

          <h1 className="text-xl font-bold text-card-foreground">
            Hasil Kuis Anda
          </h1>
          <p className="mt-1 text-xs text-muted line-clamp-1">
            {result.judul} • {result.nama}
          </p>

          <div className="my-6 rounded-xl border border-border bg-gray-50/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nilai Akhir
            </p>
            <p className="mt-2 text-5xl font-bold tracking-tight text-card-foreground">
              {result.score}
            </p>
            <div className="mt-3 flex justify-center">
              {isLulus ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-4 py-1 text-xs font-bold uppercase text-success-text">
                  <CheckCircle2 className="h-4 w-4" />
                  Lulus (KKM {result.kkm})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-subtle px-4 py-1 text-xs font-bold uppercase text-danger-text">
                  <XCircle className="h-4 w-4" />
                  Remedial (KKM {result.kkm})
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-left">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] font-medium text-muted">Peringkat</p>
              <p className="mt-0.5 text-base font-bold text-card-foreground">
                #{result.rank} <span className="text-[11px] font-normal text-muted">/ {result.totalParticipants}</span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] font-medium text-muted">Jawaban Benar</p>
              <p className="mt-0.5 text-base font-bold text-card-foreground">
                {benarCount} / {result.totalSoal}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] font-medium text-muted">Pindah Tab</p>
              <p className="mt-0.5 text-base font-bold text-card-foreground">
                {result.tabViolations}x
              </p>
            </div>
          </div>
        </div>

        <div className="flex rounded-xl border border-border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("ringkasan")}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
              activeTab === "ringkasan"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-card-foreground"
            }`}
          >
            Ringkasan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pembahasan")}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
              activeTab === "pembahasan"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-card-foreground"
            }`}
          >
            Pembahasan Soal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
              activeTab === "leaderboard"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-card-foreground"
            }`}
          >
            Leaderboard
          </button>
        </div>

        {activeTab === "pembahasan" && (
          <div className="space-y-4">
            {result.reviewQuestions.map((q, idx) => (
              <div
                key={q.soalId}
                className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-card-foreground">
                      Soal {idx + 1}.
                    </span>
                    <span className="rounded-xl bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-muted">
                      {q.topik}
                    </span>
                  </div>
                  {q.isBenar ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-2.5 py-0.5 text-xs font-semibold text-success-text">
                      <Check className="h-3.5 w-3.5" />
                      Benar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger-subtle px-2.5 py-0.5 text-xs font-semibold text-danger-text">
                      <X className="h-3.5 w-3.5" />
                      Salah
                    </span>
                  )}
                </div>

                <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-line">
                  {q.teksSoal}
                </p>

                <div className="space-y-1.5 text-xs rounded-xl bg-gray-50 p-3.5">
                  <div className="flex gap-2">
                    <span className="font-medium text-muted w-24 shrink-0">Jawaban Anda:</span>
                    <span
                      className={`font-semibold ${
                        q.isBenar ? "text-success-text" : "text-danger-text"
                      }`}
                    >
                      {q.studentAnswer || "(Tidak dijawab)"}
                    </span>
                  </div>
                  {!q.isBenar && q.correctAnswer && (
                    <div className="flex gap-2">
                      <span className="font-medium text-muted w-24 shrink-0">Kunci Jawaban:</span>
                      <span className="font-semibold text-success-text">
                        {q.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>

                {q.penjelasan && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-900 leading-relaxed">
                    <span className="font-semibold block mb-0.5">Penjelasan:</span>
                    {q.penjelasan}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-bold text-card-foreground">
                Peringkat Kelas ({result.leaderboard.length} Peserta)
              </h3>
            </div>
            <ul className="divide-y divide-border text-sm">
              {result.leaderboard.map((item) => (
                <li
                  key={item.pesertaId}
                  className={`flex items-center justify-between px-4 py-3 ${
                    item.isCurrentStudent ? "bg-primary/10 font-semibold" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        item.rank === 1
                          ? "bg-amber-100 text-amber-700"
                          : item.rank === 2
                          ? "bg-gray-200 text-gray-700"
                          : item.rank === 3
                          ? "bg-amber-50 text-amber-800"
                          : "text-muted"
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="text-card-foreground">
                      {item.nama} {item.isCurrentStudent && "(Kamu)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-card-foreground">{item.score}</span>
                    <span
                      className={`rounded-xl px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        item.statusKelulusan === "lulus"
                          ? "bg-success-subtle text-success-text"
                          : "bg-danger-subtle text-danger-text"
                      }`}
                    >
                      {item.statusKelulusan}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "ringkasan" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-card-foreground">Informasi Pengerjaan</h3>
            <div className="divide-y divide-border text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Nama Peserta</span>
                <span className="font-medium text-card-foreground">{result.nama}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Judul Kuis</span>
                <span className="font-medium text-card-foreground">{result.judul}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Standar Kelulusan (KKM)</span>
                <span className="font-medium text-card-foreground">{result.kkm}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Akurasi Jawaban</span>
                <span className="font-medium text-card-foreground">
                  {Math.round((benarCount / (result.totalSoal || 1)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted">Pelanggaran Tab</span>
                <span className="font-medium text-card-foreground">{result.tabViolations} kali</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
