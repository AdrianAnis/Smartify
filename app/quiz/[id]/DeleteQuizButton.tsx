"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Props {
  id: string;
  judul: string;
  status: string;
}

const UNDELETABLE_STATUSES = ["waiting", "ongoing"];

export function DeleteQuizButton({ id, judul, status }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDelete = !UNDELETABLE_STATUSES.includes(status);
  if (!canDelete) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/quiz/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus kuis");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="flex items-center justify-center gap-2 rounded-full border border-danger-border px-4 py-2 text-sm font-medium text-danger-strong transition-colors hover:bg-danger-subtle"
      >
        <Trash2 className="h-4 w-4" />
        Hapus
      </button>

      <ConfirmDialog
        open={open}
        title="Hapus kuis?"
        description={`Kuis "${judul}" beserta semua soal, kunci, dan penjelasannya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus kuis"
        loadingLabel="Menghapus..."
        loading={loading}
        error={error}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
