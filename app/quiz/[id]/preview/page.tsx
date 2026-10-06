"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  Hash,
  Layers,
  Lock,
  Pencil,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QuestionEditor } from "@/components/quiz/QuestionEditor";
import { QuizPreviewSkeleton } from "@/components/quiz/QuizPreviewSkeleton";
import { EDITABLE_STATUSES } from "@/lib/quiz/editable";
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

function QuestionItem({
  soal,
  index,
  editable,
  onEdit,
  onDelete,
}: {
  soal: QuizSoal;
  index: number;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPilgan = soal.tipe_soal === "pilihan_ganda";
  const correctIndex = soal.pilihan.findIndex((p) => p.is_benar);
  const correct = correctIndex >= 0 ? soal.pilihan[correctIndex] : null;

  return (
    <div className="border-b border-gray-100 pb-8 last:border-b-0 last:pb-0">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-lg font-bold text-gray-800">Soal {index + 1}.</h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {soal.topik}
          </span>
          <span className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs uppercase tracking-wider text-gray-400">
            {QUESTION_TYPE_LABELS[soal.tipe_soal] ?? soal.tipe_soal}
          </span>
          {editable && (
            <>
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Edit soal ${index + 1}`}
                className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-input hover:text-card-foreground"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Hapus soal ${index + 1}`}
                className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-danger-subtle hover:text-danger-strong"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ soal: QuizSoal; index: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishedNotice, setPublishedNotice] = useState(false);
  const [deleteQuizOpen, setDeleteQuizOpen] = useState(false);
  const [deletingQuiz, setDeletingQuiz] = useState(false);
  const [deleteQuizError, setDeleteQuizError] = useState("");

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/quiz/${id}/questions/${deleteTarget.soal.soal_id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSoal((prev) => prev.filter((s) => s.soal_id !== deleteTarget.soal.soal_id));
      setKuis((prev) => (prev ? { ...prev, total_soal: data.totalSoal } : prev));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus soal");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <QuizPreviewSkeleton />;
  }

  if (error || !kuis) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
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

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError("");
    try {
      const res = await fetch(`/api/quiz/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setKuis((prev) => (prev ? { ...prev, status: "published" } : prev));
      setPublishOpen(false);
      setPublishedNotice(true);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Gagal mempublish kuis");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteQuiz = async () => {
    setDeletingQuiz(true);
    setDeleteQuizError("");
    try {
      const res = await fetch(`/api/quiz/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.replace("/dashboard");
    } catch (err) {
      setDeleteQuizError(err instanceof Error ? err.message : "Gagal menghapus kuis");
      setDeletingQuiz(false);
    }
  };

  const status = QUIZ_STATUS_STYLES[kuis.status] ?? QUIZ_STATUS_STYLES.draft;
  const canDeleteQuiz = !["waiting", "ongoing"].includes(kuis.status);
  const editable = EDITABLE_STATUSES.includes(kuis.status);
  const topicNames = topics.map(([t]) => t);

  return (
    <>
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
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
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(kuis.status === "published" || kuis.status === "waiting") && (
              <Link
                href={`/quiz/${id}/waiting-room`}
                id="btn-header-buka-ruang-tunggu"
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90"
              >
                <Users className="h-4 w-4" />
                Buka Ruang Tunggu
              </Link>
            )}
            {canDeleteQuiz && (
              <button
                type="button"
                onClick={() => {
                  setDeleteQuizError("");
                  setDeleteQuizOpen(true);
                }}
                className="flex items-center gap-2 rounded-full border border-danger-border px-4 py-2 text-sm font-medium text-danger-strong transition-colors hover:bg-danger-subtle"
              >
                <Trash2 className="h-4 w-4" />
                Hapus kuis
              </button>
            )}
          </div>
        </div>

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
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
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

      {publishedNotice && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Kuis berhasil dipublish dan siap dimainkan. Soal masih bisa diedit sampai ruang tunggu dibuka.</span>
          </div>
          <Link
            href={`/quiz/${id}/waiting-room`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Users className="h-3.5 w-3.5" />
            Buka Ruang Tunggu
          </Link>
        </div>
      )}

      {!editable && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Lock className="h-4 w-4 shrink-0" />
          Soal tidak bisa diubah karena kuis sudah dibuka untuk siswa.
        </div>
      )}

      <div className="space-y-10 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        {soal.map((s, index) =>
          editingId === s.soal_id ? (
            <QuestionEditor
              key={s.soal_id}
              quizId={id}
              soal={s}
              index={index}
              topics={topicNames}
              onCancel={() => setEditingId(null)}
              onSaved={(updated) => {
                setSoal((prev) => prev.map((item) => (item.soal_id === updated.soal_id ? updated : item)));
                setEditingId(null);
              }}
            />
          ) : (
            <QuestionItem
              key={s.soal_id}
              soal={s}
              index={index}
              editable={editable && editingId === null}
              onEdit={() => setEditingId(s.soal_id)}
              onDelete={() => {
                setDeleteError("");
                setDeleteTarget({ soal: s, index });
              }}
            />
          ),
        )}
        {soal.length === 0 && (
          <div className="py-12 text-center text-gray-500">Belum ada soal untuk kuis ini.</div>
        )}
      </div>

      {kuis.status === "draft" && editingId === null && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => {
              setPublishError("");
              setPublishOpen(true);
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
          >
            Publish Kuis
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {(kuis.status === "published" || kuis.status === "waiting") && editingId === null && (
        <div className="fixed bottom-6 right-6 z-40">
          <Link
            href={`/quiz/${id}/waiting-room`}
            id="btn-buka-ruang-tunggu"
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
          >
            <Users className="h-5 w-5" />
            Buka Ruang Tunggu
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={publishOpen}
        tone="primary"
        title="Publish kuis?"
        description={`Kuis "${kuis.judul}" dengan ${soal.length} soal akan siap dimainkan. Soal masih bisa diedit sampai ruang tunggu dibuka.`}
        confirmLabel="Publish"
        loadingLabel="Mempublish..."
        loading={publishing}
        error={publishError}
        onConfirm={handlePublish}
        onCancel={() => setPublishOpen(false)}
      />

      <ConfirmDialog
        open={deleteQuizOpen}
        title="Hapus kuis?"
        description={`Kuis "${kuis.judul}" beserta semua soal, kunci, dan penjelasannya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus kuis"
        loadingLabel="Menghapus..."
        loading={deletingQuiz}
        error={deleteQuizError}
        onConfirm={handleDeleteQuiz}
        onCancel={() => setDeleteQuizOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Hapus soal ${(deleteTarget?.index ?? 0) + 1}?`}
        description="Soal beserta pilihan, kunci, dan penjelasannya akan dihapus permanen. Nomor soal setelahnya akan bergeser. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        loadingLabel="Menghapus..."
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
