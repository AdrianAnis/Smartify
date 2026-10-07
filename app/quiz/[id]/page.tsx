"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronRight, Download, FileText } from "lucide-react";
import { Navbar } from "@/components/dashboard/Navbar";
import { PageContainer } from "@/components/ui/PageContainer";
import { DIFFICULTY_LABELS, QUIZ_TYPE_LABELS, type QuizStatus } from "@/lib/quiz/labels";
import type { QuizDetail } from "@/lib/quiz/types";
import { FinishedQuizView } from "./FinishedQuizView";
import { DeleteQuizButton } from "./DeleteQuizButton";
import { QuizDetailSkeleton } from "@/components/quiz/QuizDetailSkeleton";

const STEPS: { status: QuizStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "published", label: "Siap" },
  { status: "waiting", label: "Ruang tunggu" },
  { status: "ongoing", label: "Berlangsung" },
  { status: "selesai", label: "Selesai" },
];

interface NextAction {
  title: string;
  description: string;
  label: string;
  href: string;
}

function getNextAction(
  id: string,
  status: QuizStatus,
  participantCount: number | null,
): NextAction | null {
  switch (status) {
    case "draft":
      return {
        title: "Periksa soal lalu publish",
        description: "Kuis masih draft. Tinjau soal hasil AI, ubah yang perlu, kemudian publish.",
        label: "Periksa dan publish",
        href: `/quiz/${id}/preview`,
      };
    case "published":
      return {
        title: "Kuis siap dimainkan",
        description: "Buka ruang tunggu untuk menampilkan QR dan mengundang siswa bergabung.",
        label: "Buka ruang tunggu",
        href: `/quiz/${id}/waiting-room`,
      };
    case "waiting":
      return {
        title: "Ruang tunggu sedang dibuka",
        description:
          participantCount === null
            ? "Siswa dapat bergabung dengan memindai QR."
            : participantCount === 0
              ? "Belum ada siswa yang bergabung. Tampilkan QR di layar kelas."
              : `${participantCount} siswa sudah bergabung. Mulai kuis saat semua siap.`,
        label: "Lanjut ke ruang tunggu",
        href: `/quiz/${id}/waiting-room`,
      };
    case "ongoing":
      return {
        title: "Kuis sedang berlangsung",
        description: "Pantau progres, skor sementara, dan pelanggaran siswa secara langsung.",
        label: "Buka monitor",
        href: `/quiz/${id}/monitor`,
      };
    default:
      return null;
  }
}

function Stepper({ current }: { current: QuizStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.status === current);

  return (
    <ol className="flex items-start" aria-label="Tahapan kuis">
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li
            key={step.status}
            aria-current={active ? "step" : undefined}
            className="flex flex-1 flex-col items-center last:flex-none"
          >
            <div className="flex w-full items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-primary text-white"
                    : active
                      ? "bg-primary/15 text-primary ring-2 ring-primary"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              {index < STEPS.length - 1 && (
                <span
                  className={`mx-2 h-0.5 flex-1 rounded-full ${done ? "bg-primary" : "bg-gray-200"}`}
                />
              )}
            </div>
            <span
              className={`mt-2 self-start text-xs ${
                active ? "font-semibold text-gray-900" : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [kuis, setKuis] = useState<QuizDetail | null>(null);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
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

        if (data.kuis.status === "waiting") {
          const pRes = await fetch(`/api/quiz/${id}/participants`);
          if (pRes.ok) {
            const pData = await pRes.json();
            setParticipantCount(Array.isArray(pData.peserta) ? pData.peserta.length : 0);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat detail kuis");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, router]);

  if (loading) {
    return <QuizDetailSkeleton />;
  }

  if (error || !kuis) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar backHref="/dashboard" />
        <div className="mx-auto mt-32 max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-gray-900">Kuis tidak dapat dibuka</h1>
          <p className="mb-6 text-sm text-gray-500">{error || "Kuis tidak ditemukan"}</p>
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Kembali ke dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isFinished = kuis.status === "selesai";
  const nextAction = getNextAction(id, kuis.status, participantCount);
  const details = [
    { label: "Jumlah soal", value: `${kuis.total_soal} soal` },
    { label: "Jenis soal", value: QUIZ_TYPE_LABELS[kuis.jenis_soal] ?? kuis.jenis_soal },
    {
      label: "Kesulitan",
      value: DIFFICULTY_LABELS[kuis.tingkat_kesulitan] ?? kuis.tingkat_kesulitan,
    },
    { label: "Durasi", value: `${kuis.durasi_menit} menit` },
    { label: "KKM", value: String(kuis.kkm) },
    {
      label: "Dibuat",
      value: new Date(kuis.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar backHref="/dashboard" />

      <main className="pt-16">
        <PageContainer className="py-8">
          <section className="rounded-xl bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Detail kuis
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{kuis.judul}</h1>
              </div>
              <div className="shrink-0">
                <DeleteQuizButton id={id} judul={kuis.judul} status={kuis.status} />
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-gray-100 pt-6 sm:grid-cols-3 lg:grid-cols-6">
              {details.map((item) => (
                <div key={item.label}>
                  <dt className="text-sm text-gray-500">{item.label}</dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <section className="rounded-xl bg-card p-6 shadow-sm sm:p-8">
                <Stepper current={kuis.status} />
                {!isFinished && nextAction && (
                  <div className="mt-8 flex flex-col gap-5 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold text-gray-900">{nextAction.title}</h2>
                      <p className="mt-1 max-w-xl text-sm text-gray-500">
                        {nextAction.description}
                      </p>
                    </div>
                    <Link
                      href={nextAction.href}
                      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {nextAction.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </section>

              {isFinished && <FinishedQuizView id={id} />}
            </div>

            <aside className="space-y-3 self-start rounded-xl bg-card p-3 shadow-sm">
              <Link
                href={`/quiz/${id}/preview`}
                className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">Lihat soal</span>
                  <span className="block text-xs text-gray-500">Lihat dan ubah daftar soal</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </Link>
              <a
                href={`/api/quiz/${id}/export?format=docx`}
                className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Download className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">
                    Download naskah soal (.docx)
                  </span>
                  <span className="block text-xs text-gray-500">Dokumen soal lengkap</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </a>
            </aside>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
