"use client";

import { useId, useState } from "react";
import type { QuizSoal } from "@/lib/quiz/types";

interface QuestionEditorProps {
  quizId: string;
  soal: QuizSoal;
  index: number;
  topics: string[];
  onSaved: (soal: QuizSoal) => void;
  onCancel: () => void;
}

const fieldClass =
  "w-full rounded-xl bg-input px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function QuestionEditor({
  quizId,
  soal,
  index,
  topics,
  onSaved,
  onCancel,
}: QuestionEditorProps) {
  const formId = useId();
  const isPilgan = soal.tipe_soal === "pilihan_ganda";

  const [teksSoal, setTeksSoal] = useState(soal.teks_soal);
  const [topik, setTopik] = useState(soal.topik);
  const [penjelasan, setPenjelasan] = useState(soal.penjelasan ?? "");
  const [pilihan, setPilihan] = useState(
    soal.pilihan.map((p) => ({ pilihan_id: p.pilihan_id, teks_pilihan: p.teks_pilihan })),
  );
  const [correctId, setCorrectId] = useState(
    soal.pilihan.find((p) => p.is_benar)?.pilihan_id ?? soal.pilihan[0]?.pilihan_id,
  );
  const [kunci, setKunci] = useState(soal.kunci_jawaban?.jawaban_text ?? "");
  const [alternatif, setAlternatif] = useState(
    (soal.kunci_jawaban?.kata_kunci ?? []).join(", "),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/quiz/${quizId}/questions/${soal.soal_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teks_soal: teksSoal,
          topik,
          penjelasan,
          ...(isPilgan
            ? { pilihan, correct_pilihan_id: correctId }
            : {
                kunci_jawaban: kunci,
                kata_kunci: alternatif.split(",").map((a) => a.trim()).filter(Boolean),
              }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(data.soal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan soal");
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 sm:p-6"
    >
      <h3 className="mb-5 text-lg font-bold text-gray-800">Edit Soal {index + 1}.</h3>

      {error && (
        <div className="mb-4 rounded-xl border border-danger-border bg-danger-subtle px-4 py-3 text-sm text-danger-text">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor={`${formId}-teks`} className="mb-2 block text-sm font-medium text-label">
            Teks soal
          </label>
          <textarea
            id={`${formId}-teks`}
            value={teksSoal}
            onChange={(e) => setTeksSoal(e.target.value)}
            rows={3}
            maxLength={2000}
            required
            className={`${fieldClass} resize-y bg-card`}
          />
        </div>

        {isPilgan ? (
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-label">
              Pilihan jawaban (pilih satu yang benar)
            </legend>
            <div className="space-y-3">
              {pilihan.map((p, i) => {
                const checked = correctId === p.pilihan_id;
                return (
                  <div
                    key={p.pilihan_id}
                    className={`flex items-center gap-3 rounded-xl border p-2 pr-3 ${
                      checked ? "border-emerald-300 bg-emerald-50" : "border-gray-100 bg-card"
                    }`}
                  >
                    <label className="flex cursor-pointer items-center gap-2 pl-1">
                      <input
                        type="radio"
                        name={`${formId}-correct`}
                        checked={checked}
                        onChange={() => setCorrectId(p.pilihan_id)}
                        className="h-4 w-4 accent-emerald-500"
                        aria-label={`Jadikan pilihan ${String.fromCharCode(65 + i)} jawaban benar`}
                      />
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                          checked ? "bg-emerald-500" : "bg-primary"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={p.teks_pilihan}
                      maxLength={500}
                      required
                      onChange={(e) =>
                        setPilihan((prev) =>
                          prev.map((item) =>
                            item.pilihan_id === p.pilihan_id
                              ? { ...item, teks_pilihan: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="min-w-0 flex-1 rounded-lg bg-input px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${formId}-kunci`} className="mb-2 block text-sm font-medium text-label">
                Kunci jawaban
              </label>
              <input
                id={`${formId}-kunci`}
                type="text"
                value={kunci}
                maxLength={500}
                required
                onChange={(e) => setKunci(e.target.value)}
                className={`${fieldClass} bg-card`}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-alt`} className="mb-2 block text-sm font-medium text-label">
                Jawaban lain yang diterima
              </label>
              <input
                id={`${formId}-alt`}
                type="text"
                value={alternatif}
                onChange={(e) => setAlternatif(e.target.value)}
                placeholder="Pisahkan dengan koma"
                className={`${fieldClass} bg-card`}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor={`${formId}-topik`} className="mb-2 block text-sm font-medium text-label">
            Topik
          </label>
          <input
            id={`${formId}-topik`}
            type="text"
            list={`${formId}-topik-list`}
            value={topik}
            maxLength={100}
            required
            onChange={(e) => setTopik(e.target.value)}
            className={`${fieldClass} bg-card`}
          />
          <datalist id={`${formId}-topik-list`}>
            {topics.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-muted">
            Gunakan nama topik yang sama untuk soal sejenis agar analisis kelas akurat.
          </p>
        </div>

        <div>
          <label htmlFor={`${formId}-penjelasan`} className="mb-2 block text-sm font-medium text-label">
            Penjelasan jawaban
          </label>
          <textarea
            id={`${formId}-penjelasan`}
            value={penjelasan}
            onChange={(e) => setPenjelasan(e.target.value)}
            rows={3}
            maxLength={2000}
            className={`${fieldClass} resize-y bg-card`}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-card-foreground hover:bg-input disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}
