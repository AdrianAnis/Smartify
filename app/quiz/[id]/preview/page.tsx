"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Clock, FileText, Gauge, Hash, Layers, Target } from "lucide-react";
import {
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  QUIZ_STATUS_STYLES,
  QUIZ_TYPE_LABELS,
} from "@/lib/quiz/labels";
import type { QuizDetail, QuizSoal } from "@/lib/quiz/types";

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <div className="flex items-center gap-2">
        <span className="truncate text-base font-bold text-gray-800">{value}</span>
        <Icon className="h-4 w-4 shrink-0 text-gray-400" />
      </div>
    </div>
  );
}

function QuestionItem({ soal, index }: { soal: QuizSoal; index: number }) {
  const isPilgan = soal.tipe_soal === "pilihan_ganda";
  const correctIndex = soal.pilihan.findIndex((p) => p.is_benar);
  const correct = correctIndex >= 0 ? soal.pilihan[correctIndex] : null;

  return (
    <div className="border-b border-gray-100 pb-8 last:border-b-0 last:pb-0">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-lg font-bold text-gray-800">Soal {index + 1}.</h3>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {soal.topik}
          </span>
          <span className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs uppercase tracking-wider text-gray-400">
            {QUESTION_TYPE_LABELS[soal.tipe_soal] ?? soal.tipe_soal}
          </span>
        </div>
      </div>

      <p className="mb-6 whitespace-pre-line leading-relaxed text-gray-700">{soal.teks_soal}</p>

      {isPilgan && soal.pilihan.length > 0 && (
        <div className="mb-8 space-y-3">
          {soal.pilihan.map((p, i) => (
            <div
              key={p.pilihan_id}
              className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {String.fromCharCode(65 + i)}
              </div>
              <span className="min-w-0 break-words text-gray-700">{p.teks_pilihan}</span>
            </div>
          ))}
        </div>
      )}

      {isPilgan && correct && (
        <div className="mb-6">
          <p className="mb-2 text-sm text-gray-500">Jawaban Benar</p>
          <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
              {String.fromCharCode(65 + correctIndex)}
            </div>
            <span className="font-semibold text-gray-800">{correct.teks_pilihan}</span>
          </div>
        </div>
      )}

      {!isPilgan && soal.kunci_jawaban && (
        <div className="mb-6">
          <p className="mb-2 text-sm text-gray-500">Jawaban Benar</p>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5">
            <span className="font-semibold text-gray-800">{soal.kunci_jawaban.jawaban_text}</span>
            {soal.kunci_jawaban.kata_kunci.length > 0 && (
              <p className="mt-1 text-sm text-emerald-800">
                Juga diterima: {soal.kunci_jawaban.kata_kunci.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {soal.penjelasan && (
        <div className="mb-6">
          <p className="mb-2 text-sm text-gray-500">Penjelasan Jawaban</p>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="whitespace-pre-line text-sm leading-relaxed text-emerald-800">
              {soal.penjelasan}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [kuis, setKuis] = useState<QuizDetail | null>(null);
  const [soal, setSoal] = useState<QuizSoal[]>([]);
  const [pembuat, setPembuat] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/quiz/${id}`);
        if (res.status === 401) {
          router.replace(`/auth/login?redirect=/quiz/${id}/preview`);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setKuis(data.kuis);
        setSoal(data.soal);
        setPembuat(data.pembuat ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat kuis");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, router]);

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    soal.forEach((s) => counts.set(s.topik, (counts.get(s.topik) ?? 0) + 1));
    return [...counts.entries()];
  }, [soal]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !kuis) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">Kuis tidak dapat dibuka</h1>
        <p className="mb-6 text-sm text-gray-500">{error || "Kuis tidak ditemukan"}</p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const status = QUIZ_STATUS_STYLES[kuis.status] ?? QUIZ_STATUS_STYLES.draft;

  return (
    <>
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
          Generate Quiz {">"} Preview
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">{kuis.judul}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>
        {pembuat && <p className="mt-1 text-sm text-gray-500">Dibuat oleh: {pembuat}</p>}

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <InfoItem icon={FileText} label="Jumlah Soal" value={`${soal.length} soal`} />
          <InfoItem
            icon={Layers}
            label="Jenis Soal"
            value={QUIZ_TYPE_LABELS[kuis.jenis_soal] ?? kuis.jenis_soal}
          />
          <InfoItem
            icon={Gauge}
            label="Kesulitan"
            value={DIFFICULTY_LABELS[kuis.tingkat_kesulitan] ?? kuis.tingkat_kesulitan}
          />
          <InfoItem icon={Clock} label="Durasi" value={`${kuis.durasi_menit} menit`} />
          <InfoItem icon={Target} label="KKM" value={String(kuis.kkm)} />
          <InfoItem icon={Hash} label="Kode Kuis" value={kuis.kode_kuis} />
        </div>
      </div>

      {topics.length > 0 && (
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-bold text-gray-800">Sebaran Topik</h2>
          <p className="mb-4 text-sm text-gray-500">
            Topik ini dipakai untuk analisis kemampuan kelas setelah kuis selesai.
          </p>
          <div className="flex flex-wrap gap-2">
            {topics.map(([topik, count]) => (
              <span
                key={topik}
                className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-sm text-gray-700"
              >
                {topik}
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        {soal.map((s, index) => (
          <QuestionItem key={s.soal_id} soal={s} index={index} />
        ))}
        {soal.length === 0 && (
          <div className="py-12 text-center text-gray-500">Belum ada soal untuk kuis ini.</div>
        )}
      </div>
    </>
  );
}
