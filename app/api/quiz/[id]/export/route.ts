import { NextRequest, NextResponse } from "next/server";
import { requireQuizOwner } from "@/lib/quiz/quiz-owner";
import { supabaseServer } from "@/lib/supabase/server";

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

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const auth = await requireQuizOwner(request, id);
    if (!auth.ok) return auth.response;

    const kuisId = Number(id);

    const { data: kuis } = await supabaseServer
      .from("kuis")
      .select("judul, kkm, total_soal, kode_kuis")
      .eq("kuis_id", kuisId)
      .single();

    const { data: pesertaList } = await supabaseServer
      .from("peserta_kuis")
      .select("peserta_id, nama, status, tab_violations, submitted_at")
      .eq("kuis_id", kuisId);

    const { data: hasilList } = await supabaseServer
      .from("hasil_kuis")
      .select("peserta_id, score, status_kelulusan, graded_at")
      .eq("kuis_id", kuisId);

    const hasilMap = new Map<number, { score: number; status_kelulusan: string; graded_at: string }>();
    hasilList?.forEach((h) => {
      hasilMap.set(h.peserta_id, {
        score: Number(h.score),
        status_kelulusan: h.status_kelulusan,
        graded_at: h.graded_at,
      });
    });

    const rows = (pesertaList ?? []).map((p) => {
      const h = hasilMap.get(p.peserta_id);
      const rawDate = p.submitted_at ?? h?.graded_at ?? null;
      return {
        nama: p.nama,
        score: h ? h.score : 0,
        statusKelulusan: h ? h.status_kelulusan : "remedial",
        tabViolations: p.tab_violations ?? 0,
        submittedAt: formatWaktuWIB(rawDate),
      };
    }).sort((a, b) => b.score - a.score);

    const headers = ["Peringkat", "Nama Siswa", "Nilai Akhir", "Status Kelulusan", "KKM", "Pelanggaran Tab", "Waktu Selesai"];
    const csvLines = [
      headers.join(","),
      ...rows.map((r, idx) => [
        idx + 1,
        `"${r.nama.replace(/"/g, '""')}"`,
        r.score,
        r.statusKelulusan.toUpperCase(),
        kuis?.kkm ?? 70,
        r.tabViolations,
        `"${r.submittedAt}"`,
      ].join(",")),
    ];

    const csvContent = "\uFEFF" + csvLines.join("\n");
    const safeTitle = (kuis?.judul ?? "Kuis").replace(/[^a-zA-Z0-9_-]/g, "_");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Nilai_${safeTitle}_${kuis?.kode_kuis ?? "Smartify"}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export CSV error:", error);
    return NextResponse.json({ error: "Gagal mengekspor laporan nilai." }, { status: 500 });
  }
}
