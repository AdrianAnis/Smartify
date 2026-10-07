import { NextRequest, NextResponse } from "next/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import type { QuestionScore } from "@/lib/classroom/quiz-play";
import { supabaseServer } from "@/lib/supabase/server";
import * as xlsx from "xlsx";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

function formatWaktuWIB(raw: string | null | undefined): string {
  if (!raw || raw === "-") return "-";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "-";
    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const day = parts.find((p) => p.type === "day")?.value.padStart(2, "0");
    const month = parts.find((p) => p.type === "month")?.value.padStart(2, "0");
    const year = parts.find((p) => p.type === "year")?.value;
    const hour = parts.find((p) => p.type === "hour")?.value.padStart(2, "0");
    const minute = parts.find((p) => p.type === "minute")?.value.padStart(2, "0");
    return `${day}/${month}/${year} ${hour}:${minute} WIB`;
  } catch {
    return "-";
  }
}

function toCsvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const auth = await requireQuizOwner(request, id);
    if (!auth.ok) return auth.response;

    const kuisId = Number(id);
    const format = request.nextUrl.searchParams.get("format") || "csv";

    const { data: kuis } = await supabaseServer
      .from("kuis")
      .select("judul, kkm, total_soal, kode_kuis")
      .eq("kuis_id", kuisId)
      .single();
    
    const safeTitle = (kuis?.judul ?? "Kuis").replace(/[^a-zA-Z0-9_-]/g, "_");

    if (format === "docx") {
      const { data: soalList } = await supabaseServer
        .from("soal")
        .select("soal_id, urutan, teks_soal, tipe_soal")
        .eq("kuis_id", kuisId)
        .order("urutan", { ascending: true });

      const { data: pilihanList } = await supabaseServer
        .from("pilihan_jawaban")
        .select("soal_id, teks_pilihan, urutan")
        .in("soal_id", soalList?.map(s => s.soal_id) || []);

      const children: Paragraph[] = [
        new Paragraph({
          text: kuis?.judul ?? "Kuis",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "" }),
      ];

      soalList?.forEach((soal) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${soal.urutan}. ${soal.teks_soal}`, bold: true })
            ]
          })
        );
        
        if (soal.tipe_soal === "pilihan_ganda") {
          const pilihan = pilihanList?.filter(p => p.soal_id === soal.soal_id).sort((a,b) => a.urutan - b.urutan) || [];
          const labels = ["A", "B", "C", "D", "E"];
          pilihan.forEach((p, index) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `    ${labels[index]}. ${p.teks_pilihan}` })
                ]
              })
            );
          });
        }
        
        children.push(new Paragraph({ text: "" }));
      });

      const doc = new Document({ sections: [{ properties: {}, children }] });
      const buffer = await Packer.toBuffer(doc);
      const docxUint8 = new Uint8Array(buffer);

      return new NextResponse(docxUint8, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="Naskah_${safeTitle}.docx"`,
        },
      });
    }

    const { data: pesertaList } = await supabaseServer
      .from("peserta_kuis")
      .select("peserta_id, nama, status, tab_violations, submitted_at")
      .eq("kuis_id", kuisId);

    const { data: hasilList } = await supabaseServer
      .from("hasil_kuis")
      .select("peserta_id, score, status_kelulusan, graded_at, score_per_question")
      .eq("kuis_id", kuisId);

    const hasilMap = new Map<number, { score: number; status_kelulusan: string; graded_at: string; score_per_question: QuestionScore[] | null }>();
    hasilList?.forEach((h) => {
      hasilMap.set(h.peserta_id, {
        score: Number(h.score),
        status_kelulusan: h.status_kelulusan,
        graded_at: h.graded_at,
        score_per_question: h.score_per_question
      });
    });

    const rows = (pesertaList ?? []).map((p) => {
      const h = hasilMap.get(p.peserta_id);
      const rawDate = p.submitted_at ?? h?.graded_at ?? null;
      const qScores: Record<string, number> = {};
      if (Array.isArray(h?.score_per_question)) {
        h.score_per_question.forEach((sq) => {
          qScores[`Soal_${sq.soal_id}`] = sq.score;
        });
      }

      return {
        Peringkat: 0,
        "Nama Siswa": p.nama,
        "Nilai Akhir": h ? h.score : 0,
        "Status Kelulusan": h ? h.status_kelulusan.toUpperCase() : "REMEDIAL",
        KKM: kuis?.kkm ?? 70,
        "Pelanggaran Tab": p.tab_violations ?? 0,
        "Waktu Selesai": formatWaktuWIB(rawDate),
        ...qScores
      };
    }).sort((a, b) => b["Nilai Akhir"] - a["Nilai Akhir"]);

    rows.forEach((r, idx) => r.Peringkat = idx + 1);

    if (format === "xlsx") {
      const worksheet = xlsx.utils.json_to_sheet(rows);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Nilai Kuis");
      const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });
      const excelUint8 = new Uint8Array(excelBuffer);
      
      return new NextResponse(excelUint8, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Nilai_${safeTitle}_${kuis?.kode_kuis ?? "Smartify"}.xlsx"`,
        },
      });
    }

    const headers = ["Peringkat", "Nama Siswa", "Nilai Akhir", "Status Kelulusan", "KKM", "Pelanggaran Tab", "Waktu Selesai"];
    const csvLines = [
      headers.join(","),
      ...rows.map((r, idx) => [
        idx + 1,
        toCsvCell(r["Nama Siswa"]),
        r["Nilai Akhir"],
        r["Status Kelulusan"],
        r["KKM"],
        r["Pelanggaran Tab"],
        `"${r["Waktu Selesai"]}"`,
      ].join(",")),
    ];

    const csvContent = "\uFEFF" + csvLines.join("\n");
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Nilai_${safeTitle}_${kuis?.kode_kuis ?? "Smartify"}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Gagal mengekspor laporan." }, { status: 500 });
  }
}
