import Link from "next/link";
import { FileText, Calendar } from "lucide-react";
import { QUIZ_STATUS_STYLES, type QuizStatus } from "@/lib/quiz/labels";

export type { QuizStatus };

interface QuizCardProps {
  id: number;
  title: string;
  totalSoal: number;
  tanggal: string;
  status: QuizStatus;
}

export function QuizCard({ id, title, totalSoal, tanggal, status }: QuizCardProps) {
  const badge = QUIZ_STATUS_STYLES[status] ?? QUIZ_STATUS_STYLES.draft;

  return (
    <Link
      href={`/quiz/${id}/preview`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors duration-200 hover:border-primary/50"
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
