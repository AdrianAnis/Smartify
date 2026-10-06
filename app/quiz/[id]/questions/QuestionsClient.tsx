"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, CheckCircle2, FileText } from "lucide-react";

interface PilihanJawaban {
  pilihan_id: number;
  teks_pilihan: string;
  is_benar: boolean;
  urutan: number;
}

interface KunciJawaban {
  jawaban_text: string;
}

interface SoalItem {
  soal_id: number;
  urutan: number;
  teks_soal: string;
  tipe_soal: string;
  penjelasan: string | null;
  pilihan_jawaban?: PilihanJawaban[];
  kunci_jawaban?: KunciJawaban[];
}

interface Props {
  kuisId: string;
  judul: string;
  soalList: SoalItem[];
}

export function QuestionsClient({ kuisId, judul, soalList }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleDownloadWord() {
    setIsExporting(true);
    try {
      window.location.href = `/api/quiz/${kuisId}/export?format=docx`;
    } catch {
    } finally {
      setTimeout(() => setIsExporting(false), 1500);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Sticky Navbar */}
      <div className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 bg-white/90 px-6 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href={`/quiz/${kuisId}`}
            className="flex items-center justify-center rounded-xl p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="text-lg font-bold text-gray-900 line-clamp-1">
            Detail Jawaban <span className="text-gray-400 font-normal mx-2">/</span> {judul}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadWord}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Unduh Soal</span>
        </button>
      </div>

      <div className="mx-auto max-w-[800px] px-4 sm:px-6 mt-8 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Daftar Soal & Jawaban</h1>
        </div>

        {soalList.map((soal) => {
          // Sort options by urutan if available
          const sortedOptions = (soal.pilihan_jawaban || []).sort((a, b) => a.urutan - b.urutan);

          let kunciText = "";
          if (soal.tipe_soal === "pilihan_ganda") {
            const correctOpt = sortedOptions.find((opt) => opt.is_benar);
            if (correctOpt) {
              const letter = String.fromCharCode(65 + sortedOptions.indexOf(correctOpt));
              kunciText = `${letter}. ${correctOpt.teks_pilihan}`;
            }
          } else {
            kunciText = (soal.kunci_jawaban || []).map(k => k.jawaban_text).join(" / ");
          }

          return (
            <div key={soal.soal_id} className="rounded-xl bg-white p-6 shadow-sm border-none">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                  {soal.urutan}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
                    {soal.teks_soal}
                  </div>

                  {soal.tipe_soal === "pilihan_ganda" && sortedOptions.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {sortedOptions.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isCorrect = opt.is_benar;
                        return (
                          <div
                            key={opt.pilihan_id}
                            className={`flex items-start gap-3 p-3 rounded-xl ${isCorrect ? 'bg-success-subtle text-success-text' : 'bg-gray-50 text-gray-600'}`}
                          >
                            <span className={`font-semibold ${isCorrect ? 'text-success-text' : 'text-gray-500'}`}>
                              {letter}.
                            </span>
                            <span className="flex-1">{opt.teks_pilihan}</span>
                            {isCorrect && <CheckCircle2 className="h-5 w-5 text-success-text shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-6 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Jawaban Benar:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl">{kunciText || "-"}</p>
                  </div>

                  {soal.penjelasan && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Penjelasan:</h4>
                      <p className="text-gray-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl text-sm">
                        {soal.penjelasan}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {soalList.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">Belum ada soal untuk kuis ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
