"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  Users,
  Activity,
} from "lucide-react";
import {
  DIFFICULTY_LABELS,
  QUIZ_STATUS_STYLES,
  QUIZ_TYPE_LABELS,
} from "@/lib/quiz/labels";
import type { QuizDetail } from "@/lib/quiz/types";
import { FinishedQuizView } from "./FinishedQuizView";
import { DeleteQuizButton } from "./DeleteQuizButton";


export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [kuis, setKuis] = useState<QuizDetail | null>(null);
  const [pembuat, setPembuat] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/quiz/${id}`);
        if (res.status === 401) {
          router.replace(`/auth/login?redirect=/quiz/${id}`);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setKuis(data.kuis);
        setPembuat(data.pembuat ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail kuis");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !kuis) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm mt-12">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">Kuis tidak dapat dibuka</h1>
        <p className="mb-6 text-sm text-gray-500">{error || "Kuis tidak ditemukan"}</p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const status = QUIZ_STATUS_STYLES[kuis.status] ?? QUIZ_STATUS_STYLES.draft;
  const isFinished = kuis.status === "selesai";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Sticky Navbar */}
      <div className="sticky top-0 z-50 flex h-16 items-center gap-4 bg-white/90 px-6 shadow-sm backdrop-blur-md">
        <Link
          href="/dashboard"
          className="flex items-center justify-center rounded-xl p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="text-lg font-bold text-gray-900">
          Detail Kuis <span className="text-gray-400 font-normal mx-2">/</span> {kuis.judul}
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 mt-8 space-y-8">
        
        {/* Header / Page Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{kuis.judul}</h1>
              <span className={`rounded-xl px-3 py-1 text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
            </div>
            {pembuat && <p className="text-sm text-gray-500 mt-2">Dibuat oleh: {pembuat}</p>}
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <DeleteQuizButton id={id} judul={kuis.judul} status={kuis.status} />
          </div>
        </div>

        {/* Quiz Information Card (5 columns) */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-y-6 md:grid-cols-5">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Jumlah Soal</p>
              <p className="text-lg font-semibold text-gray-900">{kuis.total_soal} Soal</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Jenis Soal</p>
              <p className="text-lg font-semibold text-gray-900">{QUIZ_TYPE_LABELS[kuis.jenis_soal] ?? kuis.jenis_soal}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Kesulitan</p>
              <p className="text-lg font-semibold text-gray-900">{DIFFICULTY_LABELS[kuis.tingkat_kesulitan] ?? kuis.tingkat_kesulitan}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Durasi</p>
              <p className="text-lg font-semibold text-gray-900">{kuis.durasi_menit} Menit</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">KKM</p>
              <p className="text-lg font-semibold text-gray-900">{kuis.kkm}</p>
            </div>

          </div>
        </div>

        {isFinished ? (
          <FinishedQuizView id={id} kkm={kuis.kkm} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href={`/quiz/${id}/preview`}
              className="group flex flex-col justify-between rounded-xl bg-white p-6 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Eye className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Preview & Edit</h3>
                <p className="text-sm text-gray-500 mt-1">Lihat dan ubah daftar soal</p>
              </div>
            </Link>

            {(kuis.status === "published" || kuis.status === "waiting") && (
              <Link
                href={`/quiz/${id}/waiting-room`}
                className="group flex flex-col justify-between rounded-xl bg-white p-6 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Users className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Ruang Tunggu</h3>
                  <p className="text-sm text-gray-500 mt-1">Kelola peserta sebelum kuis dimulai</p>
                </div>
              </Link>
            )}

            {(kuis.status === "ongoing") && (
              <Link
                href={`/quiz/${id}/monitor`}
                className="group flex flex-col justify-between rounded-xl bg-white p-6 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Activity className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-amber-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Monitor Kuis</h3>
                  <p className="text-sm text-gray-500 mt-1">Pantau progres peserta yang sedang ujian</p>
                </div>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
