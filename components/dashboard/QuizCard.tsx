import Link from "next/link";
import { FileText, Calendar } from "lucide-react";

export type QuizStatus = "draft" | "published" | "waiting" | "ongoing" | "selesai";

interface QuizCardProps {
  id: number;
  title: string;
  totalSoal: number;
  tanggal: string;
  status: QuizStatus;
}

const STATUS_STYLES: Record<QuizStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  published: { label: "Siap dimainkan", className: "bg-primary/10 text-primary" },
  waiting: { label: "Ruang tunggu", className: "bg-warning-subtle text-warning-text" },
  ongoing: { label: "Berlangsung", className: "bg-warning-subtle text-warning-text" },
  selesai: { label: "Selesai", className: "bg-success-subtle text-success-text" },
};

export function QuizCard({ id, title, totalSoal, tanggal, status }: QuizCardProps) {
  const badge = STATUS_STYLES[status] ?? STATUS_STYLES.draft;

  return (
    <Link
      href={`/quiz/${id}/detail`}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="h-1.5 bg-primary" />

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        <h3 className="mb-4 line-clamp-2 text-base font-semibold text-card-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted sm:gap-4">
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 shrink-0" />
            <span>{totalSoal} Soal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{tanggal}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
