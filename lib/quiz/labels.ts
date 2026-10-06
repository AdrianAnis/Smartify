export type QuizStatus = "draft" | "published" | "waiting" | "ongoing" | "selesai";

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Mudah",
  medium: "Sedang",
  hard: "Sulit",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-emerald-600 bg-emerald-100",
  medium: "text-amber-600 bg-amber-100",
  hard: "text-red-600 bg-red-100",
};

export const QUIZ_TYPE_LABELS: Record<string, string> = {
  pilihan_ganda: "Pilihan Ganda",
  isian_singkat: "Isian Singkat",
  campuran: "Campuran",
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  pilihan_ganda: "Pilihan Ganda",
  isian_singkat: "Isian Singkat",
  uraian: "Uraian",
};

export const QUIZ_STATUS_STYLES: Record<QuizStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  published: { label: "Siap dimainkan", className: "bg-primary/10 text-primary" },
  waiting: { label: "Ruang tunggu", className: "bg-warning-subtle text-warning-text" },
  ongoing: { label: "Berlangsung", className: "bg-warning-subtle text-warning-text" },
  selesai: { label: "Selesai", className: "bg-success-subtle text-success-text" },
};
